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
} from "./pi-agent.ts";

describe("pi-agent helper", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mung-test-pa-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /**
   * Create a mock skill directory with SKILL.md + optional extra files.
   * Returns the path to SKILL.md (passed as sourcePath to installSkill).
   */
  function createMockSkill(skillName: string, extraFiles: string[] = []): string {
    const skillDir = path.join(tmpDir, `src-${skillName}`);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), `# ${skillName}`);
    for (const f of extraFiles) {
      const filePath = path.join(skillDir, f);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, "reference content");
    }
    return path.join(skillDir, "SKILL.md");
  }

  describe("getSkillFileName", () => {
    it("returns <name>/SKILL.md", () => {
      expect(getSkillFileName("code-review")).toBe("code-review/SKILL.md");
    });

    it("rejects invalid skill names", () => {
      expect(() => getSkillFileName("../../../etc")).toThrow();
    });
  });

  describe("getGlobalSkillsDir", () => {
    it("returns path under ~/.pi/agent/skills", () => {
      const dir = getGlobalSkillsDir();
      expect(dir).toContain(".pi");
      expect(dir).toContain("skills");
    });
  });

  describe("getProjectSkillsDir", () => {
    it("returns <project>/.pi/skills", () => {
      expect(getProjectSkillsDir("/my/project")).toBe("/my/project/.pi/skills");
    });
  });

  describe("installSkill (default: copy)", () => {
    it("copies the whole skill directory and writes VERSION", () => {
      const sourcePath = createMockSkill("test-skill", ["references/bql.md"]);

      const result = installSkill(sourcePath, "test-skill", tmpDir);
      expect(result.installed).toBe(true);
      expect(result.method).toBe("copy");
      expect(fs.existsSync(result.targetPath)).toBe(true);
      expect(fs.lstatSync(result.targetPath).isSymbolicLink()).toBe(false);
      // Verify the whole directory structure is accessible
      expect(fs.existsSync(path.join(result.targetPath, "SKILL.md"))).toBe(true);
      expect(fs.existsSync(path.join(result.targetPath, "references", "bql.md"))).toBe(true);
      // Verify VERSION file exists with a git hash
      const versionPath = path.join(result.targetPath, "VERSION");
      expect(fs.existsSync(versionPath)).toBe(true);
      const versionContent = fs.readFileSync(versionPath, "utf-8").trim();
      expect(versionContent).toMatch(/^[0-9a-f]{7,40}$/);
    });

    it("copied files are independent from source (no symlink)", () => {
      const sourcePath = createMockSkill("independent-test", []);

      const result = installSkill(sourcePath, "independent-test", tmpDir);
      expect(result.method).toBe("copy");

      // Modify the source — copied version should remain unchanged
      fs.writeFileSync(path.join(path.dirname(sourcePath), "SKILL.md"), "# modified");
      const copiedContent = fs.readFileSync(path.join(result.targetPath, "SKILL.md"), "utf-8");
      expect(copiedContent).not.toBe("# modified");
    });
  });

  describe("installSkill (symlink mode)", () => {
    it("symlinks the whole skill directory with no VERSION", () => {
      const sourcePath = createMockSkill("symlink-skill", ["references/bql.md"]);

      const result = installSkill(sourcePath, "symlink-skill", tmpDir, true);
      expect(result.installed).toBe(true);
      expect(result.method).toBe("symlink");
      expect(fs.existsSync(result.targetPath)).toBe(true);
      expect(fs.lstatSync(result.targetPath).isSymbolicLink()).toBe(true);
      // Verify the whole directory structure is accessible
      expect(fs.existsSync(path.join(result.targetPath, "SKILL.md"))).toBe(true);
      expect(fs.existsSync(path.join(result.targetPath, "references", "bql.md"))).toBe(true);
      // No VERSION file for symlinks
      expect(fs.existsSync(path.join(result.targetPath, "VERSION"))).toBe(false);
    });
  });

  describe("uninstallSkill", () => {
    it("removes a copied skill directory", () => {
      const sourcePath = createMockSkill("copy-skill");

      installSkill(sourcePath, "copy-skill", tmpDir);
      expect(fs.existsSync(path.join(tmpDir, "copy-skill"))).toBe(true);

      const unResult = uninstallSkill("copy-skill", tmpDir);
      expect(unResult.removed).toBe(true);
      expect(fs.existsSync(unResult.targetPath)).toBe(false);
    });

    it("removes a symlinked skill directory", () => {
      const sourcePath = createMockSkill("link-skill");

      installSkill(sourcePath, "link-skill", tmpDir, true);
      expect(fs.existsSync(path.join(tmpDir, "link-skill"))).toBe(true);

      const unResult = uninstallSkill("link-skill", tmpDir);
      expect(unResult.removed).toBe(true);
      expect(fs.existsSync(unResult.targetPath)).toBe(false);
    });

    it("uninstall reports not-found for missing skill", () => {
      const result = uninstallSkill("nonexistent", tmpDir);
      expect(result.removed).toBe(false);
    });

    it("replaces existing install on re-install", () => {
      const sourcePath = createMockSkill("reinstall-skill");

      const first = installSkill(sourcePath, "reinstall-skill", tmpDir);
      expect(fs.existsSync(first.targetPath)).toBe(true);

      const second = installSkill(sourcePath, "reinstall-skill", tmpDir);
      expect(second.installed).toBe(true);
      expect(fs.existsSync(second.targetPath)).toBe(true);
    });

    it("replaces symlink install with copy install on re-install", () => {
      const sourcePath = createMockSkill("switch-mode");

      // Install as symlink first
      const linkResult = installSkill(sourcePath, "switch-mode", tmpDir, true);
      expect(linkResult.method).toBe("symlink");

      // Re-install as copy (default)
      const copyResult = installSkill(sourcePath, "switch-mode", tmpDir);
      expect(copyResult.method).toBe("copy");
      expect(fs.existsSync(copyResult.targetPath)).toBe(true);
      expect(fs.lstatSync(copyResult.targetPath).isSymbolicLink()).toBe(false);
    });
  });
});
