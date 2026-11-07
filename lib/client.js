/**
 * dsh-spending-insights v0.1.0 — DeepSeek Harness plugin: spending charts from a bank statement CSV (Nordea format), opened from the left sidebar.
 */
window.__ModuleLoader__.load({id:"dsh-spending-insights",factory:require=>{var module={exports:{}},exports=module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.jsx
var client_exports = {};
__export(client_exports, {
  SpendingIcon: () => SpendingIcon,
  SpendingPage: () => SpendingPage,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_react2 = require("react");

// src/data.js
var CATEGORIES = [
  "Groceries",
  "Restaurants & caf\xE9s",
  "Transport & car",
  "Subscriptions",
  "Health & fitness",
  "Shopping",
  "Pets",
  "Other",
  // appended after Other so earlier categories keep their colours
  "Housing & utilities",
  "Insurance",
  "Travel",
  "Medical",
  "Entertainment"
];
var RULES = [
  ["Insurance", /vakuutus|insurance|\bif p&c\b|^if\b|lähitapiola|fennia|pohjola vakuutus|turva\b/i],
  ["Medical", /apteekki|pharmacy|terveys|mehiläinen|terveystalo|pihlajalinna|aava|lääkäri|hammas|dental|klinikka|clinic|hospital|sairaala|\bhus\b|laboratori|synlab|optikko|instrumentarium|specsavers/i],
  ["Groceries", /prisma|lidl|k-?citymarket|k-?supermarket|k-?market|s-?market|alepa|asian market|gc market|supermarket|sun market|dajiangyou|tokyokan|hakaniemen|food ?market|ruoka|\balko\b/i],
  ["Restaurants & caf\xE9s", /wolt|foodora|espresso house|starbucks|robert'?s coffee|cafe|café|coffee|kahvila|ravintola|restaurant|mcdonald|\bmcd|\bkfc\b|burger|hesburger|pizza|sushi|kebab|bar /i],
  ["Travel", /hotel|hostel|motel|booking\.com|airbnb|expedia|agoda|trivago|scandic|radisson|hilton|marriott|finnair|ryanair|norwegian|lufthansa|airbaltic|\bklm\b|\bsas |tallink|silja|viking line|eckerö|finnlines|himos|\blevi\b|\bruka\b|matkahuolto|onnibus|flixbus|travel|matka/i],
  ["Entertainment", /finnkino|megastar|bowling|keilailu|ooppera|kansallisooppe|teatteri|theatre|theater|cinema|elokuva|konsertti|concert|lippupiste|lippu\.fi|tiketti|ticketmaster|liveniation|steam|playstation|nintendo|epic games|linnanmäki|serena|museo|museum|escape|karaoke|tivoli|sea life|hc helsinki|jokerit/i],
  ["Transport & car", /bilia|traficom|liikenne ja viestint|moovy|aimo|europark|easypark|parking|pysäk|neste|st1|teboil|abc |shell|virta|ev ?charg|recharge|epass24|hsl|vr-|vr |taxi|uber|bolt/i],
  ["Subscriptions", /youtube|google|openai|chatgpt|anthropic|claude\.ai|apple\.com|itunes|icloud|amazon digi|prime video|netflix|spotify|disney|hbo|telia|elisa|dna oy|microsoft|github/i],
  ["Health & fitness", /sats|elixia|epassi|smartum|uifin|gym|fitness|kuntosali|urheilu/i],
  ["Shopping", /k-?rauta|partioaitta|kirjakaup|akateeminen|marimekko|muji|biltema|ikea|clas ohlson|tokmanni|gigantti|verkkokauppa|power |h&m|zara|zalando|amazon|stockmann|sokos|motonet|xxl|intersport|halpa-halli/i],
  ["Pets", /musti|mirri|pet ?shop|eläin/i],
  ["Housing & utilities", /\bas oy\b|housing|asunto|vuokra|isännöinti|helen|caruna|fortum|oomi|vattenfall|vesihuolto|sähkö/i]
];
function categorize(merchant) {
  for (const [category, re] of RULES) if (re.test(merchant)) return category;
  return "Other";
}
function splitLine(line, sep) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
function parseDate(s) {
  let m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return void 0;
}
function parseAmount(s) {
  let t = s.replace(/[\s ]/g, "");
  if (t.includes(",") && t.includes(".")) {
    t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else t = t.replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : void 0;
}
function merchantOf(title) {
  let t = title.replace(/^[A-Z]{3} [\d.,]+ /, "");
  const m = /^(Retail|Credit|Debit|Purchase|Refund)\s+([A-Z]{3})\s+(\S+)\s+(.+)$/.exec(t);
  if (m) t = m[4];
  return t.trim();
}
function accountOf(fileName = "", header = []) {
  if (/gold|platinum|credit|luotto|mastercard|visa/i.test(fileName)) return "credit";
  if (/current|account|debit|käyttötili|tili/i.test(fileName)) return "debit";
  return header.includes("balance") || header.includes("saldo") ? "debit" : "credit";
}
function kindOf(title, amount, account = "credit") {
  if (account === "debit") {
    if (/^nordea bank abp\b/i.test(title.trim())) return "payment";
    return amount < 0 ? "purchase" : "deposit";
  }
  if (/^payment\b/i.test(title)) return "payment";
  if (/cashback/i.test(title)) return "cashback";
  return amount < 0 ? "purchase" : "refund";
}
var HEADER_ALIASES = {
  date: ["transaction date", "booking date", "date", "kirjausp\xE4iv\xE4", "tapahtumap\xE4iv\xE4"],
  title: ["title", "description", "name", "otsikko", "saaja/maksaja", "payee"],
  amount: ["amount", "summa", "m\xE4\xE4r\xE4"],
  currency: ["currency", "valuutta"]
};
function parseStatement(text, fileName = "") {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error("The file is empty.");
  const sep = (lines[0].match(/;/g) ?? []).length >= (lines[0].match(/,/g) ?? []).length ? ";" : ",";
  const header = splitLine(lines[0], sep).map((h) => h.toLowerCase());
  const col = {};
  for (const [key, names] of Object.entries(HEADER_ALIASES)) {
    col[key] = names.map((n) => header.indexOf(n)).find((i) => i >= 0);
  }
  if (col.date === void 0 || col.title === void 0 || col.amount === void 0) {
    throw new Error("Could not find the date, title and amount columns in this CSV.");
  }
  const account = accountOf(fileName, header);
  const rows = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const f = splitLine(line, sep);
    const date = parseDate(f[col.date] ?? "");
    const amount = parseAmount(f[col.amount] ?? "");
    const title = f[col.title] ?? "";
    if (!date || amount === void 0 || !title) {
      skipped++;
      continue;
    }
    rows.push({
      date,
      title,
      merchant: merchantOf(title),
      amount,
      currency: col.currency !== void 0 && f[col.currency] || "EUR",
      kind: kindOf(title, amount, account),
      account
    });
  }
  return { account, rows, skipped };
}
var rowKey = (r) => `${r.account ?? "credit"}|${r.date}|${r.title}|${r.amount}`;
function mergeRows(existing, incoming) {
  const have = /* @__PURE__ */ new Map();
  for (const r of existing) have.set(rowKey(r), (have.get(rowKey(r)) ?? 0) + 1);
  const seen = /* @__PURE__ */ new Map();
  const merged = [...existing];
  let added = 0;
  for (const r of incoming) {
    const k = rowKey(r);
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    if (n > (have.get(k) ?? 0)) {
      merged.push(r);
      added++;
    }
  }
  merged.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  return { merged, added };
}
function paidMerchants(rows) {
  const paid = /* @__PURE__ */ new Set();
  for (const r of rows) if (r.kind === "purchase") paid.add(r.merchant);
  return paid;
}
function spendingOf(rows, overrides) {
  const paid = paidMerchants(rows);
  const out = [];
  for (const r of rows) {
    const refund = r.kind === "refund" || r.kind === "deposit" && paid.has(r.merchant);
    if (r.kind !== "purchase" && !refund) continue;
    out.push({
      ...r,
      spend: -r.amount,
      category: overrides[r.merchant] ?? categorize(r.merchant)
    });
  }
  return out;
}
function incomeOf(rows) {
  const paid = paidMerchants(rows);
  return rows.filter((r) => r.kind === "deposit" && !paid.has(r.merchant));
}
var toDate = (iso) => /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
var toIso = (d) => d.toISOString().slice(0, 10);
function weekStart(iso) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return toIso(d);
}
function isoWeekNumber(iso) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7);
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d - jan4) / 864e5 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
}
function bucketOf(iso, granularity) {
  if (granularity === "week") return weekStart(iso);
  if (granularity === "month") return `${iso.slice(0, 7)}-01`;
  return `${iso.slice(0, 4)}-01-01`;
}
function nextBucket(start, granularity) {
  const d = toDate(start);
  if (granularity === "week") d.setUTCDate(d.getUTCDate() + 7);
  else if (granularity === "month") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
  return toIso(d);
}
function bucketLabel(start, granularity) {
  const [y, m, day] = start.split("-");
  if (granularity === "year") return `${y}\u5E74`;
  if (granularity === "month") return `${y}\u5E74${Number(m)}\u6708`;
  return `\u7B2C${isoWeekNumber(start)}\u5468 \xB7 ${Number(m)}\u6708${Number(day)}\u65E5\u8D77`;
}
function bucketShortLabel(start, granularity) {
  const [y, m, day] = start.split("-");
  if (granularity === "year") return `${y}\u5E74`;
  if (granularity === "month") return Number(m) === 1 ? `${y.slice(2)}\u5E741\u6708` : `${Number(m)}\u6708`;
  return `${Number(m)}/${Number(day)}`;
}
function bucketize(entries, granularity, income = []) {
  if (entries.length === 0 && income.length === 0) return [];
  const dates = [...entries, ...income].map((e) => e.date);
  let min = dates[0];
  let max = dates[0];
  for (const d of dates) {
    if (d < min) min = d;
    if (d > max) max = d;
  }
  const buckets = [];
  const index = /* @__PURE__ */ new Map();
  for (let s = bucketOf(min, granularity); s <= max; s = nextBucket(s, granularity)) {
    const b = { start: s, total: 0, income: 0, byCategory: Object.fromEntries(CATEGORIES.map((c) => [c, 0])) };
    index.set(s, b);
    buckets.push(b);
  }
  for (const e of entries) {
    const b = index.get(bucketOf(e.date, granularity));
    b.total += e.spend;
    b.byCategory[e.category] += e.spend;
  }
  for (const e of income) index.get(bucketOf(e.date, granularity)).income += e.amount;
  return buckets;
}
function categoryTotals(entries) {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const e of entries) totals[e.category] += e.spend;
  return CATEGORIES.map((c) => ({ category: c, total: totals[c] })).filter((x) => x.total > 5e-3).sort((a, b) => b.total - a.total);
}
function rangeStart(range, latestIso) {
  if (range === "all" || !latestIso) return void 0;
  if (range === "ytd") return `${latestIso.slice(0, 4)}-01-01`;
  if (range === "lastmonth") return toIso(new Date(Date.UTC(Number(latestIso.slice(0, 4)), Number(latestIso.slice(5, 7)) - 2, 1)));
  const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const [y, m, day] = latestIso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 - months + 1, 0)).getUTCDate();
  const d = new Date(Date.UTC(y, m - 1 - months, Math.min(day, lastDay)));
  d.setUTCDate(d.getUTCDate() + 1);
  return toIso(d);
}
function rangeEnd(range, latestIso) {
  if (range !== "lastmonth" || !latestIso) return void 0;
  return toIso(new Date(Date.UTC(Number(latestIso.slice(0, 4)), Number(latestIso.slice(5, 7)) - 1, 0)));
}
function rangeCoversAll(range, earliestIso, latestIso) {
  if (!earliestIso || !latestIso) return true;
  const from = rangeStart(range, latestIso);
  const to = rangeEnd(range, latestIso);
  return (!from || from <= earliestIso) && (!to || to >= latestIso);
}
function daysBetween(a, b) {
  return Math.round((toDate(b) - toDate(a)) / 864e5) + 1;
}

