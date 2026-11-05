import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bucketize, bucketLabel, categorize, categoryTotals, merchantOf, mergeRows,
  parseAmount, parseDate, parseStatement, rangeStart, spendingOf,
} from '../src/data.js'

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
  assert.equal(rangeStart('3m', '2026-11-03'), '2026-08-04')
  assert.equal(rangeStart('ytd', '2026-11-03'), '2026-01-01')
})
