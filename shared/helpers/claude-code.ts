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
 * Symlink the entire skill directory so auxiliary files (references/,
 * etc.) are available alongside skill.md.
 */
export function installSkill(
  sourcePath: string,
  skillName: string,
  targetDir: string,
  _copy?: boolean,
): { installed: boolean; targetPath: string; method: "symlink" } {
  const sourceDir = path.dirname(sourcePath);
  const targetPath = path.join(targetDir, skillName);

  fs.rmSync(targetPath, { force: true, recursive: true });
  fs.mkdirSync(targetDir, { recursive: true });
  fs.symlinkSync(sourceDir, targetPath);

  return { installed: true, targetPath, method: "symlink" };
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
