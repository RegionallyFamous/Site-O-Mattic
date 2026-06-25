import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readSpec, specTargets } from "./spec-utils.mjs";

const execFileAsync = promisify(execFile);
const outputRoot = process.env.PUBLIC_SMOKE_DIR || path.join("qa", "reports", "public-smoke");
const ref = process.env.SITE_O_MATTIC_REF || await gitRef();
const rawBase = process.env.PUBLIC_BLUEPRINT_BASE
  || `https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/${ref}/public/blueprints`;
const pageTimeout = Number(process.env.PUBLIC_SMOKE_PAGE_TIMEOUT_MS || 150_000);
const targets = await specTargets(process.argv.slice(2));

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("Missing playwright-core. Install dev dependencies before running public smoke tests.");
  process.exit(1);
}

if (!targets.length) {
  console.error("No specs found for public Playground smoke test.");
  process.exit(1);
}

await fs.mkdir(outputRoot, { recursive: true });
const executablePath = process.env.CHROME_PATH || await findChrome();
const browser = await chromium.launch({ executablePath, headless: true });
const reports = [];
let hasFailure = false;

console.log(`Public Playground smoke output: ${outputRoot}`);
console.log(`Blueprint ref: ${ref}`);
console.log(`Sweeping ${targets.length} public Playground URL${targets.length === 1 ? "" : "s"}.`);

try {
  for (const [index, target] of targets.entries()) {
    const spec = await readSpec(target);
    const rawBlueprintUrl = `${rawBase}/${spec.slug}/blueprint.json`;
    const playgroundUrl = `https://playground.wordpress.net/?blueprint-url=${encodeURIComponent(rawBlueprintUrl)}`;
    const slugDir = path.join(outputRoot, spec.slug);
    await fs.mkdir(slugDir, { recursive: true });
    console.log(`\n[${index + 1}/${targets.length}] ${spec.slug}`);

    const rawCheck = await checkRawBlueprint(rawBlueprintUrl);
    const scenarios = [];
    if (!rawCheck.ok) {
      hasFailure = true;
      console.log(`  FAIL raw blueprint fetch: ${rawCheck.detail}`);
    } else {
      console.log(`  OK raw blueprint fetch: ${rawCheck.detail}`);
    }

    for (const scenario of scenarioList()) {
      const screenshot = path.join(slugDir, `${scenario.name}.png`);
      const result = rawCheck.ok
        ? await inspectScenario(browser, playgroundUrl, scenario, screenshot).catch((error) => ({
            error: error.message,
            failures: [`${scenario.name}: ${error.message}`]
          }))
        : { failures: [`${scenario.name}: raw blueprint fetch failed`] };

      scenarios.push({ name: scenario.name, screenshot, ...result });
      if (result.failures?.length) {
        hasFailure = true;
        for (const failure of result.failures) {
          console.log(`  FAIL ${failure}`);
        }
      }
    }

    if (scenarios.every((scenario) => !scenario.failures?.length)) {
      console.log(`  OK public render: ${scenarios.map((scenario) => scenario.name).join(", ")}`);
    }

    reports.push({
      slug: spec.slug,
      specPath: target,
      rawBlueprintUrl,
      playgroundUrl,
      rawCheck,
      scenarios,
      failures: [
        ...(rawCheck.ok ? [] : [`raw: ${rawCheck.detail}`]),
        ...scenarios.flatMap((scenario) => scenario.failures || [])
      ]
    });
  }
} finally {
  await browser.close();
}

const summary = {
  generatedAt: new Date().toISOString(),
  ref,
  rawBase,
  total: reports.length,
  failed: reports.filter((report) => report.failures.length).length,
  reports
};

await fs.writeFile(path.join(outputRoot, "report.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log("\nPublic Playground smoke summary");
console.log(`- Total: ${summary.total}`);
console.log(`- Failed: ${summary.failed}`);
console.log(`- Report: ${path.join(outputRoot, "report.json")}`);

if (hasFailure) {
  process.exit(1);
}

async function checkRawBlueprint(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      return { ok: false, detail: `HTTP ${response.status}` };
    }
    const json = await response.json();
    return {
      ok: json?.$schema === "https://playground.wordpress.net/blueprint-schema.json",
      detail: json?.$schema || "missing schema"
    };
  } catch (error) {
    return { ok: false, detail: error.message };
  }
}

