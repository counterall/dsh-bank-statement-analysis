import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  loadSettings, overview, readFolder, resolveCategory, saveSettings, storePath, transactions,
} from '../src/host/core.js'
import { apply, chooseFolderMac } from '../src/host/index.js'
import { decode, fetchRates } from '../src/host/core.js'

const HEADER = 'Transaction date;Booking date;Title;Amount;Currency;Transaction type;Original amount;Original currency;City;Country;Exchange rate\n'
const line = (d, title, amount) => `"${d}";"${d}";"${title}";"${amount}";"EUR";;;;;;\n`
const OCT = HEADER
  + line('28.10.2026', 'Retail FIN Finland Wolt Oy', '-7.50')
  + line('27.10.2026', 'Retail FIN Espoo Prisma Iso Omena', '-40.00')
  + line('02.10.2026', 'Credit FIN Nordea Cashback', '3.00')
const NOV = HEADER
  + line('03.11.2026', 'Retail FIN Espoo Prisma Iso Omena', '-42.10')
  + line('28.10.2026', 'Retail FIN Finland Wolt Oy', '-7.50') // overlaps the October file
  + line('01.11.2026', 'Retail FIN Helsinki STL PALVELUT Oy', '-12.00')

async function folder() {
  const dir = await mkdtemp(join(tmpdir(), 'spending-'))
  await writeFile(join(dir, 'Nordea Gold - oct.csv'), OCT)
  await mkdir(join(dir, '2026'))
  await writeFile(join(dir, '2026', 'Nordea Gold - nov.csv'), NOV)
  await writeFile(join(dir, 'notes.txt'), 'not a statement')
  await writeFile(join(dir, 'broken.csv'), 'just;some;words\n')
  return dir
}

test('reads CSVs in the folder and one level down, de-duplicating overlaps', async () => {
  const { rows, files } = await readFolder(await folder())
  assert.deepEqual(files.map(f => f.name), ['2026/Nordea Gold - nov.csv', 'Nordea Gold - oct.csv', 'broken.csv'])
  assert.equal(rows.length, 5) // 6 rows, one overlapping
  assert.match(files[2].error, /columns/)
  await assert.rejects(readFolder('/definitely/not/here'), /不存在/)
})

test('settings round-trip and drop unknown categories', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'spending-store-'))
  const file = join(dir, 'storages', 'spending-insights.json')
  assert.deepEqual(await loadSettings(file), { folder: null, overrides: {}, currency: 'EUR' })
  await saveSettings(file, { folder: '/x', overrides: { A: 'Pets', B: 'Nope' } })
  assert.deepEqual(await loadSettings(file), { folder: '/x', overrides: { A: 'Pets' }, currency: 'EUR' })
  assert.equal(storePath({ DSH_HOME: '/h' }), '/h/storages/spending-insights.json')
})

test('overview totals, categories, trend and uncategorised merchants', async () => {
  const { rows } = await readFolder(await folder())
  const o = overview(rows, {}, { granularity: 'month' })
  assert.equal(o.totals.spending, 101.6)
  assert.equal(o.totals.cashback, 3)
  assert.equal(o.byCategory[0].category, 'Groceries')
  assert.equal(o.byCategory[0].label, '日用杂货')
  assert.deepEqual(o.trend.buckets.map(b => b.spending), [47.5, 54.1])
  assert.deepEqual(o.uncategorizedMerchants.map(m => m.merchant), ['STL PALVELUT Oy'])
  const nov = overview(rows, { 'STL PALVELUT Oy': 'Shopping' }, { from: '2026-11-01' })
  assert.equal(nov.totals.spending, 54.1)
  assert.equal(nov.uncategorizedMerchants.length, 0)
  assert.throws(() => overview(rows, {}, { from: 'last week' }), /YYYY-MM-DD/)
})

test('transactions filter by category label, merchant text and limit', async () => {
  const { rows } = await readFolder(await folder())
  const t = transactions(rows, {}, { category: '日用杂货', limit: 1 })
  assert.equal(t.matched, 2)
  assert.equal(t.total, 82.1)
  assert.equal(t.transactions.length, 1)
  assert.equal(t.transactions[0].date, '2026-11-03')
  assert.equal(transactions(rows, {}, { merchant: 'wolt' }).matched, 1)
  assert.throws(() => transactions(rows, {}, { category: 'Gadgets' }), /unknown category/)
  assert.equal(resolveCategory('pets'), 'Pets')
})

/** Minimal stand-in for the Cordis context the host half sees. */
function fakeCtx() {
  const provided = {}
  const injected = {}
  return {
    provided,
    injected,
    reflect: { provide: (n, v) => { provided[n] = v } },
    inject: (deps, fn) => { injected[deps.join(',')] = fn },
    effect: fn => fn(),
  }
}

