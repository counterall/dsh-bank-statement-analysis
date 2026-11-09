# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

`dsh-spending-insights` is a **DeepSeek Harness (dsh) plugin**. It adds a **消费分析** (Spending) row to the Web Client's left sidebar panel list. That row opens a dashboard with a Chinese UI, built from bank statement CSVs in the Nordea export format. All parsing and storage happen in the browser (`localStorage`), so no data leaves the machine.

## Layout

| Path | Role |
|---|---|
| `src/data.js` | Pure data layer with no React or DOM: CSV parsing, merchant extraction, row kinds, categorisation `RULES`, merging and de-duplication, time bucketing and range presets. |
| `src/client.jsx` | Browser half of the plugin. Contains `SpendingPage` (the dashboard UI, filters, import, transactions table) and the plugin `apply(ctx)`, which injects the stylesheet and registers the `main` slot and the `sidebar.panellist` slot. |
| `src/charts.jsx` | Hand-rolled SVG charts (`CategoryDonut`, `TrendChart`), plus `money` formatting and `colorOf`. |
| `src/styles.js` | Scoped CSS string with the `dshsp-` class prefix. It uses the harness theme tokens `--dsw-alias-*`, with fallbacks. |
| `src/i18n.js` | Chinese display labels for categories. |
| `src/storage.js` | `localStorage` persistence under the key `dsh-spending-insights:v1`, shaped as `{ rows, overrides, files }`. |
| `lib/index.js` | Host half. It is a no-op `apply()` and only exists so the plugin gets loaded. |
| `lib/client.js` | **Generated** browser bundle. It is committed to the repo. Never edit it by hand. |
| `scripts/build.mjs` | esbuild script that wraps the bundle in `window.__ModuleLoader__.load({ id, factory })`. React stays external because it comes from the host. |
| `cordis.patch.yml` | Bundle patch that adds the plugin row. `package.json` → `dsh.client` makes the web app load `lib/client.js`. |
| `test/data.test.js` | `node:test` unit tests for `src/data.js`. |

## Commands

```sh
npm install
npm test        # node --test test/*.test.js (data layer only)
npm run build   # regenerates lib/client.js (add --minify via `node scripts/build.mjs --minify`)
```

## Rules and conventions

- **After any change under `src/`, run `npm run build` and commit the regenerated `lib/client.js`.** Users install straight from GitHub, which has no build step, so they get whatever `lib/client.js` is committed.
- Keep `src/data.js` pure (no React, DOM or `localStorage`) and cover it with tests in `test/data.test.js`. UI code has no tests, so check UI changes by building.
- **Categories:** the order of `CATEGORIES` sets the colour slot (`--sp-s0`…`--sp-s12` in `styles.js`, both themes). Append new categories rather than reordering them. `RULES` order is separate: the first matching rule wins, so specific categories (insurance, medical, travel…) come before broad ones, and add matching entries in `RULES`, `i18n.js` `CATEGORY_LABELS` and the CSS colour variables. Category keys stay in English because they are persisted in per-merchant `overrides`. Only the display labels are Chinese.
- **Accounts:** `accountOf(fileName, header)` marks a statement `credit` (e.g. `Nordea Gold …`) or `debit` (e.g. `Current Account …`); without a file-name hint a `Balance` column means debit. Rows carry `account`; rows stored before this field existed are credit.
- **Alipay:** `parseAlipay` reads 支付宝 exports (GBK, decoded by the host's `decode`; preamble before the `交易时间,…` header). Rows are `account: 'alipay'`, `currency: 'CNY'`, with optional `note` (商品说明) and `hint` (category mapped from 交易分类); `categoryOf(row)` tries merchant rules, then `hint`, then `note`.
- **Currency:** rows keep their statement currency; the host converts them to the display currency (`EUR`/`CNY`, saved in settings) in `load()` with `convertRows` and freshly fetched rates (`fetchRates`), keeping the statement amount in `original`.
- **Spending semantics:** credit rows starting with `Payment` (card repayments), debit transfers to `Nordea Bank Abp` (the same repayments, seen from the current account) and rows containing `cashback` are excluded. Purchases (negative amounts) count as spend, and merchant refunds reduce it. A positive debit row (`deposit`) is a refund if that merchant also has a purchase, otherwise income (`incomeOf`). Surplus = income − spending across all categories. See `kindOf`, `spendingOf` and `incomeOf`.
- `mergeRows` de-duplicates by `account|date|title|amount`, counting duplicates per file. Re-importing an overlapping statement adds nothing, while genuinely identical purchases are kept.
- Dates are ISO `YYYY-MM-DD` strings and are handled in UTC. Weeks start on Monday and follow ISO week numbering.
- User-facing text is Simplified Chinese. Code, comments and identifiers are English.
- CSS classes use the `dshsp-` prefix and colours come from theme tokens, so light and dark mode follow the app.
- `react`, `react/jsx-runtime` and `react-dom` must stay external in the build. The only devDependency is `esbuild`, so avoid adding runtime dependencies.
- If the persisted state shape changes in a way that breaks compatibility, bump the storage key version (`:v1`).

## Install (for reference)

```sh
dsh plugin --profile web add github:counterall/dsh-bank-statement-analysis
```

Restart DeepSeek Harness after installing. See `README.md` for the desktop profile and how to uninstall.
