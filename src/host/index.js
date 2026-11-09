// Host half of dsh-spending-insights (bundled into lib/index.js).
//
// 1. A `spendingInsights` Remote service the widget calls over the Client
//    connection: it reads the statements folder and keeps the folder path and
//    per-merchant category overrides in $DSH_HOME/storages.
// 2. Agent tools, so any chat can query the same data and recategorise merchants.
//
// No @deepseek-ai/* imports: the package is installed outside the app's module
// tree. The Remote binding below is the same metadata `TypertRemoteService` and
// `@Remote` from dsh-typert-protocol produce, served through the API Gateway's
// source (SRC) dispatch — parameter names are read from the method source, so
// keep them plain identifiers and do not minify this bundle.
import { CATEGORIES } from '../data.js'
import { CATEGORY_LABELS } from '../i18n.js'
import {
  categoryList, loadSettings, merchantNames, overview, readFolder, resolveCategory, sanitizeOverrides, saveSettings,
  storePath, transactions,
} from './core.js'
import { stat } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { homedir } from 'node:os'

export const name = 'dsh-spending-insights'

const SERVICE = 'spendingInsights'
const REMOTE_METHODS = '@deepseek-ai/dsh-typert-protocol/remote-methods'

const expandHome = p => (p === '~' ? homedir() : p.startsWith('~/') ? resolve(homedir(), p.slice(2)) : p)

class SpendingInsights {
  constructor(ctx, file) {
    this.ctx = ctx
    this.file = file
    this.picker = undefined
    this.tail = Promise.resolve() // serialises settings writes (widget and agent may race)
    this.typertRemote = Object.freeze({ service: this, serviceKey: SERVICE, namespace: SERVICE })
  }

  settings() {
    return loadSettings(this.file)
  }

  mutate(fn) {
    const run = this.tail.then(async () => {
      const next = await fn(await loadSettings(this.file))
      await saveSettings(this.file, next)
      return next
    })
    this.tail = run.catch(() => {})
    return run
  }

  /** Statements and settings; `error` explains an unreadable folder. */
  async load() {
    const { folder, overrides } = await this.settings()
    if (!folder) return { folder: null, overrides, rows: [], files: [], readAt: Date.now() }
    try {
      const { rows, files } = await readFolder(folder)
      return { folder, overrides, rows, files, readAt: Date.now() }
    } catch (e) {
      return { folder, overrides, rows: [], files: [], readAt: Date.now(), error: e instanceof Error ? e.message : String(e) }
    }
  }

  // ---- Remote methods (widget) --------------------------------------------

  async state() {
    return this.load()
  }

  /** Open the host's native folder chooser; `supported: false` when this host has none. */
  async pickFolder(signal) {
    const pick = this.picker?.pick
    if (typeof pick !== 'function') return { supported: false, folder: null }
    const folder = await pick.call(this.picker, signal)
    if (!folder) return { supported: true, folder: null }
    await this.mutate(s => ({ ...s, folder }))
    return { supported: true, folder }
  }

  async setFolder(folder) {
    if (typeof folder !== 'string' || !folder.trim()) return { ok: false, error: '请输入文件夹路径。' }
    const path = expandHome(folder.trim())
    if (!isAbsolute(path)) return { ok: false, error: '请输入绝对路径，例如 ~/Documents/账单 或 /Users/…/账单。' }
    const info = await stat(path).catch(() => undefined)
    if (!info?.isDirectory()) return { ok: false, error: `找不到文件夹：${path}` }
    await this.mutate(s => ({ ...s, folder: path }))
    return { ok: true, folder: path }
  }

  /** `category: null` returns the merchant to its rule-based category. */
  async setOverride(merchant, category) {
    if (typeof merchant !== 'string' || !merchant) return { ok: false, error: 'merchant required' }
    if (category !== null && !CATEGORIES.includes(category)) return { ok: false, error: `unknown category ${category}` }
    const next = await this.mutate(s => {
      const overrides = { ...s.overrides }
      if (category === null) delete overrides[merchant]
      else overrides[merchant] = category
      return { ...s, overrides }
    })
    return { ok: true, overrides: next.overrides }
  }

  /** One-time migration of category edits kept in the widget's localStorage by v0.1. */
  async importOverrides(overrides) {
    const incoming = sanitizeOverrides(overrides && typeof overrides === 'object' ? overrides : {})
    const next = await this.mutate(s => ({ ...s, overrides: { ...incoming, ...s.overrides } }))
    return { ok: true, overrides: next.overrides }
  }
}

// Same descriptor `@Remote` writes on the class prototype (version 1).
Object.defineProperty(SpendingInsights.prototype, REMOTE_METHODS, {
  configurable: true,
  value: Object.freeze({
    version: 1,
    methods: Object.freeze(['state', 'pickFolder', 'setFolder', 'setOverride', 'importOverrides']
      .map(method => Object.freeze({ method, invocation: Object.freeze({ kind: 'direct' }) }))),
  }),
})

// ---- agent tools -----------------------------------------------------------

const DATE = { type: 'string' }
const CATEGORY_HELP = CATEGORIES.map(c => `${c} (${CATEGORY_LABELS[c]})`).join(', ')
const json = value => [{ type: 'text', text: JSON.stringify(value) }]