test('host plugin exposes a Remote service and agent tools', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'spending-home-'))
  const prev = process.env.DSH_HOME
  process.env.DSH_HOME = dir
  try {
    const ctx = fakeCtx()
    apply(ctx)
    const svc = ctx.provided.spendingInsights
    assert.equal(svc.typertRemote.namespace, 'spendingInsights')
    const marker = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(svc), '@deepseek-ai/dsh-typert-protocol/remote-methods').value
    assert.deepEqual(marker.methods.map(m => m.method), ['state', 'setCurrency', 'pickFolder', 'setFolder', 'setOverride', 'importOverrides'])
    // The Gateway reads Remote parameter names from method source.
    assert.match(svc.setOverride.toString(), /^async setOverride\(merchant, category\)/)

    const tools = []
    ctx.injected.tools({ tools: { register: t => tools.push(t) } })
    const tool = n => tools.find(t => t.name === n)
    assert.deepEqual(tools.map(t => t.name), ['spending_overview', 'spending_transactions', 'spending_set_category'])
    assert.match((await tool('spending_overview').execute({})).error, /No statements folder/)

    assert.equal((await svc.setFolder('relative/path')).ok, false)
    assert.equal((await svc.setFolder(await folder())).ok, true)
    assert.equal((await svc.state()).rows.length, 5)
    assert.equal((await tool('spending_overview').execute({})).totals.spending, 101.6)

    const set = await tool('spending_set_category').execute({ merchant: 'stl palvelut oy', category: '购物' })
    assert.deepEqual([set.merchant, set.category], ['STL PALVELUT Oy', 'Shopping'])
    assert.deepEqual((await svc.state()).overrides, { 'STL PALVELUT Oy': 'Shopping' })
    assert.equal((await tool('spending_set_category').execute({ merchant: 'STL PALVELUT Oy', category: 'auto' })).ok, true)
    assert.deepEqual((await svc.state()).overrides, {})
    assert.ok((await tool('spending_set_category').execute({ merchant: 'Wolt', category: 'Pets' })).error)

    await svc.importOverrides({ 'Wolt Oy': 'Groceries', X: 'Bogus' })
    assert.deepEqual((await svc.state()).overrides, { 'Wolt Oy': 'Groceries' })

    // DSH's native picker is used through its capability object.
    const picked = await folder()
    ctx.injected.directoryPicker({ directoryPicker: { capability: () => ({ kind: 'native', pick: async () => picked }) }, effect: fn => fn() })
    assert.deepEqual(await svc.pickFolder(undefined), { supported: true, folder: picked })
    assert.equal((await svc.state()).folder, picked)
  } finally {
    if (prev === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = prev
  }
})

test('reads Finvoice XML in its declared ISO-8859-1 encoding next to CSVs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'spending-xml-'))
  const xml = '<?xml version="1.0" encoding="ISO-8859-1"?><Finvoice><InvoiceRow>'
    + '<ArticleIdentifier>Retail FIN Espoo K-supermarket Leppävaa</ArticleIdentifier>'
    + '<RowDeliveryDate Format="CCYYMMDD">20261027</RowDeliveryDate><RowAmount AmountCurrencyIdentifier="EUR">40,00</RowAmount>'
    + '</InvoiceRow></Finvoice>'
  await writeFile(join(dir, '2026-10_Nordea Bank Abp_INVOICE.xml'), Buffer.from(xml, 'latin1'))
  await writeFile(join(dir, 'Nordea Gold - oct.csv'), HEADER + line('27.10.2026', 'Retail FIN Espoo K-supermarket Leppävaa', '-40.00')
    + line('28.10.2026', 'Retail FIN Finland Wolt Oy', '-7.50'))
  const { rows, files } = await readFolder(dir)
  assert.deepEqual(files.map(f => [f.name, f.account, f.added]), [
    ['2026-10_Nordea Bank Abp_INVOICE.xml', 'credit', 1],
    ['Nordea Gold - oct.csv', 'credit', 1], // the K-supermarket purchase is already in the invoice
  ])
  assert.equal(rows.find(r => r.amount === -40).merchant, 'K-supermarket Leppävaa')
})

test('macOS chooser: POSIX path without trailing slash, null on cancel', async () => {
  const fake = (stdout, error) => (_cmd, args, _opts, cb) => { assert.match(args[1], /choose folder/); cb(error, stdout) }
  assert.equal(await chooseFolderMac(undefined, fake('/Users/me/账单/\n')), '/Users/me/账单')
  const cancel = Object.assign(new Error('execution error: User canceled. (-128)'), { stderr: '' })
  assert.equal(await chooseFolderMac(undefined, fake('', cancel)), null)
  await assert.rejects(chooseFolderMac(undefined, fake('', new Error('boom'))), /boom/)
})

