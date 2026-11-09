# dsh-spending-insights

DeepSeek Harness plugin that adds a **消费分析** (Spending) entry to the left sidebar (the panel list above the Workspace section). It opens a dashboard (Chinese UI) built from a **folder of Nordea bank statements**, analysed together:

| File | Account |
|---|---|
| `Nordea Gold - ….csv` (CSV export) | credit card |
| `…_Nordea Bank Abp_INVOICE.xml` (Finvoice e-invoice, one per billing month) | credit card |
| `Current Account ….csv` (CSV export) | debit / current account |
 It also gives the DSH agent tools over the same data, so you can ask about your spending in any chat.

## Statements folder

Click **选择文件夹…** (native folder chooser) or **输入路径** (type a path, e.g. `~/Google Drive/账单`) and pick the folder holding your statements. A cloud-synced folder (Google Drive, iCloud, Dropbox) makes the same statements available on every machine. Every `*.csv` and `*.xml` in the folder and one level of subfolders (e.g. one per year) is read. Overlapping statements are de-duplicated, including a credit card CSV and XML invoices covering the same weeks: rows match on account, date and amount plus the title, ignoring the differences between the two exports (the CSV's `USD 5,90 ` prefix on foreign purchases, `*` characters, truncated titles, `Payment 05.10` vs `Payment`). Add new statements to the folder and click **刷新**.

The folder path and your category changes are stored in `$DSH_HOME/storages/spending-insights.json` (default `~/.dsh/storages`), shared by all profiles on the machine. Category changes made by v0.1 in the browser are moved there automatically the first time the panel opens.

## Agent tools

| Tool | What it does |
|---|---|
| `spending_overview` | Totals (spending, income, surplus, cashback), per-category split, a week/month/year trend, top merchants and merchants still in 其他, for an optional date range |
| `spending_transactions` | Individual transactions filtered by date range, category (key or Chinese label), merchant text, spending/income |
| `spending_set_category` | Recategorise a merchant (or `auto` to undo); the dashboard picks it up on 刷新 / reopen |

Try e.g. “上个月我在餐饮上花了多少？和之前比呢？” or “帮我把「其他」里的商户归类”.

## Dashboard

- one global filter bar above the charts: period (last month/3M/6M/12M/YTD/All; picking last month switches the trend to weekly), trend granularity (week/month/year), and multi-select categories with their amounts. The filters apply to every chart, tile and the table. Periods count back from the latest imported transaction; presets that would include all imported data anyway (e.g. 12M when the statement only covers 2 months) are disabled, with a hint showing the data coverage.
- tiles for spend, monthly spend, top category, cashback, income, monthly income, surplus and monthly surplus (surplus = income − spending in all categories)
- categories: groceries, dining, transport, subscriptions, fitness, shopping, pets, housing & utilities, insurance, travel, medical, entertainment, other (keyword rules; recategorise any merchant in the table)
- category share donut and a trend chart: stacked spending columns, or — for month/year granularity — income or surplus (收入 / 支出 / 盈余 toggle)
- paginated transactions table (20/50/100 per page, default 50) with the account (信用卡/借记卡), where you can recategorise a merchant

Card payments ("Payment …" on the card, transfers to "Nordea Bank Abp" from the current account) and cashback are excluded from spend, so card purchases are not counted twice; merchant refunds reduce it. Current account deposits count as income, unless they come from a merchant you also paid (then they are refunds).
Statements are read on your machine by the plugin's host half; nothing is uploaded anywhere (beyond what you choose to ask the agent's model about).

## How it works

- `src/host/` → `lib/index.js` (Node host half): reads the folder, stores settings, and registers the agent tools with `ctx.tools`. It exposes a `spendingInsights` Remote service that the widget calls via `ctx.connection.rpc.call('/api', 'spendingInsights/<method>', { args })`. The service carries the same binding/marker metadata `TypertRemoteService` + `@Remote` produce and is dispatched by the API Gateway's source (SRC) mode, so the plugin needs no generated Typert artifacts and no `@deepseek-ai/*` imports. Keep Remote method parameters plain identifiers and never minify this bundle — the Gateway reads parameter names from the method source.
- `src/client.jsx` → `lib/client.js` (browser half): sidebar entry and dashboard.
- `src/data.js`: CSV parsing, categorisation and bucketing, shared by both halves.

## Develop

```sh
npm install
npm test          # data layer + host half (folder reading, Remote service, tools)
npm run build     # writes lib/client.js and lib/index.js
```

Parsers (`parseStatement` for CSV, `parseFinvoice` for XML) and category rules (`RULES`) live in `src/data.js`. The categories have a fixed order there, so each one keeps the same colour.

## Install

The built bundles (`lib/client.js`, `lib/index.js`) are committed, so installing straight from GitHub needs no build step.

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

**After changing `src/`, run `npm run build` and commit `lib/client.js` and `lib/index.js` as well**, because installs from GitHub use those committed files.
