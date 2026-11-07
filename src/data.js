// Pure data layer: CSV parsing, categorisation, filtering and time bucketing.
// No React, no DOM — unit-tested in test/data.test.js.

/** Fixed category order: index = colour slot, so a colour always follows its category. */
export const CATEGORIES = [
  'Groceries',
  'Restaurants & cafés',
  'Transport & car',
  'Subscriptions',
  'Health & fitness',
  'Shopping',
  'Pets',
  'Other',
]

const RULES = [
  ['Groceries', /prisma|lidl|k-?citymarket|k-?supermarket|k-?market|s-?market|alepa|asian market|gc market|supermarket|sun market|dajiangyou|tokyokan|hakaniemen|food ?market|ruoka/i],
  ['Restaurants & cafés', /wolt|foodora|espresso house|starbucks|robert'?s coffee|cafe|café|coffee|kahvila|ravintola|restaurant|mcdonald|burger|hesburger|pizza|sushi|kebab|bar /i],
  ['Transport & car', /moovy|aimo|europark|easypark|parking|pysäk|neste|st1|teboil|abc |shell|virta|ev ?charg|recharge|epass24|hsl|vr-|vr |taxi|uber|bolt|finnair|ryanair|sas /i],
  ['Subscriptions', /youtube|google|openai|chatgpt|anthropic|claude\.ai|apple\.com|icloud|amazon digi|prime video|netflix|spotify|disney|hbo|telia|elisa|dna oy|microsoft|github/i],
  ['Health & fitness', /sats|elixia|apteekki|pharmacy|epassi|smartum|uifin|gym|fitness|terveys|mehiläinen|terveystalo|lääkäri|hammas/i],
  ['Shopping', /muji|biltema|ikea|clas ohlson|tokmanni|gigantti|verkkokauppa|power |h&m|zara|zalando|amazon|stockmann|sokos|motonet|xxl|intersport|halpa-halli/i],
  ['Pets', /musti|mirri|pet ?shop|eläin/i],
]

/** Category for a merchant name from the keyword rules (overrides are applied separately). */
export function categorize(merchant) {
  for (const [category, re] of RULES) if (re.test(merchant)) return category
  return 'Other'
}

/** Split one `;`-separated line, honouring double quotes. */
function splitLine(line, sep) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === sep) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out.map(s => s.trim())
}

/** "3.11.2026" or "2026-11-03" or "03/11/2026" → "2026-11-03". */
export function parseDate(s) {
  let m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  return undefined
}

/** "-26.29", "-26,29", "1 420,05", "1,420.05" → number. */
export function parseAmount(s) {
  let t = s.replace(/[\s ]/g, '')
  if (t.includes(',') && t.includes('.')) {
    t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '')
  } else t = t.replace(',', '.')
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

/**
 * "Retail FIN Espoo Prisma Iso Omena" → "Prisma Iso Omena";
 * "USD 5,90 Retail USA SEATTLE AMAZON DIGI* 5" → "AMAZON DIGI* 5".
 */
export function merchantOf(title) {
  let t = title.replace(/^[A-Z]{3} [\d.,]+ /, '')
  const m = /^(Retail|Credit|Debit|Purchase|Refund)\s+([A-Z]{3})\s+(\S+)\s+(.+)$/.exec(t)
  if (m) t = m[4]
  return t.trim()
}

/** What a statement row means for spending. */
export function kindOf(title, amount) {
  if (/^payment\b/i.test(title)) return 'payment' // paying off the card: not spending
  if (/cashback/i.test(title)) return 'cashback'
  return amount < 0 ? 'purchase' : 'refund'
}

const HEADER_ALIASES = {
  date: ['transaction date', 'booking date', 'date', 'kirjauspäivä', 'tapahtumapäivä'],
  title: ['title', 'description', 'name', 'otsikko', 'saaja/maksaja', 'payee'],
  amount: ['amount', 'summa', 'määrä'],
  currency: ['currency', 'valuutta'],
}

/**
 * Parse a bank statement CSV (Nordea export format; tolerant of similar ones).
 * @returns {{ rows: Array<{date:string,title:string,merchant:string,amount:number,currency:string,kind:string}>, skipped: number }}
 */
export function parseStatement(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length === 0) throw new Error('The file is empty.')
  const sep = (lines[0].match(/;/g) ?? []).length >= (lines[0].match(/,/g) ?? []).length ? ';' : ','
  const header = splitLine(lines[0], sep).map(h => h.toLowerCase())
  const col = {}
  for (const [key, names] of Object.entries(HEADER_ALIASES)) {
    col[key] = names.map(n => header.indexOf(n)).find(i => i >= 0)
  }
  if (col.date === undefined || col.title === undefined || col.amount === undefined) {
    throw new Error('Could not find the date, title and amount columns in this CSV.')
  }
  const rows = []
  let skipped = 0
  for (const line of lines.slice(1)) {
    const f = splitLine(line, sep)
    const date = parseDate(f[col.date] ?? '')
    const amount = parseAmount(f[col.amount] ?? '')
    const title = f[col.title] ?? ''
    if (!date || amount === undefined || !title) { skipped++; continue }
    rows.push({
      date,
      title,
      merchant: merchantOf(title),
      amount,
      currency: (col.currency !== undefined && f[col.currency]) || 'EUR',
      kind: kindOf(title, amount),
    })
  }
  return { rows, skipped }
}

