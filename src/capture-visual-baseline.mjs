import fs from "node:fs/promises";
import path from "node:path";

const slug = process.env.SLUG || process.argv[2];
const url = process.env.PLAYGROUND_URL || process.argv[3];

if (!slug || !url) {
  console.error("Usage: SLUG=<slug> PLAYGROUND_URL=<url> node src/capture-visual-baseline.mjs");
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("Missing playwright-core. Install dev dependencies before capturing baselines.");
  process.exit(1);
}

const executablePath = process.env.CHROME_PATH || await findChrome();
const browser = await chromium.launch({ executablePath, headless: true });
const baselineDir = path.join("qa", "baselines", slug);
await fs.mkdir(baselineDir, { recursive: true });

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await desktop.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  await desktop.screenshot({ path: path.join(baselineDir, "desktop.png"), fullPage: false });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  await mobile.screenshot({ path: path.join(baselineDir, "mobile.png"), fullPage: false });
  await mobile.close();

  await fs.writeFile(path.join(baselineDir, "review.json"), `${JSON.stringify({
    slug,
    url,
    capturedViewports: ["desktop", "mobile"],
    reviewed: false,
    notes: "Set reviewed to true and release.visualBaseline to approved after human visual approval."
  }, null, 2)}\n`);

  console.log(`Captured visual baseline screenshots in ${baselineDir}`);
} finally {
  await browser.close();
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
