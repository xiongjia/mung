# Beancount Examples and Patterns (CNY Edition)

Common transaction patterns for personal finance tracking in China — yuan (CNY), Chinese banks, Alipay, WeChat, and A-share investments.

## Account Setup Patterns

### Personal Finance Structure

```beancount
; Options
option "title" "Personal Finances"
option "operating_currency" "CNY"

; Commodity declarations (recommended)
2010-01-01 commodity CNY
  name: "Chinese Yuan (Renminbi)"
2012-05-01 commodity 510300
  name: "CSI 300 ETF"
2015-06-01 commodity 159915
  name: "ChiNext ETF"

; Assets — Bank accounts
2026-01-01 open Assets:Bank:CMB:Salary CNY              ; CMB payroll card
2026-01-01 open Assets:Bank:CMB:Savings CNY              ; CMB savings account
2026-01-01 open Assets:Bank:ICBC:Joint CNY               ; ICBC joint account

; Assets — Digital wallets
2026-01-01 open Assets:Digital:Alipay:Balance CNY        ; Alipay balance
2026-01-01 open Assets:Digital:Alipay:YuEBao CNY          ; Yu'E Bao (money market)
2026-01-01 open Assets:Digital:WeChat:Balance CNY         ; WeChat wallet

; Assets — Investments
2026-01-01 open Assets:Investments:Brokerage CNY,510300,159915  ; Brokerage account
2026-01-01 open Assets:Investments:Fund:CSI300 CNY                ; CSI 300 fund
2026-01-01 open Assets:Investments:Fund:ChinaInternet             ; China internet fund

; Liabilities — Credit cards
2026-01-01 open Liabilities:Card:CMB:Classic CNY         ; CMB Classic Credit Card
2026-01-01 open Liabilities:Card:CITIC:iGold CNY         ; CITIC iGold Credit Card

; Liabilities — Loans
2026-01-01 open Liabilities:Loan:Mortgage CNY
  rate: "4.2%"
  lender: "Bank of China"

; Income
2026-01-01 open Income:Salary
2026-01-01 open Income:Bonus
2026-01-01 open Income:Interest
2026-01-01 open Income:Dividends
2026-01-01 open Income:RedPacket                         ; WeChat red packet income
2026-01-01 open Income:TaxRefund                         ; Annual tax filing refund

; Expenses — Housing
2026-01-01 open Expenses:Housing:Rent
2026-01-01 open Expenses:Housing:Utilities:Electric
2026-01-01 open Expenses:Housing:Utilities:Gas
2026-01-01 open Expenses:Housing:Utilities:Water
2026-01-01 open Expenses:Housing:PropertyMgmt             ; Property management fee
2026-01-01 open Expenses:Housing:Internet                 ; Broadband
2026-01-01 open Expenses:Housing:Maintenance

; Expenses — Food & Dining
2026-01-01 open Expenses:Food:Groceries
2026-01-01 open Expenses:Food:Restaurants
2026-01-01 open Expenses:Food:Delivery                    ; Food delivery
2026-01-01 open Expenses:Food:Coffee
2026-01-01 open Expenses:Food:Tea                         ; Bubble tea / milk tea

; Expenses — Transportation
2026-01-01 open Expenses:Transport:Metro
2026-01-01 open Expenses:Transport:Taxi
2026-01-01 open Expenses:Transport:Flights
2026-01-01 open Expenses:Transport:Parking

; Expenses — Other
2026-01-01 open Expenses:Subscriptions                    ; Streaming, cloud services
2026-01-01 open Expenses:Shopping:Online                  ; Online shopping
2026-01-01 open Expenses:Shopping:Offline                 ; In-store shopping
2026-01-01 open Expenses:Healthcare:Insurance
2026-01-01 open Expenses:Healthcare:Drugstore
2026-01-01 open Expenses:Entertainment
2026-01-01 open Expenses:Education

; Equity
2026-01-01 open Equity:Opening-Balances
```

## Opening Balances

### Using Pad (Recommended)

