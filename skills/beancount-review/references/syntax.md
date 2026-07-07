# Beancount Syntax Reference

Complete reference for beancount directives and syntax.

## File Format

- Plain text files with `.beancount` extension
- UTF-8 encoding recommended
- Lines starting with `;` are comments
- Directives follow pattern: `YYYY-MM-DD <directive-type> ...`
- Order of directives does not matter (sorted chronologically after parsing)

## Currencies and Commodities

All uppercase, 1-24 characters:

```
CNY, USD, EUR, GBP         ; Fiat currencies (CNY = Chinese Yuan)
510300, 159915              ; China A-share ETFs (CSI 300, ChiNext)
AAPL, MSFT, VTI             ; US stocks/ETFs
BTC, ETH                    ; Cryptocurrencies
VACHR, SICKHR               ; Custom units (vacation hours, sick hours, etc.)
```

## Amounts

Basic amount:

```
100.00 CNY
-50.25 CNY
10 510300           ; 10 shares of CSI 300 ETF
```

Arithmetic expressions:

```
((40.00/3) + 5) CNY
(100 * 1.08) USD
```

## Account Names

Format: `Type:Component:Component:...`

Rules:

- Must start with one of five root types
- Each component starts with capital letter or number
- Components separated by colons
- No spaces (use dashes instead)
- Can contain letters, numbers, dashes

Examples (Chinese banking / digital payment context):

```
Assets:Bank:CMB:Salary                    ; CMB payroll card
Assets:Digital:Alipay:Balance              ; Alipay balance
Assets:Digital:Alipay:YuEBao               ; Alipay Yu'E Bao (money market)
Assets:Digital:WeChat:Balance              ; WeChat wallet
Assets:Investments:Brokerage               ; Brokerage account
Assets:Investments:Fund:CSI300             ; CSI 300 index fund
Liabilities:Card:CMB:Classic               ; CMB Classic Credit Card
Liabilities:Card:CITIC:iGold               ; CITIC iGold Credit Card
Liabilities:Loan:Mortgage                  ; Mortgage
Expenses:Food:Delivery                     ; Food delivery
Expenses:Transport:Metro                   ; Metro/subway
Expenses:Shopping:Online                   ; Online shopping
Income:Salary                              ; Salary
Income:Bonus                               ; Bonus
Income:RedPacket                           ; WeChat red packet income
```

Generic English examples:

```
Assets:US:BofA:Checking
Liabilities:Card:Chase-Freedom
Expenses:Food:Restaurants:Takeout
Income:2026:Bonus
Equity:Opening-Balances
```

## Directives

### open

Declare an account exists starting on a date.

Syntax:

```
YYYY-MM-DD open Account [Currency[,Currency...]] ["booking-method"]
```

Examples:

```beancount
; Basic open
2026-01-01 open Assets:Bank:CMB:Salary

; With currency constraint
2026-01-01 open Assets:Bank:CMB:Salary CNY
2026-01-01 open Assets:Digital:Alipay:YuEBao CNY

; Multiple currencies allowed
2026-01-01 open Assets:Investments:Brokerage CNY,510300,159915

; With booking method for lot tracking
2026-01-01 open Assets:Investments:Brokerage "FIFO"
```

Booking methods:

- `STRICT` — Exact lot matching required (default)
- `FIFO` — First-in-first-out
- `LIFO` — Last-in-first-out
- `NONE` — No lot tracking

Metadata on open:

```beancount
2026-01-01 open Liabilities:Loan:Mortgage
  rate: "4.2%"
  lender: "Bank of China"
  account-number: "6222****1234"
```

### close

Close an account. No transactions allowed after this date.

Syntax:

```
YYYY-MM-DD close Account
```

Example:

```beancount
2028-12-31 close Assets:Bank:OldBank
```

### commodity

Declare commodity metadata.

Syntax:

```
YYYY-MM-DD commodity Currency
  [metadata]
```

Example:

```beancount
1948-12-01 commodity CNY
  name: "Chinese Yuan (Renminbi)"

2010-01-01 commodity BTC
  name: "Bitcoin"
  asset-class: "cryptocurrency"

2012-05-01 commodity 510300
  name: "China CSI 300 ETF"
```

### balance

Assert that an account has exactly this balance at start of day.

Syntax:

```
YYYY-MM-DD balance Account Amount Currency
```

Examples:

