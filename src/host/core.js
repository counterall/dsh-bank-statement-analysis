// Host-side core: the statements folder, the persisted settings, and the
// analyses behind the agent tools. Node only (fs), no DSH imports, so it is
// unit-tested directly in test/host.test.js.
import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import {
  CATEGORIES, bucketize, bucketLabel, categoryTotals, daysBetween, incomeOf, mergeRows, parseStatementFile, spendingOf,
} from '../data.js'
import { CATEGORY_LABELS } from '../i18n.js'

// ---- settings --------------------------------------------------------------

/** `$DSH_HOME/storages/spending-insights.json`, next to DSH's own storages. */
export function storePath(env = process.env) {
  const home = env.DSH_HOME?.trim() || join(homedir(), '.dsh')
  return join(home, 'storages', 'spending-insights.json')
}

export async function loadSettings(file) {
  try {
    const v = JSON.parse(await readFile(file, 'utf8'))
    return {
      folder: typeof v.folder === 'string' && v.folder ? v.folder : null,
      overrides: v.overrides && typeof v.overrides === 'object' ? sanitizeOverrides(v.overrides) : {},
    }
  } catch {
    return { folder: null, overrides: {} }
  }
}

export async function saveSettings(file, settings) {
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  await writeFile(tmp, `${JSON.stringify(settings, null, 2)}\n`)
  await rename(tmp, file)
}

export function sanitizeOverrides(o) {
  const out = {}
  for (const [k, v] of Object.entries(o)) if (typeof k === 'string' && k && CATEGORIES.includes(v)) out[k] = v
  return out
}

// ---- statements folder -----------------------------------------------------

/** Text of a statement file: UTF-8, unless an XML prolog declares another charset (Finvoice uses ISO-8859-1). */
export function decode(buf) {
  const declared = /^\s*<\?xml[^>]*encoding=["']([\w.-]+)["']/i.exec(buf.subarray(0, 200).toString('latin1'))?.[1]
  if (declared && !/^utf-?8$/i.test(declared)) {
    try { return new TextDecoder(declared).decode(buf) } catch { /* unknown label: fall back to UTF-8 */ }
  }
  return buf.toString('utf8')
}

const MAX_DEPTH = 2 // the folder itself plus one level of subfolders (e.g. one per year)

/** Statement files: CSV exports and Finvoice XML invoices. */
export const STATEMENT_FILE = /\.(csv|xml)$/i

async function listStatements(dir, depth = 0) {
  const out = []
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue
    const p = join(dir, ent.name)
    if (ent.isDirectory() && depth + 1 < MAX_DEPTH) out.push(...await listStatements(p, depth + 1))
    else if (ent.isFile() && STATEMENT_FILE.test(ent.name)) out.push(p)
  }
  return out.sort()
}

/**
 * Read every statement (CSV or Finvoice XML) in `folder` and merge them (overlapping statements
 * are de-duplicated). A file that fails to parse is reported, not fatal.
 * @returns {Promise<{ rows: Array, files: Array<{name:string,account?:string,rows:number,added:number,skipped:number,error?:string}> }>}
 */
export async function readFolder(folder) {
  const info = await stat(folder).catch(() => undefined)
  if (!info) throw new Error(`文件夹不存在：${folder}`)
  if (!info.isDirectory()) throw new Error(`不是文件夹：${folder}`)
  let rows = []
  const files = []
  for (const path of await listStatements(folder)) {
    const name = relative(folder, path)
    try {
      const parsed = parseStatementFile(decode(await readFile(path)), name)
      const m = mergeRows(rows, parsed.rows)
      rows = m.merged
      files.push({ name, account: parsed.account, rows: parsed.rows.length, added: m.added, skipped: parsed.skipped })
    } catch (e) {
      files.push({ name, rows: 0, added: 0, skipped: 0, error: e instanceof Error ? e.message : String(e) })
    }
  }
  return { rows, files }
}

// ---- analyses for the agent tools -----------------------------------------

const round = n => Math.round(n * 100) / 100
const ISO = /^\d{4}-\d{2}-\d{2}$/

/** Accept an English key, a Chinese label, or a case-insensitive key. */
export function resolveCategory(input) {
  if (typeof input !== 'string') return undefined
  const s = input.trim()
  if (CATEGORIES.includes(s)) return s
  const byLabel = Object.entries(CATEGORY_LABELS).find(([, label]) => label === s)
  if (byLabel) return byLabel[0]
  return CATEGORIES.find(c => c.toLowerCase() === s.toLowerCase())
}

export const categoryList = () => CATEGORIES.map(c => ({ key: c, label: CATEGORY_LABELS[c] ?? c }))

