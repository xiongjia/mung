# Mung Design Document

## Overview

**Mung** is a personal AI Skills manager — a single repository that stores, catalogs, and distributes AI agent skills to Claude Code and Pi Agent installations.

### Goals

- Single source of truth for personal skills
- Install skills globally or per-project with one command
- Symlink-based distribution so updating the repo updates all installed skills
- Agent-agnostic: support Claude Code and Pi Agent through helper modules

### Non-Goals

- Package registry / publishing (this is a local-only tool)
- Runtime skill execution (skills are installed as text files for agents to read)
- Skill dependency management (v1)

---

## Directory Structure

```
mung/
├── skills/                       # Skill definitions (source of truth)
│   ├── registry.json             # Skill catalog — install/list scripts read from this
│   └── <skill-name>/
│       └── skill.md              # Skill content with frontmatter
├── shared/                       # Management tooling
│   ├── types.ts                  # Shared types, validation, SkillHelper interface
│   ├── args.ts                   # Shared CLI arg parsing + agent dispatch (lookup map)
│   ├── install.ts                # CLI: install skills
│   ├── uninstall.ts              # CLI: uninstall skills
│   ├── list.ts                   # CLI: list registered skills
│   ├── *.test.ts                 # Unit tests (vitest)
│   └── helpers/                  # Agent-specific install/uninstall logic
│       ├── claude-code.ts        # Claude Code paths and helpers
│       ├── pi-agent.ts           # Pi Agent paths and helpers
│       └── *.test.ts             # Integration tests
├── docs/
│   ├── init-draft.md             # Requirements & plan (Chinese)
│   └── design.md                 # This document
├── .github/workflows/
│   └── ci.yml                    # GitHub Actions: format check, lint, test (Node 20 + 22)
├── .claude/skills/               # Skills installed for mung's own development
├── .pi/skills/                   # Skills installed for Pi Agent (project-local)
├── CLAUDE.md                     # Entry point → @AGENTS.md
├── AGENTS.md                     # Project instructions for AI agents
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
└── .prettierrc
```

---

## Shared Modules

### `types.ts` — Core types, validation, and registry

| Export                                 | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `SkillEntry`                           | Type for a single skill registry entry                    |
| `Registry`                             | Type for the registry document `{ skills: SkillEntry[] }` |
| `AgentTarget`                          | Union type: `"claude-code" \| "pi-agent"`                 |
| `SkillHelper`                          | Interface contract for agent helpers                      |
| `validateSkillName(name)`              | Regex check — rejects `../`, `/`, uppercase, non-kebab    |
| `loadRegistry()`                       | Reads + validates `registry.json` (throws on bad format)  |
| `findSkill(registry, name)`            | Lookup a single skill by name                             |
| `resolveSkillPath(skill)`              | Resolve repo-relative path to absolute                    |
| `parseTarget(raw)`                     | Validate agent target string                              |
| `resolveSkillsToActOn(registry, args)` | Shared logic for `--all` vs `--skill` resolution          |

### `args.ts` — Shared CLI infrastructure

| Export                           | Purpose                                           |
| -------------------------------- | ------------------------------------------------- |
| `parseBaseArgs(raw)`             | Shared arg parser with bounds-checked `nextArg()` |
| `registerHelper(target, helper)` | Register a `SkillHelper` in the lookup map        |
| `getHelper(target)`              | Lookup map dispatch (replaces hardcoded ternary)  |
| `resolveTargetDir(args)`         | Resolve global/project target directory           |

---

## Skill Format

### Frontmatter

Each `skills/<name>/skill.md` begins with YAML frontmatter:

```yaml
---
name: <kebab-case-name>
description: <one-line summary>
compatibility: [claude-code, pi-agent] # target agents
tools: [bash, git, filesystem] # agent tools (optional)
---
```

- `name` — matches directory name, unique across registry, must be lowercase alphanumeric + hyphens
- `description` — used by `list.ts` and registry display
- `compatibility` — which agents this skill supports
- `tools` — tools the agent needs (Claude Code convention)

### Body

Markdown content that becomes the agent's system prompt or slash command definition. Follows the target agent's conventions.

---

## Registry (`skills/registry.json`)

Central manifest — scripts read this instead of scanning directories:

```json
{
  "skills": [
    {
      "name": "code-review",
      "description": "Review code changes for bugs, security, and quality",
      "version": "0.1.0",
      "targets": ["claude-code", "pi-agent"],
      "path": "skills/code-review/skill.md"
    }
  ]
}
```

| Field         | Description                                |
| ------------- | ------------------------------------------ |
| `name`        | Skill identifier, matches directory        |
| `description` | Human-readable summary                     |
| `version`     | Semver — used for future update detection  |
| `targets`     | Compatible agents                          |
| `path`        | Relative path from repo root to `skill.md` |

### Adding a New Skill

