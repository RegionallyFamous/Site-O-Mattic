import fs from "node:fs/promises";

const url = process.argv[2] || process.env.PLAYGROUND_URL;
if (!url) {
  console.error("Usage: node src/visual-qa.mjs <local-or-public-playground-url>");
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("Missing playwright-core. Install dev dependencies before running visual QA.");
  process.exit(1);
}

const executablePath = process.env.CHROME_PATH || await findChrome();
const browser = await chromium.launch({
  executablePath,
  headless: true
});

try {
  const results = [];
  for (const scenario of scenarios()) {
    const page = await browser.newPage({
      viewport: scenario.viewport,
      isMobile: scenario.isMobile || false
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    const frame = await findWordPressFrame(page);
    await frame.waitForSelector(".wp-site-blocks, body", { timeout: 60_000 });
    await page.screenshot({ path: scenario.screenshot, fullPage: false });

    const result = await frame.evaluate(() => {
      const text = document.body.innerText || "";
      const brand = document.querySelector(".som-text-logo")?.getBoundingClientRect();
      const ctas = [...document.querySelectorAll(".wp-block-button__link")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: element.textContent?.trim(),
            visible: rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0
          };
        });
      const overflowers = [...document.querySelectorAll("body *")]
        .filter((element) => element.scrollWidth > element.clientWidth + 2)
        .slice(0, 10)
        .map((element) => element.className || element.tagName.toLowerCase());

      return {
        bodyTextLength: text.length,
        defaultWrapperLeak: /Twenty Twenty|Designed with WordPress|^Home$/m.test(text),
        firstViewportCtaVisible: ctas.some((cta) => cta.visible),
        brand: brand ? { width: Math.round(brand.width), height: Math.round(brand.height) } : null,
        overflowers
      };
    });

    results.push({
      name: scenario.name,
      screenshot: scenario.screenshot,
      result,
      failures: failuresFor(result).map((failure) => `${scenario.name}: ${failure}`)
    });
    await page.close();
  }

  const failures = results.flatMap((item) => item.failures);
  console.log(JSON.stringify({
    url,
    screenshots: Object.fromEntries(results.map((item) => [item.name, item.screenshot])),
    results,
    failures
  }, null, 2));
  if (failures.length) {
    process.exit(1);
  }
} finally {
  await browser.close();
}

function scenarios() {
  return [
    {
      name: "desktop",
      viewport: { width: 1440, height: 1000 },
      screenshot: "/tmp/site-o-mattic-visual-qa.png"
    },
    {
      name: "mobile",
      viewport: { width: 390, height: 844 },
      isMobile: true,
      screenshot: "/tmp/site-o-mattic-visual-qa-mobile.png"
    }
  ];
}

function failuresFor(result) {
  const failures = [];
  if (result.bodyTextLength < 400) {
    failures.push("Rendered page text is unexpectedly short.");
  }
  if (!result.brand || result.brand.width < 60 || result.brand.height < 20) {
    failures.push(`Text brand is missing or too small: ${JSON.stringify(result.brand)}`);
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
    return await frame.evaluate(() => Boolean(document.querySelector(".wp-site-blocks, .som-text-logo, .wp-block-button__link")));
  } catch {
    return false;
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
