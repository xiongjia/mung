mung 这个仓库我用来管理自己的 AI Skills

- Skills 用来管理自己的 Skill
- 可以建立一个 公用的目录来通用的 脚步
- 需要支持 Claude code , Pi Agent 的安装。要支持按工程安装和全局安装.
- 需要一个简单 sample skill

---

## 实施计划

### 1. 目录结构设计

```
mung/
├── skills/                          # 所有 Skill 定义
│   ├── registry.json                # Skill 注册表（清单，供 install/list 脚本读取）
│   ├── code-review/                 # 示例 Skill：代码审查
│   │   └── skill.md
│   └── ...                          # 未来更多 Skills
├── shared/                          # 公用脚本目录
│   ├── install.ts                   # 统一安装入口（TS）
│   ├── uninstall.ts                 # 卸载（TS）
│   ├── list.ts                      # 列出可用 Skills（TS）
│   └── helpers/                     # 辅助函数
│       ├── claude-code.ts           # Claude Code 安装逻辑
│       └── pi-agent.ts              # Pi Agent 安装逻辑
├── docs/
│   ├── init-draft.md                # 需求与实施计划
│   └── design.md                    # 设计文档（架构、规范、接口定义）
├── .claude/
│   └── skills/                      # 本仓库自己用的 Claude Code Skills（开发用）
├── CLAUDE.md                        # 指针文件，指向 AGENTS.md（Claude Code 入口）
├── AGENTS.md                        # AI Agent 项目指令（主文件，Claude Code / Pi Agent 共享）
├── README.md
├── package.json                     # TS 脚本运行时依赖（tsx 等）
├── tsconfig.json
└── LICENSE
```

### 2. Skill 定义规范

- **默认语言**: Skill 和代码统一使用英文；`*-draft.md` 和特定场景 Skill（如中文用户）可按需使用中文或其他文字
- 每个 Skill 目录下包含一个 `skill.md`，格式如下：

```markdown
---
name: <skill-name>
description: <one-line description>
type: prompt | script
targets: [claude-code, pi-agent] # 支持的 Agent 类型
---

<skill 内容：提示词或脚本>
```

- **Claude Code**: Skill 以 `.md` 文件形式存入目标 `.claude/skills/<name>.md`
- **Pi Agent**: 根据 Pi Agent 的 Skill 格式存放（待调研确认路径和格式）

### 3. 安装系统设计

#### 3.1 安装目标

| Agent       | 全局路径            | 工程路径                    |
| ----------- | ------------------- | --------------------------- |
| Claude Code | `~/.claude/skills/` | `<project>/.claude/skills/` |
| Pi Agent    | 待调研确认          | 待调研确认                  |

#### 3.2 install.ts 接口

```bash
# 列出所有可用 Skills
npx tsx shared/install.ts --list

# 安装指定 Skill（全局）
npx tsx shared/install.ts --skill <name> --target claude-code --scope global

# 安装指定 Skill（工程）
npx tsx shared/install.ts --skill <name> --target claude-code --scope project --project-path /path/to/project

# 安装所有 Skills
npx tsx shared/install.ts --all --target claude-code --scope global

# 卸载
npx tsx shared/uninstall.ts --skill <name> --target claude-code --scope global
```

安装逻辑：将 `skills/<name>/skill.md` 复制或符号链接到目标路径（符号链接优先，方便更新时自动同步）。

#### 3.3 符号链接 vs 复制

- **默认：符号链接** — 仓库更新后目标自动同步
- **可选：复制** — 适合需要独立修改的场景，通过 `--copy` 参数切换

### 4. Skill 注册表 (registry.json)

`skills/registry.json` 是 Skill 的统一注册表，`install.ts` 和 `list.ts` 从这里读取而非扫描目录：

```json
{
  "skills": [
    {
      "name": "code-review",
      "description": "代码审查 Skill，同时也是新 Skill 的参考模板",
      "version": "0.1.0",
      "targets": ["claude-code"],
      "path": "skills/code-review/skill.md"
    }
  ]
}
```

- **安装**: `install.ts` 根据 registry 定位 Skill 文件并安装到目标
- **列出**: `list.ts` 直接读取 registry 展示所有可用 Skills
- **添加新 Skill**: 在 `skills/<name>/` 下创建内容 + 在 registry.json 中注册
- **版本**: registry 记录版本号，安装时可在目标目录写入版本标记，方便后续更新检测

### 5. 仓库工程配置

#### 5.1 .gitignore 完善

当前 `.gitignore` 已有基础配置，需要补充以下内容：

- `node_modules/` — 已有，确保斜杠后缀以匹配目录
- **TS 构建产物**: `*.tsbuildinfo`
- **IDE/编辑器**: `.vscode/`、`.idea/`（若需团队共享可排除部分）
- **OS 文件**: `.DS_Store`、`Thumbs.db`
- **临时文件**: `*.log`、`*.tmp`、`.cache/`

#### 5.2 CLAUDE.md → AGENTS.md

- `CLAUDE.md` — Claude Code 入口，内容仅包含指向 `AGENTS.md` 的引用（如 `@AGENTS.md`），不写实际指令
- `AGENTS.md` — 项目指令主文件，由 CLAUDE.md 和 Pi Agent 共享引用。内容应包含：
  - **仓库定位**: mung 是个人 AI Skills 管理仓库，不是标准代码项目
  - **Skill 开发约定**: Skill 目录结构、registry.json 更新流程、命名规范
  - **脚本规范**: `shared/` 下 TS 脚本使用 `npx tsx` 运行
  - **文档规范**: `docs/` 下放需求计划（init-draft.md）和设计文档（design.md）
  - **常见操作**: 如何安装 Skill、如何测试、如何提交

### 6. 实施步骤

| 阶段   | 任务                                                             | 优先级    |
| ------ | ---------------------------------------------------------------- | --------- |
| **P0** | 调研 Pi Agent 的 Skill 目录结构和格式规范                        | 🔴 阻塞项 |
| **P1** | 完善 `.gitignore` — 补充 TS / IDE / OS 文件忽略规则              | 🟡        |
| **P1** | 编写 `AGENTS.md` + `CLAUDE.md` — AI Agent 项目指令               | 🟡        |
| **P1** | 创建目录结构（`skills/`, `shared/`, `shared/helpers/`）          | 🟡        |
| **P1** | 初始化 `package.json`、`tsconfig.json` — TS 运行环境             | 🟡        |
| **P1** | 编写 `shared/install.ts` — 统一安装入口                          | 🟡        |
| **P1** | 编写 `shared/helpers/claude-code.ts` — Claude Code 安装逻辑      | 🟡        |
| **P2** | 编写 `shared/helpers/pi-agent.ts` — Pi Agent 安装逻辑（依赖 P0） | 🟢        |
| **P2** | 创建 `skills/code-review/skill.md` — 示例 Skill（兼模板）        | 🟢        |
| **P2** | 创建 `skills/registry.json` — Skill 注册表                       | 🟢        |
| **P3** | 编写 `shared/uninstall.ts` — 卸载脚本                            | 🟢        |
| **P3** | 编写 `shared/list.ts` — 列出脚本                                 | 🟢        |
| **P3** | 编写仓库 `README.md`                                             | 🟢        |

### 7. 待确认事项

- [ ] Pi Agent 的 Skill 存储路径和文件格式
- [ ] Pi Agent 是否支持全局/工程两种安装模式
- [ ] 是否需要支持 Skill 依赖管理（一个 Skill 依赖另一个）
- [ ] 是否需要版本号 / 更新检测机制
