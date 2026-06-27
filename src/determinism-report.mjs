import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { readSpec, specTargets } from "./spec-utils.mjs";

const targets = await specTargets(process.argv.slice(2));
const specs = [];

for (const target of targets) {
  specs.push(await readSpec(target));
}

if (!specs.length) {
  console.error("No specs found for determinism check.");
  process.exit(1);
}

console.log(`Checking deterministic Blueprint output for ${specs.length} spec${specs.length === 1 ? "" : "s"}.`);
await buildTargets(targets);
const first = await outputHashes(specs);
await buildTargets(targets);
const second = await outputHashes(specs);

const failures = compareHashes(first, second);
if (failures.length) {
  console.log("Blueprint determinism failed:");
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Blueprint determinism OK.");

async function buildTargets(targetList) {
  for (const target of targetList) {
    await run("node", ["src/build-blueprint.mjs", target]);
  }
  await run("node", ["src/sync-app-blueprints.mjs"]);
}

async function outputHashes(specList) {
  const hashes = new Map();
  for (const spec of specList) {
    const root = path.join("public", "blueprints", spec.slug);
    const entries = [
      "README.md",
      "asset-manifest.json",
      "blueprint.json",
      "playground-preview.md",
      `${spec.slug}-blueprint.zip`
    ];
    for (const entry of entries) {
      const filePath = path.join(root, entry);
      hashes.set(filePath, await sha256(filePath));
    }
  }
  return hashes;
}

function compareHashes(first, second) {
  const failures = [];
  const allPaths = new Set([...first.keys(), ...second.keys()]);
  for (const filePath of [...allPaths].sort()) {
    if (!first.has(filePath)) {
      failures.push(`${filePath} was missing from the first build.`);
      continue;
    }
    if (!second.has(filePath)) {
      failures.push(`${filePath} was missing from the second build.`);
      continue;
    }
    if (first.get(filePath) !== second.get(filePath)) {
      failures.push(`${filePath} changed between repeated builds.`);
    }
  }
  return failures;
}

async function sha256(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}
