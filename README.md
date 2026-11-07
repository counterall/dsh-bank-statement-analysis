# dsh-spending-insights

DeepSeek Harness plugin that adds a **消费分析** (Spending) entry to the left sidebar (the panel list above the Workspace section). It opens a dashboard (Chinese UI) built from Nordea bank statement CSVs — credit card statements (e.g. `Nordea Gold - ….csv`) and debit/current account statements (e.g. `Current Account.csv`), told apart by file name and analysed together:

- one global filter bar above the charts: period (last month/3M/6M/12M/YTD/All; picking last month switches the trend to weekly), trend granularity (week/month/year), and multi-select categories with their amounts. The filters apply to every chart, tile and the table. Periods count back from the latest imported transaction; presets that would include all imported data anyway (e.g. 12M when the statement only covers 2 months) are disabled, with a hint showing the data coverage.
- tiles for spend, monthly spend, top category, cashback, income, monthly income, surplus and monthly surplus (surplus = income − spending in all categories)
- category share donut and a trend chart: stacked spending columns, or — for month/year granularity — income or surplus (收入 / 支出 / 盈余 toggle)
- paginated transactions table (20/50/100 per page, default 50) with the account (信用卡/借记卡), where you can recategorise a merchant

Card payments ("Payment …" on the card, transfers to "Nordea Bank Abp" from the current account) and cashback are excluded from spend, so card purchases are not counted twice; merchant refunds reduce it. Current account deposits count as income, unless they come from a merchant you also paid (then they are refunds).
CSV data is parsed in the browser and stored in the Web Client's localStorage only.

## Develop

```sh
npm install
npm test          # data-layer unit tests
npm run build     # writes lib/client.js
```

Category rules live in `src/data.js` (`RULES`). The categories have a fixed order there, so each one keeps the same colour.

## Install

The built browser bundle (`lib/client.js`) is committed, so installing straight from GitHub needs no build step.

Desktop app (profile `desktop`):

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add github:counterall/dsh-bank-statement-analysis
```

`dsh` CLI / web (profile `web`):

```sh
dsh plugin --profile web add github:counterall/dsh-bank-statement-analysis
```

Restart DeepSeek Harness afterwards. You can pin a commit with `github:counterall/dsh-bank-statement-analysis#<sha>`.
To uninstall: `dsh plugin --profile <name> remove dsh-spending-insights`.

**After changing `src/`, run `npm run build` and commit `lib/client.js` as well**, because installs from GitHub use that committed file.
