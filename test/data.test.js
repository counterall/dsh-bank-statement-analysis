import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bucketize, bucketLabel, categorize, categoryTotals, merchantOf, mergeRows,
  accountOf, incomeOf, parseAmount, parseDate, parseFinvoice, parseStatement, parseStatementFile, rangeCoversAll, rangeEnd, rangeStart, spendingOf, titleKey,
} from '../src/data.js'

const HEADER_CSV = 'Transaction date;Booking date;Title;Amount;Currency;Transaction type;Original amount;Original currency;City;Country;Exchange rate\n'
const SAMPLE = '﻿Transaction date;Booking date;Title;Amount;Currency;Transaction type;Original amount;Original currency;City;Country;Exchange rate\n'
  + '"3.11.2026";"3.11.2026";"Retail FIN Espoo Prisma Iso Omena";"-42.10";"EUR";;;;;;\n'
  + '"3.11.2026";"3.11.2026";"Payment 03.11";"500.00";"EUR";;;;;;\n'
  + '"2.11.2026";"2.11.2026";"Credit FIN Nordea Cashback";"3.00";"EUR";;;;;;\n'
  + '"28.10.2026";"28.10.2026";"USD 9,99 Retail USA SEATTLE AMAZON DIGI* 5";"-9.20";"EUR";;;;;;\n'
  + '"27.10.2026";"27.10.2026";"Retail FIN Finland Wolt Oy";"-7.50";"EUR";;;;;;\n'
  + '"27.10.2026";"27.10.2026";"Retail FIN Finland Wolt Oy";"-7.50";"EUR";;;;;;\n'
  + '"26.10.2026";"26.10.2026";"Retail FIN Finland Wolt Oy";"2.00";"EUR";;;;;;\n'

test('parses Nordea rows and classifies kinds', () => {
  const { rows, skipped } = parseStatement(SAMPLE)
  assert.equal(skipped, 0)
  assert.equal(rows.length, 7)
  assert.deepEqual(rows.map(r => r.kind), ['purchase', 'payment', 'cashback', 'purchase', 'purchase', 'purchase', 'refund'])
  assert.equal(rows[0].date, '2026-11-03')
  assert.equal(rows[0].merchant, 'Prisma Iso Omena')
  assert.equal(rows[3].merchant, 'AMAZON DIGI* 5')
})

test('spending excludes payments and cashback, refunds reduce', () => {
  const { rows } = parseStatement(SAMPLE)
  const s = spendingOf(rows, {})
  assert.equal(s.length, 5)
  const totals = categoryTotals(s)
  const dining = totals.find(t => t.category === 'Restaurants & cafés')
  assert.equal(Math.round(dining.total * 100), 1300)
  assert.equal(totals[0].category, 'Groceries')
})

test('overrides win over rules', () => {
  const { rows } = parseStatement(SAMPLE)
  const s = spendingOf(rows, { 'Wolt Oy': 'Groceries' })
  assert.ok(s.filter(e => e.merchant === 'Wolt Oy').every(e => e.category === 'Groceries'))
})

test('merge keeps genuine duplicates but ignores re-imports', () => {
  const { rows } = parseStatement(SAMPLE)
  const first = mergeRows([], rows)
  assert.equal(first.added, 7)
  const again = mergeRows(first.merged, rows)
  assert.equal(again.added, 0)
  assert.equal(again.merged.length, 7)
})

test('buckets are continuous and sum to the total', () => {
  const { rows } = parseStatement(SAMPLE)
  const s = spendingOf(rows, {})
  for (const g of ['week', 'month', 'year']) {
    const b = bucketize(s, g)
    const sum = b.reduce((a, x) => a + x.total, 0)
    assert.equal(Math.round(sum * 100), Math.round(s.reduce((a, e) => a + e.spend, 0) * 100))
  }
  assert.deepEqual(bucketize(s, 'month').map(b => b.start), ['2026-10-01', '2026-11-01'])
  assert.equal(bucketize(s, 'week')[0].start, '2026-10-26') // Monday
  assert.equal(bucketLabel('2026-10-26', 'week'), '第44周 · 10月26日起')
  assert.equal(bucketLabel('2026-10-01', 'month'), '2026年10月')
})