```beancount
; Single currency balance check
2026-01-31 balance Assets:Bank:CMB:Salary 35800.00 CNY

; For multi-currency accounts, use one per currency
2026-01-31 balance Assets:Investments:Brokerage 50000.00 CNY
2026-01-31 balance Assets:Investments:Brokerage 100 510300
```

If balance doesn't match, beancount reports an error with the difference.

### pad

Insert automatic transaction to make balance assertion pass.

Syntax:

```
YYYY-MM-DD pad Account PadFromAccount
```

Example:

```beancount
; Pad will auto-generate entry to make balance work
2026-01-01 pad Assets:Bank:CMB:Salary Equity:Opening-Balances
2026-01-02 balance Assets:Bank:CMB:Salary 35800.00 CNY

; Beancount generates:
; 2026-01-01 P "Pad"
;   Assets:Bank:CMB:Salary   35800.00 CNY
;   Equity:Opening-Balances -35800.00 CNY
```

Rules:

- Only pad Assets and Liabilities (not Income/Expenses)
- Pad source is typically `Equity:Opening-Balances`
- Pad entry appears between pad directive and balance assertion

### note

Attach a dated note to an account.

Syntax:

```
YYYY-MM-DD note Account "Note text"
```

Example:

```beancount
2026-01-15 note Assets:Bank:CMB:Salary "Called bank about discrepancy"
2026-02-01 note Liabilities:Card:CITIC "Reported card stolen, new card ordered"
```

### document

Link external file to an account.

Syntax:

```
YYYY-MM-DD document Account "/path/to/file"
```

Example:

```beancount
2026-01-31 document Assets:Bank:CMB:Salary "documents/2026/statement-jan.pdf"
2026-02-15 document Expenses:Taxes "documents/tax-return-2025.pdf"
```

### price

Record market price of a commodity.

Syntax:

```
YYYY-MM-DD price Commodity Price Currency
```

Examples:

```beancount
2026-01-03 price 510300 3.950 CNY
2026-01-03 price EUR 7.80 CNY
2026-01-03 price USD 7.25 CNY
```

Used for:

- Mark-to-market valuations
- Currency conversion reporting
- Investment performance tracking

### event

Track variable values over time.

Syntax:

```
YYYY-MM-DD event "event-type" "value"
```

Examples:

```beancount
2026-01-01 event "employer" "ABC Tech Ltd."
2026-01-15 event "location" "Shanghai, China"
2026-03-01 event "employer" "New Company Inc"
```

Useful for:

- Tracking employer changes
- Location history
- Tax residency
- Any time-varying metadata

### query

Embed named BQL query in the file.

Syntax:

```
YYYY-MM-DD query "query-name" "BQL query string"
```

Example:

```beancount
2026-01-01 query "monthly-expenses" "
  SELECT MONTH(date), account, sum(position)
  WHERE account ~ 'Expenses' AND year = 2026
  GROUP BY 1, 2
  ORDER BY 1, 2
"
```

### custom

Generic directive for plugins and extensions.

Syntax:

```
YYYY-MM-DD custom "directive-name" [values...]
```

Example:

```beancount
2026-01-01 custom "budget" Expenses:Food 3000.00 CNY
2026-01-01 custom "fava-option" "fiscal-year-end" "12-31"
```

### option

Configure beancount behavior.

Syntax:

```
option "option-name" "value"
```

Common options:

```beancount
option "title" "Personal Finances"
option "operating_currency" "CNY"
option "documents" "documents/"
option "name_assets" "Assets"
option "name_liabilities" "Liabilities"
option "name_equity" "Equity"
option "name_income" "Income"
option "name_expenses" "Expenses"
```

### plugin

Load a beancount plugin.

Syntax:

```
plugin "module.path" ["config"]
```

Example:

```beancount
plugin "beancount.plugins.auto_accounts"
plugin "beancount.plugins.implicit_prices"
plugin "beancount_share.share" "{"share_tag": "shared"}"
```

### include

Include another beancount file.

Syntax:

```
include "path/to/file.beancount"
```

Example:

```beancount
include "accounts.beancount"
include "2026/01-january.beancount"
include "2026/02-february.beancount"
```

Paths are relative to the including file.

## Transaction Syntax

### Basic Structure

```
YYYY-MM-DD [txn|*|!] ["Payee"] "Narration" [#tag...] [^link...]
  [metadata: value]
  Account1    Amount [Currency] [{Cost}] [@ Price] [; comment]
  Account2    [Amount] [Currency]
  ...
```

