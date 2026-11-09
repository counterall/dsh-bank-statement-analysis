/**
 * dsh-spending-insights v0.2.0 — DeepSeek Harness plugin: spending charts from a folder of bank statement CSVs (Nordea format), opened from the left sidebar, plus agent tools to query and recategorise the same data.
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
var import_react3 = require("react");

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
  ["Groceries", /prisma|lidl|k-?citymarket|k-?supermarket|k-?market|s-?market|alepa|asian market|gc market|supermarket|sun market|dajiangyou|tokyokan|hakaniemen|food ?market|ruoka|\balko\b|big c\b|7-eleven/i],
  ["Restaurants & caf\xE9s", /wolt|foodora|espresso house|starbucks|robert'?s coffee|cafe|café|coffee|kahvila|ravintola|restaurant|mcdonald|\bmcd|\bkfc\b|burger|hesburger|pizza|sushi|kebab|bar |noodle|kitchen|sikdang|depachika|food world/i],
  ["Travel", /hotel|hostel|motel|booking\.com|airbnb|expedia|agoda|trivago|scandic|radisson|hilton|marriott|finnair|ryanair|norwegian|lufthansa|airbaltic|\bklm\b|\bsas |tallink|silja|viking line|eckerö|finnlines|himos|\blevi\b|\bruka\b|matkahuolto|onnibus|flixbus|travel|matka/i],
  ["Entertainment", /finnkino|megastar|bowling|keilailu|ooppera|kansallisooppe|teatteri|theatre|theater|cinema|elokuva|konsertti|concert|lippupiste|lippu\.fi|tiketti|ticketmaster|liveniation|steam|playstation|nintendo|epic games|linnanmäki|serena|museo|museum|escape|karaoke|tivoli|sea life|hc helsinki|jokerit/i],
  ["Transport & car", /bilia|traficom|liikenne ja viestint|moovy|aimo|europark|easypark|parking|pysäk|neste|st1|teboil|abc |shell|virta|ev ?charg|recharge|epass24|hsl|vr-|vr |taxi|uber|bolt|\bgrab\b|^transport$|\bbts\b|\bmrt\b/i],
  ["Subscriptions", /youtube|google|openai|chatgpt|anthropic|claude\.ai|apple\.com|itunes|icloud|amazon digi|prime video|netflix|spotify|disney|hbo|telia|elisa|dna oy|microsoft|github/i],
  ["Health & fitness", /sats|elixia|epassi|smartum|uifin|gym|fitness|kuntosali|urheilu|massage|let'?s relax|\bspa\b/i],
  ["Shopping", /k-?rauta|partioaitta|kirjakaup|akateeminen|marimekko|muji|biltema|ikea|clas ohlson|tokmanni|gigantti|verkkokauppa|power |h&m|zara|zalando|amazon|stockmann|sokos|motonet|xxl|intersport|halpa-halli|uniqlo|pop mart|beams|united arrows|gentlewoman/i],
  ["Pets", /musti|mirri|pet ?shop|eläin/i],
  ["Housing & utilities", /\bas oy\b|housing|asunto|vuokra|isännöinti|helen|caruna|fortum|oomi|vattenfall|vesihuolto|sähkö/i]
];
function categorize(merchant) {
  for (const [category, re] of RULES) if (re.test(merchant)) return category;
  return "Other";
}
function categoryOf(row) {
  const byMerchant = categorize(row.merchant);
  if (byMerchant !== "Other") return byMerchant;
  if (row.hint && CATEGORIES.includes(row.hint)) return row.hint;
  return row.note ? categorize(row.note) : "Other";
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
      category: overrides[r.merchant] ?? categoryOf(r)
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
function customBounds(fromIso, toIso2) {
  const valid = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : void 0;
  const from = valid(fromIso);
  const to = valid(toIso2);
  return from && to && from > to ? { from: to, to: from } : { from, to };
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

// src/remote.js
var NAMESPACE = "spendingInsights";
var connection;
var waiters = /* @__PURE__ */ new Set();
function bindConnection(ctx) {
  ctx.inject(["connection"], (c) => {
    c.effect(() => {
      connection = c.connection;
      for (const w of waiters) w();
      waiters.clear();
      return () => {
        connection = void 0;
      };
    }, "dsh-spending-insights: connection");
  });
}
function ready(signal) {
  if (connection) return Promise.resolve(connection);
  return new Promise((resolve, reject) => {
    const done = () => resolve(connection);
    waiters.add(done);
    signal?.addEventListener("abort", () => {
      waiters.delete(done);
      reject(signal.reason);
    }, { once: true });
  });
}
async function call(method, args = {}, signal) {
  const conn = await ready(signal);
  const result = await conn.rpc.call("/api", `${NAMESPACE}/${method}`, { args }, signal);
  if (!result?.ok) {
    const error = result?.error;
    const message = error?.message ?? error?.code ?? "unknown error";
    if (/invocation-unavailable|not found|404/i.test(String(error?.code ?? message))) {
      throw new Error("\u5BBF\u4E3B\u7AEF\u63D2\u4EF6\u672A\u52A0\u8F7D\uFF0C\u8BF7\u91CD\u542F DeepSeek Harness \u540E\u518D\u8BD5\u3002");
    }
    throw new Error(message);
  }
  return result.value;
}

