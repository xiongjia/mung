import * as fs from "node:fs";
import {
  loadRegistry,
  resolveSkillPath,
  resolveSkillsToActOn,
  type AgentTarget,
  type Registry,
} from "./types.ts";
import { printSkills } from "./display.ts";
import { parseBaseArgs, getHelper, resolveTargetDir } from "./args.ts";
import { registerAllHelpers } from "./helpers/index.ts";

// Register agent helpers
registerAllHelpers();

// ---- CLI arg parsing ----

interface Args {
  skill?: string;
  all: boolean;
  list: boolean;
  target: AgentTarget;
  scope: "global" | "project";
  projectPath?: string;
  copy: boolean;
}

function parseArgs(raw: string[]): Args {
  const base = parseBaseArgs(raw);
  const args: Args = {
    ...base,
    list: false,
    copy: false,
  };

  for (let i = 0; i < raw.length; i++) {
    switch (raw[i]) {
      case "--list":
        args.list = true;
        break;
      case "--copy":
        args.copy = true;
        break;
    }
  }

  return args;
}

// ---- commands ----

function cmdList(): void {
  let registry: Registry;
  try {
    registry = loadRegistry();
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
  printSkills(registry);
}

function cmdInstall(args: Args): void {
  let registry: Registry;
  try {
    registry = loadRegistry();
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
  const targetDir = resolveTargetDir(args);
  const helper = getHelper(args.target);

  let skillsToInstall = resolveSkillsToActOn(registry, {
    all: args.all,
    skill: args.skill,
  });

  // Filter by target compatibility
  if (args.all) {
    skillsToInstall = skillsToInstall.filter((s) => s.targets.includes(args.target));
  } else if (args.skill && skillsToInstall.length > 0) {
    const skill = skillsToInstall[0];
    if (!skill.targets.includes(args.target)) {
      console.error(
        `Error: skill "${args.skill}" does not support target "${args.target}". ` +
          `Supported targets: ${skill.targets.join(", ")}`,
      );
      process.exit(1);
    }
  }

  if (skillsToInstall.length === 0) {
    if (args.all) {
      if (registry.skills.length === 0) {
        console.error("Error: no skills found in registry.");
      } else {
        console.error(`Error: no skills support target "${args.target}". Check registry.json.`);
      }
    } else {
      console.error(
        `Error: skill "${args.skill}" not found in registry. Use --list to see available skills.`,
      );
    }
    process.exit(1);
  }

  let failures = 0;
  for (const skill of skillsToInstall) {
    const sourcePath = resolveSkillPath(skill);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Error: source file not found: ${sourcePath}`);
      failures++;
      continue;
    }

    try {
      const result = helper.installSkill(sourcePath, skill.name, targetDir, args.copy);
      console.log(`Installed ${skill.name} → ${result.targetPath} (${result.method})`);
    } catch (e) {
      console.error(`Error: failed to install ${skill.name}: ${(e as Error).message}`);
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`Error: ${failures} skill(s) failed to install.`);
    process.exit(1);
  }
}

// ---- main ----

const args = parseArgs(process.argv.slice(2));

if (args.list) {
  cmdList();
} else if (args.skill || args.all) {
  cmdInstall(args);
} else {
  console.log("Usage:");
  console.log("  npx tsx shared/install.ts --list");
  console.log(
    "  npx tsx shared/install.ts --skill <name> [--target claude-code|pi-agent] [--scope global|project] [--project-path <path>] [--copy]",
  );
  console.log(
    "  npx tsx shared/install.ts --all [--target claude-code|pi-agent] [--scope global|project] [--project-path <path>] [--copy]",
  );
  console.log("");
  console.log("Uninstall:");
  console.log(
    "  npx tsx shared/uninstall.ts --skill <name> [--target claude-code|pi-agent] [--scope global|project] [--project-path <path>]",
  );
}
