import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { validateSkillName } from "../types.ts";

const SKILLS_DIR_NAME = ".claude";
const SKILLS_SUBDIR = "skills";

export function getGlobalSkillsDir(): string {
  return path.join(os.homedir(), SKILLS_DIR_NAME, SKILLS_SUBDIR);
}

export function getProjectSkillsDir(projectPath: string): string {
  return path.join(projectPath, SKILLS_DIR_NAME, SKILLS_SUBDIR);
}

export function getSkillFileName(skillName: string): string {
  validateSkillName(skillName);
  return `${skillName}.md`;
}

/**
 * Install a skill markdown file to the target directory.
 * Default: symlink. Pass copy=true to copy instead.
 */
export function installSkill(
  sourcePath: string,
  skillName: string,
  targetDir: string,
  copy = false,
): { installed: boolean; targetPath: string; method: "symlink" | "copy" } {
  fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, getSkillFileName(skillName));

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

/**
 * Remove an installed skill from the target directory.
 */
export function uninstallSkill(
  skillName: string,
  targetDir: string,
): { removed: boolean; targetPath: string } {
  const targetPath = path.join(targetDir, getSkillFileName(skillName));
  if (!fs.existsSync(targetPath)) {
    return { removed: false, targetPath };
  }
  fs.rmSync(targetPath, { force: true });
  return { removed: true, targetPath };
}