// src/storage.js
var KEY = "dsh-spending-insights:v1";
function legacyOverrides() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return void 0;
    const v = JSON.parse(raw);
    return v?.overrides && typeof v.overrides === "object" && Object.keys(v.overrides).length ? v.overrides : void 0;
  } catch {
    return void 0;
  }
}
function clearLegacy() {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
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
  --sp-ai: #4f6ef7;
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
  --sp-ai: #8197ff;
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
.dshsp-link { appearance: none; border: 0; background: none; padding: 0 4px; font: inherit; color: var(--sp-text-2);
  cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.dshsp-link:focus-visible { outline: 2px solid var(--sp-accent); outline-offset: 1px; border-radius: 4px; }
.dshsp-input.dshsp-path { width: 340px; }
.dshsp-rate { color: var(--sp-text-3); font-size: 12px; margin-top: 2px; }
.dshsp-orig { display: block; color: var(--sp-text-3); font-size: 11px; line-height: 14px; }
.dshsp-folder { font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--sp-hover); border-radius: 4px;
  padding: 1px 5px; display: inline-block; max-width: min(520px, 60vw); overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; vertical-align: bottom; }
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
.dshsp-card.dshsp-ai { margin: 4px 0 16px; border: 1px solid color-mix(in srgb, var(--sp-ai) 55%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--sp-ai) 8%, var(--sp-card)), var(--sp-card) 70%);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--sp-ai) 16%, transparent), 0 1px 2px rgba(0,0,0,.05); }
.dshsp-ai .dshsp-card-title::before { content: "\u2726"; color: var(--sp-ai); margin-right: 6px; }
.dshsp-daterange { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.dshsp-input.dshsp-date { width: auto; padding: 3px 8px; }
.dshsp-ai .dshsp-label { display: inline-flex; align-items: center; gap: 6px; }
.dshsp-ai-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.dshsp-ai-presets .dshsp-chip:disabled { opacity: .5; cursor: default; }
.dshsp-ai-ask { display: flex; gap: 8px; }
.dshsp-ai-ask .dshsp-input { flex: 1; width: auto; background: var(--sp-card); }
.dshsp-ai-ask .dshsp-input:focus { outline: none; border-color: var(--sp-ai); }
.dshsp-ai .dshsp-chip { background: var(--sp-card); }
.dshsp-pager { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; margin-top: 10px; }
.dshsp-pager .dshsp-more { margin: 0; }
.dshsp-pager-controls { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
.dshsp-pager-controls label { display: inline-flex; gap: 6px; align-items: center; }
.dshsp-btn-sm { padding: 3px 10px; font-size: 12px; }
.dshsp-btn:disabled { opacity: .4; cursor: default; background: transparent; }
.dshsp-btn-primary:disabled { background: var(--sp-text); }
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
.dshsp-empty p { max-width: 640px; margin: 0 auto; line-height: 1.6; }
.dshsp-empty code { font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--sp-hover); border-radius: 4px; padding: 1px 5px; word-break: break-all; }
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
var formats = /* @__PURE__ */ new Map();
var formatter = (currency, digits) => {
  const key = `${currency}|${digits}`;
  if (!formats.has(key)) {
    formats.set(key, new Intl.NumberFormat("zh-CN", { style: "currency", currency, ...digits === 0 ? { maximumFractionDigits: 0 } : {} }));
  }
  return formats.get(key);
};
var display = "EUR";
function setMoneyCurrency(currency) {
  display = currency || "EUR";
}
var money = (n, currency = display) => formatter(currency, 2).format(n);
var money0 = (n) => formatter(display, 0).format(n);
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

// src/ai.js
var import_react2 = require("react");

// src/prompt.js
var PRESETS = [
  ["\u603B\u7ED3\u6D88\u8D39", "\u603B\u7ED3\u8FD9\u6BB5\u65F6\u95F4\u7684\u6D88\u8D39\u60C5\u51B5\uFF1A\u603B\u989D\u3001\u4E3B\u8981\u5206\u7C7B\u3001\u53D8\u5316\u8D8B\u52BF\uFF0C\u4EE5\u53CA\u503C\u5F97\u6CE8\u610F\u7684\u5730\u65B9\u3002"],
  ["\u8282\u7701\u5EFA\u8BAE", "\u6839\u636E\u8FD9\u6BB5\u65F6\u95F4\u7684\u6D88\u8D39\uFF0C\u627E\u51FA\u53EF\u4EE5\u8282\u7701\u7684\u5F00\u652F\uFF0C\u7ED9\u51FA\u5177\u4F53\u53EF\u884C\u7684\u5EFA\u8BAE\u3002"],
  ["\u73AF\u6BD4\u53D8\u5316", "\u628A\u8FD9\u6BB5\u65F6\u95F4\u7684\u6D88\u8D39\u548C\u4E4B\u524D\u540C\u6837\u957F\u5EA6\u7684\u65F6\u95F4\u6BB5\u5BF9\u6BD4\uFF0C\u8BF4\u660E\u54EA\u4E9B\u5206\u7C7B\u53D8\u5316\u6700\u5927\uFF0C\u4EE5\u53CA\u53EF\u80FD\u7684\u539F\u56E0\u3002"],
  ["\u5F52\u7C7B\u300C\u5176\u4ED6\u300D", "\u770B\u770B\u300C\u5176\u4ED6\u300D\u5206\u7C7B\u91CC\u7684\u5546\u6237\uFF0C\u5EFA\u8BAE\u5B83\u4EEC\u5E94\u8BE5\u5F52\u5230\u54EA\u4E2A\u5206\u7C7B\u3002\u5148\u5217\u51FA\u5EFA\u8BAE\uFF0C\u7B49\u6211\u786E\u8BA4\u540E\u518D\u7528 spending_set_category \u4FEE\u6539\u3002"],
  ["\u5F02\u5E38\u68C0\u67E5", "\u68C0\u67E5\u6709\u6CA1\u6709\u5F02\u5E38\u7684\u6D88\u8D39\uFF0C\u6BD4\u5982\u91CD\u590D\u6263\u6B3E\u3001\u91D1\u989D\u5F02\u5E38\u5927\u7684\u4EA4\u6613\uFF0C\u6216\u65B0\u51FA\u73B0\u7684\u8BA2\u9605\u3002"]
];
function buildPrompt(question, { from, to, categories, granularity, currency = "EUR" }) {
  const unit = { week: "\u5468", month: "\u6708", year: "\u5E74" }[granularity] ?? "\u6708";
  const scope = categories?.length ? categories.map(catLabel).join("\u3001") : "\u5168\u90E8\u5206\u7C7B";
  return `${question.trim()}
\uFF08\u6765\u81EA\u300C\u6D88\u8D39\u5206\u6790\u300D\u9762\u677F\u3002\u5F53\u524D\u7B5B\u9009\uFF1A${from} \u81F3 ${to}\uFF0C${scope}\uFF0C\u8D8B\u52BF\u6309${unit}\u3002\u8BF7\u4F7F\u7528 spending_overview \u548C spending_transactions \u5DE5\u5177\u67E5\u8BE2\u6211\u7684\u8D26\u5355\u6570\u636E\uFF0C\u65E5\u671F\u7528 YYYY-MM-DD\uFF0C\u91D1\u989D\u7528${currency === "CNY" ? "\u4EBA\u6C11\u5E01\uFF08currency \u53C2\u6570\u4F20 CNY\uFF09" : "\u6B27\u5143\uFF08currency \u53C2\u6570\u4F20 EUR\uFF09"}\uFF0C\u7528\u4E2D\u6587\u56DE\u7B54\u3002\uFF09`;
}

// src/ai.js
var LAST_WORKSPACE_KEY = "dsh-spending-insights:ai-workspace";
var ui;
var workspaces;
var layout;
var defaultName = "\u9ED8\u8BA4\u5DE5\u4F5C\u533A";
var snapshot = { available: false, items: [] };
var listeners = /* @__PURE__ */ new Set();
function recompute() {
  const list = workspaces?.list?.getSnapshot?.();
  const items = (list?.items ?? []).map((w) => ({
    id: w.workspaceId,
    label: w.title === "default-workspace" ? defaultName : w.title,
    path: w.path
  }));
  snapshot = { available: Boolean(ui && workspaces), items };
  for (const l of listeners) l();
}
function bindWorkspaces(ctx) {
  ctx.inject(["uiWorkspace", "workspaces", "layout", "locale"], (c) => {
    c.effect(() => {
      ui = c.uiWorkspace;
      workspaces = c.workspaces;
      layout = c.layout;
      try {
        const t = c.locale?.bind?.("workspace");
        const label = t?.("workspace.defaultName");
        if (typeof label === "string" && label && label !== "workspace.defaultName") defaultName = label;
      } catch {
      }
      const unsubscribe = workspaces.list?.subscribe?.(recompute);
      recompute();
      return () => {
        if (typeof unsubscribe === "function") unsubscribe();
        ui = void 0;
        workspaces = void 0;
        layout = void 0;
        recompute();
      };
    }, "dsh-spending-insights: workspaces");
  });
}
var subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
var read = () => snapshot;
function useWorkspaces() {
  return (0, import_react2.useSyncExternalStore)(subscribe, read, read);
}
function lastWorkspace() {
  try {
    return globalThis.localStorage?.getItem(LAST_WORKSPACE_KEY) ?? void 0;
  } catch {
    return void 0;
  }
}
function rememberWorkspace(id) {
  try {
    globalThis.localStorage?.setItem(LAST_WORKSPACE_KEY, id);
  } catch {
  }
}
function askInWorkspace(workspaceId, prompt) {
  if (!ui) throw new Error("\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u6253\u5F00\u5BF9\u8BDD\u3002");
  rememberWorkspace(workspaceId);
  layout?.selectPanel?.(null);
  ui.startSession(workspaceId, { prompt, clearPreviousDraft: true });
}

// src/client.jsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var PANEL_ID = "spending-insights";
var STYLE_ID = "dsh-spending-insights-style";
var PAGE_SIZES = [20, 50, 100];
var RANGES = [["lastmonth", "\u4E0A\u4E2A\u6708"], ["3m", "\u8FD13\u4E2A\u6708"], ["6m", "\u8FD16\u4E2A\u6708"], ["12m", "\u8FD112\u4E2A\u6708"], ["ytd", "\u4ECA\u5E74"], ["all", "\u5168\u90E8"], ["custom", "\u81EA\u5B9A\u4E49"]];
var GRANULARITIES = [["week", "\u5468"], ["month", "\u6708"], ["year", "\u5E74"]];
var METRICS = [["income", "\u6536\u5165"], ["spend", "\u652F\u51FA"], ["surplus", "\u76C8\u4F59"]];
var ACCOUNT_LABELS = { credit: "\u4FE1\u7528\u5361", debit: "\u501F\u8BB0\u5361", alipay: "\u652F\u4ED8\u5B9D" };
var CURRENCIES = [["EUR", "\u20AC \u6B27\u5143"], ["CNY", "\xA5 \u4EBA\u6C11\u5E01"]];
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
function DateRangePicker({ from, to, min, max, onChange }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshsp-daterange", role: "group", "aria-label": "\u81EA\u5B9A\u4E49\u65F6\u95F4\u8303\u56F4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "input",
      {
        type: "date",
        className: "dshsp-input dshsp-date",
        value: from,
        min,
        max: to || max,
        onChange: (e) => onChange(e.target.value, to),
        "aria-label": "\u5F00\u59CB\u65E5\u671F"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-label", children: "\u81F3" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "input",
      {
        type: "date",
        className: "dshsp-input dshsp-date",
        value: to,
        min: from || min,
        max,
        onChange: (e) => onChange(from, e.target.value),
        "aria-label": "\u7ED3\u675F\u65E5\u671F"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: "dshsp-link",
        onClick: () => onChange(min ?? "", max ?? ""),
        title: "\u91CD\u7F6E\u4E3A\u5168\u90E8\u8D26\u5355\u65E5\u671F",
        children: "\u91CD\u7F6E"
      }
    )
  ] });
}
function SpendingIcon({ size = 20 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: size, height: size, viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M10 2.75a7.25 7.25 0 1 0 7.25 7.25H10V2.75Z", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12.5 1.9a7.3 7.3 0 0 1 5.6 5.6H12.5V1.9Z", fill: "currentColor" })
  ] });
}
var EMPTY = { folder: null, overrides: {}, currency: "EUR", rows: [], files: [] };
var errorText = (e) => e instanceof Error ? e.message : String(e);
function rateText(data) {
  const r = data.rate;
  if (!r) return "";
  const others = Object.keys(r.rates).filter((c) => c !== "EUR");
  const pairs = others.map((c) => `1 \u20AC = ${Number(r.rates[c].toFixed(4))} ${c === "CNY" ? "\u5143" : c}`);
  const when = r.date ? `\uFF0C${r.date}` : "";
  return `\u6C47\u7387 ${pairs.join("\uFF0C")}\uFF08${r.source}${when}\uFF09${r.stale ? " \xB7 \u83B7\u53D6\u6700\u65B0\u6C47\u7387\u5931\u8D25\uFF0C\u4F7F\u7528\u4E0A\u6B21\u7684\u6C47\u7387" : ""}`;
}
function unconvertedNotice(data) {
  return { error: true, text: `\u65E0\u6CD5\u83B7\u53D6\u6C47\u7387\uFF0C${data.unconverted.join("\u3001")} \u8D26\u5355\u6682\u672A\u8BA1\u5165\u3002\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u70B9\u51FB\u5237\u65B0\u3002` };
}
function readSummary(data) {
  const ok = data.files.filter((f) => !f.error);
  const bad = data.files.filter((f) => f.error);
  const skipped = ok.reduce((a, f) => a + f.skipped, 0);
  let text = `\u5DF2\u8BFB\u53D6 ${ok.length} \u4E2A\u8D26\u5355\u6587\u4EF6\uFF0C\u5171 ${data.rows.length} \u6761\u8BB0\u5F55`;
  if (skipped) text += `\uFF08\u8DF3\u8FC7 ${skipped} \u884C\u65E0\u6CD5\u8BC6\u522B\u7684\u5185\u5BB9\uFF09`;
  text += "\u3002";
  if (bad.length) text += ` \u65E0\u6CD5\u8BFB\u53D6\uFF1A${bad.map((f) => `${f.name}\uFF08${f.error}\uFF09`).join("\uFF1B")}`;
  return { error: bad.length > 0, text };
}
function FolderControls({ folder, busy, onPick, onSetPath, onRefresh }) {
  const [editing, setEditing] = (0, import_react3.useState)(false);
  const [path, setPath] = (0, import_react3.useState)("");
  const submit = async (e) => {
    e.preventDefault();
    if (await onSetPath(path)) setEditing(false);
  };
  if (editing) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "dshsp-actions", onSubmit: submit, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          className: "dshsp-input dshsp-path",
          autoFocus: true,
          value: path,
          placeholder: "/Users/\u2026/\u8D26\u5355 \u6216 ~/Documents/\u8D26\u5355",
          "aria-label": "\u8D26\u5355\u6587\u4EF6\u5939\u8DEF\u5F84",
          onChange: (e) => setPath(e.target.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "submit", className: "dshsp-btn dshsp-btn-primary", disabled: busy, children: "\u4FDD\u5B58" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-btn", onClick: () => setEditing(false), children: "\u53D6\u6D88" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-actions", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-link", onClick: () => {
      setPath(folder ?? "");
      setEditing(true);
    }, children: "\u8F93\u5165\u8DEF\u5F84" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: `dshsp-btn${folder ? "" : " dshsp-btn-primary"}`,
        disabled: busy,
        onClick: async () => {
          if (await onPick() === "unsupported") {
            setPath(folder ?? "");
            setEditing(true);
          }
        },
        children: folder ? "\u66F4\u6362\u6587\u4EF6\u5939\u2026" : "\u9009\u62E9\u6587\u4EF6\u5939\u2026"
      }
    ),
    folder && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-btn dshsp-btn-primary", disabled: busy, onClick: onRefresh, children: busy ? "\u8BFB\u53D6\u4E2D\u2026" : "\u5237\u65B0" })
  ] });
}
function AskAiCard({ filters }) {
  const { available, items } = useWorkspaces();
  const [chosen, setChosen] = (0, import_react3.useState)(lastWorkspace);
  const [question, setQuestion] = (0, import_react3.useState)("");
  const [error, setError] = (0, import_react3.useState)(void 0);
  if (!available) return null;
  const workspace = items.find((w) => w.id === chosen) ?? items[0];
  const ask = (q) => {
    if (!q.trim() || !workspace) return;
    setError(void 0);
    try {
      askInWorkspace(workspace.id, buildPrompt(q, filters));
      setQuestion("");
    } catch (e) {
      setError(errorText(e));
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsp-card dshsp-ai", "aria-label": "\u95EE AI", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-card-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "dshsp-card-title", children: "\u95EE AI" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-card-sub", children: "\u5728\u6240\u9009\u5DE5\u4F5C\u533A\u65B0\u5EFA\u5BF9\u8BDD\uFF0C\u95EE\u9898\u548C\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4F1A\u586B\u5165\u8F93\u5165\u6846\uFF0C\u6309\u56DE\u8F66\u53D1\u9001" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "dshsp-label dshsp-push", children: [
        "\u5DE5\u4F5C\u533A",
        items.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("select", { className: "dshsp-select", value: workspace?.id, onChange: (e) => setChosen(e.target.value), "aria-label": "\u5728\u54EA\u4E2A\u5DE5\u4F5C\u533A\u65B0\u5EFA\u5BF9\u8BDD", children: items.map((w) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: w.id, title: w.path, children: w.label }, w.id)) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-more", children: "\uFF08\u8FD8\u6CA1\u6709\u5DE5\u4F5C\u533A\uFF0C\u8BF7\u5148\u5728\u4FA7\u8FB9\u680F\u6DFB\u52A0\uFF09" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-ai-presets", role: "group", "aria-label": "\u5E38\u7528\u95EE\u9898", children: PRESETS.map(([label, q]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshsp-chip", disabled: !workspace, title: q, onClick: () => ask(q), children: label }, label)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "dshsp-ai-ask", onSubmit: (e) => {
      e.preventDefault();
      ask(question);
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          className: "dshsp-input",
          value: question,
          onChange: (e) => setQuestion(e.target.value),
          placeholder: "\u8F93\u5165\u4F60\u7684\u95EE\u9898\uFF0C\u4F8B\u5982\uFF1A\u4E0A\u4E2A\u6708\u9910\u996E\u6BD4\u5E73\u65F6\u591A\u5417\uFF1F",
          "aria-label": "\u5411 AI \u63D0\u95EE"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "submit", className: "dshsp-btn dshsp-btn-primary", disabled: !workspace || !question.trim(), children: "\u95EE AI" })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-notice dshsp-error", children: error })
  ] });
}
function SpendingPage() {
  const [store, setStore] = (0, import_react3.useState)(EMPTY);
  const [loaded, setLoaded] = (0, import_react3.useState)(false);
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [range, setRange] = (0, import_react3.useState)("all");
  const [custom, setCustom] = (0, import_react3.useState)({ from: "", to: "" });
  const [granularity, setGranularity] = (0, import_react3.useState)("month");
  const [metric, setMetric] = (0, import_react3.useState)("spend");
  const [selected, setSelected] = (0, import_react3.useState)(void 0);
  const [query, setQuery] = (0, import_react3.useState)("");
  const [page, setPage] = (0, import_react3.useState)(1);
  const [pageSize, setPageSize] = (0, import_react3.useState)(50);
  const [notice, setNotice] = (0, import_react3.useState)(void 0);
  const mounted = (0, import_react3.useRef)(true);
  (0, import_react3.useEffect)(() => () => {
    mounted.current = false;
  }, []);
  const refresh = (0, import_react3.useCallback)(async (announce) => {
    setBusy(true);
    try {
      const data = await call("state");
      if (!mounted.current) return;
      setStore(data);
      if (data.error) setNotice({ error: true, text: `\u65E0\u6CD5\u8BFB\u53D6\u8D26\u5355\u6587\u4EF6\u5939\uFF1A${data.error}` });
      else if (data.unconverted) setNotice(unconvertedNotice(data));
      else if (announce && data.folder) setNotice(readSummary(data));
    } catch (e) {
      if (mounted.current) setNotice({ error: true, text: `\u8BFB\u53D6\u5931\u8D25\uFF1A${errorText(e)}` });
    } finally {
      if (mounted.current) {
        setBusy(false);
        setLoaded(true);
      }
    }
  }, []);
  (0, import_react3.useEffect)(() => {
    (async () => {
      const legacy = legacyOverrides();
      if (legacy) {
        try {
          await call("importOverrides", { overrides: legacy });
          clearLegacy();
        } catch {
        }
      }
      await refresh(false);
    })();
  }, [refresh]);
  const pickFolder = async () => {
    setBusy(true);
    try {
      const r = await call("pickFolder");
      if (!r.supported) return "unsupported";
      if (r.folder) await refresh(true);
      return r.folder ? "picked" : "cancelled";
    } catch (e) {
      setNotice({ error: true, text: `\u65E0\u6CD5\u6253\u5F00\u6587\u4EF6\u5939\u9009\u62E9\u5668\uFF1A${errorText(e)}` });
      return "unsupported";
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const changeCurrency = async (currency) => {
    if (currency === store.currency) return;
    setBusy(true);
    try {
      const r = await call("setCurrency", { currency });
      if (!r.ok) throw new Error(r.error);
      if (!mounted.current) return;
      setStore(r.state);
      setNotice(r.state.unconverted ? unconvertedNotice(r.state) : void 0);
    } catch (e) {
      if (mounted.current) setNotice({ error: true, text: `\u5207\u6362\u8D27\u5E01\u5931\u8D25\uFF1A${errorText(e)}` });
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const setFolderPath = async (path) => {
    try {
      const r = await call("setFolder", { folder: path });
      if (!r.ok) {
        setNotice({ error: true, text: r.error });
        return false;
      }
      await refresh(true);
      return true;
    } catch (e) {
      setNotice({ error: true, text: errorText(e) });
      return false;
    }
  };
  setMoneyCurrency(store.currency);
  const all = (0, import_react3.useMemo)(() => spendingOf(store.rows, store.overrides), [store]);
  const allIncome = (0, import_react3.useMemo)(() => incomeOf(store.rows), [store.rows]);
  const hasDebit = (0, import_react3.useMemo)(() => store.rows.some((r) => r.account === "debit"), [store.rows]);
  const allDates = [...all, ...allIncome].map((e) => e.date);
  const latest = allDates.length ? allDates.reduce((a, d) => d > a ? d : a) : void 0;
  const earliest = allDates.length ? allDates.reduce((a, d) => d < a ? d : a) : void 0;
  const coversAll = (r) => r !== "all" && r !== "custom" && rangeCoversAll(r, earliest, latest);
  const bounds = range === "custom" ? customBounds(custom.from, custom.to) : { from: rangeStart(range, latest), to: rangeEnd(range, latest) };
  const { from, to } = bounds;
  const inRange = (d) => (!from || d >= from) && (!to || d <= to);
  const inPeriod = (0, import_react3.useMemo)(() => all.filter((e) => inRange(e.date)), [all, from, to]);
  const incomeInPeriod = (0, import_react3.useMemo)(() => allIncome.filter((e) => inRange(e.date)), [allIncome, from, to]);
  const periodStart = from && earliest && from > earliest ? from : earliest;
  const periodEnd = to && latest && to < latest ? to : latest;
  const selectRange = (r) => {
    if (r === "custom" && range !== "custom") setCustom({ from: periodStart ?? "", to: periodEnd ?? "" });
    setRange(r);
    if (r === "lastmonth") setGranularity("week");
  };
  const periodTotals = (0, import_react3.useMemo)(() => categoryTotals(inPeriod), [inPeriod]);
  const periodSum = periodTotals.reduce((a, t) => a + t.total, 0);
  const available = periodTotals.map((t) => t.category);
  const active = selected ? selected.filter((c) => available.includes(c)) : [];
  const isAll = active.length === 0;
  const series = isAll ? available : active;
  const entries = (0, import_react3.useMemo)(
    () => isAll ? inPeriod : inPeriod.filter((e) => active.includes(e.category)),
    [inPeriod, isAll, active.join("|")]
  );
  const totals = (0, import_react3.useMemo)(() => categoryTotals(entries), [entries]);
  const shownMetric = granularity === "week" ? "spend" : metric;
  const buckets = (0, import_react3.useMemo)(
    () => shownMetric === "spend" ? bucketize(entries, granularity) : bucketize(inPeriod, granularity, incomeInPeriod),
    [shownMetric, entries, inPeriod, incomeInPeriod, granularity]
  );
  const cashback = (0, import_react3.useMemo)(() => store.rows.filter((r) => r.kind === "cashback" && inRange(r.date)).reduce((a, r) => a + r.amount, 0), [store.rows, from, to]);
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
  (0, import_react3.useEffect)(() => {
    setPage(1);
  }, [from, to, query, pageSize, active.join("|")]);
  const setOverride = async (merchant, category) => {
    const previous = store.overrides;
    setStore((s) => ({ ...s, overrides: { ...s.overrides, [merchant]: category } }));
    try {
      const r = await call("setOverride", { merchant, category });
      if (!r.ok) throw new Error(r.error);
      setStore((s) => ({ ...s, overrides: r.overrides }));
    } catch (e) {
      setStore((s) => ({ ...s, overrides: previous }));
      setNotice({ error: true, text: `\u5206\u7C7B\u4FDD\u5B58\u5931\u8D25\uFF1A${errorText(e)}` });
    }
  };
  const header = /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-head", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: "dshsp-title", children: "\u6D88\u8D39\u5206\u6790" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-sub", children: store.folder ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        "\u8D26\u5355\u6587\u4EF6\u5939 ",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { className: "dshsp-folder", title: store.folder, children: store.folder }),
        ` \xB7 ${store.files.length} \u4E2A\u6587\u4EF6 \xB7 ${store.rows.length} \u6761\u8BB0\u5F55`
      ] }) : "\u6839\u636E\u94F6\u884C\u8D26\u5355\uFF08CSV / XML\uFF09\u548C\u652F\u4ED8\u5B9D\u8D26\u5355\u751F\u6210\u6D88\u8D39\u56FE\u8868\uFF0C\u6570\u636E\u4EC5\u4FDD\u5B58\u5728\u672C\u673A\u3002" }),
      store.rate && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-rate", children: rateText(store) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Segmented,
        {
          label: "\u663E\u793A\u8D27\u5E01",
          options: CURRENCIES,
          value: store.currency,
          onChange: changeCurrency,
          isDisabled: () => busy
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        FolderControls,
        {
          folder: store.folder,
          busy,
          onPick: pickFolder,
          onSetPath: setFolderPath,
          onRefresh: () => refresh(true)
        }
      )
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
      loaded && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-empty", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SpendingIcon, { size: 40 }),
        store.folder && !store.error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u6587\u4EF6\u5939\u4E2D\u6CA1\u6709\u53EF\u8BC6\u522B\u7684\u8D26\u5355" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
            "\u628A\u94F6\u884C\u8D26\u5355\uFF08CSV \u6216 XML\uFF09\u6216\u652F\u4ED8\u5B9D\u8D26\u5355\u653E\u8FDB ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: store.folder }),
            "\uFF08\u53EF\u4EE5\u653E\u5728\u4E00\u5C42\u5B50\u6587\u4EF6\u5939\u91CC\uFF0C\u4F8B\u5982\u6309\u5E74\u4EFD\uFF09\uFF0C\u7136\u540E\u70B9\u51FB",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u5237\u65B0" }),
            "\u3002"
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u9009\u62E9\u8D26\u5355\u6587\u4EF6\u5939" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
            "\u70B9\u51FB",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u9009\u62E9\u6587\u4EF6\u5939\u2026" }),
            "\uFF0C\u9009\u62E9\u5B58\u653E\u94F6\u884C\u8D26\u5355\uFF08CSV / XML\uFF09\u7684\u6587\u4EF6\u5939\uFF0C\u4F8B\u5982 Google Drive \u6216 iCloud \u540C\u6B65\u7684\u6587\u4EF6\u5939\uFF0C \u8FD9\u6837\u5728\u6BCF\u53F0\u7535\u8111\u4E0A\u90FD\u80FD\u7528\u540C\u4E00\u4EFD\u8D26\u5355\u3002\u4EE5\u540E\u6709\u65B0\u8D26\u5355\u65F6\uFF0C\u653E\u8FDB\u8FD9\u4E2A\u6587\u4EF6\u5939\u518D\u70B9",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u5237\u65B0" }),
            "\u5373\u53EF\u3002",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
            "\u652F\u6301 Nordea \u4FE1\u7528\u5361 CSV\uFF08Nordea Gold\u2026csv\uFF09\u3001\u4FE1\u7528\u5361\u7535\u5B50\u53D1\u7968 XML\uFF08\u2026_INVOICE.xml\uFF09\u3001\u501F\u8BB0\u5361 CSV\uFF08Current Account\u2026csv\uFF09\uFF0C \u4EE5\u53CA\u652F\u4ED8\u5B9D\u8D26\u5355 CSV\uFF08Alipay\u2026csv\uFF0C\u4EBA\u6C11\u5E01\uFF0C\u53EF\u5728\u9875\u9762\u53F3\u4E0A\u89D2\u5207\u6362\u663E\u793A\u4E3A\u6B27\u5143\u6216\u4EBA\u6C11\u5E01\uFF09\uFF1B \u91CD\u53E0\u7684\u8D26\u5355\uFF08\u5305\u62EC\u540C\u4E00\u65F6\u671F\u7684 CSV \u548C XML\uFF09\u4F1A\u81EA\u52A8\u53BB\u91CD\uFF0C\u501F\u8BB0\u5361\u4E2D\u7ED9\u4FE1\u7528\u5361\u7684\u8FD8\u6B3E\u4E0D\u4F1A\u91CD\u590D\u8BA1\u5165\u652F\u51FA\u3002"
          ] })
        ] })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsp-root", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-inner", children: [
    header,
    noticeEl,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AskAiCard, { filters: { from: periodStart, to: periodEnd, categories: isAll ? [] : active, granularity, currency: store.currency } }),
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
        range === "custom" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          DateRangePicker,
          {
            from: custom.from,
            to: custom.to,
            min: earliest,
            max: latest,
            onChange: (f, t) => setCustom({ from: f, to: t })
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { className: `dshsp-num${e.spend < 0 ? " dshsp-refund" : ""}`, children: [
            money(e.spend),
            e.original && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-orig", children: money(-e.original.amount, e.original.currency) })
          ] })
        ] }, `${e.account}|${e.date}|${e.title}|${e.amount}|${i}`)) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsp-pager", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsp-more", children: "\u4FEE\u6539\u5206\u7C7B\u4F1A\u5E94\u7528\u5230\u8BE5\u5546\u6237\u7684\u6240\u6709\u4EA4\u6613\u3002\u4E5F\u53EF\u4EE5\u5728\u5BF9\u8BDD\u4E2D\u8BA9 AI \u5E2E\u4F60\u5206\u6790\u6216\u5F52\u7C7B\u6D88\u8D39\u3002" }),
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
  bindConnection(ctx);
  bindWorkspaces(ctx);
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