test('helpers', () => {
  assert.equal(parseDate('5.1.2026'), '2026-01-05')
  assert.equal(parseAmount('1 420,05'), 1420.05)
  assert.equal(parseAmount('-1,420.05'), -1420.05)
  assert.equal(merchantOf('Retail SWE Stockholm Epass24.com'), 'Epass24.com')
  assert.equal(categorize('SATS Finland OY'), 'Health & fitness')
  assert.equal(categorize('STL PALVELUT Oy'), 'Other')
  assert.equal(categorize('IF Vakuutus'), 'Insurance')
  assert.equal(categorize('Terveystalo Oy'), 'Medical')
  assert.equal(categorize('Yliopiston Apteekki'), 'Medical')
  assert.equal(categorize('Sokos Hotel Tapiola'), 'Travel')
  assert.equal(categorize('FINNAIR'), 'Travel')
  assert.equal(categorize('Finnkino Tennispalatsi'), 'Entertainment')
  assert.equal(categorize('ESPOO ESPOONLAHTI LIPPULA'), 'Other')
  assert.equal(categorize('HSL Mobiili'), 'Transport & car')
  assert.equal(rangeStart('3m', '2026-11-03'), '2026-08-04')
  assert.equal(rangeStart('ytd', '2026-11-03'), '2026-01-01')
})

test('range start clamps to month end instead of overflowing', () => {
  assert.equal(rangeStart('3m', '2026-05-31'), '2026-03-01')
  assert.equal(rangeStart('6m', '2026-08-31'), '2026-03-01')
  assert.equal(rangeStart('12m', '2028-02-29'), '2027-03-01')
  assert.equal(rangeStart('3m', '2026-03-15'), '2025-12-16')
  assert.equal(rangeStart('all', '2026-03-15'), undefined)
})

test('rangeCoversAll flags presets that cannot narrow the data', () => {
  // Data from 2026-08-21 to 2026-11-03: every preset includes everything.
  for (const r of ['3m', '6m', '12m', 'ytd', 'all']) assert.equal(rangeCoversAll(r, '2026-08-21', '2026-11-03'), true)
  // Two years of data: only "all" covers it.
  for (const r of ['3m', '6m', '12m', 'ytd']) assert.equal(rangeCoversAll(r, '2024-11-01', '2026-11-03'), false)
  assert.equal(rangeCoversAll('all', '2024-11-01', '2026-11-03'), true)
})

test('last month is the calendar month before the latest data month', () => {
  assert.equal(rangeStart('lastmonth', '2026-11-03'), '2026-10-01')
  assert.equal(rangeEnd('lastmonth', '2026-11-03'), '2026-10-31')
  assert.equal(rangeStart('lastmonth', '2026-01-20'), '2025-12-01')
  assert.equal(rangeEnd('lastmonth', '2026-01-20'), '2025-12-31')
  assert.equal(rangeEnd('lastmonth', '2028-03-31'), '2028-02-29')
  assert.equal(rangeEnd('3m', '2026-11-03'), undefined)
  // Ends before the latest date, so it always narrows the data.
  assert.equal(rangeCoversAll('lastmonth', '2026-08-21', '2026-11-03'), false)
})

const DEBIT = '\ufeffBooking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;\n'
  + '2026/10/31;2500,00;;;ACME OY;ACME OY;Salary;;3000,00;EUR;\n'
  + '2026/10/20;-400,00;;;Nordea Bank Abp;Nordea Bank Abp;;;500,00;EUR;\n'
  + '2026/10/15;-80,00;;;As Oy Example;As Oy Example;Vastike;;900,00;EUR;\n'
  + '2026/10/16;20,00;;;As Oy Example;As Oy Example;Hyvitys;;920,00;EUR;\n'
  + '2026/11/02;-10,00;;;Lidl;Lidl;;;910,00;EUR;\n'

