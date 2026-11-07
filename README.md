# dsh-spending-insights

DeepSeek Harness plugin that adds a **消费分析** (Spending) entry to the left sidebar (the panel list above the Workspace section). It opens a dashboard (Chinese UI) built from bank statement CSVs (Nordea export format):

- one global filter bar above the charts: period (3M/6M/12M/YTD/All), trend granularity (week/month/year), and multi-select categories with their amounts. The filters apply to every chart, tile and the table. Periods count back from the latest imported transaction; presets that would include all imported data anyway (e.g. 12M when the statement only covers 2 months) are disabled, with a hint showing the data coverage.
- category share donut and stacked spending-over-time columns
- paginated transactions table (20/50/100 per page, default 50), where you can recategorise a merchant

Card payments ("Payment …") and cashback are excluded from spend; merchant refunds reduce it.
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