async function inspectScenario(browser, url, scenario, screenshot) {
  const page = await browser.newPage({
    viewport: scenario.viewport,
    isMobile: scenario.isMobile || false
  });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: pageTimeout });
    const frame = await findWordPressFrame(page);
    await frame.waitForSelector(".wp-site-blocks, body", { timeout: 60_000 });
    await page.screenshot({ path: screenshot, fullPage: false });
    const result = await frame.evaluate(() => {
      const text = document.body.innerText || "";
      const logo = rectFor(document.querySelector(".wp-block-site-logo img"));
      const h1 = rectFor(document.querySelector("h1"));
      const media = rectFor(document.querySelector(".wp-block-cover__image-background, .wp-block-image img, .wp-block-media-text__media"));
      const ctas = [...document.querySelectorAll(".wp-block-button__link")]
        .map((element) => ({ text: element.textContent?.trim(), rect: rectFor(element) }))
        .filter((item) => item.rect);
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const overflowers = [...document.querySelectorAll("body *")]
        .filter((element) => element.scrollWidth > element.clientWidth + 2)
        .slice(0, 10)
        .map((element) => String(element.className || element.tagName.toLowerCase()));
      const visible = (rect) => Boolean(rect && rect.width > 0 && rect.height > 0 && rect.top < viewport.height && rect.bottom > 0);

      return {
        bodyTextLength: text.length,
        defaultWrapperLeak: /Twenty Twenty|Designed with WordPress|^Home$/m.test(text),
        firstViewportCtaVisible: ctas.some((cta) => visible(cta.rect)),
        firstViewportCtaText: ctas.find((cta) => visible(cta.rect))?.text || null,
        logo,
        h1,
        h1Visible: visible(h1),
        media,
        mediaVisible: visible(media),
        overflowers
      };

      function rectFor(element) {
        if (!element) {
          return null;
        }
        const rect = element.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      }
    });
    return { result, failures: failuresFor(result).map((failure) => `${scenario.name}: ${failure}`) };
  } finally {
    await page.close();
  }
}

function scenarioList() {
  return [
    { name: "desktop", viewport: { width: 1440, height: 1000 } },
    { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true }
  ];
}

function failuresFor(result) {
  const failures = [];
  if (result.bodyTextLength < 400) {
    failures.push("Rendered page text is unexpectedly short.");
  }
  if (!result.logo || result.logo.width < 180 || result.logo.height < 30) {
    failures.push(`Logo is missing or too small: ${JSON.stringify(result.logo)}`);
  }
  if (!result.h1Visible) {
    failures.push("H1 is not visible in the first viewport.");
  }
  if (!result.mediaVisible) {
    failures.push("Primary media is not visible in the first viewport.");
  }
  if (!result.firstViewportCtaVisible) {
    failures.push("No CTA button is visible in the first viewport.");
  }
  if (result.defaultWrapperLeak) {
    failures.push("Default theme wrapper text appears in the render.");
  }
  if (result.overflowers.length) {
    failures.push(`Potential horizontal overflow: ${result.overflowers.join(", ")}`);
  }
  return failures;
}

async function findWordPressFrame(page) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const frames = page.frames();
    const frame = frames.find((candidate) => {
      const urlValue = candidate.url();
      return urlValue.includes("/wp-admin") || urlValue.includes("wordpress") || urlValue.includes("playground");
    });
    if (frame && await hasWordPressContent(frame)) {
      return frame;
    }
    if (await hasWordPressContent(page.mainFrame())) {
      return page.mainFrame();
    }
    await page.waitForTimeout(500);
  }
  return page.mainFrame();
}

async function hasWordPressContent(frame) {
  try {
    return await frame.evaluate(() => Boolean(document.querySelector(".wp-site-blocks, .wp-block-site-logo, .wp-block-button__link")));
  } catch {
    return false;
  }
}

async function gitRef() {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"]);
    return stdout.trim();
  } catch {
    return "main";
  }
}

async function findChrome() {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium"
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next known browser path.
    }
  }
  return undefined;
}