```beancount
2026-01-01 pad Assets:Bank:CMB:Salary Equity:Opening-Balances
2026-01-02 balance Assets:Bank:CMB:Salary 35000.00 CNY

2026-01-01 pad Assets:Digital:Alipay:YuEBao Equity:Opening-Balances
2026-01-02 balance Assets:Digital:Alipay:YuEBao 50000.00 CNY

2026-01-01 pad Liabilities:Card:CMB:Classic Equity:Opening-Balances
2026-01-02 balance Liabilities:Card:CMB:Classic -3200.00 CNY
```

### Explicit Opening Transaction

```beancount
2026-01-01 * "Opening Balances"
  Assets:Bank:CMB:Salary             35000.00 CNY
  Assets:Digital:Alipay:YuEBao       50000.00 CNY
  Assets:Digital:WeChat:Balance        2000.00 CNY
  Liabilities:Card:CMB:Classic       -3200.00 CNY
  Liabilities:Loan:Mortgage       -1800000.00 CNY
  Equity:Opening-Balances
```

## Income Patterns

### Simple Paycheck

```beancount
2026-01-15 * "ABC Tech" "January salary"
  Assets:Bank:CMB:Salary    28000.00 CNY
  Income:Salary             -28000.00 CNY
```

### Paycheck with Deductions (Social Insurance + Housing Fund + Tax)

```beancount
2026-01-15 * "ABC Tech" "January salary with deductions"
  Assets:Bank:CMB:Salary              22000.00 CNY  ; Net pay
  Expenses:Taxes:Income                3500.00 CNY  ; Individual income tax
  Expenses:SocialSecurity:Pension      2000.00 CNY  ; Pension insurance (personal share)
  Expenses:SocialSecurity:Medical       500.00 CNY  ; Medical insurance (personal share)
  Expenses:SocialSecurity:Unemployment   200.00 CNY  ; Unemployment insurance
  Expenses:Housing:ProvidentFund       3000.00 CNY  ; Housing fund (personal share)
  Assets:Housing:ProvidentFund         3000.00 CNY  ; Housing fund account (after employer match)
  Income:Salary                       -35000.00 CNY ; Gross salary
```

### Year-End Bonus

```beancount
2026-02-05 * "ABC Tech" "2025 year-end bonus"
  Assets:Bank:CMB:Salary              35000.00 CNY
  Expenses:Taxes:Income               12500.00 CNY  ; Bonus tax (separate calculation)
  Income:Bonus                       -50000.00 CNY
```

### Yu'E Bao / Money Market Interest

```beancount
2026-01-20 * "Yu'E Bao" "Interest credited"
  Assets:Digital:Alipay:YuEBao    18.60 CNY
  Income:Interest                -18.60 CNY
```

### Dividend Income

```beancount
2026-03-15 * "China Asset Mgmt" "CSI 300 ETF dividend"
  Assets:Investments:Brokerage    150.00 CNY
  Income:Dividends               -150.00 CNY
```

### WeChat Red Packet Received

```beancount
2026-02-10 * "Family" "CNY red packets"
  Assets:Digital:WeChat:Balance    2000.00 CNY
  Income:RedPacket               -2000.00 CNY
```

### Annual Tax Refund

```beancount
2026-06-01 * "Tax Bureau" "2025 annual tax filing refund"
  Assets:Bank:CMB:Salary    1200.00 CNY
  Income:TaxRefund         -1200.00 CNY
```

## Expense Patterns

### Grocery Shopping

```beancount
2026-01-05 * "Hema Fresh" "Weekend groceries"
  Expenses:Food:Groceries    328.00 CNY
  Liabilities:Card:CMB:Classic
```

### Food Delivery

```beancount
2026-01-10 * "Meituan" "Lunch delivery"
  Expenses:Food:Delivery    35.00 CNY
  Assets:Digital:Alipay:Balance
```

### Bubble Tea

```beancount
2026-01-12 * "Heytea" "Afternoon milk tea"
  Expenses:Food:Tea    29.00 CNY
  Assets:Digital:WeChat:Balance
```

### Coffee

