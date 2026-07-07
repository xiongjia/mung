---
name: beancount-review
description: Beancount ledger review — detect accounting errors, analyze income/expenses by period, and generate advisory reports
compatibility: [claude-code, pi-agent]
tools: [bash, read, filesystem]
---

# Beancount Review

You are a certified accountant reviewing a beancount ledger. Be thorough and precise.

## Invocation

```
/beancount-review [--period month|quarter|year] [--compare previous|last-year] [--file <path>] [--conda-env <name>]
```

| Option        | Default     | Description                                                                |
| ------------- | ----------- | -------------------------------------------------------------------------- |
| `--period`    | `month`     | Analysis period: `month`, `quarter`, or `year`                             |
| `--compare`   | `previous`  | Baseline: `previous` (prior period) or `last-year` (same period last year) |
| `--file`      | auto-detect | Path to the main beancount file                                            |
| `--conda-env` | `pymain`    | Name of the conda environment with beancount installed                     |

## Configuration Discovery

1. Check CLI arguments first
2. Check environment variable `BEANCOUNT_CONDA_ENV`
3. Look for `.beancount-config` in the project root:

```json
{
  "main_file": "main.bean",
  "conda_env": "pymain"
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

- The beancount ledger is in **the project root directory** (where this skill is installed)
- If `--file` is given, use that path (relative to project root or absolute)
- Otherwise, scan the project root for `*.bean` files and use the first one found
- Check `.beancount-config` for `main_file` (relative to project root)
- The main file typically includes/imports subsidiary `.bean` files

### Step 2 — Error Check

Run `bean-check` on the main file. Parse the output and categorize:

- **🔴 Errors**: unbalanced transactions, missing prices, commodity mismatches, invalid directives
- **🟡 Warnings**: accounts without `open` directive, unused accounts, suspicious patterns

Additionally, run BQL-driven checks to detect common issues:

```bash
# Duplicate transactions (same date, payee, and amount)
conda run -n <env> bean-query <main_file> "
  SELECT date, payee, narration, account, SUM(position) AS amount, COUNT(*) AS cnt
  GROUP BY date, payee, narration, account
  HAVING COUNT(*) > 1
  ORDER BY cnt DESC
"

# Asset accounts with negative balances (should not happen for cash/checking)
conda run -n <env> bean-query <main_file> "
  SELECT account, SUM(position) AS balance
  FROM CLOSE
  WHERE account ~ '^Assets:' AND NOT account ~ 'Liabilities|Loan'
  GROUP BY 1 HAVING SUM(position) < 0
"

# Flagged transactions (pending review)
conda run -n <env> bean-query <main_file> "
  SELECT date, payee, narration, account, position
  WHERE flag = '!' ORDER BY date
"

# Transactions with missing/zero amounts
conda run -n <env> bean-query <main_file> "
  SELECT date, payee, narration, position
  WHERE position = 0
  ORDER BY date
"
```

### Step 3 — Determine Analysis Period

**Default behavior**: analyze the **last completed period**, not the current partial one.

1. Get today's date
2. Determine the target period (based on `--period`):

| `--period` | Default analysis range | Example (today = July 4, 2026) |
| ---------- | ---------------------- | ------------------------------ |
| `month`    | Last complete month    | June 1 – June 30, 2026         |
| `quarter`  | Last complete quarter  | April 1 – June 30, 2026 (Q2)   |
| `year`     | Last complete year     | Jan 1 – Dec 31, 2025           |

3. Determine the comparison baseline (based on `--compare`):

| `--compare`          | Baseline                    | Example (target = June 2026) |
| -------------------- | --------------------------- | ---------------------------- |
| `previous` (default) | Prior period of same length | May 2026                     |
| `last-year`          | Same period, prior year     | June 2025                    |

### Step 4 — Income & Expense Analysis

Query the beancount ledger using `FROM OPEN ON / CLOSE ON` syntax, which cleanly isolates periods and handles opening balances correctly.

For the target period `<start>` to `<end>` (where `<end>` = `<start>` + 1 period, i.e., exclusive end):

```bash
# Current period income — using OPEN ON / CLOSE ON period isolation
conda run -n <env> bean-query <main_file> "
  SELECT account, SUM(position) AS total
  FROM OPEN ON <start> CLOSE ON <end>
  WHERE account ~ '^Income'
  GROUP BY account ORDER BY total DESC
"

# Current period expenses
conda run -n <env> bean-query <main_file> "
  SELECT account, SUM(position) AS total
  FROM OPEN ON <start> CLOSE ON <end>
  WHERE account ~ '^Expenses'
  GROUP BY account ORDER BY total ASC
"

# Category aggregation (二级分类) — using ROOT(account, 2)
conda run -n <env> bean-query <main_file> "
  SELECT ROOT(account, 2) AS category, SUM(position) AS total
  FROM OPEN ON <start> CLOSE ON <end>
  WHERE account ~ '^Expenses'
  GROUP BY 1 ORDER BY 2 DESC
"

# Income vs Expenses summary (single query)
conda run -n <env> bean-query <main_file> "
  SELECT ROOT(account, 1) AS type, SUM(position) AS total
  FROM OPEN ON <start> CLOSE ON <end>
  WHERE account ~ '^Income|^Expenses'
  GROUP BY 1
"
```

Run the same queries for the comparison period (using its own `<comp_start>` / `<comp_end>` dates):

```bash
# Comparison period — same structure, different dates
conda run -n <env> bean-query <main_file> "
  SELECT account, SUM(position) AS total
  FROM OPEN ON <comp_start> CLOSE ON <comp_end>
  WHERE account ~ '^Income'
  GROUP BY account ORDER BY total DESC
