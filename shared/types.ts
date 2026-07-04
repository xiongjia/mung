import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ---- types ----

export interface SkillEntry {
  name: string;
  description: string;
  version: string;
  targets: string[];
  path: string;
}

export interface Registry {
  skills: SkillEntry[];
}

export type AgentTarget = "claude-code" | "pi-agent";

export interface SkillHelper {
  getGlobalSkillsDir(): string;
  getProjectSkillsDir(projectPath: string): string;
  getSkillFileName(skillName: string): string;
  installSkill(
    sourcePath: string,
    skillName: string,
    targetDir: string,
    copy?: boolean,
  ): { installed: boolean; targetPath: string; method: "symlink" | "copy" };
  uninstallSkill(skillName: string, targetDir: string): { removed: boolean; targetPath: string };
}

// ---- constants ----

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MUNG_DIR = path.resolve(__dirname, "..");

export const VALID_TARGETS: AgentTarget[] = ["claude-code", "pi-agent"];

/** Reject skill names containing path separators or traversal sequences */
export function validateSkillName(name: string): void {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `Invalid skill name "${name}": must be lowercase alphanumeric with hyphens only`,
    );
  }
}

// ---- helpers ----

export function loadRegistry(): Registry {
  const registryPath = path.join(MUNG_DIR, "skills", "registry.json");
  let raw: string;
  try {
    raw = fs.readFileSync(registryPath, "utf-8");
  } catch (e) {
    throw new Error(`Failed to read registry at ${registryPath}: ${(e as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse registry at ${registryPath}: invalid JSON`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("skills" in parsed) ||
    !Array.isArray((parsed as Registry).skills)
  ) {
    throw new Error(`Invalid registry format at ${registryPath}: expected { skills: [...] }`);
  }

  return parsed as Registry;
}

export function findSkill(registry: Registry, name: string): SkillEntry | undefined {
  return registry.skills.find((s) => s.name === name);
}

export function resolveSkillPath(skill: SkillEntry): string {
  const resolved = path.resolve(MUNG_DIR, skill.path);
  // Prevent path traversal — resolved must stay within MUNG_DIR
  if (!resolved.startsWith(MUNG_DIR + path.sep) && resolved !== MUNG_DIR) {
    throw new Error(`Invalid skill path "${skill.path}": must be within the project directory`);
  }
  return resolved;
}

export function parseTarget(raw: string, flagName = "target"): AgentTarget {
  if (VALID_TARGETS.includes(raw as AgentTarget)) return raw as AgentTarget;
  throw new Error(`Invalid --${flagName} "${raw}". Valid values: ${VALID_TARGETS.join(", ")}`);
}

/**
 * Resolve which skills to act on based on CLI args.
 *
 * - `all: true` → returns every skill in the registry (caller may filter further, e.g. by target)
 * - `skill: "<name>"` → returns the matching skill, or empty array if not found
 * - neither → returns empty array
 *
 * This function does NOT filter by target compatibility — that is the caller's responsibility
 * (see install.ts for target filtering).
 */
export function resolveSkillsToActOn(
  registry: Registry,
  args: { all?: boolean; skill?: string },
): SkillEntry[] {
  if (args.all) {
    return [...registry.skills];
  }
  if (args.skill) {
    const found = findSkill(registry, args.skill);
    if (!found) return [];
    return [found];
  }
  return [];
}
