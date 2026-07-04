# Beancount Review Skill

AI-powered beancount ledger review — detect accounting errors, analyze income/expenses, and get financial advice.

## Files

| File / Dir    | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `skill.md`    | Skill content installed to Claude Code as a prompt. |
| `README.md`   | This file — developer/user documentation.           |
| `scripts/`    | Optional helper scripts for beancount operations.   |
| `references/` | Optional reference materials (cheatsheets, etc.).   |

## Prerequisites

- **conda** installed and a conda environment with `beancount` configured:

  ```bash
  conda create -n beancount python=3.12
  conda activate beancount
  pip install beancount
  ```

- A beancount ledger repository (`.bean` files)

## Quick Start

### 1. Install the skill

```bash
cd ~/your-mung-repo
npx tsx shared/install.ts --skill beancount-review --target claude-code --scope global
```

### 2. Configure (optional)

Create `.beancount-config` in your ledger project root:

```json
{
  "main_file": "main.bean",
  "conda_env": "beancount"
}
```

Or set an environment variable:

```bash
export BEANCOUNT_CONDA_ENV=beancount
```

### 3. Use it

```bash
# In your beancount project directory, run:
/beancount-review

# Or with options:
/beancount-review --period quarter --compare last-year --conda-env my-env
```

## Options

| Option        | Default     | Description                                            |
| ------------- | ----------- | ------------------------------------------------------ |
| `--period`    | `month`     | Analysis window: `month`, `quarter`, `year`            |
| `--compare`   | `previous`  | Baseline: `previous` (prior period) or `last-year`     |
| `--file`      | auto        | Path to main beancount file (auto-detected if omitted) |
| `--conda-env` | `beancount` | conda environment name                                 |

## Configuration Priority

1. CLI argument `--conda-env`
2. Environment variable `BEANCOUNT_CONDA_ENV`
3. `.beancount-config` file in project root
4. Default: `beancount`

## Example Output

```
# Beancount Review Report
**Period**: 2026-01-01 to 2026-01-31
**Ledger**: ~/ledger/main.bean

## 🔍 Error Check
No errors found.

## 📊 Financial Analysis

| Metric | Current | Previous | Change |
|--------|---------|----------|--------|
| Total Income | ¥35,000 | ¥32,000 | +9.4% |
| Total Expenses | ¥22,500 | ¥20,000 | +12.5% |
| Net Savings | ¥12,500 | ¥12,000 | +4.2% |
| Savings Rate | 35.7% | 37.5% | −1.8pp |

## ⚠️ Anomalies
- **Expenses:餐饮**: +35% vs baseline — consider review
- **Expenses:购物**: +28% — approaching threshold

## 💡 Recommendations
1. 餐饮 spending increased 35%, set monthly budget cap
2. Savings rate remains healthy at 35.7%
```

## Troubleshooting

| Problem                         | Solution                                         |
| ------------------------------- | ------------------------------------------------ |
| `conda: command not found`      | Install conda or use `uv tool install beancount` |
| `bean-check: command not found` | `conda activate <env> && pip install beancount`  |
| `No .bean files found`          | Run from ledger directory or use `--file`        |
| `bean-query returns empty`      | Check account name patterns match your ledger    |
| `conda run` slow to start       | Normal; conda activation takes ~1s per command   |
