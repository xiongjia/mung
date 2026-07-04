import { registerHelper } from "../args.ts";
import * as claudeCode from "./claude-code.ts";
import * as piAgent from "./pi-agent.ts";

/** Register all known agent helpers. Call once at startup. */
export function registerAllHelpers(): void {
  registerHelper("claude-code", claudeCode);
  registerHelper("pi-agent", piAgent);
}
