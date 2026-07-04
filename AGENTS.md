# AGENTS.md — Mung Project Instructions

## Project Identity

**mung** is a personal AI Skills management repository. It is NOT a standard code project — it's a toolbox for managing, distributing, and installing AI agent skills across Claude Code and Pi Agent.

## Skill Development Conventions

### Adding a New Skill

1. Create `skills/<skill-name>/skill.md` with the required frontmatter
2. Register it in `skills/registry.json`
3. Test installation: `npx tsx shared/install.ts --skill <name> --target claude-code --scope global`
4. Clean up: `npx tsx shared/uninstall.ts --skill <name> --target claude-code --scope global`

### Skill Directory Structure

Each skill in `skills/<name>/` must have a `skill.md`:

```markdown
---
name: <skill-name>
description: <one-line description>
type: prompt | script
targets: [claude-code, pi-agent]
---

<skill content — prompt text or script instructions>
```

### Naming Conventions

- Directory names: kebab-case (e.g., `code-review`)
- Skill names: match directory name
- Use English for all skills and code; locale-specific skills may use other languages

## Script Conventions

- Package manager: `pnpm` (dependency management)
- All `shared/` scripts are TypeScript, run with `npx tsx`
- Entry points: `install.ts`, `uninstall.ts`, `list.ts`
- Agent-specific logic lives in `shared/helpers/<agent-name>.ts`
- Scripts read from `skills/registry.json` — do NOT scan directories

## Git Conventions

### Commit Message Format

Every commit message must use one of the following prefixes:

| Prefix      | When to use                                            |
| ----------- | ------------------------------------------------------ |
| `feat:`     | New skill or new feature for an existing skill         |
| `fix:`      | Bug fix, typo correction, or behavior correction       |
| `docs:`     | Documentation-only changes (README, AGENTS.md, drafts) |
| `refactor:` | Code restructuring with no behavior change             |
| `test:`     | Adding or updating tests                               |
| `chore:`    | Tooling, config, dependencies, CI, formatting          |
| `style:`    | Code style / formatting only (Prettier, ESLint)        |

Examples:

```
feat: add beancount-review skill with income/expense analysis
fix: correct default conda env name from beancount to pymain
docs: add README for code-review skill
chore: pin pnpm version and clean up CI config
refactor: extract shared CLI arg parsing into args.ts
```

### Scope (optional)

For changes specific to one skill, append the skill name as a scope:

```
feat(beancount-review): add Spending Structure analysis section
fix(code-review): correct naming issues detection regex
```

## Documentation

- `docs/design.md` — architecture, spec, and interface design

## Common Operations

### List available skills

```bash
npx tsx shared/list.ts
```

### Install a skill globally for Claude Code

```bash
npx tsx shared/install.ts --skill code-review --target claude-code --scope global
```

### Uninstall a skill

```bash
npx tsx shared/uninstall.ts --skill code-review --target claude-code --scope global
```

### Install all skills to a project

```bash
npx tsx shared/install.ts --all --target claude-code --scope project --project-path /path/to/project
```
