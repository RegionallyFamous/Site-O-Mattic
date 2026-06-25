import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const ROOT = process.cwd();
const OUTPUT_ROOT = process.env.VISUAL_SWEEP_DIR || "/tmp/site-o-mattic-visual-sweep";
const START_PORT = Number(process.env.VISUAL_SWEEP_PORT || 9540);
const SERVER_TIMEOUT_MS = Number(process.env.VISUAL_SWEEP_SERVER_TIMEOUT_MS || 90_000);
const PAGE_TIMEOUT_MS = Number(process.env.VISUAL_SWEEP_PAGE_TIMEOUT_MS || 120_000);

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("Missing playwright-core. Install dev dependencies before running visual sweep.");
  process.exit(1);
}

const specPaths = await specTargets(process.argv.slice(2));
if (!specPaths.length) {
  console.error("No specs found for visual sweep.");
  process.exit(1);
}

await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
await fs.mkdir(OUTPUT_ROOT, { recursive: true });

const executablePath = process.env.CHROME_PATH || await findChrome();
const browser = await chromium.launch({ executablePath, headless: true });
const reports = [];
let hasFailure = false;

console.log(`Visual sweep output: ${OUTPUT_ROOT}`);
console.log(`Sweeping ${specPaths.length} Blueprint${specPaths.length === 1 ? "" : "s"} through local Playground renders.`);

for (const [index, specPath] of specPaths.entries()) {
    const spec = await readSpec(specPath);
    const port = START_PORT + index;
    const blueprintPath = blueprintPathForSpec(spec);
    const url = `http://127.0.0.1:${port}`;
    const slugDir = path.join(OUTPUT_ROOT, spec.slug);

    await fs.mkdir(slugDir, { recursive: true });
    console.log(`\n[${index + 1}/${specPaths.length}] ${spec.slug}: starting Playground on ${url}`);

    const server = startPlaygroundServer(blueprintPath, port);
    try {
      const startup = await waitForReady(server, SERVER_TIMEOUT_MS);
      if (startup.warnings.length) {
        console.log(`  startup warnings: ${startup.warnings.length} non-fatal line${startup.warnings.length === 1 ? "" : "s"}`);
      }

      const scenarioReports = [];
      for (const scenario of scenarios()) {
        const screenshot = path.join(slugDir, `${scenario.name}.png`);
        const result = await inspectScenario(browser, url, scenario, screenshot);
        const failures = failuresFor(result).map((failure) => `${scenario.name}: ${failure}`);
        scenarioReports.push({ ...result, name: scenario.name, screenshot, failures });
      }

      const signature = summarizeScenarioShape(scenarioReports);
      const failures = scenarioReports.flatMap((scenario) => scenario.failures);
      if (failures.length) {
        hasFailure = true;
        for (const failure of failures) {
          console.log(`  FAIL ${failure}`);
        }
      } else {
        console.log(`  OK rendered viewports: ${scenarioReports.map((scenario) => scenario.name).join(", ")}`);
      }

      reports.push({
        slug: spec.slug,
        name: spec.businessName,
        specPath,
        blueprintPath,
        url,
        layoutVariant: spec.layoutVariant,
        pattern: spec.pattern,
        signature,
        scenarios: scenarioReports,
        failures
      });
    } finally {
      await stopServer(server);
    }
}

const nearestNeighbors = nearestNeighborSummary(reports);
const summary = {
  generatedAt: new Date().toISOString(),
  outputRoot: OUTPUT_ROOT,
  total: reports.length,
  failed: reports.filter((report) => report.failures.length).length,
  nearestNeighbors,
  reports
};

await fs.writeFile(path.join(OUTPUT_ROOT, "report.json"), `${JSON.stringify(summary, null, 2)}\n`);
await writeContactSheet(summary);
await browser.close();

console.log("\nVisual sweep summary");
console.log(`- Total: ${summary.total}`);
console.log(`- Failed: ${summary.failed}`);
console.log(`- Report: ${path.join(OUTPUT_ROOT, "report.json")}`);
console.log(`- Contact sheet: ${path.join(OUTPUT_ROOT, "contact-sheet.png")}`);
console.log("- Closest desktop layout neighbors:");
for (const item of nearestNeighbors.slice(0, 10)) {
  console.log(`  ${item.left} <-> ${item.right}: distance ${item.distance}`);
}