1. Create `skills/<name>/skill.md` with frontmatter
2. Add entry to `skills/registry.json`
3. Test: `npx tsx shared/install.ts --skill <name> --target claude-code --scope global`
4. Clean up: `npx tsx shared/uninstall.ts --skill <name> --target claude-code --scope global`
5. Run `pnpm check` (format + lint + test)

---

## Install System

### Architecture

```
                    ┌──────────────┐
                    │  install.ts  │  CLI entry point
                    └──────┬───────┘
                           │ reads
                    ┌──────▼───────┐
                    │ registry.json│
                    └──────┬───────┘
                           │ looks up skill path
              ┌────────────┼────────────┐
              ▼                         ▼
     ┌─────────────────┐      ┌────────────────┐
     │ claude-code.ts  │      │  pi-agent.ts   │
     │ helper          │      │  helper        │
     └───────┬─────────┘      └───────┬────────┘
             │                        │
             ▼                        ▼
     ~/.claude/skills/       ~/.pi/agent/skills/
     <project>/.claude/      <project>/.pi/skills/
```

Agent dispatch uses a `registerHelper()` / `getHelper()` lookup map. The helper interface (`SkillHelper`) provides compile-time safety for adding new agent types.

### CLI Interface

```bash
# List available skills
npx tsx shared/list.ts

# Install a skill
npx tsx shared/install.ts --skill <name> \
  --target claude-code|pi-agent \
  --scope global|project \
  [--project-path <path>] \
  [--copy]

# Install all skills
npx tsx shared/install.ts --all \
  --target claude-code|pi-agent \
  --scope global|project \
  [--project-path <path>]

# Uninstall
npx tsx shared/uninstall.ts --skill <name> \
  --target claude-code|pi-agent \
  --scope global|project \
  [--project-path <path>]
```

### Target Paths

| Agent       | Scope   | Path                                   |
| ----------- | ------- | -------------------------------------- |
| Claude Code | global  | `~/.claude/skills/<name>.md`           |
| Claude Code | project | `<project>/.claude/skills/<name>.md`   |
| Pi Agent    | global  | `~/.pi/agent/skills/<name>/SKILL.md`   |
| Pi Agent    | project | `<project>/.pi/skills/<name>/SKILL.md` |

### Symlink vs Copy

| Mode    | Default | Flag     | Behavior                                                     |
| ------- | ------- | -------- | ------------------------------------------------------------ |
| Symlink | ✅      | —        | `ln -s` from repo source → target; auto-updates on repo pull |
| Copy    |         | `--copy` | Copies file; edits to installed skill don't affect source    |

---

## Helper Module Interface (`SkillHelper`)

Each `shared/helpers/<agent>.ts` implements:

```typescript
interface SkillHelper {
  getGlobalSkillsDir(): string;
  getProjectSkillsDir(projectPath: string): string;
  getSkillFileName(skillName: string): string; // validates via validateSkillName()
  installSkill(sourcePath, skillName, targetDir, copy?): InstallResult;
  uninstallSkill(skillName, targetDir): UninstallResult;
}
```

New agent support requires: (1) implementing this interface, (2) calling `registerHelper()` in `install.ts` and `uninstall.ts`.

---

## Input Validation

- **skillName**: validated by `getSkillFileName()` via `validateSkillName()` — rejects path traversal (`../`, `/`) and non-kebab characters
- **registry.json**: validated by `loadRegistry()` — runtime check for `{ skills: [...] }` shape
- **CLI args**: `nextArg()` bounds-checks all value-consuming flags; `parseTarget()` and `parseScope()` validate enum values at runtime
- **Source files**: checked with `fs.existsSync()` before install, failures tracked and reported with non-zero exit

---

## CI/CD

GitHub Actions ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) runs on push/PR to main:

| Job      | Steps                                                 |
| -------- | ----------------------------------------------------- |
| **lint** | `pnpm format:check` (prettier) + `pnpm lint` (eslint) |
| **test** | `pnpm test` (vitest) on Node 20 + 22 matrix           |

---

## Language Convention

- **Skills & code**: English by default
- **Draft docs** (`*.draft.md`): Any language (Chinese, etc.)
- **Locale-specific skills**: May use other languages when appropriate

---

## Tech Stack

| Component       | Choice                                        |
| --------------- | --------------------------------------------- |
| Runtime         | Node.js + tsx (no build step)                 |
| Package manager | pnpm                                          |
| Language        | TypeScript (strict mode, NodeNext resolution) |
| Type checking   | `tsc --noEmit`                                |
| Linting         | ESLint + @typescript-eslint                   |
| Formatting      | Prettier                                      |
| Testing         | Vitest                                        |
| CI              | GitHub Actions                                |

---

## Open Questions

- [x] Pi Agent skill directory paths and file format (`.pi/skills/<name>/SKILL.md` project, `~/.pi/agent/skills/<name>/SKILL.md` global)
- [ ] Pi Agent `SKILL.md` frontmatter compliance (name + description fields)
- [ ] Skill version tracking at install target (for update detection)
- [ ] Skill dependency management
