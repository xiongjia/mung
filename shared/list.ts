import { loadRegistry, type Registry } from "./types.ts";
import { printSkills } from "./display.ts";

function main(): void {
  let registry: Registry;
  try {
    registry = loadRegistry();
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  printSkills(registry);
}

main();
