import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { validateSkillName } from "../types.ts";
import { writeVersionFile } from "./version.ts";

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
