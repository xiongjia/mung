import { loadRegistry, resolveSkillsToActOn, type AgentTarget, type Registry } from "./types.ts";
import { parseBaseArgs, getHelper, resolveTargetDir } from "./args.ts";
import { registerAllHelpers } from "./helpers/index.ts";

// Register agent helpers
registerAllHelpers();

// ---- CLI arg parsing ----

interface Args {
  skill?: string;
  all: boolean;
  target: AgentTarget;
  scope: "global" | "project";
  projectPath?: string;
}

function parseArgs(raw: string[]): Args {
  return parseBaseArgs(raw);
}

// ---- main ----

const args = parseArgs(process.argv.slice(2));

if (!args.skill && !args.all) {
  console.log("Usage:");
  console.log(
    "  npx tsx shared/uninstall.ts --skill <name> [--target claude-code|pi-agent] [--scope global|project] [--project-path <path>]",
  );
  console.log(
    "  npx tsx shared/uninstall.ts --all [--target claude-code|pi-agent] [--scope global|project] [--project-path <path>]",
  );
  process.exit(0);
}

let registry: Registry;
try {
  registry = loadRegistry();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
const targetDir = resolveTargetDir(args);
const helper = getHelper(args.target);

const skillsToUninstall = resolveSkillsToActOn(registry, {
  all: args.all,
  skill: args.skill,
});

if (skillsToUninstall.length === 0) {
  if (args.all) {
    console.error("Error: no skills found in registry. Nothing to uninstall.");
  } else {
    console.error(
      `Error: skill "${args.skill}" not found in registry. Use --list to see available skills.`,
    );
  }
  process.exit(1);
}

for (const skill of skillsToUninstall) {
  const result = helper.uninstallSkill(skill.name, targetDir);
  if (result.removed) {
    console.log(`Uninstalled ${skill.name} from ${result.targetPath}`);
  } else {
    console.log(`${skill.name} was not installed at ${result.targetPath}`);
  }
}
