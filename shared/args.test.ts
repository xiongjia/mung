import { describe, it, expect, beforeAll, vi } from "vitest";
import { parseBaseArgs } from "./args.ts";
import * as claudeCode from "./helpers/claude-code.ts";
import * as piAgent from "./helpers/pi-agent.ts";
import { registerHelper } from "./args.ts";

beforeAll(() => {
  registerHelper("claude-code", claudeCode);
  registerHelper("pi-agent", piAgent);
});

describe("parseBaseArgs", () => {
  it("returns defaults with no args", () => {
    const args = parseBaseArgs([]);
    expect(args.target).toBe("claude-code");
    expect(args.scope).toBe("global");
    expect(args.all).toBe(false);
  });

  it("parses --skill", () => {
    const args = parseBaseArgs(["--skill", "my-skill"]);
    expect(args.skill).toBe("my-skill");
  });

  it("parses --all", () => {
    const args = parseBaseArgs(["--all"]);
    expect(args.all).toBe(true);
  });

  it("parses --target pi-agent", () => {
    const args = parseBaseArgs(["--target", "pi-agent"]);
    expect(args.target).toBe("pi-agent");
  });

  it("parses --scope project with --project-path", () => {
    const args = parseBaseArgs(["--scope", "project", "--project-path", "/tmp/test"]);
    expect(args.scope).toBe("project");
    expect(args.projectPath).toBe("/tmp/test");
  });

  it("exits on invalid --target value (throws via parseTarget)", () => {
    expect(() => parseBaseArgs(["--target", "invalid"])).toThrow();
  });

  it("exits on missing value for --skill (exit code)", () => {
    // nextArg exits with process.exit(1) when value is missing
    // We can't test process.exit directly, but we verify the guard exists
    // by checking that --skill as last arg doesn't silently return undefined
    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    expect(() => parseBaseArgs(["--skill"])).toThrow("process.exit called");
    mockExit.mockRestore();
  });
});