// src/storage.js
var KEY = "dsh-spending-insights:v1";
function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return { rows: [], overrides: {}, files: [] };
    const v = JSON.parse(raw);
    return {
      rows: Array.isArray(v.rows) ? v.rows : [],
      overrides: v.overrides && typeof v.overrides === "object" ? v.overrides : {},
      files: Array.isArray(v.files) ? v.files : []
    };
  } catch {
    return { rows: [], overrides: {}, files: [] };
  }
}
function save(state) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// src/styles.js
var CSS = `
.dshsp-root {
  --sp-surface: var(--dsw-alias-bg-base, #fcfcfb);
  --sp-card: var(--dsw-alias-bg-base, #fcfcfb);
  --sp-text: var(--dsw-alias-label-primary, #0b0b0b);
  --sp-text-2: var(--dsw-alias-label-secondary, #52514e);
  --sp-text-3: var(--dsw-alias-label-tertiary, #8a8984);
  --sp-border: var(--dsw-alias-border-l2, rgba(0,0,0,.1));
  --sp-grid: var(--dsw-alias-border-l1, rgba(0,0,0,.06));
  --sp-hover: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.05));
  --sp-active: var(--dsw-alias-interactive-bg-active, rgba(0,0,0,.08));
  --sp-accent: var(--dsw-alias-brand-primary, #2a78d6);
  --sp-s0: #2a78d6; --sp-s1: #eb6834; --sp-s2: #1baf7a; --sp-s3: #eda100;
  --sp-s4: #e87ba4; --sp-s5: #008300; --sp-s6: #6250d6; --sp-s7: #8f8e88; --sp-s8: #00b4d8;
  --sp-s9: #8a5a2b; --sp-s10: #c43c8f; --sp-s11: #d64545; --sp-s12: #7a9a1f;
  --sp-income: #1a9e5c; --sp-deficit: #d03b3b;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  background: var(--sp-surface);
  color: var(--sp-text);
  font-size: 13px;
  line-height: 18px;
}
body[data-ds-dark-theme] .dshsp-root {
  color-scheme: dark;
  --sp-s0: #3987e5; --sp-s1: #d95926; --sp-s2: #199e70; --sp-s3: #c98500;
  --sp-s4: #d55181; --sp-s5: #008300; --sp-s6: #9085e9; --sp-s7: #7d7c77; --sp-s8: #22c7e8;
  --sp-s9: #b07a45; --sp-s10: #d660a8; --sp-s11: #e5605c; --sp-s12: #94b43a;
  --sp-income: #2fb872; --sp-deficit: #e5534b;
}
.dshsp-root *, .dshsp-root *::before, .dshsp-root *::after { box-sizing: border-box; }
.dshsp-inner { padding: 20px 32px 48px; }
.dshsp-head { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; justify-content: space-between;
  padding-left: max(0px, calc(var(--dsh-frame-leading-clearance, 0px) - 24px)); margin-bottom: 16px; }
.dshsp-title { font-size: 22px; line-height: 28px; font-weight: 600; margin: 0; }
.dshsp-sub { color: var(--sp-text-2); margin-top: 2px; }
.dshsp-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.dshsp-btn { appearance: none; border: 0.5px solid var(--sp-border); background: transparent; color: var(--sp-text);
  border-radius: 8px; padding: 6px 12px; font: inherit; cursor: pointer; white-space: nowrap; }
.dshsp-btn:focus-visible, .dshsp-seg button:focus-visible, .dshsp-chip:focus-visible { outline: 2px solid var(--sp-accent); outline-offset: 1px; }
@media (hover: hover) { .dshsp-btn:hover { background: var(--sp-hover); } }
.dshsp-btn-primary { background: var(--sp-text); color: var(--sp-surface); border-color: transparent; }
@media (hover: hover) { .dshsp-btn-primary:hover { background: var(--sp-text); opacity: .88; } }
.dshsp-btn-danger { color: #d03b3b; }
.dshsp-filters { position: sticky; top: 0; z-index: 3; background: var(--sp-surface); padding: 10px 0; margin: -10px 0 6px;
  border-bottom: 0.5px solid var(--sp-border); display: grid; gap: 8px; }
.dshsp-filter-row { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: center; }
.dshsp-filter-row > .dshsp-label:first-child { min-width: 52px; }
.dshsp-filter-row .dshsp-chips { margin: 0; flex: 1 1 0; min-width: 0; }
.dshsp-filter-row { align-items: flex-start; }
.dshsp-filter-row:first-child { align-items: center; }
.dshsp-filter-row > .dshsp-label:first-child { line-height: 16px; padding-top: 2px; }
.dshsp-gap { margin-left: 12px; }
.dshsp-push { margin-left: auto; }
.dshsp-pager { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; margin-top: 10px; }
.dshsp-pager .dshsp-more { margin: 0; }
.dshsp-pager-controls { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
.dshsp-pager-controls label { display: inline-flex; gap: 6px; align-items: center; }
.dshsp-btn-sm { padding: 3px 10px; font-size: 12px; }
.dshsp-btn:disabled { opacity: .4; cursor: default; background: transparent; }
.dshsp-tiles { margin-top: 16px; }
.dshsp-toolbar { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; margin-bottom: 16px; }
.dshsp-seg { display: inline-flex; padding: 2px; gap: 2px; border-radius: 9px; background: var(--sp-hover); }
.dshsp-seg button { appearance: none; border: 0; background: transparent; color: var(--sp-text-2); font: inherit;
  padding: 4px 10px; border-radius: 7px; cursor: pointer; }
.dshsp-seg button[aria-pressed="true"] { background: var(--sp-surface); color: var(--sp-text); box-shadow: 0 0 0 0.5px var(--sp-border), 0 1px 2px rgba(0,0,0,.06); }
.dshsp-seg button:disabled { opacity: .4; cursor: not-allowed; }
.dshsp-label { color: var(--sp-text-3); font-size: 12px; }
.dshsp-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
@media (max-width: 900px) { .dshsp-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.dshsp-tile { border: 0.5px solid var(--sp-border); border-radius: 12px; padding: 12px 14px; background: var(--sp-card); }
.dshsp-tile-label { color: var(--sp-text-2); font-size: 12px; }
.dshsp-tile-value { font-size: 22px; line-height: 28px; font-weight: 600; margin-top: 4px; font-variant-numeric: tabular-nums; }
.dshsp-tile-note { color: var(--sp-text-3); font-size: 12px; margin-top: 2px; }
.dshsp-grid { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(0, 2.4fr); gap: 12px; margin-bottom: 12px; }
@media (max-width: 900px) { .dshsp-grid { grid-template-columns: minmax(0, 1fr); } }
.dshsp-card { border: 0.5px solid var(--sp-border); border-radius: 12px; padding: 14px 16px 16px; background: var(--sp-card); min-width: 0; }
.dshsp-card-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.dshsp-card-title { font-size: 14px; font-weight: 600; margin: 0; }
.dshsp-card-sub { color: var(--sp-text-3); font-size: 12px; }
.dshsp-donut { display: flex; justify-content: center; align-items: center; min-height: 320px; }
.dshsp-donut-wrap { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; }
.dshsp-donut { flex: 0 0 auto; position: relative; }
.dshsp-legend { flex: 1 1 180px; list-style: none; margin: 0; padding: 0; min-width: 0; }
.dshsp-legend li button { width: 100%; display: grid; grid-template-columns: 10px minmax(0,1fr) auto 44px; gap: 8px; align-items: center;
  appearance: none; border: 0; background: transparent; color: var(--sp-text); font: inherit; text-align: left; padding: 4px 6px; border-radius: 6px; cursor: pointer; }
@media (hover: hover) { .dshsp-legend li button:hover { background: var(--sp-hover); } }
.dshsp-legend li button[aria-pressed="true"] { background: var(--sp-active); }
.dshsp-legend li.dshsp-dim button { opacity: .45; }
.dshsp-sw { width: 10px; height: 10px; border-radius: 3px; }
.dshsp-legend .dshsp-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshsp-num { font-variant-numeric: tabular-nums; text-align: right; }
.dshsp-pct { color: var(--sp-text-3); font-variant-numeric: tabular-nums; text-align: right; }
.dshsp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.dshsp-chip { appearance: none; display: inline-flex; gap: 6px; align-items: center; border: 0.5px solid var(--sp-border); background: transparent;
  color: var(--sp-text-2); font: inherit; font-size: 12px; padding: 2px 9px; border-radius: 999px; corner-shape: round; cursor: pointer; }
.dshsp-chip[aria-pressed="true"] { background: var(--sp-active); color: var(--sp-text); border-color: transparent; }
@media (hover: hover) { .dshsp-chip:hover { background: var(--sp-hover); } }
.dshsp-chip[data-dim] { opacity: .55; }
.dshsp-chip-num { color: var(--sp-text-3); font-variant-numeric: tabular-nums; }
.dshsp-chip .dshsp-sw { width: 8px; height: 8px; border-radius: 2px; }
.dshsp-chart { position: relative; width: 100%; }
.dshsp-chart svg { display: block; overflow: visible; }
.dshsp-axis { fill: var(--sp-text-3); font-size: 11px; font-variant-numeric: tabular-nums; }
.dshsp-tip { position: absolute; pointer-events: none; z-index: 2; min-width: 170px; max-width: 260px; padding: 8px 10px; border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, var(--sp-surface)); color: var(--sp-text); font-size: 12px; line-height: 17px;
  box-shadow: var(--dsw-elevation-panel, 0 0 0 0.5px rgba(0,0,0,.12), 0 6px 20px rgba(0,0,0,.12)); }
.dshsp-tip-title { font-weight: 600; margin-bottom: 4px; }
.dshsp-tip-row { display: grid; grid-template-columns: 8px minmax(0,1fr) auto; gap: 6px; align-items: center; }
.dshsp-tip-row .dshsp-sw { width: 8px; height: 8px; border-radius: 2px; }
.dshsp-tip-total { border-top: 0.5px solid var(--sp-border); margin-top: 4px; padding-top: 4px; display: flex; justify-content: space-between; font-weight: 600; }
.dshsp-table-wrap { overflow-x: auto; }
.dshsp-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.dshsp-table th { text-align: left; font-weight: 500; color: var(--sp-text-3); font-size: 12px; padding: 6px 8px; border-bottom: 0.5px solid var(--sp-border); white-space: nowrap; }
.dshsp-table td { padding: 5px 8px; border-bottom: 0.5px solid var(--sp-grid); vertical-align: middle; }
.dshsp-table td.dshsp-num, .dshsp-table th.dshsp-num { text-align: right; }
.dshsp-table .dshsp-merchant { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshsp-select { font: inherit; font-size: 12px; color: var(--sp-text); background: transparent; border: 0.5px solid var(--sp-border); border-radius: 6px; padding: 2px 4px; }
.dshsp-input { font: inherit; color: var(--sp-text); background: transparent; border: 0.5px solid var(--sp-border); border-radius: 8px; padding: 5px 10px; min-width: 0; width: 220px; max-width: 100%; }
.dshsp-refund { color: var(--sp-s5); }
.dshsp-surplus { color: var(--sp-income); }
.dshsp-deficit { color: var(--sp-deficit); }
.dshsp-account { color: var(--sp-text-2); white-space: nowrap; }
.dshsp-empty { border: 1px dashed var(--sp-border); border-radius: 16px; padding: 48px 24px; text-align: center; color: var(--sp-text-2); }
.dshsp-empty.dshsp-drag, .dshsp-root.dshsp-drag .dshsp-inner { outline: 2px dashed var(--sp-accent); outline-offset: -6px; border-radius: 16px; }
.dshsp-empty h2 { color: var(--sp-text); font-size: 16px; margin: 12px 0 4px; }
.dshsp-notice { margin-bottom: 12px; padding: 8px 12px; border-radius: 8px; background: var(--sp-hover); color: var(--sp-text-2); }
.dshsp-notice.dshsp-error { color: #d03b3b; }
.dshsp-notice-dismissable { display: flex; align-items: flex-start; gap: 8px; }
.dshsp-notice-dismissable > span { flex: 1; }
.dshsp-notice-close { flex: none; border: 0; background: transparent; color: var(--sp-text-3); cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 4px; border-radius: 4px; }
.dshsp-notice-close:hover { color: var(--sp-text); background: var(--sp-card); }
.dshsp-more { margin-top: 8px; color: var(--sp-text-3); font-size: 12px; }
`;