```beancount
2026-01-03 * "Luckin Coffee" "Latte"
  Expenses:Food:Coffee    29.90 CNY
  Liabilities:Card:CMB:Classic

2026-01-15 * "Starbucks" "Americano"
  Expenses:Food:Coffee    33.00 CNY
  Assets:Digital:Alipay:Balance
```

### Split Transaction

```beancount
2026-01-10 * "Sam's Club" "Weekend haul"
  Expenses:Food:Groceries       350.00 CNY
  Expenses:Shopping:Offline     200.00 CNY
  Expenses:Food:Delivery         80.00 CNY  ; Deli section
  Liabilities:Card:CMB:Classic
```

### Subscriptions

```beancount
2026-01-01 * "Tencent Video" "Monthly membership"
  Expenses:Subscriptions    25.00 CNY
  Assets:Digital:WeChat:Balance

2026-01-01 * "NetEase Music" "Monthly membership"
  Expenses:Subscriptions    15.00 CNY
  Liabilities:Card:CITIC:iGold

2026-01-15 * "iCloud" "200GB storage"
  Expenses:Subscriptions    21.00 CNY
  Liabilities:Card:CMB:Classic
```

### Utilities

```beancount
2026-01-15 * "State Grid Shanghai" "January electricity"
  Expenses:Housing:Utilities:Electric    268.00 CNY
  Assets:Bank:CMB:Salary

2026-01-15 * "Shanghai Gas" "January gas"
  Expenses:Housing:Utilities:Gas    85.00 CNY
  Assets:Bank:CMB:Salary

2026-01-10 * "Shanghai Water" "January water"
  Expenses:Housing:Utilities:Water    45.00 CNY
  Assets:Digital:Alipay:Balance
```

### Property Management Fee

```beancount
2026-01-05 * "Property Mgmt" "January management fee"
  Expenses:Housing:PropertyMgmt    350.00 CNY
  Assets:Bank:CMB:Salary
```

### Transportation

```beancount
; Metro
2026-01-05 * "Shanghai Metro" "Commute"
  Expenses:Transport:Metro    6.00 CNY
  Assets:Digital:Alipay:Balance

; Ride-hailing
2026-01-08 * "Didi" "Late night ride home"
  Expenses:Transport:Taxi    45.00 CNY
  Assets:Digital:WeChat:Balance

; Bike sharing
2026-01-05 * "Hellobike" "Monthly pass"
  Expenses:Transport:Metro    15.00 CNY
  Assets:Digital:Alipay:Balance

; Gas
2026-01-12 * "Sinopec" "Gas refill"
  Expenses:Transport:Gas    350.00 CNY
  Liabilities:Card:CMB:Classic
```

## Housing Patterns

### Rent

```beancount
2026-01-01 * "Landlord" "January rent"
  Expenses:Housing:Rent    6500.00 CNY
  Assets:Bank:CMB:Salary
```

### Mortgage Payment

```beancount
2026-01-01 * "Bank of China" "January mortgage"
  Liabilities:Loan:Mortgage       3800.00 CNY  ; Principal
  Expenses:Housing:Mortgage       4200.00 CNY  ; Interest
  Assets:Bank:CMB:Salary        -8000.00 CNY
```

### Home Maintenance

```beancount
2026-01-20 * "Property Mgmt" "Plumbing repair"
  Expenses:Housing:Maintenance    200.00 CNY
  Assets:Digital:Alipay:Balance
```

## Credit Card Patterns

### Credit Card Purchase

```beancount
2026-01-03 * "JD.com" "Books"
  Expenses:Education    120.00 CNY
  Liabilities:Card:CMB:Classic
```

### Credit Card Payment

```beancount
2026-01-25 * "CMB" "Credit card payment"
  Liabilities:Card:CMB:Classic    3500.00 CNY
  Assets:Bank:CMB:Salary         -3500.00 CNY
```

### Balance Check

```beancount
; Verify balance after payment
2026-01-26 balance Liabilities:Card:CMB:Classic 0.00 CNY
```

## Transfer Patterns

### Bank to Alipay