const rowKey = r => `${r.date}|${r.title}|${r.amount}`

/**
 * Merge newly imported rows into the stored ones. Identical rows (same date,
 * title, amount) are counted per file, so re-importing an overlapping
 * statement adds nothing while two genuinely identical purchases survive.
 * @returns {{ merged: Array, added: number }}
 */
export function mergeRows(existing, incoming) {
  const have = new Map()
  for (const r of existing) have.set(rowKey(r), (have.get(rowKey(r)) ?? 0) + 1)
  const seen = new Map()
  const merged = [...existing]
  let added = 0
  for (const r of incoming) {
    const k = rowKey(r)
    const n = (seen.get(k) ?? 0) + 1
    seen.set(k, n)
    if (n > (have.get(k) ?? 0)) { merged.push(r); added++ }
  }
  merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return { merged, added }
}

/**
 * Spending entries: purchases count positive, merchant refunds negative.
 * Card payments and cashback are excluded.
 */
export function spendingOf(rows, overrides) {
  const out = []
  for (const r of rows) {
    if (r.kind !== 'purchase' && r.kind !== 'refund') continue
    out.push({
      ...r,
      spend: -r.amount,
      category: overrides[r.merchant] ?? categorize(r.merchant),
    })
  }
  return out
}

// ---- dates -----------------------------------------------------------------

const toDate = iso => new Date(`${iso}T00:00:00Z`)
const toIso = d => d.toISOString().slice(0, 10)

/** Monday of the ISO week containing `iso`. */
function weekStart(iso) {
  const d = toDate(iso)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return toIso(d)
}

function isoWeekNumber(iso) {
  const d = toDate(iso)
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7)) // Thursday of this week
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7)
}

/** Bucket start date for a granularity. */
export function bucketOf(iso, granularity) {
  if (granularity === 'week') return weekStart(iso)
  if (granularity === 'month') return `${iso.slice(0, 7)}-01`
  return `${iso.slice(0, 4)}-01-01`
}

function nextBucket(start, granularity) {
  const d = toDate(start)
  if (granularity === 'week') d.setUTCDate(d.getUTCDate() + 7)
  else if (granularity === 'month') d.setUTCMonth(d.getUTCMonth() + 1)
  else d.setUTCFullYear(d.getUTCFullYear() + 1)
  return toIso(d)
}

export function bucketLabel(start, granularity) {
  const [y, m, day] = start.split('-')
  if (granularity === 'year') return `${y}年`
  if (granularity === 'month') return `${y}年${Number(m)}月`
  return `第${isoWeekNumber(start)}周 · ${Number(m)}月${Number(day)}日起`
}

export function bucketShortLabel(start, granularity) {
  const [y, m, day] = start.split('-')
  if (granularity === 'year') return `${y}年`
  if (granularity === 'month') return Number(m) === 1 ? `${y.slice(2)}年1月` : `${Number(m)}月`
  return `${Number(m)}/${Number(day)}`
}

/**
 * Continuous series of buckets (empty periods included) from the earliest to
 * the latest entry, each with per-category totals.
 */
export function bucketize(entries, granularity) {
  if (entries.length === 0) return []
  let min = entries[0].date
  let max = entries[0].date
  for (const e of entries) { if (e.date < min) min = e.date; if (e.date > max) max = e.date }
  const buckets = []
  const index = new Map()
  for (let s = bucketOf(min, granularity); s <= max; s = nextBucket(s, granularity)) {
    const b = { start: s, total: 0, byCategory: Object.fromEntries(CATEGORIES.map(c => [c, 0])) }
    index.set(s, b)
    buckets.push(b)
  }
  for (const e of entries) {
    const b = index.get(bucketOf(e.date, granularity))
    b.total += e.spend
    b.byCategory[e.category] += e.spend
  }
  return buckets
}

/** Category totals, largest first, zero/negative totals dropped. */
export function categoryTotals(entries) {
  const totals = Object.fromEntries(CATEGORIES.map(c => [c, 0]))
  for (const e of entries) totals[e.category] += e.spend
  return CATEGORIES.map(c => ({ category: c, total: totals[c] }))
    .filter(x => x.total > 0.005)
    .sort((a, b) => b.total - a.total)
}

/** Earliest date included by a range preset, relative to the latest data date. */
export function rangeStart(range, latestIso) {
  if (range === 'all' || !latestIso) return undefined
  if (range === 'ytd') return `${latestIso.slice(0, 4)}-01-01`
  const months = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const [y, m, day] = latestIso.split('-').map(Number)
  // Same day N months earlier, clamped to that month's length (May 31 − 3m → Feb 28), then +1 day.
  const lastDay = new Date(Date.UTC(y, m - 1 - months + 1, 0)).getUTCDate()
  const d = new Date(Date.UTC(y, m - 1 - months, Math.min(day, lastDay)))
  d.setUTCDate(d.getUTCDate() + 1)
  return toIso(d)
}

/** True when a range preset includes every entry (it would show the same as "all"). */
export function rangeCoversAll(range, earliestIso, latestIso) {
  const from = rangeStart(range, latestIso)
  return !from || !earliestIso || from <= earliestIso
}

export function daysBetween(a, b) {
  return Math.round((toDate(b) - toDate(a)) / 86400000) + 1
}