### Flags

| Flag         | Meaning           |
| ------------ | ----------------- |
| `*` or `txn` | Completed/cleared |
| `!`          | Pending review    |

### Payee and Narration

```beancount
; Both payee and narration
2026-01-03 * "Luckin Coffee" "Latte"

; Narration only (no payee)
2026-01-03 * "Daily commute"

; Empty narration (just payee)
2026-01-03 * "Hema Fresh" ""
```

### Posting Syntax

Basic posting:

```
  Account    Amount Currency
```

With inline comment:

```
  Account    Amount Currency  ; comment here
```

Posting-level metadata:

```
  Account    Amount Currency
    category: "daily"
    receipt: "receipts/2026/01.jpg"
```

### Costs (for lots/positions)

Per-unit cost:

```
  Assets:Investments:Brokerage    100 510300 {3.950 CNY}
```

Total cost:

```
  Assets:Investments:Brokerage    100 510300 {{395.00 CNY}}
```

With acquisition date:

```
  Assets:Investments:Brokerage    100 510300 {3.950 CNY, 2026-01-15}
```

With label:

```
  Assets:Investments:Brokerage    100 510300 {3.950 CNY, "DCA-Jan"}
```

Full cost spec:

```
  Assets:Investments:Brokerage    100 510300 {3.950 CNY, 2026-01-15, "DCA-Jan"}
```

### Prices (for currency conversion)

Per-unit price:

```
  Assets:Cash:JPY    10000 JPY @ 0.048 CNY
```

Total price:

```
  Assets:Cash:JPY    10000 JPY @@ 480 CNY
```

### Selling with Cost Basis

```beancount
2026-06-15 * "Huatai Securities" "Sell CSI 300 ETF"
  Assets:Investments:Brokerage   -100 510300 {3.950 CNY} @ 4.250 CNY
  Assets:Investments:Brokerage   425.00 CNY
  Income:Investments:Gains       ; Auto-calculated: -30.00 CNY
```

### Tags and Links

Tags (categorization):

```beancount
2026-11-11 * "Tmall" "Singles Day shopping" #shopping #double11
  Expenses:Shopping:Online    1500.00 CNY
  Liabilities:Card:CMB:Classic
```

Links (connect related transactions):

```beancount
2026-01-15 * "Client" "Project contract payment" ^invoice-2026-001
  Income:Consulting        -50000.00 CNY
  Assets:Receivables        50000.00 CNY

2026-02-01 * "Client" "Payment received" ^invoice-2026-001
  Assets:Bank:CMB:Salary        50000.00 CNY
  Assets:Receivables           -50000.00 CNY
```

### Block Tags

Apply tags to multiple transactions:

```beancount
pushtag #travel-2026-cny

2026-02-10 * "China Southern" "Flight home for CNY"
  Expenses:Transport:Flights    1200.00 CNY
  Liabilities:Card:CITIC:iGold

2026-02-10 * "Ctrip" "Hotel during CNY"
  Expenses:Travel:Lodging       800.00 CNY
  Liabilities:Card:CITIC:iGold

poptag #travel-2026-cny
```

## Metadata

### Transaction-Level

```beancount
2026-01-03 * "JD.com" "Office supplies"
  order-id: "JD123456789"
  tracking: "SF1234567890"
  Expenses:Office    350.00 CNY
  Liabilities:Card:CMB:Classic
```

### Posting-Level

```beancount
2026-01-03 * "Hema Fresh" "Weekend groceries"
  Expenses:Food:Groceries    280.00 CNY
    aisle: "produce"
  Expenses:Food:Delivery      50.00 CNY
    aisle: "deli"
  Liabilities:Card:CMB:Classic
```

### Metadata Types

- Strings: `key: "value"`
- Numbers: `amount: 123.45`
- Dates: `purchased: 2026-01-15`
- Accounts: `source: Assets:Bank:CMB:Salary`
- Tags: `category: #food`
- Currencies: `currency: CNY`
- Booleans: Not directly supported, use strings

## Comments

```beancount
; Full line comment

2026-01-03 * "Convenience Store" "Purchase"  ; Inline comment
  Expenses:Food:Coffee    32.00 CNY           ; Posting comment
  Assets:Digital:Alipay

;; Section header comment
;; ======================

* Org-mode style headers work too
** Subsection
```