// src/charts.jsx
var import_react = require("react");

// src/i18n.js
var CATEGORY_LABELS = {
  "Groceries": "\u65E5\u7528\u6742\u8D27",
  "Restaurants & caf\xE9s": "\u9910\u996E\u5916\u5356",
  "Transport & car": "\u4EA4\u901A\u51FA\u884C",
  "Subscriptions": "\u8BA2\u9605\u4E0E\u901A\u8BAF",
  "Health & fitness": "\u8FD0\u52A8\u5065\u8EAB",
  "Shopping": "\u8D2D\u7269",
  "Pets": "\u5BA0\u7269",
  "Other": "\u5176\u4ED6",
  "Housing & utilities": "\u4F4F\u623F\u4E0E\u751F\u6D3B\u7F34\u8D39",
  "Insurance": "\u4FDD\u9669",
  "Travel": "\u65C5\u6E38",
  "Medical": "\u533B\u7597",
  "Entertainment": "\u5A31\u4E50"
};
var catLabel = (c) => CATEGORY_LABELS[c] ?? c;

// src/charts.jsx
var import_jsx_runtime = require("react/jsx-runtime");
var colorOf = (category) => `var(--sp-s${CATEGORIES.indexOf(category)})`;
var eur = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "EUR" });
var eur0 = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
var money = (n) => eur.format(n);
var money0 = (n) => eur0.format(n);
var GRANULARITY_UNIT = { week: "\u5468", month: "\u6708", year: "\u5E74" };
function useWidth(fallback = 600) {
  const ref = (0, import_react.useRef)(null);
  const [width, setWidth] = (0, import_react.useState)(fallback);
  (0, import_react.useLayoutEffect)(() => {
    const el = ref.current;
    if (!el) return void 0;
    setWidth(el.clientWidth || fallback);
    if (typeof ResizeObserver === "undefined") return void 0;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
function Swatch({ category }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsp-sw", style: { background: colorOf(category) } });
}
function arcPath(cx, cy, r0, r1, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (r, a) => `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`;
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    return `M ${p(r1, 0)} A ${r1} ${r1} 0 1 1 ${p(r1, Math.PI)} A ${r1} ${r1} 0 1 1 ${p(r1, 0)} M ${p(r0, 0)} A ${r0} ${r0} 0 1 0 ${p(r0, Math.PI)} A ${r0} ${r0} 0 1 0 ${p(r0, 0)} Z`;
  }
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}
function CategoryDonut({ totals, onPick }) {
  const [hover, setHover] = (0, import_react.useState)(void 0);
  const [ref, width] = useWidth(320);
  const size = Math.max(180, Math.min(300, width));
  const c = size / 2;
  const r1 = c - 4;
  const r0 = r1 - Math.round(size * 0.17);
  const sum = totals.reduce((a, t) => a + t.total, 0);
  let angle = 0;
  const slices = totals.map((t) => {
    const a0 = angle;
    angle += t.total / sum * Math.PI * 2;
    return { ...t, a0, a1: angle };
  });
  const shownTotal = hover ? totals.find((t) => t.category === hover)?.total ?? 0 : sum;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshsp-donut", ref, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      role: "img",
      "aria-label": `\u5206\u7C7B\u6D88\u8D39\u5360\u6BD4\uFF0C\u5408\u8BA1 ${money(sum)}`,
      children: [
        slices.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "path",
          {
            d: arcPath(c, c, hover === s.category ? r0 - 3 : r0, hover === s.category ? r1 + 3 : r1, s.a0, s.a1),
            fill: colorOf(s.category),
            stroke: "var(--sp-card)",
            strokeWidth: slices.length > 1 ? 2 : 0,
            strokeLinejoin: "round",
            opacity: hover && hover !== s.category ? 0.55 : 1,
            style: { cursor: "pointer", transition: "opacity .15s" },
            onMouseEnter: () => setHover(s.category),
            onMouseLeave: () => setHover(void 0),
            onClick: () => onPick(s.category),
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: `${catLabel(s.category)}\uFF1A${money(s.total)}\uFF08${(s.total / sum * 100).toFixed(1)}%\uFF09` })
          },
          s.category
        )),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: c, y: c - 8, textAnchor: "middle", className: "dshsp-axis", style: { fontSize: 12 }, children: hover ? catLabel(hover) : "\u5408\u8BA1" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: c, y: c + 16, textAnchor: "middle", fill: "var(--sp-text)", style: { fontSize: 22, fontWeight: 600 }, children: money0(shownTotal) }),
        hover && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: c, y: c + 36, textAnchor: "middle", className: "dshsp-axis", style: { fontSize: 12 }, children: `${(shownTotal / sum * 100).toFixed(1)}%` })
      ]
    }
  ) });
}
function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
function topRounded(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return `M ${x} ${y + h} V ${y + rr} Q ${x} ${y} ${x + rr} ${y} H ${x + w - rr} Q ${x + w} ${y} ${x + w} ${y + rr} V ${y + h} Z`;
}
function bottomRounded(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return `M ${x} ${y} V ${y + h - rr} Q ${x} ${y + h} ${x + rr} ${y + h} H ${x + w - rr} Q ${x + w} ${y + h} ${x + w} ${y + h - rr} V ${y} Z`;
}
function niceStep(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
var METRIC_LABEL = { spend: "\u6D88\u8D39", income: "\u6536\u5165", surplus: "\u76C8\u4F59" };
function TrendChart({ metric = "spend", ...props }) {
  return metric === "spend" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpendChart, { ...props }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowChart, { metric, ...props });
}
function Tooltip({ width, tipLeft, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshsp-tip", style: {
    top: 8,
    left: tipLeft > width / 2 ? void 0 : tipLeft + 12,
    right: tipLeft > width / 2 ? width - tipLeft + 12 : void 0
  }, children });
}
function FlowChart({ buckets, granularity, metric }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = (0, import_react.useState)(void 0);
  (0, import_react.useEffect)(() => {
    setHover(void 0);
  }, [buckets]);
  const height = 320;
  const m = { top: 14, right: 8, bottom: 26, left: 60 };
  const iw = Math.max(10, width - m.left - m.right);
  const ih = height - m.top - m.bottom;
  const valueOf = (b) => metric === "income" ? b.income : b.income - b.total;
  const values = buckets.map(valueOf);
  const step = niceStep((Math.max(0, ...values) - Math.min(0, ...values)) / 4);
  const lo = Math.floor(Math.min(0, ...values) / step) * step;
  const hi = Math.max(step, Math.ceil(Math.max(0, ...values) / step) * step);
  const y = (v) => m.top + ih - (v - lo) / (hi - lo) * ih;
  const ticks = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(t);
  const n = Math.max(1, buckets.length);
  const band = iw / n;
  const barW = Math.max(2, Math.min(64, band * 0.68));
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 64))));
  const avg = values.length ? values.reduce((a, v) => a + v, 0) / values.length : 0;
  const fill = (v) => metric === "income" || v >= 0 ? "var(--sp-income)" : "var(--sp-deficit)";
  const hb = hover !== void 0 ? buckets[hover] : void 0;
  const tipLeft = hover !== void 0 ? m.left + band * hover + band / 2 : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsp-chart", ref, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width, height, role: "img", "aria-label": `\u6BCF${GRANULARITY_UNIT[granularity]}${METRIC_LABEL[metric]}\u8D8B\u52BF`, children: [
      ticks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "line",
          {
            x1: m.left,
            x2: m.left + iw,
            y1: y(t),
            y2: y(t),
            stroke: t === 0 ? "var(--sp-border)" : "var(--sp-grid)",
            strokeWidth: t === 0 ? 1 : 0.5
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: m.left - 8, y: y(t) + 4, textAnchor: "end", className: "dshsp-axis", children: money0(t) })
      ] }, t)),
      buckets.map((b, i) => {
        const v = values[i];
        const x = m.left + band * i + (band - barW) / 2;
        const h = Math.abs(y(v) - y(0));
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { opacity: hover !== void 0 && hover !== i ? 0.55 : 1, children: [
          h > 0 && (v > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: topRounded(x, y(v), barW, h, 4), fill: fill(v) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: bottomRounded(x, y(0), barW, h, 4), fill: fill(v) })),
          i % labelEvery === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: m.left + band * i + band / 2, y: height - 8, textAnchor: "middle", className: "dshsp-axis", children: bucketShortLabel(b.start, granularity) })
        ] }, b.start);
      }),
      buckets.length > 1 && avg !== 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: m.left, x2: m.left + iw, y1: y(avg), y2: y(avg), stroke: "var(--sp-text-2)", strokeWidth: 1, strokeDasharray: "3 3" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: m.left + iw, y: y(avg) - 5, textAnchor: "end", className: "dshsp-axis", children: `\u5E73\u5747 ${money0(avg)} / ${GRANULARITY_UNIT[granularity]}` })
      ] }),
      buckets.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "rect",
        {
          x: m.left + band * i,
          y: m.top,
          width: band,
          height: ih,
          fill: "transparent",
          onMouseEnter: () => setHover(i),
          onMouseLeave: () => setHover(void 0)
        },
        `hit-${b.start}`
      ))
    ] }),
    hb && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { width, tipLeft, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshsp-tip-title", children: bucketLabel(hb.start, granularity) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsp-tip-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsp-sw", style: { background: "var(--sp-income)" } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6536\u5165" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsp-num", children: money(hb.income) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsp-tip-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsp-sw", style: { background: "var(--sp-text-3)" } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u652F\u51FA" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsp-num", children: money(hb.total) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsp-tip-total", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u76C8\u4F59" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: money(hb.income - hb.total) })
      ] })
    ] })
  ] });
}
function SpendChart({ buckets, granularity, series }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = (0, import_react.useState)(void 0);
  (0, import_react.useEffect)(() => {
    setHover(void 0);
  }, [buckets]);
  const height = 320;
  const m = { top: 14, right: 8, bottom: 26, left: 60 };
  const iw = Math.max(10, width - m.left - m.right);
  const ih = height - m.top - m.bottom;
  const ordered = CATEGORIES.filter((c) => series.includes(c));
  const valueOf = (b, c) => Math.max(0, b.byCategory[c]);
  const totalOf = (b) => ordered.reduce((a, c) => a + valueOf(b, c), 0);
  const max = niceMax(Math.max(0, ...buckets.map(totalOf)));
  const y = (v) => m.top + ih - v / max * ih;
  const n = Math.max(1, buckets.length);
  const band = iw / n;
  const barW = Math.max(2, Math.min(64, band * 0.68));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 64))));
  const avg = buckets.length ? buckets.reduce((a, b) => a + totalOf(b), 0) / buckets.length : 0;
  const hb = hover !== void 0 ? buckets[hover] : void 0;
  const tipLeft = hover !== void 0 ? m.left + band * hover + band / 2 : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsp-chart", ref, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width, height, role: "img", "aria-label": `\u6BCF${GRANULARITY_UNIT[granularity]}\u6D88\u8D39\u8D8B\u52BF`, children: [
      ticks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "line",
          {
            x1: m.left,
            x2: m.left + iw,
            y1: y(t),
            y2: y(t),
            stroke: t === 0 ? "var(--sp-border)" : "var(--sp-grid)",
            strokeWidth: t === 0 ? 1 : 0.5
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: m.left - 8, y: y(t) + 4, textAnchor: "end", className: "dshsp-axis", children: money0(t) })
      ] }, t)),
      buckets.map((b, i) => {
        const x = m.left + band * i + (band - barW) / 2;
        let acc = 0;
        const segs = [];
        const drawn = ordered.filter((c) => valueOf(b, c) > 0);
        drawn.forEach((c, j) => {
          const v = valueOf(b, c);
          const y0 = y(acc);
          const y1 = y(acc + v);
          acc += v;
          const gap = j > 0 ? 2 : 0;
          const h = Math.max(0, y0 - y1 - gap);
          if (h <= 0) return;
          segs.push(j === drawn.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: topRounded(x, y1, barW, h, 4), fill: colorOf(c) }, c) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x, y: y1, width: barW, height: h, fill: colorOf(c) }, c));
        });
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { opacity: hover !== void 0 && hover !== i ? 0.55 : 1, children: [
          segs,
          i % labelEvery === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: m.left + band * i + band / 2, y: height - 8, textAnchor: "middle", className: "dshsp-axis", children: bucketShortLabel(b.start, granularity) })
        ] }, b.start);
      }),
      buckets.length > 1 && avg > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: m.left, x2: m.left + iw, y1: y(avg), y2: y(avg), stroke: "var(--sp-text-2)", strokeWidth: 1, strokeDasharray: "3 3" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: m.left + iw, y: y(avg) - 5, textAnchor: "end", className: "dshsp-axis", children: `\u5E73\u5747 ${money0(avg)} / ${GRANULARITY_UNIT[granularity]}` })
      ] }),
      buckets.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "rect",
        {
          x: m.left + band * i,
          y: m.top,
          width: band,
          height: ih,
          fill: "transparent",
          onMouseEnter: () => setHover(i),
          onMouseLeave: () => setHover(void 0)
        },
        `hit-${b.start}`
      ))
    ] }),
    hb && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { width, tipLeft, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshsp-tip-title", children: bucketLabel(hb.start, granularity) }),
      [...ordered].reverse().filter((c) => hb.byCategory[c] !== 0).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsp-tip-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swatch, { category: c }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: catLabel(c) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsp-num", children: money(hb.byCategory[c]) })
      ] }, c)),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsp-tip-total", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5408\u8BA1" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: money(totalOf(hb)) })
      ] })
    ] })
  ] });
}