test('account type comes from the file name, else from a Balance column', () => {
  assert.equal(accountOf('Nordea Gold - 5.11.2026 09.29.33.csv'), 'credit')
  assert.equal(accountOf('Current Account.csv'), 'debit')
  assert.equal(accountOf('export.csv', ['booking date', 'amount', 'balance']), 'debit')
  assert.equal(accountOf('export.csv', ['date', 'title', 'amount']), 'credit')
  assert.equal(parseStatement(DEBIT, 'Current Account.csv').account, 'debit')
  assert.equal(parseStatement(SAMPLE, 'Nordea Gold.csv').account, 'credit')
})

test('debit statement: card repayments excluded, deposits split into refunds and income', () => {
  const { rows } = parseStatement(DEBIT, 'Current Account.csv')
  assert.equal(rows.length, 5)
  assert.ok(rows.every(r => r.account === 'debit'))
  assert.equal(rows.find(r => r.title === 'Nordea Bank Abp').kind, 'payment')
  const spend = spendingOf(rows, {})
  assert.deepEqual(spend.map(e => e.spend).sort((a, b) => a - b), [-20, 10, 80])
  assert.equal(spend.find(e => e.merchant === 'As Oy Example').category, 'Housing & utilities')
  const income = incomeOf(rows)
  assert.deepEqual(income.map(r => r.amount), [2500])
})

test('credit and debit rows with identical fields are not merged together', () => {
  const credit = { date: '2026-10-01', title: 'X', merchant: 'X', amount: -5, kind: 'purchase' }
  const debit = { ...credit, account: 'debit' }
  assert.equal(mergeRows([credit], [debit]).added, 1)
  assert.equal(mergeRows([credit], [{ ...credit, account: 'credit' }]).added, 0)
})

test('buckets carry income and span income-only periods', () => {
  const { rows } = parseStatement(DEBIT, 'Current Account.csv')
  const b = bucketize(spendingOf(rows, {}), 'month', incomeOf(rows))
  assert.deepEqual(b.map(x => [x.start, x.income, x.total]), [['2026-10-01', 2500, 60], ['2026-11-01', 0, 10]])
  const only = bucketize([], 'month', incomeOf(rows))
  assert.equal(only.length, 1)
})

const FINVOICE = '<?xml version="1.0" encoding="ISO-8859-1"?><Finvoice>\n'
  + '<InvoiceRow>\n<ArticleIdentifier>Payment</ArticleIdentifier>\n<RowDeliveryDate Format="CCYYMMDD">20261005</RowDeliveryDate>\n'
  + '<RowAmount AmountCurrencyIdentifier="EUR">-500,00</RowAmount>\n</InvoiceRow>\n'
  + '<InvoiceRow>\n<ArticleIdentifier>Retail FIN Espoo K-supermarket Lepp&#228;vaa</ArticleIdentifier>\n<ArticleName>5225-**</ArticleName>\n'
  + '<RowDeliveryDate Format="CCYYMMDD">20261003</RowDeliveryDate>\n<RowVatExcludedAmount AmountCurrencyIdentifier="EUR">12,30</RowVatExcludedAmount>\n'
  + '<RowAmount AmountCurrencyIdentifier="EUR">12,30</RowAmount>\n</InvoiceRow>\n'
  + '<InvoiceRow>\n<ArticleIdentifier>Retail IRL Dublin WLGOOGLE  YouTubePrem</ArticleIdentifier>\n<RowDeliveryDate Format="CCYYMMDD">20261001</RowDeliveryDate>\n'
  + '<RowAmount AmountCurrencyIdentifier="EUR">16,99</RowAmount>\n</InvoiceRow>\n'
  + '<InvoiceRow>\n<ArticleIdentifier>Retail USA SEATTLE AMAZON DIGI 590FS8JB2</ArticleIdentifier>\n<RowDeliveryDate Format="CCYYMMDD">20261008</RowDeliveryDate>\n'
  + '<RowAmount AmountCurrencyIdentifier="EUR">5,41</RowAmount>\n</InvoiceRow>\n'
  + '<InvoiceRow>\n<ArticleIdentifier>Credit FIN Nordea Cashback</ArticleIdentifier>\n<RowDeliveryDate Format="CCYYMMDD">20260930</RowDeliveryDate>\n'
  + '<RowAmount AmountCurrencyIdentifier="EUR">-4,47</RowAmount>\n</InvoiceRow>\n'
  + '<InvoiceRow>\n<ArticleIdentifier>Credit FIN VANTAA IKEA VANTAA RETURN</ArticleIdentifier>\n<RowDeliveryDate Format="CCYYMMDD">20260912</RowDeliveryDate>\n'
  + '<RowAmount AmountCurrencyIdentifier="EUR">-7,99</RowAmount>\n</InvoiceRow>\n'
  + '<InvoiceRow>\n<ArticleIdentifier>Total Balance</ArticleIdentifier>\n<RowAmount AmountCurrencyIdentifier="EUR">500,00</RowAmount>\n</InvoiceRow>\n'
  + '</Finvoice>\n'

