import { type Registry } from "./types.ts";

/**
 * Print the skills registry in a human-readable table format.
 *
 * Called from `install.ts --list` and `list.ts` — single source of truth
 * for skill listing display.
 */
export function printSkills(registry: Registry): void {
  if (registry.skills.length === 0) {
    console.log("No skills registered yet.");
    return;
  }

  console.log("Available skills:\n");
  let first = true;
  for (const skill of registry.skills) {
    if (first) {
      first = false;
    } else {
      console.log("");
    }
    console.log(`  ${skill.name} (v${skill.version})`);
    console.log(`    ${skill.description}`);
    console.log(`    targets: ${skill.targets.join(", ")}`);
  }
}