function tool(def) {
  return {
    ...def,
    output: { schema: { type: 'object' }, render: (_args, value) => json(value) },
  }
}

async function dataOrHint(service) {
  const data = await service.load()
  if (!data.folder) return { hint: 'No statements folder is set. Ask the user to open 消费分析 in the sidebar and choose the folder that holds their bank statement files (Nordea CSV exports or Finvoice XML invoices).' }
  if (data.error) return { hint: `The statements folder could not be read: ${data.error}` }
  if (data.rows.length === 0) return { hint: `The statements folder (${data.folder}) contains no readable statements (CSV or XML).` }
  return { data }
}

function tools(service) {
  return [
    tool({
      name: 'spending_overview',
      description: 'Summarise the user\'s personal spending and income from their bank statements (the 消费分析 / Spending Insights plugin): '
        + 'totals, spending per category with shares, a spending/income trend per week, month or year, top merchants and '
        + 'merchants still in the "Other" category. Use it for questions about how much they spend, where their money goes, '
        + 'or how spending changes over time. Dates are YYYY-MM-DD; omit them for all data. Amounts are EUR.',
      parameters: {
        type: 'object',
        properties: {
          from: { ...DATE, description: 'First day to include (inclusive).' },
          to: { ...DATE, description: 'Last day to include (inclusive).' },
          granularity: { type: 'string', enum: ['week', 'month', 'year'], description: 'Trend bucket size. Default month.' },
        },
      },
      isConcurrencySafe: () => true,
      async execute(args) {
        const { data, hint } = await dataOrHint(service)
        if (hint) return { error: hint }
        return { folder: data.folder, statementFiles: data.files.length, ...overview(data.rows, data.overrides, args) }
      },
    }),
    tool({
      name: 'spending_transactions',
      description: 'List individual bank statement transactions (newest first) from the Spending Insights plugin, filtered by '
        + 'date range, category and/or merchant text. type "spending" (default) lists purchases (positive) and refunds '
        + `(negative); "income" lists deposits. Categories: ${CATEGORY_HELP}.`,
      parameters: {
        type: 'object',
        properties: {
          from: { ...DATE, description: 'First day to include (inclusive).' },
          to: { ...DATE, description: 'Last day to include (inclusive).' },
          category: { type: 'string', description: 'Category key or Chinese label (spending only).' },
          merchant: { type: 'string', description: 'Case-insensitive text to match in the merchant name or statement title.' },
          type: { type: 'string', enum: ['spending', 'income'] },
          limit: { type: 'integer', description: 'Maximum rows to return, 1–500. Default 50.' },
        },
      },
      isConcurrencySafe: () => true,
      async execute(args) {
        const { data, hint } = await dataOrHint(service)
        if (hint) return { error: hint }
        try {
          return transactions(data.rows, data.overrides, args)
        } catch (e) {
          return { error: e instanceof Error ? e.message : String(e) }
        }
      },
    }),
    tool({
      name: 'spending_set_category',
      description: 'Recategorise a merchant in the Spending Insights plugin. Applies to every transaction of that merchant, '
        + 'now and in future statements, and the 消费分析 charts update on refresh. Use the exact merchant name from '
        + 'spending_overview or spending_transactions. Pass category "auto" to undo a manual choice. '
        + `Categories: ${CATEGORY_HELP}.`,
      parameters: {
        type: 'object',
        properties: {
          merchant: { type: 'string', description: 'Exact merchant name as shown in the tool results.' },
          category: { type: 'string', description: 'Category key, its Chinese label, or "auto".' },
        },
        required: ['merchant', 'category'],
      },
      async execute(args) {
        const { data, hint } = await dataOrHint(service)
        if (hint) return { error: hint }
        const names = merchantNames(data.rows)
        const merchant = names.find(n => n === args.merchant) ?? names.find(n => n.toLowerCase() === args.merchant.toLowerCase())
        if (!merchant) {
          const q = args.merchant.toLowerCase()
          return { error: `No merchant named "${args.merchant}".`, similar: names.filter(n => n.toLowerCase().includes(q) || q.includes(n.toLowerCase())).slice(0, 10) }
        }
        const auto = args.category.trim().toLowerCase() === 'auto'
        const category = auto ? null : resolveCategory(args.category)
        if (!auto && !category) return { error: `Unknown category "${args.category}".`, categories: categoryList() }
        await service.setOverride(merchant, category)
        const atMerchant = data.rows.filter(r => r.merchant === merchant)
        return {
          ok: true,
          merchant,
          category: category ?? 'auto (rule-based)',
          transactionsAffected: atMerchant.length,
        }
      },
    }),
  ]
}

export function apply(ctx) {
  const service = new SpendingInsights(ctx, storePath())
  ctx.reflect.provide(SERVICE, service)

  ctx.inject(['tools'], c => {
    for (const t of tools(service)) c.tools.register(t)
  })
  ctx.inject(['directoryPicker'], c => {
    c.effect(() => {
      service.picker = c.directoryPicker
      return () => { service.picker = undefined }
    }, 'spending-insights: directory picker')
  })
}
