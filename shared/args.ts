import { type AgentTarget, type SkillHelper, parseTarget } from "./types.ts";

// ---- shared CLI types ----

export interface BaseArgs {
  skill?: string;
  all: boolean;
  target: AgentTarget;
  scope: "global" | "project";
  projectPath?: string;
}

// ---- shared arg parsing ----

/** Safely consume the next arg value, exiting with a clear message if missing or looks like a flag. */
function nextArg(raw: string[], i: number, flag: string): string {
  if (i + 1 >= raw.length) {
    console.error(`Error: missing value for ${flag}`);
    process.exit(1);
  }
  const value = raw[i + 1];
  if (value.startsWith("--")) {
    console.error(`Error: expected a value for ${flag}, but got "${value}" (looks like a flag)`);
    process.exit(1);
  }
  return value;
}

const SCOPE_VALUES = ["global", "project"] as const;

function parseScope(raw: string): "global" | "project" {
  if (SCOPE_VALUES.includes(raw as (typeof SCOPE_VALUES)[number])) {
    return raw as "global" | "project";
  }
  console.error(`Error: invalid --scope "${raw}". Valid values: ${SCOPE_VALUES.join(", ")}`);
  process.exit(1);
}

export function parseBaseArgs(raw: string[]): BaseArgs {
  const args: BaseArgs = {
    all: false,
    target: "claude-code",
    scope: "global",
  };

  for (let i = 0; i < raw.length; i++) {
    switch (raw[i]) {
      case "--skill":
        args.skill = nextArg(raw, i++, "--skill");
        break;
      case "--all":
        args.all = true;
        break;
      case "--target":
        args.target = parseTarget(nextArg(raw, i++, "--target"));
        break;
      case "--scope":
        args.scope = parseScope(nextArg(raw, i++, "--scope"));
        break;
      case "--project-path":
        args.projectPath = nextArg(raw, i++, "--project-path");
        break;
    }
  }

  return args;
}

// ---- shared dispatch ----

const HELPERS: Partial<Record<AgentTarget, SkillHelper>> = {};

export function registerHelper(target: AgentTarget, helper: SkillHelper): void {
  HELPERS[target] = helper;
}

export function getHelper(target: AgentTarget): SkillHelper {
  const helper = HELPERS[target];
  if (!helper) {
    throw new Error(`No helper registered for "${target}". Call registerHelper() first.`);
  }
  return helper;
}

// ---- shared target dir resolution ----

export function resolveTargetDir(args: BaseArgs): string {
  const helper = getHelper(args.target);
  if (args.scope === "global") {
    if (args.projectPath) {
      console.warn("Warning: --project-path is ignored when --scope is global");
    }
    return helper.getGlobalSkillsDir();
  }
  if (!args.projectPath) {
    console.error("Error: --project-path is required when --scope is project");
    process.exit(1);
  }
  return helper.getProjectSkillsDir(args.projectPath);
}
