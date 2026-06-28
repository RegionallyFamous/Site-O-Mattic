import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const ROOT = process.cwd();
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CODEX_NODE_BIN = path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "bin");
const PORT_BASE = Number.parseInt(process.env.SITE_O_MATTIC_EDITOR_VALIDATE_PORT || "9460", 10);
const STARTUP_TIMEOUT_MS = 90_000;
const EDITOR_TIMEOUT_MS = 75_000;

async function main() {
  const specs = resolveSpecFiles(process.argv.slice(2));
  const executablePath = process.env.CHROME_PATH || DEFAULT_CHROME;

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Chrome executable not found. Set CHROME_PATH or install Chrome at ${DEFAULT_CHROME}.`);
  }

  const browser = await chromium.launch({ executablePath, headless: true });
  const reports = [];

  try {
    for (const [index, specPath] of specs.entries()) {
      const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
      const slug = spec.slug || path.basename(specPath, ".json");
      const blueprintPath = path.join(ROOT, "public", "blueprints", slug, "blueprint.json");
      const port = PORT_BASE + index;

      if (!fs.existsSync(blueprintPath)) {
        reports.push({ slug, status: "failed", errors: [`Missing Blueprint: ${blueprintPath}`] });
        continue;
      }

      process.stdout.write(`Editor-validating ${slug}... `);
      const server = startPlayground(blueprintPath, port);
      try {
        await server.ready;
        const report = await inspectEditor(browser, `http://127.0.0.1:${port}`, slug);
        reports.push(report);
        console.log(report.invalidCount === 0 ? "ok" : `${report.invalidCount} invalid`);
      } catch (error) {
        reports.push({ slug, status: "failed", invalidCount: 0, errors: [error.message] });
        console.log("failed");
      } finally {
        await server.stop();
      }
    }
  } finally {
    await browser.close();
  }

  const failed = reports.filter((report) => report.status !== "passed" || report.invalidCount > 0);
  console.log("\nEditor block validation report");
  console.log(`- Blueprints checked: ${reports.length}`);
  console.log(`- Failed: ${failed.length}`);

  for (const report of failed) {
    console.log(`\n${report.slug}`);
    for (const error of report.errors || []) {
      console.log(`  - ${error}`);
    }
    for (const block of report.invalid || []) {
      console.log(`  - ${block.name}${block.className ? ` .${block.className}` : ""}${block.text ? `: ${block.text}` : ""}`);
      for (const issue of block.issues || []) {
        console.log(`    ${issue}`);
      }
    }
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

function resolveSpecFiles(args) {
  const positional = args.filter((arg) => !arg.startsWith("--"));
  const files = positional.length > 0
    ? positional.map((arg) => path.resolve(ROOT, arg))
    : fs.readdirSync(path.join(ROOT, "specs"))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => path.join(ROOT, "specs", file));

  return files.filter((file) => {
    if (!fs.existsSync(file)) {
      throw new Error(`Spec not found: ${file}`);
    }
    return true;
  });
}

function startPlayground(blueprintPath, port) {
  const child = spawn("npx", [
    "-y",
    "@wp-playground/cli@latest",
    "server",
    `--blueprint=${blueprintPath}`,
    "--php=8.4",
    "--wp=latest",
    `--port=${port}`,
    "--login",
    "--verbosity=normal"
  ], {
    cwd: ROOT,
    env: playgroundEnv(),
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for Playground on port ${port}. Last output: ${output.slice(-600)}`)), STARTUP_TIMEOUT_MS);
    const onData = (chunk) => {
      output += chunk.toString();
      if (/Ready!|WordPress is running on/i.test(output)) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      if (!/Ready!|WordPress is running on/i.test(output)) {
        clearTimeout(timer);
        reject(new Error(`Playground exited early with code ${code}. Output: ${output.slice(-600)}`));
      }
    });
  });

  return {
    ready,
    stop: () => new Promise((resolve) => {
      if (child.exitCode !== null || child.killed) {
        resolve();
        return;
      }
      child.once("exit", () => resolve());
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode === null && !child.killed) {
          child.kill("SIGKILL");
        }
        resolve();
      }, 2_000).unref();
    })
  };
}

function playgroundEnv() {
  const env = { ...process.env };
  if (fs.existsSync(CODEX_NODE_BIN)) {
    env.PATH = `${CODEX_NODE_BIN}${path.delimiter}${env.PATH || ""}`;
  }
  return env;
}

async function inspectEditor(browser, baseUrl, slug) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  const validationLogs = [];

  page.on("console", (message) => {
    const text = message.text();
    if (/Block validation failed|Expected attributes|Expected tag name|unexpected or invalid/i.test(text)) {
      validationLogs.push(text.slice(0, 500));
    }
  });

  try {
    await page.goto(`${baseUrl}/wp-admin/edit.php?post_type=page`, { waitUntil: "networkidle", timeout: EDITOR_TIMEOUT_MS });
    const editHref = await page.$$eval("a", (anchors) => anchors
      .map((anchor) => anchor.href)
      .find((href) => /post\.php\?post=/.test(href) && /action=edit/.test(href)));

    if (!editHref) {
      throw new Error("Could not find Home page edit link.");
    }

    await page.goto(editHref, { waitUntil: "domcontentloaded", timeout: EDITOR_TIMEOUT_MS });
    await page.waitForFunction(() => window.wp && wp.data && wp.blocks && wp.data.select("core/block-editor"), null, { timeout: EDITOR_TIMEOUT_MS });
    await page.waitForTimeout(4_000);

    const result = await page.evaluate(() => {
      const formatValidationArg = (arg) => {
        if (typeof arg === "string") {
          return arg.replace(/\s+/g, " ").trim().slice(0, 900);
        }
        if (!arg || typeof arg !== "object") {
          return "";
        }
        try {
          return JSON.stringify(arg).replace(/\s+/g, " ").trim().slice(0, 900);
        } catch {
          return "";
        }
      };
      const blocks = wp.data.select("core/block-editor").getBlocks();
      const flat = (items, out = []) => {
        for (const block of items) {
          out.push(block);
          if (block.innerBlocks?.length) {
            flat(block.innerBlocks, out);
          }
        }
        return out;
      };
      const all = flat(blocks);
      const invalid = all.filter((block) => block.isValid === false);
      return {
        total: all.length,
        invalidCount: invalid.length,
        invalid: invalid.map((block) => ({
          name: block.name,
          text: block.attributes?.text || block.attributes?.content || block.attributes?.caption || "",
          className: block.attributes?.className || "",
          url: block.attributes?.url || "",
          issues: (block.validationIssues || []).map((issue) => (issue.args || [])
            .map((arg) => formatValidationArg(arg))
            .filter(Boolean)
            .join(" | "))
        }))
      };
    });

    return {
      slug,
      status: result.invalidCount === 0 ? "passed" : "failed",
      total: result.total,
      invalidCount: result.invalidCount,
      invalid: result.invalid,
      validationLogs
    };
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
