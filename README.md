# mung

Personal AI Skills manager — create, manage, and distribute AI agent skills across Claude Code and Pi Agent.

## Quick Start

```bash
# Install dependencies
pnpm install

# List available skills
npx tsx shared/list.ts

# Install code-review skill globally for Claude Code
npx tsx shared/install.ts --skill code-review --target claude-code --scope global

# Uninstall
npx tsx shared/uninstall.ts --skill code-review --target claude-code --scope global

# Install all skills to a project
npx tsx shared/install.ts --all --target claude-code --scope project --project-path /path/to/project
```

## Commands

| Script                       | Description             |
| ---------------------------- | ----------------------- |
| `pnpm add --skill <name>`    | Install a skill         |
| `pnpm remove --skill <name>` | Uninstall a skill       |
| `pnpm list`                  | List available skills   |
| `pnpm lint`                  | ESLint check            |
| `pnpm format:check`          | Prettier check          |
| `pnpm format`                | Auto-format all files   |
| `pnpm test`                  | Run unit tests (vitest) |
| `pnpm check`                 | Format + lint + test    |

## Directory Structure

```
mung/
├── skills/                       # Skill definitions (source of truth)
│   ├── registry.json             # Skill catalog — install/list scripts read from this
│   └── <skill-name>/
│       └── skill.md              # Skill content with frontmatter
├── shared/                       # Management tooling
│   ├── types.ts                  # Shared types + registry loader + validation
│   ├── args.ts                   # Shared CLI arg parsing + agent dispatch
│   ├── install.ts                # CLI: install skills
│   ├── uninstall.ts              # CLI: uninstall skills
│   ├── list.ts                   # CLI: list registered skills
│   └── helpers/                  # Agent-specific install/uninstall logic
│       ├── claude-code.ts        # Claude Code (~/.claude/skills/<name>.md)
│       └── pi-agent.ts           # Pi Agent (~/.pi/agent/skills/<name>/SKILL.md)
├── docs/
│   └── design.md                 # Architecture, spec, and interface design
├── .github/workflows/
│   └── ci.yml                    # GitHub Actions: format check, lint, test
├── CLAUDE.md                     # Claude Code entry point → @AGENTS.md
├── AGENTS.md                     # AI agent project instructions
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
└── .prettierrc
```

## Skills

| Skill                                                 | Targets               | Description                                                                                               |
| ----------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| [code-review](skills/code-review/README.md)           | Claude Code, Pi Agent | Strict code review on diffs — correctness, security, naming, and project conventions                      |
| [beancount-review](skills/beancount-review/README.md) | Claude Code, Pi Agent | Beancount ledger review — detect errors, analyze income/expenses by period, and generate advisory reports |

## Install Targets

| Agent       | Global                               | Project                                |
| ----------- | ------------------------------------ | -------------------------------------- |
| Claude Code | `~/.claude/skills/<name>.md`         | `<project>/.claude/skills/<name>.md`   |
| Pi Agent    | `~/.pi/agent/skills/<name>/SKILL.md` | `<project>/.pi/skills/<name>/SKILL.md` |

## Adding a New Skill

1. Create `skills/<name>/skill.md` with the required frontmatter
2. Register it in `skills/registry.json`
3. Test: `npx tsx shared/install.ts --skill <name> --target claude-code --scope global`
4. Clean up: `npx tsx shared/uninstall.ts --skill <name> --target claude-code --scope global`
5. Run checks: `pnpm check`

## Documentation

- [docs/design.md](docs/design.md) — Architecture design

## License

MIT