// src/client.jsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var PANEL_ID = "spending-insights";
var STYLE_ID = "dsh-spending-insights-style";
var PAGE_SIZES = [20, 50, 100];
var RANGES = [["lastmonth", "\u4E0A\u4E2A\u6708"], ["3m", "\u8FD13\u4E2A\u6708"], ["6m", "\u8FD16\u4E2A\u6708"], ["12m", "\u8FD112\u4E2A\u6708"], ["ytd", "\u4ECA\u5E74"], ["all", "\u5168\u90E8"]];
var GRANULARITIES = [["week", "\u5468"], ["month", "\u6708"], ["year", "\u5E74"]];
var METRICS = [["income", "\u6536\u5165"], ["spend", "\u652F\u51FA"], ["surplus", "\u76C8\u4F59"]];
var ACCOUNT_LABELS = { credit: "\u4FE1\u7528\u5361", debit: "\u501F\u8BB0\u5361" };
function Segmented({ options, value, onChange, label, isDisabled, disabledTitle }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-seg", role: "group", "aria-label": label, children: options.map(([v, text]) => {
    const disabled = isDisabled?.(v) ?? false;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        "aria-pressed": value === v,
        disabled,
        title: disabled ? disabledTitle : void 0,
        onClick: () => onChange(v),
        children: text
      },
      v
    );
  }) });
}
function SpendingIcon({ size = 20 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: size, height: size, viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M10 2.75a7.25 7.25 0 1 0 7.25 7.25H10V2.75Z", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12.5 1.9a7.3 7.3 0 0 1 5.6 5.6H12.5V1.9Z", fill: "currentColor" })
  ] });
}
function readFile(file) {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}
function SpendingPage() {
  const [store, setStore] = (0, import_react2.useState)(load);
  const [range, setRange] = (0, import_react2.useState)("all");
  const [granularity, setGranularity] = (0, import_react2.useState)("month");
  const [metric, setMetric] = (0, import_react2.useState)("spend");
  const [selected, setSelected] = (0, import_react2.useState)(void 0);
  const [query, setQuery] = (0, import_react2.useState)("");
  const [page, setPage] = (0, import_react2.useState)(1);
  const [pageSize, setPageSize] = (0, import_react2.useState)(50);
  const [notice, setNotice] = (0, import_react2.useState)(void 0);
  const [confirmClear, setConfirmClear] = (0, import_react2.useState)(false);
  const [dragging, setDragging] = (0, import_react2.useState)(false);
  const fileInput = (0, import_react2.useRef)(null);
  const storeRef = (0, import_react2.useRef)(store);
  const update = (0, import_react2.useCallback)((next) => {
    storeRef.current = next;
    setStore(next);
    if (!save(next)) setNotice({ error: true, text: "\u65E0\u6CD5\u5199\u5165\u672C\u5730\u5B58\u50A8\uFF0C\u5237\u65B0\u540E\u6570\u636E\u5C06\u4E22\u5931\u3002" });
  }, []);
  const importFiles = (0, import_react2.useCallback)(async (files) => {
    const parsedFiles = [];
    try {
      for (const file of files) parsedFiles.push([file.name, parseStatement(await readFile(file), file.name)]);
    } catch (e) {
      setNotice({ error: true, text: `\u5BFC\u5165\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}` });
      return;
    }
    const base = storeRef.current;
    let rows = base.rows;
    const names = [];
    const labelled = [];
    let added = 0;
    let skipped = 0;
    for (const [name2, parsed] of parsedFiles) {
      const m = mergeRows(rows, parsed.rows);
      rows = m.merged;
      added += m.added;
      skipped += parsed.skipped;
      names.push(name2);
      labelled.push(`${name2}\uFF08${ACCOUNT_LABELS[parsed.account]}\uFF09`);
    }
    update({ ...base, rows, files: [.../* @__PURE__ */ new Set([...base.files, ...names])] });
    setNotice({ text: `\u5DF2\u4ECE ${labelled.join("\u3001")} \u5BFC\u5165 ${added} \u7B14\u65B0\u4EA4\u6613` + (skipped ? `\uFF08\u8DF3\u8FC7 ${skipped} \u884C\u65E0\u6CD5\u8BC6\u522B\u7684\u5185\u5BB9\uFF09` : "") + "\u3002" });
  }, [update]);
  const onPick = (e) => {
    const files = [...e.target.files ?? []];
    e.target.value = "";
    if (files.length) importFiles(files);
  };
  const dropHandlers = {
    onDragOver: (e) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e) => {
      if (e.currentTarget === e.target) setDragging(false);
    },
    onDrop: (e) => {
      e.preventDefault();
      setDragging(false);
      const files = [...e.dataTransfer?.files ?? []].filter((f) => /\.(csv|txt)$/i.test(f.name));
      if (files.length) importFiles(files);
    }
  };
  const all = (0, import_react2.useMemo)(() => spendingOf(store.rows, store.overrides), [store]);
  const allIncome = (0, import_react2.useMemo)(() => incomeOf(store.rows), [store.rows]);
  const hasDebit = (0, import_react2.useMemo)(() => store.rows.some((r) => r.account === "debit"), [store.rows]);
  const allDates = [...all, ...allIncome].map((e) => e.date);
  const latest = allDates.length ? allDates.reduce((a, d) => d > a ? d : a) : void 0;
  const earliest = allDates.length ? allDates.reduce((a, d) => d < a ? d : a) : void 0;
  const coversAll = (r) => r !== "all" && rangeCoversAll(r, earliest, latest);
  const from = rangeStart(range, latest);
  const to = rangeEnd(range, latest);
  const inRange = (d) => (!from || d >= from) && (!to || d <= to);
  const inPeriod = (0, import_react2.useMemo)(() => all.filter((e) => inRange(e.date)), [all, from, to]);
  const incomeInPeriod = (0, import_react2.useMemo)(() => allIncome.filter((e) => inRange(e.date)), [allIncome, from, to]);
  const periodStart = from && earliest && from > earliest ? from : earliest;
  const periodEnd = to && latest && to < latest ? to : latest;
  const selectRange = (r) => {
    setRange(r);
    if (r === "lastmonth") setGranularity("week");
  };
  const periodTotals = (0, import_react2.useMemo)(() => categoryTotals(inPeriod), [inPeriod]);
  const periodSum = periodTotals.reduce((a, t) => a + t.total, 0);
  const available = periodTotals.map((t) => t.category);
  const active = selected ? selected.filter((c) => available.includes(c)) : [];
  const isAll = active.length === 0;
  const series = isAll ? available : active;
  const entries = (0, import_react2.useMemo)(
    () => isAll ? inPeriod : inPeriod.filter((e) => active.includes(e.category)),
    [inPeriod, isAll, active.join("|")]
  );
  const totals = (0, import_react2.useMemo)(() => categoryTotals(entries), [entries]);
  const shownMetric = granularity === "week" ? "spend" : metric;
  const buckets = (0, import_react2.useMemo)(
    () => shownMetric === "spend" ? bucketize(entries, granularity) : bucketize(inPeriod, granularity, incomeInPeriod),
    [shownMetric, entries, inPeriod, incomeInPeriod, granularity]
  );
  const cashback = (0, import_react2.useMemo)(() => store.rows.filter((r) => r.kind === "cashback" && inRange(r.date)).reduce((a, r) => a + r.amount, 0), [store.rows, from, to]);
  const toggleCategory = (c) => {
    if (isAll) {
      setSelected([c]);
      return;
    }
    const next = active.includes(c) ? active.filter((x) => x !== c) : [...active, c];
    setSelected(next.length ? next : void 0);
  };
  const total = entries.reduce((a, e) => a + e.spend, 0);
  const days = inPeriod.length || incomeInPeriod.length ? daysBetween(periodStart, periodEnd) : 0;
  const monthly = (v) => days ? v / days * 30.44 : 0;
  const perMonth = monthly(total);
  const income = incomeInPeriod.reduce((a, e) => a + e.amount, 0);
  const spendAll = inPeriod.reduce((a, e) => a + e.spend, 0);
  const surplus = income - spendAll;
  const purchases = entries.filter((e) => e.spend > 0).length;
  const top = totals[0];
  const q = query.trim().toLowerCase();
  const listed = q ? entries.filter((e) => e.merchant.toLowerCase().includes(q)) : entries;
  const pages = Math.max(1, Math.ceil(listed.length / pageSize));
  const current = Math.min(page, pages);
  const pageRows = listed.slice((current - 1) * pageSize, current * pageSize);
  (0, import_react2.useEffect)(() => {
    setPage(1);
  }, [range, query, pageSize, active.join("|")]);
  const setOverride = (merchant, category) => {
    update({ ...store, overrides: { ...store.overrides, [merchant]: category } });
  };
  const header = /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-head", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: "dshsp-title", children: "\u6D88\u8D39\u5206\u6790" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-sub", children: store.rows.length ? `\u5171 ${store.rows.length} \u6761\u8D26\u5355\u8BB0\u5F55 \xB7 \u5DF2\u5BFC\u5165 ${store.files.length} \u4E2A\u6587\u4EF6 \xB7 \u6570\u636E\u4EC5\u4FDD\u5B58\u5728\u672C\u673A` : "\u6839\u636E\u94F6\u884C\u8D26\u5355 CSV \u751F\u6210\u6D88\u8D39\u56FE\u8868\uFF0C\u6570\u636E\u4EC5\u4FDD\u5B58\u5728\u672C\u673A\u3002" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { ref: fileInput, type: "file", accept: ".csv,text/csv,text/plain", multiple: true, hidden: true, onChange: onPick }),
      store.rows.length > 0 && (confirmClear ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-label", children: "\u786E\u5B9A\u5220\u9664\u6240\u6709\u5DF2\u5BFC\u5165\u7684\u6570\u636E\uFF1F" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: "dshsp-btn dshsp-btn-danger",
            onClick: () => {
              update({ rows: [], overrides: {}, files: [] });
              setConfirmClear(false);
              setNotice(void 0);
              setSelected(void 0);
            },
            children: "\u5220\u9664"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-btn", onClick: () => setConfirmClear(false), children: "\u53D6\u6D88" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-btn", onClick: () => setConfirmClear(true), children: "\u6E05\u9664\u6570\u636E" })),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-btn dshsp-btn-primary", onClick: () => fileInput.current?.click(), children: "\u5BFC\u5165 CSV\u2026" })
    ] })
  ] });
  const noticeEl = notice && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `dshsp-notice dshsp-notice-dismissable${notice.error ? " dshsp-error" : ""}`, role: "status", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: notice.text }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: "dshsp-notice-close",
        "aria-label": "\u5173\u95ED\u63D0\u793A",
        title: "\u5173\u95ED",
        onClick: () => setNotice(void 0),
        children: "\xD7"
      }
    )
  ] });
  if (store.rows.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-root", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-inner", children: [
      header,
      noticeEl,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `dshsp-empty${dragging ? " dshsp-drag" : ""}`, ...dropHandlers, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SpendingIcon, { size: 40 }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u5BFC\u5165\u94F6\u884C\u8D26\u5355" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
          "\u5C06 CSV \u8D26\u5355\u6587\u4EF6\u62D6\u653E\u5230\u8FD9\u91CC\uFF0C\u6216\u70B9\u51FB",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u5BFC\u5165 CSV\u2026" }),
          "\u3002\u652F\u6301 Nordea \u4FE1\u7528\u5361\u8D26\u5355\uFF08\u5982 Nordea Gold\u2026csv\uFF09 \u548C\u501F\u8BB0\u5361\u8D26\u5355\uFF08Current Account\u2026csv\uFF09\uFF0C\u6309\u6587\u4EF6\u540D\u533A\u5206\u3002",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
          "\u53EF\u4EE5\u5BFC\u5165\u591A\u4EFD\u8D26\u5355\uFF0C\u91CD\u590D\u7684\u8BB0\u5F55\u4F1A\u81EA\u52A8\u5408\u5E76\uFF1B\u501F\u8BB0\u5361\u4E2D\u7ED9\u4FE1\u7528\u5361\u7684\u8FD8\u6B3E\uFF08Nordea Bank Abp\uFF09\u4E0D\u4F1A\u91CD\u590D\u8BA1\u5165\u652F\u51FA\u3002"
        ] })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `dshsp-root${dragging ? " dshsp-drag" : ""}`, ...dropHandlers, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-inner", children: [
    header,
    noticeEl,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsp-filters", "aria-label": "\u7B5B\u9009", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-filter-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-label", children: "\u65F6\u95F4\u8303\u56F4" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          Segmented,
          {
            label: "\u65F6\u95F4\u8303\u56F4",
            options: RANGES,
            value: range,
            onChange: selectRange,
            isDisabled: coversAll,
            disabledTitle: `\u5DF2\u5BFC\u5165\u7684\u8D26\u5355\u53EA\u8986\u76D6 ${earliest} \u81F3 ${latest}\uFF0C\u6B64\u8303\u56F4\u4E0E\u300C\u5168\u90E8\u300D\u76F8\u540C\u3002\u5BFC\u5165\u66F4\u65E9\u7684\u8D26\u5355\u540E\u5373\u53EF\u4F7F\u7528\u3002`
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-label dshsp-gap", children: "\u8D8B\u52BF\u7C92\u5EA6" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Segmented, { label: "\u8D8B\u52BF\u7C92\u5EA6", options: GRANULARITIES, value: granularity, onChange: setGranularity }),
        latest && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshsp-label dshsp-push", children: [
          `${periodStart} \u81F3 ${periodEnd}`,
          RANGES.some(([r]) => coversAll(r)) && `\uFF08\u8D26\u5355\u6570\u636E\u81EA ${earliest} \u8D77\uFF09`
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-filter-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshsp-label", title: "\u70B9\u51FB\u5206\u7C7B\u7B5B\u9009\uFF0C\u53EF\u591A\u9009", children: [
          "\u6D88\u8D39\u5206\u7C7B",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
          "\uFF08\u53EF\u591A\u9009\uFF09"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-chips", role: "group", "aria-label": "\u6D88\u8D39\u5206\u7C7B\uFF08\u53EF\u591A\u9009\uFF09", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "dshsp-chip", "aria-pressed": isAll, onClick: () => setSelected(void 0), children: [
            "\u5168\u90E8 ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-chip-num", children: money(periodSum) })
          ] }),
          periodTotals.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "button",
            {
              type: "button",
              className: "dshsp-chip",
              "aria-pressed": !isAll && active.includes(t.category),
              "data-dim": !isAll && !active.includes(t.category) ? "" : void 0,
              onClick: () => toggleCategory(t.category),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Swatch, { category: t.category }),
                catLabel(t.category),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-chip-num", children: `${money(t.total)} \xB7 ${(t.total / periodSum * 100).toFixed(0)}%` })
              ]
            },
            t.category
          ))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tiles", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-label", children: "\u603B\u6D88\u8D39" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-value", children: money(total) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-note", children: `${days} \u5929\u5185\u5171 ${purchases} \u7B14\u6D88\u8D39` })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-label", children: "\u6708\u5747\u6D88\u8D39" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-value", children: money(perMonth) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-note", children: `\u5468\u5747 ${money(days ? total / days * 7 : 0)} \xB7 \u6309 ${days} \u5929\u6298\u7B97` })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-label", children: "\u6700\u5927\u5206\u7C7B" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-value", children: top ? catLabel(top.category) : "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-note", children: top && total > 0 ? `${money(top.total)} \xB7 \u5360 ${(top.total / total * 100).toFixed(0)}%` : "" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-label", children: "\u8FD4\u73B0" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-value", children: money(cashback) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-note", children: "\u4FE1\u7528\u5361\u8FD8\u6B3E\u4E0D\u8BA1\u5165\u6D88\u8D39" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-label", children: "\u603B\u6536\u5165" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-value", children: money(income) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-note", children: hasDebit ? `${incomeInPeriod.length} \u7B14\u5165\u8D26\uFF08\u501F\u8BB0\u5361\uFF09` : "\u5BFC\u5165\u501F\u8BB0\u5361\u8D26\u5355\u540E\u663E\u793A" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-label", children: "\u6708\u5747\u6536\u5165" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-value", children: money(monthly(income)) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-note", children: `\u6309 ${days} \u5929\u6298\u7B97` })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-label", children: "\u603B\u76C8\u4F59" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `dshsp-tile-value ${surplus < 0 ? "dshsp-deficit" : "dshsp-surplus"}`, children: money(surplus) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-note", children: "\u6536\u5165 \u2212 \u5168\u90E8\u5206\u7C7B\u6D88\u8D39" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-tile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-label", children: "\u6708\u5747\u76C8\u4F59" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `dshsp-tile-value ${surplus < 0 ? "dshsp-deficit" : "dshsp-surplus"}`, children: money(monthly(surplus)) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-tile-note", children: income > 0 ? `\u50A8\u84C4\u7387 ${(surplus / income * 100).toFixed(0)}%` : `\u6309 ${days} \u5929\u6298\u7B97` })
      ] })
    ] }),
    entries.length === 0 && incomeInPeriod.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-notice", children: "\u8BE5\u65F6\u95F4\u8303\u56F4\u5185\u6CA1\u6709\u4EA4\u6613\u8BB0\u5F55\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsp-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-card-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "dshsp-card-title", children: "\u5206\u7C7B\u5360\u6BD4" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-card-sub", children: "\u70B9\u51FB\u6247\u533A\u53EF\u7B5B\u9009" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CategoryDonut, { totals, onPick: toggleCategory })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsp-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-card-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "dshsp-card-title", children: `${METRICS.find((m) => m[0] === shownMetric)[1]}\u8D8B\u52BF\uFF08\u6309${GRANULARITIES.find((g) => g[0] === granularity)[1]}\uFF09` }),
          granularity !== "week" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Segmented, { label: "\u8D8B\u52BF\u6307\u6807", options: METRICS, value: metric, onChange: setMetric }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-card-sub", children: shownMetric === "income" ? "\u501F\u8BB0\u5361\u5165\u8D26" : shownMetric === "surplus" ? "\u6536\u5165 \u2212 \u5168\u90E8\u5206\u7C7B\u6D88\u8D39" : isAll ? "\u5168\u90E8\u5206\u7C7B" : active.map(catLabel).join("\u3001") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TrendChart, { buckets, granularity, series, metric: shownMetric })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsp-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-card-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { className: "dshsp-card-title", children: [
          "\u4EA4\u6613\u660E\u7EC6",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-card-sub", children: `  ${listed.length} \u7B14` })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            className: "dshsp-input",
            type: "search",
            placeholder: "\u6309\u5546\u6237\u7B5B\u9009",
            value: query,
            onChange: (e) => setQuery(e.target.value),
            "aria-label": "\u6309\u5546\u6237\u7B5B\u9009"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-table-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: "dshsp-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "\u65E5\u671F" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "\u5546\u6237" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "\u8D26\u6237" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "\u5206\u7C7B" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { className: "dshsp-num", children: "\u91D1\u989D" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: pageRows.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: e.date }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "dshsp-merchant", title: e.title, children: e.merchant }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "dshsp-account", children: ACCOUNT_LABELS[e.account ?? "credit"] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "select",
            {
              className: "dshsp-select",
              value: e.category,
              "aria-label": `${e.merchant} \u7684\u5206\u7C7B`,
              onChange: (ev) => setOverride(e.merchant, ev.target.value),
              children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: c, children: catLabel(c) }, c))
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: `dshsp-num${e.spend < 0 ? " dshsp-refund" : ""}`, children: money(e.spend) })
        ] }, `${e.account}|${e.date}|${e.title}|${e.amount}|${i}`)) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-pager", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-more", children: "\u4FEE\u6539\u5206\u7C7B\u4F1A\u5E94\u7528\u5230\u8BE5\u5546\u6237\u7684\u6240\u6709\u4EA4\u6613\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-pager-controls", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "dshsp-label", children: [
            "\u6BCF\u9875",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("select", { className: "dshsp-select", value: pageSize, onChange: (e) => setPageSize(Number(e.target.value)), children: PAGE_SIZES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: n, children: `${n} \u6761` }, n)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-label", children: listed.length ? `${(current - 1) * pageSize + 1}\u2013${Math.min(current * pageSize, listed.length)} / ${listed.length}` : "0 / 0" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-btn dshsp-btn-sm", disabled: current <= 1, onClick: () => setPage(current - 1), children: "\u4E0A\u4E00\u9875" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-label", children: `\u7B2C ${current} / ${pages} \u9875` }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-btn dshsp-btn-sm", disabled: current >= pages, onClick: () => setPage(current + 1), children: "\u4E0B\u4E00\u9875" })
        ] })
      ] })
    ] })
  ] }) });
}
var name = "dsh-spending-insights";
var inject = ["slots"];
function apply(ctx) {
  ctx.effect(() => {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return () => {
    };
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, "dsh-spending-insights: styles");
  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL_ID }, SpendingPage));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
    name: "sidebar.panellist",
    id: PANEL_ID,
    order: 20,
    label: () => "\u6D88\u8D39\u5206\u6790"
  }, SpendingIcon));
}

return module.exports}});
