import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { printSkills } from "./display.ts";
import { type Registry, type SkillEntry } from "./types.ts";

function makeRegistry(skills: SkillEntry[]): Registry {
  return { skills };
}

describe("printSkills", () => {
  let logs: string[];

  beforeEach(() => {
    logs = [];
    vi.spyOn(console, "log").mockImplementation((msg) => {
      logs.push(msg);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints a message when the registry is empty", () => {
    const registry = makeRegistry([]);
    printSkills(registry);

    expect(logs).toEqual(["No skills registered yet."]);
  });

  it("prints a single skill with no trailing blank line", () => {
    const registry = makeRegistry([
      {
        name: "test-skill",
        description: "A test skill",
        version: "1.0.0",
        targets: ["claude-code", "pi-agent"],
        path: "skills/test-skill/skill.md",
      },
    ]);
    printSkills(registry);

    // First line includes the trailing \n from the format string
    expect(logs[0]).toBe("Available skills:\n");
    // Last line is the targets line — no trailing blank line
    expect(logs[logs.length - 1]).toBe("    targets: claude-code, pi-agent");
    // Check the skill entry lines
    const joined = logs.join("\n");
    expect(joined).toContain("test-skill (v1.0.0)");
    expect(joined).toContain("A test skill");
    expect(joined).toContain("targets: claude-code, pi-agent");
  });

  it("prints multiple skills with blank lines between them but not after the last", () => {
    const registry = makeRegistry([
      {
        name: "alpha",
        description: "First skill",
        version: "0.1.0",
        targets: ["claude-code"],
        path: "skills/alpha/skill.md",
      },
      {
        name: "beta",
        description: "Second skill",
        version: "0.2.0",
        targets: ["pi-agent"],
        path: "skills/beta/skill.md",
      },
    ]);
    printSkills(registry);

    // Blank line separator exists between skills
    const blankIndex = logs.indexOf("");
    expect(blankIndex).toBeGreaterThan(0);
    // Verify the blank line sits between the two skill blocks
    expect(logs[blankIndex - 1]).toBe("    targets: claude-code");
    expect(logs[blankIndex + 1]).toBe("  beta (v0.2.0)");
    // No trailing blank line
    expect(logs[logs.length - 1]).toBe("    targets: pi-agent");
    // Content checks
    const joined = logs.join("\n");
    expect(joined).toContain("alpha (v0.1.0)");
    expect(joined).toContain("First skill");
    expect(joined).toContain("beta (v0.2.0)");
    expect(joined).toContain("Second skill");
  });

  it("prints three skills with separators between each pair and no trailing blank", () => {
    const registry = makeRegistry([
      {
        name: "alpha",
        description: "First skill",
        version: "1.0",
        targets: ["claude-code"],
        path: "skills/alpha/skill.md",
      },
      {
        name: "beta",
        description: "Second skill",
        version: "2.0",
        targets: ["pi-agent"],
        path: "skills/beta/skill.md",
      },
      {
        name: "gamma",
        description: "Third skill",
        version: "3.0",
        targets: ["claude-code", "pi-agent"],
        path: "skills/gamma/skill.md",
      },
    ]);
    printSkills(registry);

    // All three skills present
    const joined = logs.join("\n");
    expect(joined).toContain("alpha (v1.0)");
    expect(joined).toContain("beta (v2.0)");
    expect(joined).toContain("gamma (v3.0)");

    // Two blank separators exist
    const blanks = logs.filter((l) => l === "");
    expect(blanks).toHaveLength(2);

    // Verify each blank sits between two skill blocks
    const firstBlank = logs.indexOf("");
    expect(logs[firstBlank - 1]).toBe("    targets: claude-code");
    expect(logs[firstBlank + 1]).toBe("  beta (v2.0)");

    const secondBlank = logs.indexOf("", firstBlank + 1);
    expect(logs[secondBlank - 1]).toBe("    targets: pi-agent");
    expect(logs[secondBlank + 1]).toBe("  gamma (v3.0)");

    // No trailing blank line
    expect(logs[logs.length - 1]).toBe("    targets: claude-code, pi-agent");
  });

  it("handles skills with empty targets array and no trailing blank line", () => {
    const registry = makeRegistry([
      {
        name: "empty-targets",
        description: "No targets",
        version: "1.0",
        targets: [],
        path: "skills/empty-targets/skill.md",
      },
    ]);
    printSkills(registry);

    const joined = logs.join("\n");
    expect(joined).toContain("empty-targets (v1.0)");
    expect(joined).toContain("targets:");
    // No trailing blank line
    expect(logs[logs.length - 1]).toBe("    targets: ");
  });
});