function period(rows, from, to) {
  for (const [k, v] of [['from', from], ['to', to]]) {
    if (v !== undefined && !ISO.test(v)) throw new Error(`${k} must be a YYYY-MM-DD date`)
  }
  const dates = rows.map(r => r.date)
  const earliest = dates.length ? dates.reduce((a, d) => (d < a ? d : a)) : undefined
  const latest = dates.length ? dates.reduce((a, d) => (d > a ? d : a)) : undefined
  const start = from && earliest && from > earliest ? from : (from ?? earliest)
  const end = to && latest && to < latest ? to : (to ?? latest)
  const within = d => (!from || d >= from) && (!to || d <= to)
  return { earliest, latest, start, end, within }
}

/**
 * Totals, category split, trend and notable merchants for a period.
 * @param {{from?:string,to?:string,granularity?:'week'|'month'|'year'}} opts
 */
export function overview(rows, overrides, opts = {}) {
  const granularity = opts.granularity ?? 'month'
  const p = period(rows, opts.from, opts.to)
  const spending = spendingOf(rows, overrides).filter(e => p.within(e.date))
  const income = incomeOf(rows).filter(e => p.within(e.date))
  const cashback = rows.filter(r => r.kind === 'cashback' && p.within(r.date)).reduce((a, r) => a + r.amount, 0)
  const totalSpend = spending.reduce((a, e) => a + e.spend, 0)
  const totalIncome = income.reduce((a, e) => a + e.amount, 0)
  const days = p.start && p.end ? daysBetween(p.start, p.end) : 0

  const counts = {}
  for (const e of spending) counts[e.category] = (counts[e.category] ?? 0) + 1
  const byCategory = categoryTotals(spending).map(t => ({
    category: t.category,
    label: CATEGORY_LABELS[t.category] ?? t.category,
    total: round(t.total),
    share: totalSpend > 0 ? round((t.total / totalSpend) * 100) : 0,
    transactions: counts[t.category],
  }))

  const trend = bucketize(spending, granularity, income).map(b => ({
    period: bucketLabel(b.start, granularity),
    start: b.start,
    spending: round(b.total),
    income: round(b.income ?? 0),
    byCategory: Object.fromEntries(Object.entries(b.byCategory).filter(([, v]) => v !== 0).map(([k, v]) => [k, round(v)])),
  }))

  const merchants = new Map()
  for (const e of spending) {
    const m = merchants.get(e.merchant) ?? { merchant: e.merchant, category: e.category, total: 0, transactions: 0 }
    m.total += e.spend
    m.transactions++
    merchants.set(e.merchant, m)
  }
  const ranked = [...merchants.values()].map(m => ({ ...m, total: round(m.total) })).sort((a, b) => b.total - a.total)

  return {
    currency: 'EUR',
    dataCoverage: { earliest: p.earliest ?? null, latest: p.latest ?? null },
    period: { from: p.start ?? null, to: p.end ?? null, days },
    totals: {
      spending: round(totalSpend),
      income: round(totalIncome),
      surplus: round(totalIncome - totalSpend),
      cashback: round(cashback),
      spendingTransactions: spending.length,
      perMonthSpending: days ? round((totalSpend / days) * 30.44) : 0,
    },
    byCategory,
    trend: { granularity, buckets: trend },
    topMerchants: ranked.slice(0, 15),
    uncategorizedMerchants: ranked.filter(m => m.category === 'Other').slice(0, 30),
    categories: categoryList(),
    notes: 'Spending excludes card repayments and cashback; merchant refunds count as negative spending. '
      + 'Income is debit-account deposits from payers you never paid. Amounts are EUR.',
  }
}

/**
 * Individual transactions, newest first.
 * @param {{from?:string,to?:string,category?:string,merchant?:string,type?:'spending'|'income',limit?:number}} opts
 */
export function transactions(rows, overrides, opts = {}) {
  const p = period(rows, opts.from, opts.to)
  const type = opts.type ?? 'spending'
  let category
  if (opts.category !== undefined) {
    category = resolveCategory(opts.category)
    if (!category) throw new Error(`unknown category "${opts.category}"; use one of: ${CATEGORIES.join(', ')}`)
  }
  const q = opts.merchant?.trim().toLowerCase()
  const limit = Math.max(1, Math.min(500, Math.floor(opts.limit ?? 50)))
  const list = type === 'income'
    ? incomeOf(rows).map(r => ({ ...r, value: r.amount, category: 'Income' }))
    : spendingOf(rows, overrides).map(e => ({ ...e, value: e.spend }))
  const matched = list.filter(e => p.within(e.date)
    && (!category || e.category === category)
    && (!q || e.merchant.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)))
  matched.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return {
    type,
    matched: matched.length,
    total: round(matched.reduce((a, e) => a + e.value, 0)),
    returned: Math.min(limit, matched.length),
    transactions: matched.slice(0, limit).map(e => ({
      date: e.date,
      merchant: e.merchant,
      category: e.category,
      account: e.account ?? 'credit',
      amount: round(e.value),
      title: e.title,
    })),
  }
}

/** Every distinct merchant name, for matching what the user (or the model) typed. */
export function merchantNames(rows) {
  return [...new Set(rows.map(r => r.merchant))]
}
