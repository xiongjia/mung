import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  getGlobalSkillsDir,
  getProjectSkillsDir,
  getSkillFileName,
  installSkill,
  uninstallSkill,
} from "./claude-code.ts";

describe("claude-code helper", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mung-test-cc-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /**
   * Create a mock skill directory with skill.md + optional extra files.
   * Returns the path to skill.md (passed as sourcePath to installSkill).
   */
  function createMockSkill(skillName: string, extraFiles: string[] = []): string {
    const skillDir = path.join(tmpDir, `src-${skillName}`);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "skill.md"), `# ${skillName}`);
    for (const f of extraFiles) {
      const filePath = path.join(skillDir, f);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, "reference content");
    }
    return path.join(skillDir, "skill.md");
  }

  describe("getSkillFileName", () => {
    it("returns <name>.md", () => {
      expect(getSkillFileName("code-review")).toBe("code-review.md");
    });

    it("rejects invalid skill names", () => {
      expect(() => getSkillFileName("../../../etc")).toThrow();
    });
  });

  describe("getGlobalSkillsDir", () => {
    it("returns path under home .claude/skills", () => {
      const dir = getGlobalSkillsDir();
      expect(dir).toContain(".claude");
      expect(dir).toContain("skills");
    });
  });

  describe("getProjectSkillsDir", () => {
    it("returns <project>/.claude/skills", () => {
      expect(getProjectSkillsDir("/my/project")).toBe("/my/project/.claude/skills");
    });
  });

  describe("installSkill and uninstallSkill", () => {
    it("symlinks the whole skill directory", () => {
      const sourcePath = createMockSkill("test-skill", ["references/bql.md"]);

      const result = installSkill(sourcePath, "test-skill", tmpDir);
      expect(result.installed).toBe(true);
      expect(result.method).toBe("symlink");
      expect(fs.existsSync(result.targetPath)).toBe(true);
      expect(fs.lstatSync(result.targetPath).isSymbolicLink()).toBe(true);
      // Verify the whole directory structure is accessible
      expect(fs.existsSync(path.join(result.targetPath, "skill.md"))).toBe(true);
      expect(fs.existsSync(path.join(result.targetPath, "references", "bql.md"))).toBe(true);
    });

    it("uninstalls the whole directory", () => {
      const sourcePath = createMockSkill("test-skill");

      installSkill(sourcePath, "test-skill", tmpDir);
      expect(fs.existsSync(path.join(tmpDir, "test-skill"))).toBe(true);

      const unResult = uninstallSkill("test-skill", tmpDir);
      expect(unResult.removed).toBe(true);
      expect(fs.existsSync(unResult.targetPath)).toBe(false);
    });

    it("uninstall reports not-found for missing skill", () => {
      const result = uninstallSkill("nonexistent", tmpDir);
      expect(result.removed).toBe(false);
    });

    it("replaces existing install on re-install", () => {
      const sourcePath = createMockSkill("test-skill");

      const first = installSkill(sourcePath, "test-skill", tmpDir);
      expect(fs.existsSync(first.targetPath)).toBe(true);

      const second = installSkill(sourcePath, "test-skill", tmpDir);
      expect(second.installed).toBe(true);
      expect(fs.existsSync(second.targetPath)).toBe(true);
    });
  });
});