"
```

#### Step 4a — Balance Sheet Snapshot

Take a point-in-time snapshot of assets and liabilities at the end of the target period:

```bash
conda run -n <env> bean-query <main_file> "
  SELECT account, SUM(position) AS balance
  FROM CLOSE ON <end> CLEAR
  WHERE account ~ '^Assets|^Liabilities'
  GROUP BY 1 ORDER BY account
"
```

#### Step 4b — Investment Portfolio Overview

If investment accounts exist, query holdings with cost basis and market value:

```bash
conda run -n <env> bean-query <main_file> "
  SELECT account, UNITS(SUM(position)), COST(SUM(position)), VALUE(SUM(position))
  FROM CLOSE ON <end>
  WHERE account ~ '^Assets:Investments'
  GROUP BY 1 ORDER BY account
"
```

#### Step 4c — Subscription & Recurring Detection

Detect potential subscriptions by finding payees with regular recurring charges:

```bash
conda run -n <env> bean-query <main_file> "
  SELECT payee, COUNT(*) AS freq, COST(SUM(position)) AS total
  WHERE account ~ '^Expenses' AND date >= <6-months-ago>
  GROUP BY 1 HAVING COUNT(*) >= 3
  ORDER BY 2 DESC
"
```

Calculate key metrics:

| Metric                 | Formula                                |
| ---------------------- | -------------------------------------- |
| Total Income           | Σ Income accounts                      |
| Total Expenses         | Σ Expense accounts                     |
| Net Savings            | Income − Expenses                      |
| Savings Rate           | Net Savings ÷ Income × 100%            |
| Top Expense Categories | Top 5 by ROOT(account, 2) aggregation  |
| MoM / QoQ / YoY Change | (Current − Previous) ÷ Previous × 100% |

Flag anomalies:

- Any expense category with > 30% increase vs baseline
- Income decline > 10%
- Savings rate < 10%

### Step 5 — Advisory Report

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
| ---- | ---- | ----- |

### Warnings (🟡)

| Line | File | Issue |
| ---- | ---- | ----- |

_No errors found._ ← if applicable

---

## 📊 Financial Analysis

### Summary

| Metric         | Current | Previous | Change |
| -------------- | ------- | -------- | ------ |
| Total Income   | ¥XXX    | ¥XXX     | +X%    |
| Total Expenses | ¥XXX    | ¥XXX     | +X%    |
| Net Savings    | ¥XXX    | ¥XXX     | +X%    |
| Savings Rate   | XX%     | XX%      | —      |

### Top Expense Categories (二级分类)

| Category | Amount | % of Total | vs Baseline |
| -------- | ------ | ---------- | ----------- |

### Income Breakdown

| Source | Amount | % of Total |
| ------ | ------ | ---------- |

---

## 📈 Investment Holdings

| Account | Units | Cost Basis | Market Value | P&L |
| ------- | ----- | ---------- | ------------ | --- |

_No investment accounts found._ ← if applicable

---

## ⚠️ Anomalies

- **<Category>**: increased X% vs baseline — possible reason: <explain>
- **Income**: declined X% — check <suggestion>

---

## 🏗️ Spending Structure

Analyze the expense composition and identify structural issues:

- **Essential vs Discretionary ratio**: classify expenses and compute the ratio (recommended: essential ≥ 50%)
- **Category concentration**: flag if a single category exceeds 40% of total spending
- **Recurring subscriptions**: list recurring items and suggest review for unused services
- **Seasonal patterns**: note month-over-month trends that may indicate one-time vs recurring spending

## ⚠️ Risk Alerts

Identify financial risks and early warning signs:

- **Savings rate below 10%** for two consecutive periods → financial cushion insufficient
- **Debt-to-income ratio** trend (if liability accounts exist) → > 40% is risky
- **Income concentration risk**: single income source > 80% → lack of diversification
- **Liquidity risk**: liquid asset balance (cash + money market + Alipay/WeChat) < 3× monthly expenses → emergency fund low
- **Expense growth outpaces income growth** for 3+ consecutive periods → unsustainable
- **Negative asset balances**: asset accounts like checking/savings/digital wallet show negative balance → data entry error or overdraft
- **Investment concentration**: single position > 50% of total portfolio value → lack of diversification
- **Subscription creep**: total subscription spending > 5% of monthly income → review unused services

## 💡 Recommendations

Provide specific, actionable advice using concrete metrics from the report:

1. **Spending optimization**: based on top expense categories, suggest targets (e.g., "餐饮 ¥4,500/月 → target ¥3,500, saving ¥1,000/月")
2. **Emergency fund**: based on monthly expenses, calculate target (3-6× = ¥XX,XXX)
3. **Budget allocation**: suggest income split (e.g., 50% essentials / 30% discretionary / 20% savings)
4. **Tax optimization**: mention tax-advantaged accounts or deductions if relevant
```

## Reference Files

This skill ships with reference files in the `references/` directory:

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `references/syntax.md`   | Beancount directive syntax reference with CNY examples                             |
| `references/bql.md`      | Full BQL query language documentation                                              |
| `references/examples.md` | Common transaction patterns (CNY adaptation with Chinese banking/wallet scenarios) |

## Notes

- Run `conda run` for EACH beancount command — the conda activation only lasts for one invocation
- If `bean-query` returns no results, verify the date range and account regex patterns
- `FROM OPEN ON <date> CLOSE ON <date>` syntax requires beancount >= 2.3.0; use `WHERE date >= X AND date < Y` as fallback for older versions
- The `ROOT(account, n)` function helps with category-level aggregation — essential for "Essential vs Discretionary" classification
- `VALUE(position)` requires price directives or `beancount.plugins.implicit_prices` plugin
- Large ledgers may need `--no-cache` or may be slow; warn the user if it takes > 10 seconds
