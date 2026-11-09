// dsh-spending-insights v0.2.0 host half: generated from src/host by scripts/build.mjs, do not edit.

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
function daysBetween(a, b) {
  return Math.round((toDate(b) - toDate(a)) / 864e5) + 1;
}

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

// src/host/core.js
import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
function storePath(env = process.env) {
  const home = env.DSH_HOME?.trim() || join(homedir(), ".dsh");
  return join(home, "storages", "spending-insights.json");
}
async function loadSettings(file) {
  try {
    const v = JSON.parse(await readFile(file, "utf8"));
    return {
      folder: typeof v.folder === "string" && v.folder ? v.folder : null,
      overrides: v.overrides && typeof v.overrides === "object" ? sanitizeOverrides(v.overrides) : {}
    };
  } catch {
    return { folder: null, overrides: {} };
  }
}
async function saveSettings(file, settings) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(settings, null, 2)}
`);
  await rename(tmp, file);
}
function sanitizeOverrides(o) {
  const out = {};
  for (const [k, v] of Object.entries(o)) if (typeof k === "string" && k && CATEGORIES.includes(v)) out[k] = v;
  return out;
}
var MAX_DEPTH = 2;
async function listCsv(dir, depth = 0) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory() && depth + 1 < MAX_DEPTH) out.push(...await listCsv(p, depth + 1));
    else if (ent.isFile() && /\.csv$/i.test(ent.name)) out.push(p);
  }
  return out.sort();
}
async function readFolder(folder) {
  const info = await stat(folder).catch(() => void 0);
  if (!info) throw new Error(`\u6587\u4EF6\u5939\u4E0D\u5B58\u5728\uFF1A${folder}`);
  if (!info.isDirectory()) throw new Error(`\u4E0D\u662F\u6587\u4EF6\u5939\uFF1A${folder}`);
  let rows = [];
  const files = [];
  for (const path of await listCsv(folder)) {
    const name2 = relative(folder, path);
    try {
      const parsed = parseStatement(await readFile(path, "utf8"), name2);
      const m = mergeRows(rows, parsed.rows);
      rows = m.merged;
      files.push({ name: name2, account: parsed.account, rows: parsed.rows.length, added: m.added, skipped: parsed.skipped });
    } catch (e) {
      files.push({ name: name2, rows: 0, added: 0, skipped: 0, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { rows, files };
}
var round = (n) => Math.round(n * 100) / 100;
var ISO = /^\d{4}-\d{2}-\d{2}$/;
function resolveCategory(input) {
  if (typeof input !== "string") return void 0;
  const s = input.trim();
  if (CATEGORIES.includes(s)) return s;
  const byLabel = Object.entries(CATEGORY_LABELS).find(([, label]) => label === s);
  if (byLabel) return byLabel[0];
  return CATEGORIES.find((c) => c.toLowerCase() === s.toLowerCase());
}
var categoryList = () => CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABELS[c] ?? c }));
function period(rows, from, to) {
  for (const [k, v] of [["from", from], ["to", to]]) {
    if (v !== void 0 && !ISO.test(v)) throw new Error(`${k} must be a YYYY-MM-DD date`);
  }
  const dates = rows.map((r) => r.date);
  const earliest = dates.length ? dates.reduce((a, d) => d < a ? d : a) : void 0;
  const latest = dates.length ? dates.reduce((a, d) => d > a ? d : a) : void 0;
  const start = from && earliest && from > earliest ? from : from ?? earliest;
  const end = to && latest && to < latest ? to : to ?? latest;
  const within = (d) => (!from || d >= from) && (!to || d <= to);
  return { earliest, latest, start, end, within };
}
function overview(rows, overrides, opts = {}) {
  const granularity = opts.granularity ?? "month";
  const p = period(rows, opts.from, opts.to);
  const spending = spendingOf(rows, overrides).filter((e) => p.within(e.date));
  const income = incomeOf(rows).filter((e) => p.within(e.date));
  const cashback = rows.filter((r) => r.kind === "cashback" && p.within(r.date)).reduce((a, r) => a + r.amount, 0);
  const totalSpend = spending.reduce((a, e) => a + e.spend, 0);
  const totalIncome = income.reduce((a, e) => a + e.amount, 0);
  const days = p.start && p.end ? daysBetween(p.start, p.end) : 0;
  const counts = {};
  for (const e of spending) counts[e.category] = (counts[e.category] ?? 0) + 1;
  const byCategory = categoryTotals(spending).map((t) => ({
    category: t.category,
    label: CATEGORY_LABELS[t.category] ?? t.category,
    total: round(t.total),
    share: totalSpend > 0 ? round(t.total / totalSpend * 100) : 0,
    transactions: counts[t.category]
  }));
  const trend = bucketize(spending, granularity, income).map((b) => ({
    period: bucketLabel(b.start, granularity),
    start: b.start,
    spending: round(b.total),
    income: round(b.income ?? 0),
    byCategory: Object.fromEntries(Object.entries(b.byCategory).filter(([, v]) => v !== 0).map(([k, v]) => [k, round(v)]))
  }));
  const merchants = /* @__PURE__ */ new Map();
  for (const e of spending) {
    const m = merchants.get(e.merchant) ?? { merchant: e.merchant, category: e.category, total: 0, transactions: 0 };
    m.total += e.spend;
    m.transactions++;
    merchants.set(e.merchant, m);
  }
  const ranked = [...merchants.values()].map((m) => ({ ...m, total: round(m.total) })).sort((a, b) => b.total - a.total);
  return {
    currency: "EUR",
    dataCoverage: { earliest: p.earliest ?? null, latest: p.latest ?? null },
    period: { from: p.start ?? null, to: p.end ?? null, days },
    totals: {
      spending: round(totalSpend),
      income: round(totalIncome),
      surplus: round(totalIncome - totalSpend),
      cashback: round(cashback),
      spendingTransactions: spending.length,
      perMonthSpending: days ? round(totalSpend / days * 30.44) : 0
    },
    byCategory,
    trend: { granularity, buckets: trend },
    topMerchants: ranked.slice(0, 15),
    uncategorizedMerchants: ranked.filter((m) => m.category === "Other").slice(0, 30),
    categories: categoryList(),
    notes: "Spending excludes card repayments and cashback; merchant refunds count as negative spending. Income is debit-account deposits from payers you never paid. Amounts are EUR."
  };
}
function transactions(rows, overrides, opts = {}) {
  const p = period(rows, opts.from, opts.to);
  const type = opts.type ?? "spending";
  let category;
  if (opts.category !== void 0) {
    category = resolveCategory(opts.category);
    if (!category) throw new Error(`unknown category "${opts.category}"; use one of: ${CATEGORIES.join(", ")}`);
  }
  const q = opts.merchant?.trim().toLowerCase();
  const limit = Math.max(1, Math.min(500, Math.floor(opts.limit ?? 50)));
  const list = type === "income" ? incomeOf(rows).map((r) => ({ ...r, value: r.amount, category: "Income" })) : spendingOf(rows, overrides).map((e) => ({ ...e, value: e.spend }));
  const matched = list.filter((e) => p.within(e.date) && (!category || e.category === category) && (!q || e.merchant.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)));
  matched.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  return {
    type,
    matched: matched.length,
    total: round(matched.reduce((a, e) => a + e.value, 0)),
    returned: Math.min(limit, matched.length),
    transactions: matched.slice(0, limit).map((e) => ({
      date: e.date,
      merchant: e.merchant,
      category: e.category,
      account: e.account ?? "credit",
      amount: round(e.value),
      title: e.title
    }))
  };
}
function merchantNames(rows) {
  return [...new Set(rows.map((r) => r.merchant))];
}

// src/host/index.js
import { stat as stat2 } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { homedir as homedir2 } from "node:os";
var name = "dsh-spending-insights";
var SERVICE = "spendingInsights";
var REMOTE_METHODS = "@deepseek-ai/dsh-typert-protocol/remote-methods";
var expandHome = (p) => p === "~" ? homedir2() : p.startsWith("~/") ? resolve(homedir2(), p.slice(2)) : p;
var SpendingInsights = class {
  constructor(ctx, file) {
    this.ctx = ctx;
    this.file = file;
    this.picker = void 0;
    this.tail = Promise.resolve();
    this.typertRemote = Object.freeze({ service: this, serviceKey: SERVICE, namespace: SERVICE });
  }
  settings() {
    return loadSettings(this.file);
  }
  mutate(fn) {
    const run = this.tail.then(async () => {
      const next = await fn(await loadSettings(this.file));
      await saveSettings(this.file, next);
      return next;
    });
    this.tail = run.catch(() => {
    });
    return run;
  }
  /** Statements and settings; `error` explains an unreadable folder. */
  async load() {
    const { folder, overrides } = await this.settings();
    if (!folder) return { folder: null, overrides, rows: [], files: [], readAt: Date.now() };
    try {
      const { rows, files } = await readFolder(folder);
      return { folder, overrides, rows, files, readAt: Date.now() };
    } catch (e) {
      return { folder, overrides, rows: [], files: [], readAt: Date.now(), error: e instanceof Error ? e.message : String(e) };
    }
  }
  // ---- Remote methods (widget) --------------------------------------------
  async state() {
    return this.load();
  }
  /** Open the host's native folder chooser; `supported: false` when this host has none. */
  async pickFolder(signal) {
    const pick = this.picker?.pick;
    if (typeof pick !== "function") return { supported: false, folder: null };
    const folder = await pick.call(this.picker, signal);
    if (!folder) return { supported: true, folder: null };
    await this.mutate((s) => ({ ...s, folder }));
    return { supported: true, folder };
  }
  async setFolder(folder) {
    if (typeof folder !== "string" || !folder.trim()) return { ok: false, error: "\u8BF7\u8F93\u5165\u6587\u4EF6\u5939\u8DEF\u5F84\u3002" };
    const path = expandHome(folder.trim());
    if (!isAbsolute(path)) return { ok: false, error: "\u8BF7\u8F93\u5165\u7EDD\u5BF9\u8DEF\u5F84\uFF0C\u4F8B\u5982 ~/Documents/\u8D26\u5355 \u6216 /Users/\u2026/\u8D26\u5355\u3002" };
    const info = await stat2(path).catch(() => void 0);
    if (!info?.isDirectory()) return { ok: false, error: `\u627E\u4E0D\u5230\u6587\u4EF6\u5939\uFF1A${path}` };
    await this.mutate((s) => ({ ...s, folder: path }));
    return { ok: true, folder: path };
  }
  /** `category: null` returns the merchant to its rule-based category. */
  async setOverride(merchant, category) {
    if (typeof merchant !== "string" || !merchant) return { ok: false, error: "merchant required" };
    if (category !== null && !CATEGORIES.includes(category)) return { ok: false, error: `unknown category ${category}` };
    const next = await this.mutate((s) => {
      const overrides = { ...s.overrides };
      if (category === null) delete overrides[merchant];
      else overrides[merchant] = category;
      return { ...s, overrides };
    });
    return { ok: true, overrides: next.overrides };
  }
  /** One-time migration of category edits kept in the widget's localStorage by v0.1. */
  async importOverrides(overrides) {
    const incoming = sanitizeOverrides(overrides && typeof overrides === "object" ? overrides : {});
    const next = await this.mutate((s) => ({ ...s, overrides: { ...incoming, ...s.overrides } }));
    return { ok: true, overrides: next.overrides };
  }
};
Object.defineProperty(SpendingInsights.prototype, REMOTE_METHODS, {
  configurable: true,
  value: Object.freeze({
    version: 1,
    methods: Object.freeze(["state", "pickFolder", "setFolder", "setOverride", "importOverrides"].map((method) => Object.freeze({ method, invocation: Object.freeze({ kind: "direct" }) })))
  })
});
var DATE = { type: "string" };
var CATEGORY_HELP = CATEGORIES.map((c) => `${c} (${CATEGORY_LABELS[c]})`).join(", ");
var json = (value) => [{ type: "text", text: JSON.stringify(value) }];
function tool(def) {
  return {
    ...def,
    output: { schema: { type: "object" }, render: (_args, value) => json(value) }
  };
}
async function dataOrHint(service) {
  const data = await service.load();
  if (!data.folder) return { hint: "No statements folder is set. Ask the user to open \u6D88\u8D39\u5206\u6790 in the sidebar and choose the folder that holds their bank statement CSV files." };
  if (data.error) return { hint: `The statements folder could not be read: ${data.error}` };
  if (data.rows.length === 0) return { hint: `The statements folder (${data.folder}) contains no readable CSV statements.` };
  return { data };
}
function tools(service) {
  return [
    tool({
      name: "spending_overview",
      description: `Summarise the user's personal spending and income from their bank statements (the \u6D88\u8D39\u5206\u6790 / Spending Insights plugin): totals, spending per category with shares, a spending/income trend per week, month or year, top merchants and merchants still in the "Other" category. Use it for questions about how much they spend, where their money goes, or how spending changes over time. Dates are YYYY-MM-DD; omit them for all data. Amounts are EUR.`,
      parameters: {
        type: "object",
        properties: {
          from: { ...DATE, description: "First day to include (inclusive)." },
          to: { ...DATE, description: "Last day to include (inclusive)." },
          granularity: { type: "string", enum: ["week", "month", "year"], description: "Trend bucket size. Default month." }
        }
      },
      isConcurrencySafe: () => true,
      async execute(args) {
        const { data, hint } = await dataOrHint(service);
        if (hint) return { error: hint };
        return { folder: data.folder, statementFiles: data.files.length, ...overview(data.rows, data.overrides, args) };
      }
    }),
    tool({
      name: "spending_transactions",
      description: `List individual bank statement transactions (newest first) from the Spending Insights plugin, filtered by date range, category and/or merchant text. type "spending" (default) lists purchases (positive) and refunds (negative); "income" lists deposits. Categories: ${CATEGORY_HELP}.`,
      parameters: {
        type: "object",
        properties: {
          from: { ...DATE, description: "First day to include (inclusive)." },
          to: { ...DATE, description: "Last day to include (inclusive)." },
          category: { type: "string", description: "Category key or Chinese label (spending only)." },
          merchant: { type: "string", description: "Case-insensitive text to match in the merchant name or statement title." },
          type: { type: "string", enum: ["spending", "income"] },
          limit: { type: "integer", description: "Maximum rows to return, 1\u2013500. Default 50." }
        }
      },
      isConcurrencySafe: () => true,
      async execute(args) {
        const { data, hint } = await dataOrHint(service);
        if (hint) return { error: hint };
        try {
          return transactions(data.rows, data.overrides, args);
        } catch (e) {
          return { error: e instanceof Error ? e.message : String(e) };
        }
      }
    }),
    tool({
      name: "spending_set_category",
      description: `Recategorise a merchant in the Spending Insights plugin. Applies to every transaction of that merchant, now and in future statements, and the \u6D88\u8D39\u5206\u6790 charts update on refresh. Use the exact merchant name from spending_overview or spending_transactions. Pass category "auto" to undo a manual choice. Categories: ${CATEGORY_HELP}.`,
      parameters: {
        type: "object",
        properties: {
          merchant: { type: "string", description: "Exact merchant name as shown in the tool results." },
          category: { type: "string", description: 'Category key, its Chinese label, or "auto".' }
        },
        required: ["merchant", "category"]
      },
      async execute(args) {
        const { data, hint } = await dataOrHint(service);
        if (hint) return { error: hint };
        const names = merchantNames(data.rows);
        const merchant = names.find((n) => n === args.merchant) ?? names.find((n) => n.toLowerCase() === args.merchant.toLowerCase());
        if (!merchant) {
          const q = args.merchant.toLowerCase();
          return { error: `No merchant named "${args.merchant}".`, similar: names.filter((n) => n.toLowerCase().includes(q) || q.includes(n.toLowerCase())).slice(0, 10) };
        }
        const auto = args.category.trim().toLowerCase() === "auto";
        const category = auto ? null : resolveCategory(args.category);
        if (!auto && !category) return { error: `Unknown category "${args.category}".`, categories: categoryList() };
        await service.setOverride(merchant, category);
        const atMerchant = data.rows.filter((r) => r.merchant === merchant);
        return {
          ok: true,
          merchant,
          category: category ?? "auto (rule-based)",
          transactionsAffected: atMerchant.length
        };
      }
    })
  ];
}
function apply(ctx) {
  const service = new SpendingInsights(ctx, storePath());
  ctx.reflect.provide(SERVICE, service);
  ctx.inject(["tools"], (c) => {
    for (const t of tools(service)) c.tools.register(t);
  });
  ctx.inject(["directoryPicker"], (c) => {
    c.effect(() => {
      service.picker = c.directoryPicker;
      return () => {
        service.picker = void 0;
      };
    }, "spending-insights: directory picker");
  });
}
export {
  apply,
  name
};