```beancount
2026-01-05 * "Top up Alipay"
  Assets:Digital:Alipay:Balance    2000.00 CNY
  Assets:Bank:CMB:Salary          -2000.00 CNY
```

### Bank to Yu'E Bao

```beancount
2026-01-10 * "Transfer to Yu'E Bao"
  Assets:Digital:Alipay:YuEBao    5000.00 CNY
  Assets:Bank:CMB:Salary         -5000.00 CNY
```

### WeCash to Bank (Withdrawal)

```beancount
2026-01-15 * "WeChat withdrawal to bank"
  Assets:Bank:CMB:Salary           950.00 CNY  ; After 0.1% fee
  Expenses:Fees:Service              1.00 CNY  ; Withdrawal fee
  Assets:Digital:WeChat:Balance    -951.00 CNY
```

### Alipay to WeChat (Peer Transfer)

```beancount
2026-01-20 * "Friend" "Dinner split"
  Assets:Digital:WeChat:Balance     120.00 CNY
  Assets:Digital:Alipay:Balance    -120.00 CNY
```

## Investment Patterns

### Buy ETF

```beancount
2026-01-15 * "Huatai Securities" "Buy 3000 shares CSI 300 ETF"
  Assets:Investments:Brokerage    3000 510300 {3.950 CNY}
  Assets:Investments:Brokerage             -11850.00 CNY
```

### Dollar-Cost Averaging (DCA) Fund Purchase

```beancount
; Monthly DCA on the 10th, tagged for tracking
2026-01-10 * "Ant Fund" "CSI 300 DCA" #dca #index-fund
  Assets:Investments:Fund:CSI300    500.00 CNY
  Assets:Digital:Alipay:YuEBao     -500.00 CNY

2026-02-10 * "Ant Fund" "CSI 300 DCA" #dca #index-fund
  Assets:Investments:Fund:CSI300    500.00 CNY
  Assets:Digital:Alipay:YuEBao     -500.00 CNY
```

### Sell ETF

```beancount
2026-06-15 * "Huatai Securities" "Sell 1000 shares CSI 300 ETF"
  Assets:Investments:Brokerage    -1000 510300 {3.950 CNY} @ 4.250 CNY
  Assets:Investments:Brokerage           4250.00 CNY
  Income:Investments:Gains                ; Auto-calculated: -300.00 CNY
```

### Dividend Reinvestment

```beancount
2026-03-15 * "China Asset Mgmt" "CSI 300 ETF dividend reinvested"
  Assets:Investments:Brokerage    20 510300 {4.180 CNY}
  Income:Dividends              -83.60 CNY
```

### New Share / Convertible Bond Lottery

```beancount
; Winning a new convertible bond subscription (A-share market)
2026-04-10 * "Huatai Securities" "Convertible bond allotment" #ipo
  Assets:Investments:Brokerage    10 123456 {100.00 CNY}  ; Convertible bond
  Assets:Investments:Brokerage           -1000.00 CNY
```

### New Bond Listing Sale

```beancount
2026-04-25 * "Huatai Securities" "Convertible bond sold at listing" #ipo
  Assets:Investments:Brokerage    -10 123456 {100.00 CNY} @ 125.00 CNY
  Assets:Investments:Brokerage           1250.00 CNY
  Income:Investments:Gains                ; Auto-calculated: -250.00 CNY
```

## Reimbursement Patterns

### Work Expense Reimbursement

```beancount
; Initial expense
2026-01-10 * "Ctrip" "Business trip flight" #work-travel
  Expenses:Travel:BusinessTrip    1200.00 CNY
  Liabilities:Card:CITIC:iGold

; Reimbursement received
2026-01-25 * "ABC Tech" "Travel reimbursement" #work-travel
  Assets:Bank:CMB:Salary    1200.00 CNY
  Income:Reimbursements     -1200.00 CNY
```

### Using Links for Tracking

