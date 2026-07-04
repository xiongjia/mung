import { describe, it, expect } from "vitest";
import { validateSkillName, resolveSkillsToActOn, type Registry } from "./types.ts";

describe("validateSkillName", () => {
  it("accepts valid kebab-case names", () => {
    expect(() => validateSkillName("code-review")).not.toThrow();
    expect(() => validateSkillName("my-skill")).not.toThrow();
    expect(() => validateSkillName("a")).not.toThrow();
    expect(() => validateSkillName("abc123-def")).not.toThrow();
  });

  it("rejects names with path traversal", () => {
    expect(() => validateSkillName("../../../.bashrc")).toThrow();
    expect(() => validateSkillName("foo/bar")).toThrow();
    expect(() => validateSkillName("..")).toThrow();
  });

  it("rejects names with invalid characters", () => {
    expect(() => validateSkillName("")).toThrow();
    expect(() => validateSkillName("Code-Review")).toThrow();
    expect(() => validateSkillName("code_review")).toThrow();
    expect(() => validateSkillName("code review")).toThrow();
  });
});

describe("resolveSkillsToActOn", () => {
  const registry: Registry = {
    skills: [
      { name: "alpha", description: "a", version: "1.0", targets: [], path: "a" },
      { name: "beta", description: "b", version: "1.0", targets: [], path: "b" },
    ],
  };

  it("returns all skills when --all is set", () => {
    const result = resolveSkillsToActOn(registry, { all: true });
    expect(result).toHaveLength(2);
  });

  it("returns empty array when --all on empty registry", () => {
    const result = resolveSkillsToActOn(registry, { all: true });
    // registry has 2 skills, not empty
    expect(result.length).toBeGreaterThan(0);
    const emptyRegistry: Registry = { skills: [] };
    expect(resolveSkillsToActOn(emptyRegistry, { all: true })).toHaveLength(0);
  });

  it("returns single skill by name", () => {
    const result = resolveSkillsToActOn(registry, { skill: "alpha" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("alpha");
  });

  it("returns empty array for unknown skill", () => {
    const result = resolveSkillsToActOn(registry, { skill: "nope" });
    expect(result).toHaveLength(0);
  });

  it("returns empty array when no --all and no --skill", () => {
    const result = resolveSkillsToActOn(registry, {});
    expect(result).toHaveLength(0);
  });
});
