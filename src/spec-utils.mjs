import fs from "node:fs/promises";
import path from "node:path";

export async function specTargets(args = process.argv.slice(2)) {
  if (args.length) {
    return args;
  }

  const entries = await fs.readdir("specs");
  return entries
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => path.join("specs", entry));
}

export async function readSpec(target) {
  return JSON.parse(await fs.readFile(target, "utf8"));
}

export function blueprintPathForSpec(spec) {
  return path.join("public", "blueprints", spec.slug, "blueprint.json");
}

export function blueprintDirForSpec(spec) {
  return path.join("public", "blueprints", spec.slug);
}
