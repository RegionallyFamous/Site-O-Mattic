import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const ROOT = process.cwd();
const OUTPUT_ROOT = process.env.VISUAL_SWEEP_DIR || "/tmp/site-o-mattic-visual-sweep";
const START_PORT = Number(process.env.VISUAL_SWEEP_PORT || 9540);
const SERVER_TIMEOUT_MS = Number(process.env.VISUAL_SWEEP_SERVER_TIMEOUT_MS || 90_000);
const PAGE_TIMEOUT_MS = Number(process.env.VISUAL_SWEEP_PAGE_TIMEOUT_MS || 120_000);
const FOCUS_WALK_LIMIT = Number(process.env.VISUAL_SWEEP_FOCUS_WALK_LIMIT || 80);
const MOBILE_MEDIA_PROOF_MIN_VISIBLE_RATIO = Number(process.env.VISUAL_SWEEP_MOBILE_MEDIA_PROOF_MIN_RATIO || 0.25);
const NEAR_NEIGHBOR_TASTE_DISTANCE = Number(process.env.VISUAL_SWEEP_NEAR_NEIGHBOR_TASTE_DISTANCE || 48);
const PLAYGROUND_NODE_BIN_DIR = await findPlaygroundNodeBinDir();

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
if (PLAYGROUND_NODE_BIN_DIR) {
  console.log(`Playground CLI child PATH prefers Node 22: ${PLAYGROUND_NODE_BIN_DIR}`);
}

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
        console.log(`  startup warnings: ${startup.warnings.length} line${startup.warnings.length === 1 ? "" : "s"}`);
      }
      const startupFailures = startupFailuresFor(startup.warnings);
      for (const failure of startupFailures) {
        console.log(`  FAIL ${failure}`);
      }

      const scenarioReports = [];
      for (const scenario of scenarios()) {
        const screenshot = path.join(slugDir, `${scenario.name}.png`);
        const result = await inspectScenario(browser, url, scenario, screenshot, spec);
        const failures = failuresFor(result).map((failure) => `${scenario.name}: ${failure}`);
        scenarioReports.push({ ...result, name: scenario.name, screenshot, failures });
      }

      const signature = summarizeScenarioShape(scenarioReports);
      const failures = [
        ...startupFailures,
        ...scenarioReports.flatMap((scenario) => scenario.failures)
      ];
      const tasteWarnings = scenarioReports.flatMap((scenario) =>
        (scenario.tasteWarnings || []).map((warning) => `${scenario.name}: ${warning}`)
      );
      if (failures.length) {
        hasFailure = true;
        for (const failure of failures) {
          console.log(`  FAIL ${failure}`);
        }
      } else {
        console.log(`  OK rendered viewports: ${scenarioReports.map((scenario) => scenario.name).join(", ")}`);
      }
      for (const warning of tasteWarnings.slice(0, 6)) {
        console.log(`  TASTE ${warning}`);
      }
      if (tasteWarnings.length > 6) {
        console.log(`  TASTE +${tasteWarnings.length - 6} more taste warning${tasteWarnings.length - 6 === 1 ? "" : "s"}`);
      }

      reports.push({
        slug: spec.slug,
        name: spec.businessName,
        specPath,
        blueprintPath,
        url,
        layoutVariant: spec.layoutVariant,
        pattern: spec.pattern,
        startupWarnings: startup.warnings,
        signature,
        scenarios: scenarioReports,
        tasteWarnings,
        failures
      });
    } finally {
      await stopServer(server);
    }
}

const nearestNeighbors = nearestNeighborSummary(reports);
applyNearestNeighborTasteWarnings(reports, nearestNeighbors);
const summary = {
  generatedAt: new Date().toISOString(),
  outputRoot: OUTPUT_ROOT,
  total: reports.length,
  failed: reports.filter((report) => report.failures.length).length,
  tasteWarningCount: reports.reduce((sum, report) => sum + report.tasteWarnings.length, 0),
  nearestNeighbors,
  reports
};
const reviewEvidence = {
  generatedAt: summary.generatedAt,
  outputRoot: OUTPUT_ROOT,
  total: summary.total,
  failed: summary.failed,
  tasteWarningCount: summary.tasteWarningCount,
  nearestNeighbors,
  items: reports.map(buildReviewEvidence)
};

await fs.writeFile(path.join(OUTPUT_ROOT, "report.json"), `${JSON.stringify(summary, null, 2)}\n`);
await fs.writeFile(path.join(OUTPUT_ROOT, "review-evidence.json"), `${JSON.stringify(reviewEvidence, null, 2)}\n`);
await writeContactSheet(summary);
await browser.close();