```beancount
2026-01-10 * "Ctrip" "Business trip flight" ^trip-jan-2026
  Expenses:Travel:BusinessTrip    1200.00 CNY
  Liabilities:Card:CITIC:iGold

2026-01-25 * "ABC Tech" "Travel reimbursement" ^trip-jan-2026
  Assets:Bank:CMB:Salary    1200.00 CNY
  Income:Reimbursements     -1200.00 CNY
```

## Loan Patterns

### Auto Loan

```beancount
2026-01-15 * "ICBC" "Car loan payment"
  Liabilities:Loan:Auto           2500.00 CNY  ; Principal
  Expenses:Transport:Interest      350.00 CNY  ; Interest
  Assets:Bank:CMB:Salary        -2850.00 CNY
```

### Consumer Loan

```beancount
2026-01-05 * "CMB Flash Loan" "Consumer loan repayment"
  Liabilities:Loan:Consumption      800.00 CNY  ; Principal
  Expenses:Interest:Consumption      60.00 CNY  ; Interest
  Assets:Bank:CMB:Salary          -860.00 CNY
```

## Travel Patterns

### Chinese New Year Travel

```beancount
pushtag #travel-2026-cny

2026-02-08 * "China Southern" "Shanghai→Beijing flight"
  Expenses:Transport:Flights    1200.00 CNY
  Liabilities:Card:CITIC:iGold

2026-02-08 * "Didi" "Airport transfer"
  Expenses:Transport:Taxi       120.00 CNY
  Assets:Digital:WeChat:Balance

2026-02-10 * "Supermarket" "CNY groceries"
  Expenses:Food:Groceries       500.00 CNY
  Assets:Digital:Alipay:Balance

poptag #travel-2026-cny
```

### National Holiday Trip

```beancount
pushtag #travel-2026-national-day

2026-10-01 * "Ctrip" "Sanya hotel 3 nights"
  Expenses:Travel:Lodging    2400.00 CNY
  Liabilities:Card:CMB:Classic

2026-10-02 * "Restaurant" "Seafood dinner"
  Expenses:Food:Restaurants   380.00 CNY
  Assets:Digital:Alipay:Balance

2026-10-03 * "Scenic spot" "Entrance tickets"
  Expenses:Entertainment      150.00 CNY
  Assets:Digital:WeChat:Balance

poptag #travel-2026-national-day
```

## Singles' Day / Double 11 Shopping

```beancount
pushtag #double11-2026

2026-11-11 * "Tmall" "Dyson vacuum cleaner"
  Expenses:Shopping:Online    2800.00 CNY
  Liabilities:Card:CMB:Classic

2026-11-11 * "JD.com" "Books"
  Expenses:Education           200.00 CNY
  Liabilities:Card:CITIC:iGold

2026-11-11 * "Tmall" "Household supplies stockup"
  Expenses:Shopping:Online     500.00 CNY
  Assets:Digital:Alipay:Balance

poptag #double11-2026
```

## Digital Wallet Patterns

### Top Up WeChat Wallet

```beancount
2026-01-10 * "WeChat top up"
  Assets:Digital:WeChat:Balance    500.00 CNY
  Assets:Bank:CMB:Salary          -500.00 CNY
```

### Alipay Payment

```beancount
2026-01-12 * "Family Mart" "Snacks"
  Expenses:Food:Coffee    15.00 CNY
  Assets:Digital:Alipay:Balance
```

### Yu'E Bao Auto-Debit

```beancount
2026-01-15 * "Didi" "Ride home"  ; Auto-debited from Yu'E Bao
  Expenses:Transport:Taxi    35.00 CNY
  Assets:Digital:Alipay:YuEBao
```

## Multi-Currency

### Foreign Currency Purchase

```beancount
2026-01-15 * "Amazon JP" "Purchase from Japan Amazon"
  Expenses:Shopping:Online    10000 JPY @ 0.048 CNY
  Liabilities:Card:CMB:Classic       -480.00 CNY
```

### Currency Exchange

```beancount
2026-01-10 * "Bank of China" "Bought 1000 USD"
  Assets:Cash:USD    1000 USD @ 7.25 CNY
  Assets:Bank:CMB:Salary  -7250.00 CNY
```

