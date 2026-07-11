/**
 * Pi Agent helper.
 *
 * Pi Agent skill structure (per https://pi.dev/docs/latest/skills):
 *   - Project:  .pi/skills/<skill-name>/SKILL.md   (recursive)
 *   - Global:   ~/.pi/agent/skills/<skill-name>/SKILL.md (recursive)
 *   - Pi also reads .claude/skills/<name>.md (one level deep) as fallback
 *   - SKILL.md uses YAML frontmatter with name + description
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { validateSkillName } from "../types.ts";
import { writeVersionFile } from "./version.ts";

/** Pi Agent global (user-level) skills directory */
export function getGlobalSkillsDir(): string {
  return path.join(os.homedir(), ".pi", "agent", "skills");
}

/** Pi Agent project-local skills directory */
export function getProjectSkillsDir(projectPath: string): string {
  return path.join(projectPath, ".pi", "skills");
}

/** Pi uses <skill-name>/SKILL.md inside the skills directory */
export function getSkillFileName(skillName: string): string {
  validateSkillName(skillName);
  return path.join(skillName, "SKILL.md");
}

/**
 * Install a skill.
 *
 * Default mode is **copy**: the entire skill directory is copied to the target and
 * a VERSION file with the git commit hash is written.
 *
 * Pass `symlink: true` to create a symlink instead (no VERSION file).
 */
export function installSkill(
  sourcePath: string,
  skillName: string,
  targetDir: string,
  symlink?: boolean,
): { installed: boolean; targetPath: string; method: "symlink" | "copy" } {
  const sourceDir = path.dirname(sourcePath);
  const targetPath = path.join(targetDir, skillName);

  fs.rmSync(targetPath, { force: true, recursive: true });
  fs.mkdirSync(targetDir, { recursive: true });

  if (symlink) {
    fs.symlinkSync(sourceDir, targetPath);
    return { installed: true, targetPath, method: "symlink" };
  }

  // Copy mode (default)
  fs.cpSync(sourceDir, targetPath, { recursive: true });
  writeVersionFile(targetPath);
  return { installed: true, targetPath, method: "copy" };
}

/**
 * Remove an installed skill directory.
 */
export function uninstallSkill(
  skillName: string,
  targetDir: string,
): { removed: boolean; targetPath: string } {
  const targetPath = path.join(targetDir, skillName);
  if (!fs.existsSync(targetPath)) {
    return { removed: false, targetPath };
  }
  fs.rmSync(targetPath, { force: true, recursive: true });
  return { removed: true, targetPath };
}
