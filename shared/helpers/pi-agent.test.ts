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

    it("uninstalls and cleans up empty parent dir", () => {
      const source = path.join(tmpDir, "source.md");
      fs.writeFileSync(source, "# test");

      const installed = installSkill(source, "test-skill", tmpDir, true);
      const parentDir = path.dirname(installed.targetPath);
      expect(fs.existsSync(parentDir)).toBe(true);

      const unResult = uninstallSkill("test-skill", tmpDir);
      expect(unResult.removed).toBe(true);
      expect(fs.existsSync(unResult.targetPath)).toBe(false);
      expect(fs.existsSync(parentDir)).toBe(false);
    });

    it("uninstall reports not-found for missing skill", () => {
      const result = uninstallSkill("nonexistent", tmpDir);
      expect(result.removed).toBe(false);
    });
  });
});
