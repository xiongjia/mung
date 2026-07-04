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
    it("installs via symlink by default", () => {
      const source = path.join(tmpDir, "source.md");
      fs.writeFileSync(source, "# test");

      const result = installSkill(source, "test-skill", tmpDir);
      expect(result.installed).toBe(true);
      expect(result.method).toBe("symlink");
      expect(fs.existsSync(result.targetPath)).toBe(true);
      expect(fs.lstatSync(result.targetPath).isSymbolicLink()).toBe(true);
    });

    it("installs via copy when copy=true", () => {
      const source = path.join(tmpDir, "source.md");
      fs.writeFileSync(source, "# test");

      const result = installSkill(source, "test-skill", tmpDir, true);
      expect(result.method).toBe("copy");
      expect(fs.lstatSync(result.targetPath).isSymbolicLink()).toBe(false);
    });

    it("uninstalls a previously installed skill", () => {
      const source = path.join(tmpDir, "source.md");
      fs.writeFileSync(source, "# test");

      installSkill(source, "test-skill", tmpDir, true);
      const unResult = uninstallSkill("test-skill", tmpDir);
      expect(unResult.removed).toBe(true);
      expect(fs.existsSync(unResult.targetPath)).toBe(false);
    });

    it("uninstall reports not-found for missing skill", () => {
      const result = uninstallSkill("nonexistent", tmpDir);
      expect(result.removed).toBe(false);
    });

    it("installing overwrites existing target", () => {
      const source1 = path.join(tmpDir, "source1.md");
      const source2 = path.join(tmpDir, "source2.md");
      fs.writeFileSync(source1, "# first");
      fs.writeFileSync(source2, "# second");

      const r1 = installSkill(source1, "test-skill", tmpDir, true);
      expect(fs.readFileSync(r1.targetPath, "utf-8")).toBe("# first");

      const r2 = installSkill(source2, "test-skill", tmpDir, true);
      expect(fs.readFileSync(r2.targetPath, "utf-8")).toBe("# second");
    });
  });
});
