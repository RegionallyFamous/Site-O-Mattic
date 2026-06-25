import { spawn } from "node:child_process";
import { specTargets } from "./spec-utils.mjs";

const targets = await specTargets(process.argv.slice(2));

for (const target of targets) {
  await run("node", ["src/build-blueprint.mjs", target]);
}

await run("node", ["src/sync-app-blueprints.mjs"]);

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