if (hasFailure) {
  process.exit(1);
}

function scenarios() {
  return [
    {
      name: "desktop",
      viewport: { width: 1440, height: 1000 }
    },
    {
      name: "mobile-390",
      viewport: { width: 390, height: 844 },
      isMobile: true
    },
    {
      name: "mobile-360",
      viewport: { width: 360, height: 780 },
      isMobile: true
    }
  ];
}

function startPlaygroundServer(blueprintPath, port) {
  const cliArgs = [
    "server",
    `--blueprint=${blueprintPath}`,
    "--php=8.4",
    "--wp=latest",
    `--port=${port}`,
    "--login",
    "--verbosity=normal"
  ];
  const command = playgroundCommand(cliArgs);
  return spawn(command.bin, command.args, {
    cwd: ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function playgroundCommand(cliArgs) {
  if (process.env.PLAYGROUND_CLI_BIN) {
    return { bin: process.env.PLAYGROUND_CLI_BIN, args: cliArgs };
  }
  if (process.env.PLAYGROUND_CLI_USE_NPM_EXEC === "1") {
    return {
      bin: "npm",
      args: ["exec", "--yes", "--package", "@wp-playground/cli@latest", "--", "wp-playground-cli", ...cliArgs]
    };
  }
  return {
    bin: "npx",
    args: ["--yes", "--package", "@wp-playground/cli@latest", "--", "wp-playground-cli", ...cliArgs]
  };
}

function waitForReady(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    let output = "";
    const warnings = [];
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for Playground server after ${timeoutMs}ms. Last output:\n${output.slice(-4000)}`));
    }, timeoutMs);

    const onData = (chunk) => {
      const text = chunk.toString();
      output += text;
      for (const line of text.split(/\r?\n/)) {
        if (/warning|unexpected error|EBADF/i.test(line)) {
          warnings.push(stripAnsi(line));
        }
      }
      if (text.includes("Ready!") || /WordPress is running on/.test(text)) {
        cleanup();
        resolve({ output, warnings });
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`Playground server exited before ready with code ${code}. Last output:\n${output.slice(-4000)}`));
    };

    const cleanup = () => {
      clearTimeout(timer);
      child.stdout.off("data", onData);
      child.stderr.off("data", onData);
      child.off("exit", onExit);
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", onExit);
    child.on("error", (error) => {
      cleanup();
      reject(error);
    });
  });
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode) {
    return;
  }
  child.kill("SIGINT");
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
      resolve();
    }, 3000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function inspectScenario(browser, url, scenario, screenshot) {
  const page = await browser.newPage({
    viewport: scenario.viewport,
    isMobile: scenario.isMobile || false
  });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: PAGE_TIMEOUT_MS });
    const frame = await findWordPressFrame(page);
    await frame.waitForSelector(".wp-site-blocks, body", { timeout: 60_000 });
    await page.screenshot({ path: screenshot, fullPage: false });

    return await frame.evaluate(() => {
      const text = document.body.innerText || "";
      const logo = rectFor(document.querySelector(".wp-block-site-logo img"));
      const h1 = rectFor(document.querySelector("h1"));
      const ctas = [...document.querySelectorAll(".wp-block-button__link")]
        .map((element) => ({ text: element.textContent?.trim(), rect: rectFor(element) }))
        .filter((item) => item.rect);
      const media = rectFor(document.querySelector(".wp-block-cover__image-background, .wp-block-image img, .wp-block-media-text__media"));
      const firstSection = rectFor(document.querySelector(".wp-site-blocks > *"));
      const bodyRect = rectFor(document.body);
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const overflowers = [...document.querySelectorAll("body *")]
        .filter((element) => element.scrollWidth > element.clientWidth + 2)
        .slice(0, 10)
        .map((element) => String(element.className || element.tagName.toLowerCase()));

      const visible = (rect) => Boolean(rect && rect.width > 0 && rect.height > 0 && rect.top < viewport.height && rect.bottom > 0);
      const firstViewportCta = ctas.find((cta) => visible(cta.rect));

      return {
        bodyTextLength: text.length,
        defaultWrapperLeak: /Twenty Twenty|Designed with WordPress|^Home$/m.test(text),
        firstViewportCtaVisible: Boolean(firstViewportCta),
        firstViewportCtaText: firstViewportCta?.text || null,
        logo,
        h1,
        h1Visible: visible(h1),
        media,
        mediaVisible: visible(media),
        firstSection,
        bodyRect,
        viewport,
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
  } finally {
    await page.close();
  }
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

function summarizeScenarioShape(scenarios) {
  const desktop = scenarios.find((scenario) => scenario.name === "desktop") || scenarios[0];
  return {
    desktopLogo: desktop?.logo,
    desktopH1: desktop?.h1,
    desktopCtaText: desktop?.firstViewportCtaText,
    desktopMedia: desktop?.media,
    mobile390H1: scenarios.find((scenario) => scenario.name === "mobile-390")?.h1,
    mobile360H1: scenarios.find((scenario) => scenario.name === "mobile-360")?.h1
  };
}

function nearestNeighborSummary(reports) {
  const pairs = [];
  for (let left = 0; left < reports.length; left += 1) {
    for (let right = left + 1; right < reports.length; right += 1) {
      const distance = layoutDistance(reports[left].signature, reports[right].signature);
      pairs.push({
        left: reports[left].slug,
        right: reports[right].slug,
        distance
      });
    }
  }
  return pairs.sort((left, right) => left.distance - right.distance).slice(0, 20);
}

function layoutDistance(left, right) {
  const leftRects = [left.desktopLogo, left.desktopH1, left.desktopMedia].filter(Boolean);
  const rightRects = [right.desktopLogo, right.desktopH1, right.desktopMedia].filter(Boolean);
  const count = Math.min(leftRects.length, rightRects.length);
  if (!count) {
    return 999999;
  }
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    total += rectDistance(leftRects[index], rightRects[index]);
  }
  return Math.round(total / count);
}

function rectDistance(left, right) {
  return Math.abs(left.top - right.top)
    + Math.abs(left.left - right.left)
    + Math.abs(left.width - right.width)
    + Math.abs(left.height - right.height);
}

async function writeContactSheet(summary) {
  const htmlPath = path.join(OUTPUT_ROOT, "contact-sheet.html");
  const screenshotPath = path.join(OUTPUT_ROOT, "contact-sheet.png");
  const cards = summary.reports.map((report) => {
    const desktop = `${report.slug}/desktop.png`;
    const mobile = `${report.slug}/mobile-390.png`;
    const status = report.failures.length ? "FAIL" : "OK";
    return `
      <article class="${report.failures.length ? "fail" : "ok"}">
        <header><strong>${escapeHtml(report.slug)}</strong><span>${status}</span></header>
        <div class="shots">
          <img src="${desktop}" alt="${escapeHtml(report.slug)} desktop">
          <img class="mobile" src="${mobile}" alt="${escapeHtml(report.slug)} mobile">
        </div>
      </article>`;
  }).join("\n");

  await fs.writeFile(htmlPath, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Site-O-Mattic Visual Sweep</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#101114;color:#f5f5f5;font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{padding:24px}
    h1{margin:0 0 18px;font-size:28px}
    .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
    article{background:#1c1e23;border:1px solid #31343b;border-radius:8px;overflow:hidden}
    article.fail{border-color:#ff6464}
    header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid #31343b}
    header strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    header span{font-weight:800;color:#72e29f}
    article.fail header span{color:#ff8585}
    .shots{display:grid;grid-template-columns:1fr 108px;gap:8px;padding:8px;align-items:start}
    img{display:block;width:100%;height:220px;object-fit:cover;object-position:top center;background:#000;border-radius:4px}
    img.mobile{height:220px}
  </style>
</head>
<body>
  <main>
    <h1>Site-O-Mattic Visual Sweep</h1>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>
`);

  const page = await browser.newPage({ viewport: { width: 1800, height: Math.max(1200, Math.ceil(summary.reports.length / 3) * 320) } });
  try {
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } finally {
    await page.close();
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
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