### Overseas Trip

```beancount
2026-03-15 * "Hotel" "Tokyo hotel 3 nights"
  Expenses:Travel:Lodging    60000 JPY @ 0.048 CNY
  Liabilities:Card:CITIC:iGold          -2880.00 CNY
```

## File Organization

### Main File (2026.beancount)

```beancount
; -*- mode: beancount; coding: utf-8; -*-
option "title" "2026 Personal Finances"
option "operating_currency" "CNY"

; Account definitions
include "accounts.beancount"

; Monthly transactions
include "2026/01-january.beancount"
include "2026/02-february.beancount"
include "2026/03-march.beancount"
; ...

; Price records (for investments)
include "prices.beancount"
```

### Accounts File (accounts.beancount)

```beancount
; All open directives
2026-01-01 open Assets:Bank:CMB:Salary CNY
2026-01-01 open Assets:Digital:Alipay:Balance CNY
; ... all accounts
```

### Monthly File (2026/01-january.beancount)

```beancount
; January 2026 Transactions

2026-01-01 * "Opening Balance"
  ; ...

2026-01-05 * "Hema Fresh" "Weekend groceries"
  ; ...

; Month-end balance assertions
2026-01-31 balance Assets:Bank:CMB:Salary 35000.00 CNY
2026-01-31 balance Assets:Digital:Alipay:YuEBao 52000.00 CNY
```

## Reconciliation Workflow

### Monthly Bank Reconciliation

```beancount
; 1. Download e-statement from mobile banking app
; 2. Record any missing transactions
; 3. Add balance assertion
2026-01-31 balance Assets:Bank:CMB:Salary 35800.00 CNY
; 4. Run bean-check to verify
; Mismatch → investigate the difference
```

### Credit Card Reconciliation

```beancount
; Statement closing date
2026-01-25 balance Liabilities:Card:CMB:Classic -4320.00 CNY

; After payment posts
2026-01-30 balance Liabilities:Card:CMB:Classic 0.00 CNY
```

### Alipay / WeChat Reconciliation

```beancount
; Alipay balance check
2026-01-31 balance Assets:Digital:Alipay:Balance 680.00 CNY
2026-01-31 balance Assets:Digital:Alipay:YuEBao 52800.00 CNY

; WeChat wallet check
2026-01-31 balance Assets:Digital:WeChat:Balance 350.00 CNY
```

## Common Queries

### Monthly Spending by Category

```sql
SELECT MONTH(date), ROOT(account, 2), SUM(position)
WHERE account ~ "Expenses" AND year = 2026
GROUP BY 1, 2
ORDER BY 1, 2
```

### Credit Card Balance

```sql
SELECT account, SUM(position)
WHERE account ~ "Liabilities:Card"
GROUP BY 1
```

### Yu'E Bao / Interest Income Summary

```sql
SELECT account, SUM(position)
WHERE account ~ "Income:Interest" AND year = 2026
GROUP BY 1
```

### Holdings Report

```sql
SELECT account, UNITS(SUM(position)), COST(SUM(position)), VALUE(SUM(position))
WHERE account ~ "Assets:Investments"
GROUP BY 1
```

### Net Worth

```sql
SELECT SUM(position)
FROM CLOSE
WHERE account ~ "Assets|Liabilities"
```

### Singles' Day Total

```sql
SELECT SUM(position)
WHERE "double11" IN tags AND year = 2026
```

### Annual Savings Rate

```sql
SELECT
  SUM(position) AS net_savings
FROM OPEN ON 2026-01-01 CLOSE ON 2027-01-01
WHERE account ~ "Income|Expenses"
```

### Monthly Food Spending

```sql
SELECT MONTH(date), SUM(position)
WHERE account ~ "Expenses:Food" AND year = 2026
GROUP BY 1
ORDER BY 1
```

### Subscription Services List

```sql
SELECT payee, account, COST(SUM(position)), COUNT(*) AS freq
WHERE account = "Expenses:Subscriptions" AND year = 2026
GROUP BY 1, 2
ORDER BY 3 DESC
```
