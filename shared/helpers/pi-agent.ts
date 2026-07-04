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

export function installSkill(
  sourcePath: string,
  skillName: string,
  targetDir: string,
  copy = false,
): { installed: boolean; targetPath: string; method: "symlink" | "copy" } {
  const targetPath = path.join(targetDir, getSkillFileName(skillName));
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  // Remove existing if present (force: true handles ENOENT)
  fs.rmSync(targetPath, { force: true });

  if (copy) {
    fs.copyFileSync(sourcePath, targetPath);
    return { installed: true, targetPath, method: "copy" };
  } else {
    fs.symlinkSync(sourcePath, targetPath);
    return { installed: true, targetPath, method: "symlink" };
  }
}

export function uninstallSkill(
  skillName: string,
  targetDir: string,
): { removed: boolean; targetPath: string } {
  const targetPath = path.join(targetDir, getSkillFileName(skillName));
  if (!fs.existsSync(targetPath)) {
    return { removed: false, targetPath };
  }
  fs.rmSync(targetPath, { force: true });
  // Clean up empty parent directory
  const parentDir = path.dirname(targetPath);
  try {
    fs.rmdirSync(parentDir);
  } catch {
    /* not empty — fine */
  }
  return { removed: true, targetPath };
}
