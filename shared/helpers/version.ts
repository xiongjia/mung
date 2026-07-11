import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Find the project root by walking up from a starting directory
 * until we find a `package.json` file.
 */
export function findProjectRoot(fromDir: string): string | undefined {
  let current = path.resolve(fromDir);
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(path.join(current, "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return undefined; // hit filesystem root
    current = parent;
  }
  return undefined;
}

/**
 * Write a VERSION file with the current git commit hash into the
 * installed skill directory.
 *
 * The project root is determined by walking up from this helper file's
 * own location, so it works correctly regardless of the current working
 * directory.
 */
export function writeVersionFile(skillDir: string): void {
  const helperDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = findProjectRoot(helperDir);
  if (!projectRoot) return; // not inside a project — skip

  try {
    const commitHash = execSync("git rev-parse HEAD", {
      cwd: projectRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    fs.writeFileSync(path.join(skillDir, "VERSION"), commitHash + "\n");
  } catch (e) {
    console.error("mung: failed to write VERSION file:", (e as Error).message);
  }
}
