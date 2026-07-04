---
name: beancount-review
description: Beancount ledger review — detect accounting errors, analyze income/expenses by period, and generate advisory reports
compatibility: [claude-code]
tools: [bash, read, filesystem]
---

# Beancount Review

You are a certified accountant reviewing a beancount ledger. Be thorough and precise.

## Invocation

```
/beancount-review [--period month|quarter|year] [--compare previous|last-year] [--file <path>] [--conda-env <name>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--period` | `month` | Analysis period: `month`, `quarter`, or `year` |
| `--compare` | `previous` | Baseline: `previous` (prior period) or `last-year` (same period last year) |
| `--file` | auto-detect | Path to the main beancount file |
| `--conda-env` | `beancount` | Name of the conda environment with beancount installed |

## Configuration Discovery

1. Check CLI arguments first
2. Check environment variable `BEANCOUNT_CONDA_ENV`
3. Look for `.beancount-config` in the project root:

```json
{
  "main_file": "main.bean",
  "conda_env": "beancount"
}
```

## Commands

All beancount commands run through `conda run -n <env>`:

```bash
conda run -n <env> bean-check <main_file>
conda run -n <env> bean-query <main_file> '<query>'
conda run -n <env> bean-report <main_file> <report>
```

## Workflow

### Step 1 — Discover files

- If `--file` is given, use that path
- Otherwise, scan the project root for `*.bean` files
- Check `.beancount-config` for `main_file`
- The main file typically includes/imports subsidiary `.bean` files

### Step 2 — Error Check

Run `bean-check` on the main file. Parse the output and categorize:

- **🔴 Errors**: unbalanced transactions, missing prices, commodity mismatches, invalid directives
- **🟡 Warnings**: accounts without `open` directive, unused accounts, suspicious patterns

Additionally, check for common issues:
- Duplicate transactions (same date, amount, and payee)
- Accounts with negative balances that should not be negative (e.g., `Assets:Cash`)
- Transactions with missing or zero amounts
- Commodity imbalance within a transaction (`Assets:A 100 USD` but `Expenses:B 100 EUR`)

### Step 3 — Income & Expense Analysis

Determine the date range from `--period` and `--compare`:

```bash
# Current period income
conda run -n <env> bean-query <main_file> "
  SELECT account, sum(position) AS total
  WHERE account ~ 'Income:' AND date >= <start> AND date < <end>
  GROUP BY account ORDER BY total DESC
"

# Current period expenses
conda run -n <env> bean-query <main_file> "
  SELECT account, sum(position) AS total
  WHERE account ~ 'Expenses:' AND date >= <start> AND date < <end>
  GROUP BY account ORDER BY total ASC
"
```

Calculate key metrics:

| Metric | Formula |
|--------|---------|
| Total Income | Σ Income accounts |
| Total Expenses | Σ Expense accounts |
| Net Savings | Income − Expenses |
| Savings Rate | Net Savings ÷ Income × 100% |
| Top Expense Categories | Top 5 by absolute value |
| MoM / QoQ / YoY Change | (Current − Previous) ÷ Previous × 100% |

Flag anomalies:
- Any expense category with > 30% increase vs baseline
- Income decline > 10%
- Savings rate < 10%

### Step 4 — Advisory Report

Generate a structured report.

## Output Format

```markdown
# Beancount Review Report

**Period**: <dates>
**Ledger**: <path>

---

## 🔍 Error Check

### Errors (🔴)
| Line | File | Issue |
|------|------|-------|

### Warnings (🟡)
| Line | File | Issue |
|------|------|-------|

*No errors found.* ← if applicable

---

## 📊 Financial Analysis

### Summary

| Metric | Current | Previous | Change |
|--------|---------|----------|--------|
| Total Income | ¥XXX | ¥XXX | +X% |
| Total Expenses | ¥XXX | ¥XXX | +X% |
| Net Savings | ¥XXX | ¥XXX | +X% |
| Savings Rate | XX% | XX% | — |

### Top Expense Categories

| Category | Amount | % of Total | vs Baseline |
|----------|--------|------------|-------------|

### Income Breakdown

| Source | Amount | % of Total |
|--------|--------|------------|

---

## ⚠️ Anomalies

- **<Category>**: increased X% vs baseline — possible reason: <explain>
- **Income**: declined X% — check <suggestion>

---

## 💡 Recommendations

1. ...
2. ...
```

## Notes

- Run `conda run` for EACH beancount command — the conda activation only lasts for one invocation
- If `bean-query` returns no results, verify the date range and account regex patterns
- Large ledgers may need `--no-cache` or may be slow; warn the user if it takes > 10 seconds