const ALIPAY_CSV = '导出信息：\r\n------支付宝------\r\n交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,交易订单号,商家订单号,备注,\r\n'
  + '2026-10-20 15:10:15,餐饮美食,海底捞,x,火锅,支出,745.00,花呗,交易成功,1\t,2\t,,\r\n'

/** GBK bytes for the text above (Node has no GBK encoder): ASCII passes through, CJK via a small table. */
function gbk(text) {
  const table = new Map()
  const dec = new TextDecoder('gbk')
  for (let hi = 0x81; hi <= 0xfe; hi++) {
    for (let lo = 0x40; lo <= 0xfe; lo++) {
      const ch = dec.decode(Uint8Array.of(hi, lo))
      if (ch.length === 1 && !table.has(ch)) table.set(ch, [hi, lo])
    }
  }
  const out = []
  for (const ch of text) {
    if (ch.charCodeAt(0) < 0x80) out.push(ch.charCodeAt(0))
    else out.push(...table.get(ch))
  }
  return Buffer.from(out)
}

test('decodes GBK Alipay exports; UTF-8 stays UTF-8', () => {
  assert.equal(decode(gbk(ALIPAY_CSV)), ALIPAY_CSV)
  assert.equal(decode(Buffer.from(ALIPAY_CSV, 'utf8')), ALIPAY_CSV)
})

test('fetchRates: frankfurter first, open.er-api as fallback, error when both fail', async () => {
  const ok = body => ({ ok: true, json: async () => body })
  const frank = async url => (assert.match(url, /frankfurter/), ok({ date: '2026-11-06', rates: { CNY: 7.45 } }))
  assert.deepEqual((await fetchRates(['CNY', 'EUR'], frank)).rates, { EUR: 1, CNY: 7.45 })
  const fallback = async url => (/frankfurter/.test(url) ? { ok: false, status: 503 } : ok({ time_last_update_unix: 1794182551, rates: { CNY: 7.5, USD: 1.1 } }))
  const r = await fetchRates(['CNY'], fallback)
  assert.deepEqual([r.rates, r.source], [{ EUR: 1, CNY: 7.5 }, 'open.er-api.com'])
  await assert.rejects(fetchRates(['CNY'], async () => { throw new Error('offline') }), /无法获取汇率/)
})

test('host converts Alipay RMB and Nordea EUR into the chosen currency', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'spending-fx-'))
  const prev = process.env.DSH_HOME
  process.env.DSH_HOME = dir
  try {
    const stmts = join(dir, 'stmts')
    await mkdir(stmts)
    await writeFile(join(stmts, 'Alipay(20261001-20261031).csv'), gbk(ALIPAY_CSV))
    await writeFile(join(stmts, 'Nordea Gold - oct.csv'), HEADER + line('28.10.2026', 'Retail FIN Finland Wolt Oy', '-7.50'))
    const ctx = fakeCtx()
    apply(ctx)
    const svc = ctx.provided.spendingInsights
    let online = true
    let fetches = 0
    svc.fetchRates = async () => {
      fetches++
      if (!online) throw new Error('offline')
      return { rates: { EUR: 1, CNY: 7.45 }, date: '2026-11-06', source: 'test', fetchedAt: Date.now() }
    }
    await svc.setFolder(stmts)

    const eur = await svc.state()
    assert.equal(eur.currency, 'EUR')
    assert.deepEqual(eur.rows.map(r => [r.merchant, r.amount, r.account]), [['Wolt Oy', -7.5, 'credit'], ['海底捞', -100, 'alipay']])
    assert.deepEqual(eur.rows[1].original, { amount: -745, currency: 'CNY' })
    assert.equal(eur.rate.stale, false)

    const cny = await svc.setCurrency('CNY')
    assert.equal(cny.ok, true)
    assert.deepEqual(cny.state.rows.map(r => Math.round(r.amount * 100) / 100), [-55.87, -745])
    assert.equal((await svc.setCurrency('USD')).ok, false)

    const tools = []
    ctx.injected.tools({ tools: { register: t => tools.push(t) } })
    const ov = await tools.find(t => t.name === 'spending_overview').execute({})
    assert.equal(ov.currency, 'CNY')
    assert.equal(ov.totals.spending, 800.88)
    const inEur = await tools.find(t => t.name === 'spending_transactions').execute({ currency: 'EUR', merchant: '海底捞' })
    assert.deepEqual([inEur.currency, inEur.total, inEur.transactions[0].original], ['EUR', 100, { amount: 745, currency: 'CNY' }])

    // Offline: the widget keeps working with the last rate, marked stale.
    online = false
    svc.rates = undefined
    const stale = await svc.state()
    assert.equal(stale.rate.stale, true)
    assert.equal(stale.rows.length, 2)
    assert.equal(fetches, 2) // setCurrency and the tools reused the rate fetched on open
  } finally {
    if (prev === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = prev
  }
})