test('Finvoice XML invoice: credit card rows with CSV sign convention', () => {
  const { account, rows, skipped } = parseStatementFile(FINVOICE, '2026-10_Nordea Bank Abp_INVOICE.xml')
  assert.equal(account, 'credit')
  assert.equal(skipped, 0)
  assert.deepEqual(rows.map(r => [r.date, r.amount, r.kind]), [
    ['2026-10-05', 500, 'payment'],
    ['2026-10-03', -12.3, 'purchase'],
    ['2026-10-01', -16.99, 'purchase'],
    ['2026-10-08', -5.41, 'purchase'],
    ['2026-09-30', 4.47, 'cashback'],
    ['2026-09-12', 7.99, 'refund'],
  ])
  assert.equal(rows[1].merchant, 'K-supermarket Leppävaa')
  assert.equal(rows[2].merchant, 'WLGOOGLE YouTubePrem')
  assert.throws(() => parseFinvoice('<?xml version="1.0"?><Invoice/>'), /Finvoice/)
})

test('the same card transaction in a CSV and an XML invoice is merged', () => {
  const csv = parseStatement(HEADER_CSV
    + '"5.10.2026";"5.10.2026";"Payment 05.10";"500.00";"EUR";;;;;;\n'
    + '"3.10.2026";"3.10.2026";"Retail FIN Espoo K-supermarket Leppävaa";"-12.30";"EUR";;;;;;\n'
    + '"1.10.2026";"1.10.2026";"Retail IRL Dublin WL*GOOGLE YouTubePrem";"-16.99";"EUR";;;;;;\n'
    + '"8.10.2026";"8.10.2026";"USD 5,90 Retail USA SEATTLE AMAZON DIGI* 5";"-5.41";"EUR";;;;;;\n'
    + '"8.10.2026";"8.10.2026";"Retail FIN Espoo Prisma";"-5.41";"EUR";;;;;;\n', 'Nordea Gold.csv').rows
  const xml = parseFinvoice(FINVOICE).rows
  const { merged, added } = mergeRows(xml, csv)
  assert.equal(added, 1) // only the Prisma purchase is new: same date and amount, different title
  assert.equal(merged.length, xml.length + 1)
  assert.equal(titleKey('USD 5,90 Retail USA SEATTLE AMAZON DIGI* 5'), 'retailusaseattleamazondigi5')
  // A debit row with the same date, amount and title is a different transaction.
  assert.equal(mergeRows(xml, [{ ...xml[1], account: 'debit' }]).added, 1)
})