console.log("\nVisual sweep summary");
console.log(`- Total: ${summary.total}`);
console.log(`- Failed: ${summary.failed}`);
console.log(`- Taste warnings: ${summary.tasteWarningCount}`);
console.log(`- Report: ${path.join(OUTPUT_ROOT, "report.json")}`);
console.log(`- Review evidence: ${path.join(OUTPUT_ROOT, "review-evidence.json")}`);
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
      name: "mobile-430",
      viewport: { width: 430, height: 932 },
      isMobile: true
    },
    {
      name: "mobile-360",
      viewport: { width: 360, height: 780 },
      isMobile: true
    },
    {
      name: "tablet-768",
      viewport: { width: 768, height: 1024 }
    },
    {
      name: "tablet-1024",
      viewport: { width: 1024, height: 900 }
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
    env: playgroundChildEnv(),
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

function playgroundChildEnv() {
  if (!PLAYGROUND_NODE_BIN_DIR) {
    return process.env;
  }
  return {
    ...process.env,
    PATH: `${PLAYGROUND_NODE_BIN_DIR}${path.delimiter}${process.env.PATH || ""}`
  };
}

async function findPlaygroundNodeBinDir() {
  if (process.env.VISUAL_SWEEP_DISABLE_NODE22_SHIM === "1") {
    return null;
  }

  if (process.env.VISUAL_SWEEP_NODE_BIN_DIR) {
    const requested = process.env.VISUAL_SWEEP_NODE_BIN_DIR;
    if (await pathExists(path.join(requested, "node"))) {
      return requested;
    }
    console.warn(`VISUAL_SWEEP_NODE_BIN_DIR does not contain node: ${requested}`);
    return null;
  }

  const candidates = [];
  const nvmDir = process.env.NVM_DIR || path.join(os.homedir(), ".nvm");
  const nvmVersionsDir = path.join(nvmDir, "versions", "node");

  try {
    const entries = await fs.readdir(nvmVersionsDir, { withFileTypes: true });
    const node22Dirs = entries
      .filter((entry) => entry.isDirectory() && /^v22\./.test(entry.name))
      .map((entry) => path.join(nvmVersionsDir, entry.name, "bin"))
      .sort((left, right) => compareNodeVersionDirs(right, left));
    candidates.push(...node22Dirs);
  } catch {
    // No nvm install is fine; fall through to common Homebrew paths.
  }

  candidates.push(
    "/opt/homebrew/opt/node@22/bin",
    "/usr/local/opt/node@22/bin"
  );

  for (const candidate of candidates) {
    if (await pathExists(path.join(candidate, "node"))) {
      return candidate;
    }
  }

  return null;
}

function compareNodeVersionDirs(left, right) {
  const leftParts = path.basename(path.dirname(left)).replace(/^v/, "").split(".").map(Number);
  const rightParts = path.basename(path.dirname(right)).replace(/^v/, "").split(".").map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
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

async function inspectScenario(browser, url, scenario, screenshot, spec) {
  const page = await browser.newPage({
    viewport: scenario.viewport,
    isMobile: scenario.isMobile || false
  });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: PAGE_TIMEOUT_MS });
    const frame = await findWordPressFrame(page);
    await frame.waitForSelector(".wp-site-blocks, body", { timeout: 60_000 });
    await page.screenshot({ path: screenshot, fullPage: false });

    return await frame.evaluate(async ({ expectedCtaTexts, focusWalkLimit, scenarioName, isMobileViewport, mobileMediaProofMinVisibleRatio }) => {
      const text = document.body.innerText || "";
      const logo = rectFor(document.querySelector(".wp-block-site-logo img"));
      const h1Element = document.querySelector("h1");
      const h1 = rectFor(h1Element);
      const h1Contrast = contrastReport(h1Element);
      const navigationElement = document.querySelector(".wp-block-navigation");
      const navigation = rectFor(navigationElement);
      const ctas = [...document.querySelectorAll(".wp-block-button__link")]
        .map((element) => ({ text: element.textContent?.trim(), rect: rectFor(element), lineCount: textLineCount(element) }))
        .filter((item) => item.rect);
      const media = rectFor(document.querySelector(".wp-block-cover__image-background, .wp-block-image img, .wp-block-media-text__media"));
      const firstSection = rectFor(document.querySelector(".wp-site-blocks > *"));
      const bodyRect = rectFor(document.body);
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const overflowers = [...document.querySelectorAll("body *")]
        .filter((element) => !visuallyHiddenElement(element) && element.scrollWidth > element.clientWidth + 2)
        .slice(0, 10)
        .map((element) => String(element.className || element.tagName.toLowerCase()));

      const visible = (rect) => Boolean(rect && rect.width > 0 && rect.height > 0 && rect.top < viewport.height && rect.bottom > 0);
      const visibleCtas = ctas.filter((cta) => visible(cta.rect));
      const firstViewportCta = visibleCtas[0];
      const expectedCtas = expectedCtaTexts.map(normalizeCtaText).filter(Boolean);
      const firstViewportExpectedCta = expectedCtas.length
        ? visibleCtas.find((cta) => expectedCtas.includes(normalizeCtaText(cta.text)))
        : firstViewportCta;
      const keyOverlaps = keyOverlapFailures([
        { name: "logo", rect: logo },
        { name: "navigation", rect: navigation },
        { name: "h1", rect: h1 },
        ...ctas
          .filter((cta) => visible(cta.rect))
          .map((cta, index) => ({ name: `cta:${cta.text || index + 1}`, rect: cta.rect }))
      ]);
      const mediaProof = mediaProofReport(media);
      const ctaTypography = ctaTypographyReport(visibleCtas);
      const h1Typography = h1TypographyReport(h1Element, h1);
      const navigationTypography = navigationTypographyReport(navigationElement);
      const proofAlignment = proofAlignmentReport();
      const sectionIntroAlignment = sectionIntroAlignmentReport();
      const tasteWarnings = tasteWarningReport({ mediaProof, ctaTypography, h1Typography, navigationTypography, sectionIntroAlignment });
      disableSmoothScrolling();
      const anchorNavigation = await anchorNavigationReport();
      const focusWalk = await focusWalkReport();

      return {
        bodyTextLength: text.length,
        defaultWrapperLeak: /Twenty Twenty|Designed with WordPress|^Home$/m.test(text),
        firstViewportCtaVisible: Boolean(firstViewportCta),
        firstViewportCtaText: firstViewportCta?.text || null,
        firstViewportExpectedCtaVisible: Boolean(firstViewportExpectedCta),
        firstViewportExpectedCtaText: firstViewportExpectedCta?.text || null,
        expectedCtaTexts,
        visibleCtaTexts: visibleCtas.map((cta) => cta.text).filter(Boolean),
        ctaTypography,
        h1Typography,
        navigationTypography,
        logo,
        h1,
        h1Contrast,
        h1Visible: visible(h1),
        media,
        mediaProof,
        mediaVisible: visible(media),
        tasteWarnings,
        firstSection,
        bodyRect,
        viewport,
        overflowers,
        keyOverlaps,
        proofAlignment,
        sectionIntroAlignment,
        anchorNavigation,
        focusWalk
      };

      async function anchorNavigationReport() {
        const links = [...document.querySelectorAll('a[href^="#"]')]
          .map((link) => ({
            href: link.getAttribute("href") || "",
            text: link.textContent?.trim() || link.getAttribute("aria-label") || "anchor"
          }))
          .filter((link) => link.href.length > 1);
        const seen = new Set();
        const checked = [];
        const failures = [];

        for (const link of links) {
          const rawId = link.href.slice(1);
          const id = decodeHash(rawId);
          if (!id || seen.has(id)) {
            continue;
          }
          seen.add(id);
          const target = document.getElementById(id) || document.querySelector(`[name="${cssAttrValue(id)}"]`);
          if (!target) {
            failures.push(`Missing target #${id} for "${link.text}"`);
            continue;
          }

          target.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
          await nextPaint();
          const rect = rectFor(target);
          checked.push({ id, text: link.text, rect });
          if (!rect) {
            failures.push(`#${id} did not produce a measurable target.`);
            continue;
          }
          if (rect.top < -2) {
            failures.push(`#${id} scrolled above the viewport (${rect.top}px).`);
          }
          if (rect.top > viewport.height - 80) {
            failures.push(`#${id} landed too low in the viewport (${rect.top}px).`);
          }

          const cover = fixedOverlap(target, anchorProbeRect(rect));
          if (cover) {
            failures.push(`#${id} is covered by ${cover.name} (${cover.area}px overlap).`);
          }
        }

        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        await nextPaint();
        return {
          checked: checked.length,
          targets: checked.slice(0, 12),
          failures: failures.slice(0, 12)
        };
      }

      async function focusWalkReport() {
        const focusable = [...document.querySelectorAll('a[href], button, summary, [tabindex]:not([tabindex="-1"])')]
          .filter((element) => visibleElement(element))
          .slice(0, focusWalkLimit);
        const checked = [];
        const failures = [];

        for (const element of focusable) {
          const label = element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName.toLowerCase();
          element.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
          await nextPaint();
          element.focus({ preventScroll: true });
          await nextPaint();
          const active = document.activeElement;
          const rect = rectFor(element);
          const activeOk = active === element || element.contains(active);
          const inViewport = rect && rect.bottom > 0 && rect.top < viewport.height && rect.right > 0 && rect.left < viewport.width;
          checked.push({ label: label.slice(0, 80), rect, active: activeOk });

          if (!activeOk) {
            failures.push(`Focus did not land on "${label}".`);
            continue;
          }
          if (!inViewport) {
            failures.push(`Focused element "${label}" is outside the viewport.`);
            continue;
          }

          const cover = fixedOverlap(element, rect);
          if (cover) {
            failures.push(`Focused element "${label}" is covered by ${cover.name} (${cover.area}px overlap).`);
          }
        }

        return {
          checked: checked.length,
          targets: checked.slice(0, 12),
          failures: failures.slice(0, 12)
        };
      }

      function keyOverlapFailures(items) {
        const visibleItems = items.filter((item) => visible(item.rect));
        const failures = [];
        for (let left = 0; left < visibleItems.length; left += 1) {
          for (let right = left + 1; right < visibleItems.length; right += 1) {
            const overlap = overlapArea(visibleItems[left].rect, visibleItems[right].rect);
            if (overlap > 24) {
              failures.push(`${visibleItems[left].name} overlaps ${visibleItems[right].name} by ${Math.round(overlap)}px`);
            }
          }
        }
        return failures.slice(0, 8);
      }

      function proofAlignmentReport() {
        const cards = [...document.querySelectorAll(".som-proof-card,.som-route-proof-card,[class*='-proof-card']")]
          .map((card) => {
            const children = [...card.children]
              .map((child) => ({ element: child, rect: rectFor(child), text: child.textContent?.trim() || "" }))
              .filter((child) => child.text && child.rect && child.rect.width > 20 && child.rect.height > 8);
            return {
              rect: rectFor(card),
              stat: children[0]?.rect || null,
              label: children.at(-1)?.rect || null,
              directTextChildren: children.length
            };
          })
          .filter((card) => card.rect && card.rect.width > 80 && card.rect.height > 40 && card.stat && card.label && card.directTextChildren === 2)
          .sort((left, right) => left.rect.top - right.rect.top || left.rect.left - right.rect.left);
        const rows = [];
        for (const card of cards) {
          const row = rows.find((candidate) => Math.abs(candidate.top - card.rect.top) <= 18);
          if (row) {
            row.cards.push(card);
            row.top = Math.round((row.top + card.rect.top) / 2);
          } else {
            rows.push({ top: card.rect.top, cards: [card] });
          }
        }
        const failures = rows
          .filter((row) => row.cards.length >= 2)
          .map((row) => {
            const statSpread = spread(row.cards.map((card) => card.stat.top));
            const labelSpread = spread(row.cards.map((card) => card.label.bottom));
            return { top: row.top, count: row.cards.length, statSpread, labelSpread };
          })
          .filter((row) => row.statSpread > 16 || row.labelSpread > 16)
          .map((row) => `proof row y=${row.top} (${row.count} cards) stat spread ${row.statSpread}px, label spread ${row.labelSpread}px`);
        return {
          checkedRows: rows.filter((row) => row.cards.length >= 2).length,
          failures: failures.slice(0, 8)
        };
      }

      function sectionIntroAlignmentReport() {
        const headings = [...document.querySelectorAll(".wp-site-blocks h2.wp-block-heading, .wp-site-blocks h2")]
          .filter(visibleElement)
          .map((heading) => {
            const intro = nextIntroParagraphFor(heading);
            const headingRect = rectFor(heading);
            const introRect = intro ? rectFor(intro) : null;
            return { heading, intro, headingRect, introRect };
          })
          .filter((pair) => pair.intro && pair.headingRect && pair.introRect)
          .filter((pair) => {
            const headingText = pair.heading.textContent?.trim() || "";
            const introText = pair.intro.textContent?.trim() || "";
            return headingText.length >= 8
              && introText.length >= 55
              && pair.headingRect.width >= 220
              && pair.introRect.width >= 240
              && pair.headingRect.height >= 20
              && pair.introRect.height >= 20;
          })
          .filter((pair) => {
            const headingAlign = getComputedStyle(pair.heading).textAlign;
            const introAlign = getComputedStyle(pair.intro).textAlign;
            return headingAlign !== "center"
              && introAlign !== "center"
              && !pair.heading.classList.contains("has-text-align-center")
              && !pair.intro.classList.contains("has-text-align-center");
          });
        const driftLimit = isMobileViewport
          ? 48
          : Math.max(80, Math.min(140, viewport.width * 0.075));
        const gapLimit = isMobileViewport ? 42 : 56;
        const items = headings
          .map((pair) => ({
            headingText: pair.heading.textContent?.trim() || "",
            delta: Math.round(pair.introRect.left - pair.headingRect.left),
            verticalGap: Math.round(pair.introRect.top - pair.headingRect.bottom),
            headingLeft: Math.round(pair.headingRect.left),
            introLeft: Math.round(pair.introRect.left)
          }));
        const failures = items
          .filter((item) => Math.abs(item.delta) > driftLimit || item.verticalGap > gapLimit)
          .map((item) => {
            const issues = [];
            if (Math.abs(item.delta) > driftLimit) {
              issues.push(`copy starts ${Math.abs(item.delta)}px ${item.delta > 0 ? "to the right" : "to the left"}`);
            }
            if (item.verticalGap > gapLimit) {
              issues.push(`gap is ${item.verticalGap}px`);
            }
            return `Section intro "${shortText(item.headingText, 42)}" has awkward rhythm on ${scenarioName}: ${issues.join(", ")}.`;
          });
        return {
          checkedPairs: headings.length,
          driftLimit: Math.round(driftLimit),
          gapLimit,
          items: items.slice(0, 8),
          failures: failures.slice(0, 8)
        };
      }

      function nextIntroParagraphFor(heading) {
        let candidate = heading.nextElementSibling;
        let scanned = 0;
        while (candidate && scanned < 6) {
          scanned += 1;
          if (/^H[1-3]$/i.test(candidate.tagName)) {
            return null;
          }
          if (candidate.matches?.("p, .wp-block-paragraph") && visibleElement(candidate)) {
            return candidate;
          }
          if (candidate.matches?.(".wp-block-columns, .wp-block-table, .wp-block-gallery, .wp-block-media-text, figure, ul, ol, table")) {
            return null;
          }
          candidate = candidate.nextElementSibling;
        }
        return null;
      }

      function mediaProofReport(rect) {
        if (!rect) {
          return null;
        }
        const totalArea = Math.max(0, rect.width) * Math.max(0, rect.height);
        const visibleLeft = Math.max(0, rect.left);
        const visibleRight = Math.min(viewport.width, rect.right);
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewport.height, rect.bottom);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibleArea = visibleWidth * visibleHeight;
        return {
          visibleArea: Math.round(visibleArea),
          totalArea: Math.round(totalArea),
          visibleRatio: totalArea ? roundRatio(visibleArea / totalArea) : 0,
          visibleHeightRatio: rect.height ? roundRatio(visibleHeight / rect.height) : 0,
          visibleWidthRatio: rect.width ? roundRatio(visibleWidth / rect.width) : 0,
          visibleHeight: Math.round(visibleHeight),
          totalHeight: Math.round(rect.height),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          viewportHeight: viewport.height
        };
      }

      function tasteWarningReport({ mediaProof: proof, ctaTypography: ctaType, h1Typography: h1Type, navigationTypography: navType, sectionIntroAlignment: sectionIntro }) {
        const warnings = [];
        if (isMobileViewport && proof && proof.visibleArea > 0 && proof.visibleRatio < mobileMediaProofMinVisibleRatio) {
          warnings.push(`Primary media proof is thin in first viewport: ${formatPercent(proof.visibleRatio)} visible on ${scenarioName} (top ${proof.top}px, ${proof.visibleHeight}/${proof.totalHeight}px height visible).`);
        }
        for (const failure of sectionIntro?.failures || []) {
          warnings.push(failure);
        }
        for (const failure of ctaType?.failures || []) {
          warnings.push(failure);
        }
        for (const failure of h1Type?.failures || []) {
          warnings.push(failure);
        }
        for (const failure of navType?.failures || []) {
          warnings.push(failure);
        }
        return warnings;
      }

      function h1TypographyReport(element, rect) {
        if (!element || !rect) {
          return { checked: false, failures: [] };
        }
        const lineCount = textLineCount(element);
        const heightRatio = viewport.height ? roundRatio(rect.height / viewport.height) : 0;
        const lineLimit = isMobileViewport ? 4 : viewport.width >= 1180 ? 3 : 4;
        const heightLimit = isMobileViewport ? 0.34 : 0.3;
        const failures = [];
        if (lineCount > lineLimit) {
          failures.push(`H1 wraps across ${lineCount} lines on ${scenarioName}; limit ${lineLimit}.`);
        }
        if (heightRatio > heightLimit) {
          failures.push(`H1 consumes ${formatPercent(heightRatio)} of viewport height on ${scenarioName}; limit ${formatPercent(heightLimit)}.`);
        }
        return {
          checked: true,
          text: element.textContent?.trim() || "",
          lineCount,
          heightRatio,
          lineLimit,
          heightLimit,
          rect,
          failures
        };
      }

      function navigationTypographyReport(element) {
        if (!element || !visibleElement(element)) {
          return { checked: false, failures: [] };
        }
        const rect = rectFor(element);
        const controls = [...element.querySelectorAll("a, button")]
          .filter(visibleElement)
          .map((control) => ({
            text: control.textContent?.trim() || control.getAttribute("aria-label") || "",
            rect: rectFor(control),
            lineCount: textLineCount(control)
          }))
          .filter((control) => control.rect);
        const textControls = controls.filter((control) => control.text);
        const rowCount = new Set(textControls.map((control) => Math.round(control.rect.top / 4) * 4)).size;
        const overflow = element.scrollWidth > element.clientWidth + 2;
        const navigationContainer = element.querySelector(".wp-block-navigation__container") || element;
        const navigationStyle = getComputedStyle(navigationContainer);
        const isVerticalNavigation = navigationStyle.flexDirection?.startsWith("column")
          || element.classList.contains("som-rail-nav")
          || Boolean(element.closest(".som-side-rail"));
        const failures = [];
        if (overflow) {
          failures.push(`Navigation overflows its container on ${scenarioName}: ${element.scrollWidth}px content in ${element.clientWidth}px box.`);
        }
        if (!isMobileViewport && textControls.length > 1 && rowCount > 1 && !isVerticalNavigation) {
          failures.push(`Navigation wraps into ${rowCount} rows on ${scenarioName}.`);
        }
        for (const control of textControls.filter((item) => item.text.length <= 20 && item.lineCount > 1)) {
          failures.push(`Short navigation label wraps across ${control.lineCount} lines on ${scenarioName}: "${control.text}".`);
        }
        return {
          checked: true,
          overflow,
          rowCount,
          rect,
          items: textControls.slice(0, 8),
          failures: failures.slice(0, 8)
        };
      }

      function ctaTypographyReport(buttons) {
        const failures = buttons
          .filter((button) => button.text && button.text.length <= 26 && button.lineCount > 1)
          .map((button) => `Short CTA label wraps across ${button.lineCount} lines on ${scenarioName}: "${button.text}".`);
        return {
          checked: buttons.length,
          maxLineCount: Math.max(0, ...buttons.map((button) => button.lineCount || 0)),
          failures: failures.slice(0, 8),
          items: buttons.slice(0, 8).map((button) => ({
            text: button.text,
            lineCount: button.lineCount,
            rect: button.rect
          }))
        };
      }

      function fixedOverlap(element, rect) {
        if (!rect) {
          return null;
        }
        const areaLimit = Math.max(160, Math.min(1600, rect.width * rect.height * 0.12));
        const overlays = fixedOrStickyElements()
          .filter((item) => item.element !== element && !item.element.contains(element) && !element.contains(item.element))
          .map((item) => ({ ...item, area: Math.round(overlapArea(item.rect, rect)) }))
          .filter((item) => item.area > areaLimit)
          .sort((left, right) => right.area - left.area);
        const overlay = overlays[0];
        if (!overlay) {
          return null;
        }
        return {
          name: overlay.name,
          area: overlay.area,
          rect: overlay.rect
        };
      }

      function anchorProbeRect(rect) {
        const height = Math.min(96, Math.max(32, rect.height));
        return {
          ...rect,
          bottom: Math.round(Math.min(rect.bottom, rect.top + height)),
          height: Math.round(height)
        };
      }

      function fixedOrStickyElements() {
        return [...document.querySelectorAll("body *")]
          .map((element) => {
            const style = window.getComputedStyle(element);
            return {
              element,
              position: style.position,
              name: elementDescriptor(element),
              rect: rectFor(element)
            };
          })
          .filter((item) => (item.position === "fixed" || item.position === "sticky")
            && item.rect
            && item.rect.width > 24
            && item.rect.height > 12
            && item.rect.bottom > 0
            && item.rect.top < viewport.height
            && item.rect.right > 0
            && item.rect.left < viewport.width);
      }

      function visibleElement(element) {
        const style = window.getComputedStyle(element);
        const rect = rectFor(element);
        return Boolean(rect
          && style.visibility !== "hidden"
          && style.display !== "none"
          && rect.width > 0
          && rect.height > 0);
      }

      function visuallyHiddenElement(element) {
        let current = element;
        while (current && current !== document.body && current.nodeType === Node.ELEMENT_NODE) {
          if (visuallyHiddenSelf(current)) {
            return true;
          }
          current = current.parentElement;
        }
        return false;
      }

      function visuallyHiddenSelf(element) {
        const style = window.getComputedStyle(element);
        const rect = rectFor(element);
        if (!rect || style.display === "none" || style.visibility === "hidden") {
          return true;
        }
        const clipped = style.clip !== "auto" || style.clipPath !== "none";
        return Boolean(clipped
          && rect.width <= 2
          && rect.height <= 2
          && style.position === "absolute"
          && style.overflow === "hidden");
      }

      async function nextPaint() {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      function disableSmoothScrolling() {
        document.documentElement.style.scrollBehavior = "auto";
        document.body.style.scrollBehavior = "auto";
      }

      function decodeHash(value) {
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }

      function cssAttrValue(value) {
        return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
      }

      function elementDescriptor(element) {
        const tag = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : "";
        const className = String(element.className || "")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((item) => `.${item}`)
          .join("");
        return `${tag}${id}${className}`;
      }

      function shortText(value, maxLength) {
        const textValue = String(value || "").replace(/\s+/g, " ").trim();
        if (textValue.length <= maxLength) {
          return textValue;
        }
        return `${textValue.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
      }

      function overlapArea(left, right) {
        const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
        const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
        return width * height;
      }

      function spread(values) {
        return Math.round(Math.max(...values) - Math.min(...values));
      }

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

      function textLineCount(element) {
        try {
          const range = document.createRange();
          range.selectNodeContents(element);
          const tops = [...range.getClientRects()]
            .filter((rect) => rect.width > 1 && rect.height > 1)
            .map((rect) => Math.round(rect.top / 2) * 2);
          range.detach();
          return new Set(tops).size || 1;
        } catch {
          return 1;
        }
      }

      function contrastReport(element) {
        if (!element) {
          return null;
        }
        const foreground = parseCssColor(window.getComputedStyle(element).color);
        if (!foreground) {
          return null;
        }

        let backgroundImageAncestor = false;
        let current = element;
        while (current) {
          const style = window.getComputedStyle(current);
          if (style.backgroundImage && /\burl\(/i.test(style.backgroundImage)) {
            backgroundImageAncestor = true;
          }
          if (current.classList?.contains("wp-block-cover") && current.querySelector(".wp-block-cover__image-background")) {
            backgroundImageAncestor = true;
          }
          const background = parseCssColor(style.backgroundColor);
          if (background && background.a > 0.05) {
            return {
              ratio: Number(contrastRatio(foreground, background).toFixed(2)),
              foreground: colorString(foreground),
              background: colorString(background),
              backgroundImageAncestor
            };
          }
          current = current.parentElement;
        }
        const fallback = { r: 255, g: 255, b: 255, a: 1 };
        return {
          ratio: Number(contrastRatio(foreground, fallback).toFixed(2)),
          foreground: colorString(foreground),
          background: "rgb(255, 255, 255)",
          backgroundImageAncestor
        };
      }

      function parseCssColor(value) {
        const match = String(value || "").match(/rgba?\(([^)]+)\)/i);
        if (!match) {
          return null;
        }
        const parts = match[1].split(",").map((part) => part.trim());
        const [r, g, b] = parts.slice(0, 3).map(Number);
        const a = parts[3] === undefined ? 1 : Number(parts[3]);
        if ([r, g, b, a].some((part) => Number.isNaN(part))) {
          return null;
        }
        return { r, g, b, a };
      }

      function contrastRatio(left, right) {
        const leftLuminance = relativeLuminance(left);
        const rightLuminance = relativeLuminance(right);
        const light = Math.max(leftLuminance, rightLuminance);
        const dark = Math.min(leftLuminance, rightLuminance);
        return (light + 0.05) / (dark + 0.05);
      }

      function relativeLuminance(color) {
        const [r, g, b] = [color.r, color.g, color.b]
          .map((channel) => {
            const value = channel / 255;
            return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }

      function colorString(color) {
        return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
      }

      function normalizeCtaText(value) {
        return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      }

      function roundRatio(value) {
        return Math.round(value * 1000) / 1000;
      }

      function formatPercent(value) {
        return `${Math.round(value * 100)}%`;
      }
    }, {
      expectedCtaTexts: expectedFirstViewportCtaTexts(spec),
      focusWalkLimit: FOCUS_WALK_LIMIT,
      scenarioName: scenario.name,
      isMobileViewport: Boolean(scenario.isMobile),
      mobileMediaProofMinVisibleRatio: MOBILE_MEDIA_PROOF_MIN_VISIBLE_RATIO
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
  if (result.firstViewportCtaVisible && !result.firstViewportExpectedCtaVisible) {
    failures.push(`No spec primary/secondary CTA is visible in the first viewport. Expected ${result.expectedCtaTexts.join(" / ")}; saw ${result.visibleCtaTexts.join(" / ") || "none"}.`);
  }
  if (result.h1Contrast && !result.h1Contrast.backgroundImageAncestor && result.h1Contrast.ratio < 4.5) {
    failures.push(`H1 contrast is low on its computed background (${result.h1Contrast.ratio}:1, ${result.h1Contrast.foreground} on ${result.h1Contrast.background}).`);
  }
  if (result.defaultWrapperLeak) {
    failures.push("Default theme wrapper text appears in the render.");
  }
  if (result.overflowers.length) {
    failures.push(`Potential horizontal overflow: ${result.overflowers.join(", ")}`);
  }
  if (result.keyOverlaps?.length) {
    failures.push(`Key element overlap: ${result.keyOverlaps.join("; ")}`);
  }
  if (result.proofAlignment?.failures?.length) {
    failures.push(`Proof card alignment drift: ${result.proofAlignment.failures.join("; ")}`);
  }
  if (result.sectionIntroAlignment?.failures?.length) {
    failures.push(`Section intro alignment drift: ${result.sectionIntroAlignment.failures.join("; ")}`);
  }
  if (result.anchorNavigation?.failures?.length) {
    failures.push(`Anchor navigation issue: ${result.anchorNavigation.failures.join("; ")}`);
  }
  if (result.focusWalk?.failures?.length) {
    failures.push(`Focus walk issue: ${result.focusWalk.failures.join("; ")}`);
  }
  return failures;
}

function startupFailuresFor(warnings) {
  if (!warnings.length || process.env.VISUAL_SWEEP_ALLOW_STARTUP_WARNINGS === "1") {
    return [];
  }
  return warnings.map((warning) => `Unexpected Playground startup warning: ${warning}`);
}

function expectedFirstViewportCtaTexts(spec) {
  return [...new Set([
    spec.copy?.primaryCta,
    spec.copy?.secondaryCta
  ].filter(Boolean))];
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
    mobile430H1: scenarios.find((scenario) => scenario.name === "mobile-430")?.h1,
    mobile360H1: scenarios.find((scenario) => scenario.name === "mobile-360")?.h1,
    tablet768H1: scenarios.find((scenario) => scenario.name === "tablet-768")?.h1,
    tablet1024H1: scenarios.find((scenario) => scenario.name === "tablet-1024")?.h1
  };
}

function buildReviewEvidence(report) {
  return {
    slug: report.slug,
    name: report.name,
    specPath: report.specPath,
    blueprintPath: report.blueprintPath,
    layoutVariant: report.layoutVariant,
    primaryPattern: report.pattern?.primaryPattern || null,
    secondaryPattern: report.pattern?.secondaryPattern || null,
    silhouette: report.pattern?.silhouette || null,
    navigationPrimitive: report.pattern?.navigationPrimitive || null,
    mobileActionPattern: report.pattern?.mobileActionPattern || null,
    styleFamily: report.pattern?.styleFamily || null,
    ctaRhythm: report.pattern?.ctaRhythm || null,
    imageEvidence: report.pattern?.imageEvidence || null,
    coreBlockPlan: report.pattern?.coreBlockPlan || [],
    startupWarnings: report.startupWarnings,
    status: report.failures.length ? "fail" : "ok",
    failures: report.failures,
    tasteWarnings: report.tasteWarnings,
    scenarios: report.scenarios.map((scenario) => ({
      name: scenario.name,
      viewport: scenario.viewport,
      screenshot: path.relative(OUTPUT_ROOT, scenario.screenshot),
      bodyTextLength: scenario.bodyTextLength,
      defaultWrapperLeak: scenario.defaultWrapperLeak,
      firstViewportCtaText: scenario.firstViewportCtaText,
      firstViewportExpectedCtaText: scenario.firstViewportExpectedCtaText,
      expectedCtaTexts: scenario.expectedCtaTexts,
      visibleCtaTexts: scenario.visibleCtaTexts,
      ctaTypography: scenario.ctaTypography,
      h1Typography: scenario.h1Typography,
      navigationTypography: scenario.navigationTypography,
      logo: scenario.logo,
      h1: scenario.h1,
      h1Contrast: scenario.h1Contrast,
      media: scenario.media,
      mediaProof: scenario.mediaProof,
      tasteWarnings: scenario.tasteWarnings,
      overflowers: scenario.overflowers,
      keyOverlaps: scenario.keyOverlaps,
      proofAlignment: scenario.proofAlignment,
      sectionIntroAlignment: scenario.sectionIntroAlignment,
      anchorNavigation: scenario.anchorNavigation,
      focusWalk: scenario.focusWalk,
      failures: scenario.failures
    }))
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

function applyNearestNeighborTasteWarnings(reports, pairs) {
  const bySlug = new Map(reports.map((report) => [report.slug, report]));
  for (const pair of pairs) {
    if (pair.distance > NEAR_NEIGHBOR_TASTE_DISTANCE) {
      continue;
    }
    const left = bySlug.get(pair.left);
    const right = bySlug.get(pair.right);
    if (!left || !right) {
      continue;
    }
    left.tasteWarnings.push(nearestNeighborTasteWarning(right.slug, pair.distance));
    right.tasteWarnings.push(nearestNeighborTasteWarning(left.slug, pair.distance));
  }
}

function nearestNeighborTasteWarning(slug, distance) {
  return `Visual nearest-neighbor is too close to ${slug}: distance ${distance} below ${NEAR_NEIGHBOR_TASTE_DISTANCE}.`;
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
