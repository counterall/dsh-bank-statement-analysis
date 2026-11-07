// Browser half: a "消费分析" row in the left sidebar's panel list (above the
// Workspace section) that opens a full spending dashboard in the main column.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORIES, bucketize, categoryTotals, daysBetween, mergeRows, parseStatement, incomeOf, rangeCoversAll, rangeEnd, rangeStart, spendingOf,
} from './data.js'
import { load, save } from './storage.js'
import { CSS } from './styles.js'
import { CategoryDonut, Swatch, TrendChart, money } from './charts.jsx'
import { catLabel } from './i18n.js'

const PANEL_ID = 'spending-insights'
const STYLE_ID = 'dsh-spending-insights-style'
const PAGE_SIZES = [20, 50, 100]

const RANGES = [['lastmonth', '上个月'], ['3m', '近3个月'], ['6m', '近6个月'], ['12m', '近12个月'], ['ytd', '今年'], ['all', '全部']]
const GRANULARITIES = [['week', '周'], ['month', '月'], ['year', '年']]
const METRICS = [['income', '收入'], ['spend', '支出'], ['surplus', '盈余']]
const ACCOUNT_LABELS = { credit: '信用卡', debit: '借记卡' }

function Segmented({ options, value, onChange, label, isDisabled, disabledTitle }) {
  return (
    <div className="dshsp-seg" role="group" aria-label={label}>
      {options.map(([v, text]) => {
        const disabled = isDisabled?.(v) ?? false
        return (
          <button key={v} type="button" aria-pressed={value === v} disabled={disabled}
            title={disabled ? disabledTitle : undefined} onClick={() => onChange(v)}>{text}</button>
        )
      })}
    </div>
  )
}

/** Sidebar row glyph: a small donut, drawn in currentColor like the shipped icons. */
export function SpendingIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2.75a7.25 7.25 0 1 0 7.25 7.25H10V2.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12.5 1.9a7.3 7.3 0 0 1 5.6 5.6H12.5V1.9Z" fill="currentColor" />
    </svg>
  )
}

function readFile(file) {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsText(file)
  })
}

export function SpendingPage() {
  const [store, setStore] = useState(load)
  const [range, setRange] = useState('all')
  const [granularity, setGranularity] = useState('month')
  const [metric, setMetric] = useState('spend')
  /** Selected categories; `undefined` means all. */
  const [selected, setSelected] = useState(undefined)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [notice, setNotice] = useState(undefined)
  const [confirmClear, setConfirmClear] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)
  // Latest store for async imports, so overlapping imports never merge into a stale snapshot.
  const storeRef = useRef(store)

  const update = useCallback(next => {
    storeRef.current = next
    setStore(next)
    if (!save(next)) setNotice({ error: true, text: '无法写入本地存储，刷新后数据将丢失。' })
  }, [])

  const importFiles = useCallback(async files => {
    const parsedFiles = []
    try {
      for (const file of files) parsedFiles.push([file.name, parseStatement(await readFile(file), file.name)])
    } catch (e) {
      setNotice({ error: true, text: `导入失败：${e instanceof Error ? e.message : String(e)}` })
      return
    }
    const base = storeRef.current
    let rows = base.rows
    const names = []
    const labelled = []
    let added = 0
    let skipped = 0
    for (const [name, parsed] of parsedFiles) {
      const m = mergeRows(rows, parsed.rows)
      rows = m.merged
      added += m.added
      skipped += parsed.skipped
      names.push(name)
      labelled.push(`${name}（${ACCOUNT_LABELS[parsed.account]}）`)
    }
    update({ ...base, rows, files: [...new Set([...base.files, ...names])] })
    setNotice({ text: `已从 ${labelled.join('、')} 导入 ${added} 笔新交易` + (skipped ? `（跳过 ${skipped} 行无法识别的内容）` : '') + '。' })
  }, [update])

  const onPick = e => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length) importFiles(files)
  }
  const dropHandlers = {
    onDragOver: e => { e.preventDefault(); setDragging(true) },
    onDragLeave: e => { if (e.currentTarget === e.target) setDragging(false) },
    onDrop: e => {
      e.preventDefault()
      setDragging(false)
      const files = [...(e.dataTransfer?.files ?? [])].filter(f => /\.(csv|txt)$/i.test(f.name))
      if (files.length) importFiles(files)
    },
  }

  // Period filter first (gives the per-category amounts shown in the filter bar),
  // then the category filter, which every chart, tile and the table share.
  const all = useMemo(() => spendingOf(store.rows, store.overrides), [store])
  const allIncome = useMemo(() => incomeOf(store.rows), [store.rows])
  const hasDebit = useMemo(() => store.rows.some(r => r.account === 'debit'), [store.rows])
  const allDates = [...all, ...allIncome].map(e => e.date)
  const latest = allDates.length ? allDates.reduce((a, d) => (d > a ? d : a)) : undefined
  const earliest = allDates.length ? allDates.reduce((a, d) => (d < a ? d : a)) : undefined
  const coversAll = r => r !== 'all' && rangeCoversAll(r, earliest, latest)
  const from = rangeStart(range, latest)
  const to = rangeEnd(range, latest)
  const inRange = d => (!from || d >= from) && (!to || d <= to)
  const inPeriod = useMemo(() => all.filter(e => inRange(e.date)), [all, from, to])
  const incomeInPeriod = useMemo(() => allIncome.filter(e => inRange(e.date)), [allIncome, from, to])
  // Displayed period: the preset's bounds, narrowed to the imported data.
  const periodStart = from && earliest && from > earliest ? from : earliest
  const periodEnd = to && latest && to < latest ? to : latest

  const selectRange = r => {
    setRange(r)
    if (r === 'lastmonth') setGranularity('week')
  }
  const periodTotals = useMemo(() => categoryTotals(inPeriod), [inPeriod])
  const periodSum = periodTotals.reduce((a, t) => a + t.total, 0)
  const available = periodTotals.map(t => t.category)
  const active = selected ? selected.filter(c => available.includes(c)) : []
  const isAll = active.length === 0
  const series = isAll ? available : active

  const entries = useMemo(
    () => (isAll ? inPeriod : inPeriod.filter(e => active.includes(e.category))),
    [inPeriod, isAll, active.join('|')],
  )
  const totals = useMemo(() => categoryTotals(entries), [entries])
  // Income and surplus ignore the category filter: surplus = income − all spending.
  const shownMetric = granularity === 'week' ? 'spend' : metric
  const buckets = useMemo(
    () => (shownMetric === 'spend' ? bucketize(entries, granularity) : bucketize(inPeriod, granularity, incomeInPeriod)),
    [shownMetric, entries, inPeriod, incomeInPeriod, granularity],
  )
  const cashback = useMemo(() => store.rows
    .filter(r => r.kind === 'cashback' && inRange(r.date))
    .reduce((a, r) => a + r.amount, 0), [store.rows, from, to])

  /** Click on a category: from "all", isolate it; otherwise toggle it in the selection. */
  const toggleCategory = c => {
    if (isAll) { setSelected([c]); return }
    const next = active.includes(c) ? active.filter(x => x !== c) : [...active, c]
    setSelected(next.length ? next : undefined)
  }

  const total = entries.reduce((a, e) => a + e.spend, 0)
  const days = inPeriod.length || incomeInPeriod.length ? daysBetween(periodStart, periodEnd) : 0
  const monthly = v => (days ? (v / days) * 30.44 : 0)
  const perMonth = monthly(total)
  const income = incomeInPeriod.reduce((a, e) => a + e.amount, 0)
  const spendAll = inPeriod.reduce((a, e) => a + e.spend, 0)
  const surplus = income - spendAll
  const purchases = entries.filter(e => e.spend > 0).length
  const top = totals[0]

  const q = query.trim().toLowerCase()
  const listed = q ? entries.filter(e => e.merchant.toLowerCase().includes(q)) : entries
  const pages = Math.max(1, Math.ceil(listed.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = listed.slice((current - 1) * pageSize, current * pageSize)
  useEffect(() => { setPage(1) }, [range, query, pageSize, active.join('|')])

  const setOverride = (merchant, category) => {
    update({ ...store, overrides: { ...store.overrides, [merchant]: category } })
  }

  const header = (
    <div className="dshsp-head">
      <div>
        <h1 className="dshsp-title">消费分析</h1>
        <div className="dshsp-sub">
          {store.rows.length
            ? `共 ${store.rows.length} 条账单记录 · 已导入 ${store.files.length} 个文件 · 数据仅保存在本机`
            : '根据银行账单 CSV 生成消费图表，数据仅保存在本机。'}
        </div>
      </div>
      <div className="dshsp-actions">
        <input ref={fileInput} type="file" accept=".csv,text/csv,text/plain" multiple hidden onChange={onPick} />
        {store.rows.length > 0 && (confirmClear
          ? (
            <>
              <span className="dshsp-label">确定删除所有已导入的数据？</span>
              <button type="button" className="dshsp-btn dshsp-btn-danger"
                onClick={() => { update({ rows: [], overrides: {}, files: [] }); setConfirmClear(false); setNotice(undefined); setSelected(undefined) }}>
                删除
              </button>
              <button type="button" className="dshsp-btn" onClick={() => setConfirmClear(false)}>取消</button>
            </>
          )
          : <button type="button" className="dshsp-btn" onClick={() => setConfirmClear(true)}>清除数据</button>)}
        <button type="button" className="dshsp-btn dshsp-btn-primary" onClick={() => fileInput.current?.click()}>导入 CSV…</button>
      </div>
    </div>
  )

  const noticeEl = notice && (
    <div className={`dshsp-notice dshsp-notice-dismissable${notice.error ? ' dshsp-error' : ''}`} role="status">
      <span>{notice.text}</span>
      <button type="button" className="dshsp-notice-close" aria-label="关闭提示" title="关闭"
        onClick={() => setNotice(undefined)}>×</button>
    </div>
  )

  if (store.rows.length === 0) {
    return (
      <div className="dshsp-root">
        <div className="dshsp-inner">
          {header}
          {noticeEl}
          <div className={`dshsp-empty${dragging ? ' dshsp-drag' : ''}`} {...dropHandlers}>
            <SpendingIcon size={40} />
            <h2>导入银行账单</h2>
            <p>将 CSV 账单文件拖放到这里，或点击<strong>导入 CSV…</strong>。支持 Nordea 信用卡账单（如 Nordea Gold…csv）
              和借记卡账单（Current Account…csv），按文件名区分。<br />
              可以导入多份账单，重复的记录会自动合并；借记卡中给信用卡的还款（Nordea Bank Abp）不会重复计入支出。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`dshsp-root${dragging ? ' dshsp-drag' : ''}`} {...dropHandlers}>
      <div className="dshsp-inner">
        {header}
        {noticeEl}

        <section className="dshsp-filters" aria-label="筛选">
          <div className="dshsp-filter-row">
            <span className="dshsp-label">时间范围</span>
            <Segmented label="时间范围" options={RANGES} value={range} onChange={selectRange}
              isDisabled={coversAll}
              disabledTitle={`已导入的账单只覆盖 ${earliest} 至 ${latest}，此范围与「全部」相同。导入更早的账单后即可使用。`} />
            <span className="dshsp-label dshsp-gap">趋势粒度</span>
            <Segmented label="趋势粒度" options={GRANULARITIES} value={granularity} onChange={setGranularity} />
            {latest && (
              <span className="dshsp-label dshsp-push">
                {`${periodStart} 至 ${periodEnd}`}
                {RANGES.some(([r]) => coversAll(r)) && `（账单数据自 ${earliest} 起）`}
              </span>
            )}
          </div>
          <div className="dshsp-filter-row">
            <span className="dshsp-label" title="点击分类筛选，可多选">消费分类<br />（可多选）</span>
            <div className="dshsp-chips" role="group" aria-label="消费分类（可多选）">
              <button type="button" className="dshsp-chip" aria-pressed={isAll} onClick={() => setSelected(undefined)}>
                全部 <span className="dshsp-chip-num">{money(periodSum)}</span>
              </button>
              {periodTotals.map(t => (
                <button key={t.category} type="button" className="dshsp-chip"
                  aria-pressed={!isAll && active.includes(t.category)}
                  data-dim={!isAll && !active.includes(t.category) ? '' : undefined}
                  onClick={() => toggleCategory(t.category)}>
                  <Swatch category={t.category} />
                  {catLabel(t.category)}
                  <span className="dshsp-chip-num">{`${money(t.total)} · ${((t.total / periodSum) * 100).toFixed(0)}%`}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="dshsp-tiles">
          <div className="dshsp-tile">
            <div className="dshsp-tile-label">总消费</div>
            <div className="dshsp-tile-value">{money(total)}</div>
            <div className="dshsp-tile-note">{`${days} 天内共 ${purchases} 笔消费`}</div>
          </div>
          <div className="dshsp-tile">
            <div className="dshsp-tile-label">月均消费</div>
            <div className="dshsp-tile-value">{money(perMonth)}</div>
            <div className="dshsp-tile-note">{`周均 ${money(days ? total / days * 7 : 0)} · 按 ${days} 天折算`}</div>
          </div>
          <div className="dshsp-tile">
            <div className="dshsp-tile-label">最大分类</div>
            <div className="dshsp-tile-value">{top ? catLabel(top.category) : '—'}</div>
            <div className="dshsp-tile-note">{top && total > 0 ? `${money(top.total)} · 占 ${((top.total / total) * 100).toFixed(0)}%` : ''}</div>
          </div>
          <div className="dshsp-tile">
            <div className="dshsp-tile-label">返现</div>
            <div className="dshsp-tile-value">{money(cashback)}</div>
            <div className="dshsp-tile-note">信用卡还款不计入消费</div>
          </div>
          <div className="dshsp-tile">
            <div className="dshsp-tile-label">总收入</div>
            <div className="dshsp-tile-value">{money(income)}</div>
            <div className="dshsp-tile-note">{hasDebit ? `${incomeInPeriod.length} 笔入账（借记卡）` : '导入借记卡账单后显示'}</div>
          </div>
          <div className="dshsp-tile">
            <div className="dshsp-tile-label">月均收入</div>
            <div className="dshsp-tile-value">{money(monthly(income))}</div>
            <div className="dshsp-tile-note">{`按 ${days} 天折算`}</div>
          </div>
          <div className="dshsp-tile">
            <div className="dshsp-tile-label">总盈余</div>
            <div className={`dshsp-tile-value ${surplus < 0 ? 'dshsp-deficit' : 'dshsp-surplus'}`}>{money(surplus)}</div>
            <div className="dshsp-tile-note">收入 − 全部分类消费</div>
          </div>
          <div className="dshsp-tile">
            <div className="dshsp-tile-label">月均盈余</div>
            <div className={`dshsp-tile-value ${surplus < 0 ? 'dshsp-deficit' : 'dshsp-surplus'}`}>{money(monthly(surplus))}</div>
            <div className="dshsp-tile-note">{income > 0 ? `储蓄率 ${((surplus / income) * 100).toFixed(0)}%` : `按 ${days} 天折算`}</div>
          </div>
        </div>

        {entries.length === 0 && incomeInPeriod.length === 0
          ? <div className="dshsp-notice">该时间范围内没有交易记录。</div>
          : (
            <div className="dshsp-grid">
              <section className="dshsp-card">
                <div className="dshsp-card-head">
                  <h2 className="dshsp-card-title">分类占比</h2>
                  <span className="dshsp-card-sub">点击扇区可筛选</span>
                </div>
                <CategoryDonut totals={totals} onPick={toggleCategory} />
              </section>
              <section className="dshsp-card">
                <div className="dshsp-card-head">
                  <h2 className="dshsp-card-title">
                    {`${METRICS.find(m => m[0] === shownMetric)[1]}趋势（按${GRANULARITIES.find(g => g[0] === granularity)[1]}）`}
                  </h2>
                  {granularity !== 'week' && (
                    <Segmented label="趋势指标" options={METRICS} value={metric} onChange={setMetric} />
                  )}
                  <span className="dshsp-card-sub">
                    {shownMetric === 'income' ? '借记卡入账'
                      : shownMetric === 'surplus' ? '收入 − 全部分类消费'
                        : isAll ? '全部分类' : active.map(catLabel).join('、')}
                  </span>
                </div>
                <TrendChart buckets={buckets} granularity={granularity} series={series} metric={shownMetric} />
              </section>
            </div>
          )}

        <section className="dshsp-card">
          <div className="dshsp-card-head">
            <h2 className="dshsp-card-title">
              交易明细
              <span className="dshsp-card-sub">{`  ${listed.length} 笔`}</span>
            </h2>
            <input className="dshsp-input" type="search" placeholder="按商户筛选" value={query}
              onChange={e => setQuery(e.target.value)} aria-label="按商户筛选" />
          </div>
          <div className="dshsp-table-wrap">
            <table className="dshsp-table">
              <thead>
                <tr><th>日期</th><th>商户</th><th>账户</th><th>分类</th><th className="dshsp-num">金额</th></tr>
              </thead>
              <tbody>
                {pageRows.map((e, i) => (
                  <tr key={`${e.account}|${e.date}|${e.title}|${e.amount}|${i}`}>
                    <td>{e.date}</td>
                    <td className="dshsp-merchant" title={e.title}>{e.merchant}</td>
                    <td className="dshsp-account">{ACCOUNT_LABELS[e.account ?? 'credit']}</td>
                    <td>
                      <select className="dshsp-select" value={e.category} aria-label={`${e.merchant} 的分类`}
                        onChange={ev => setOverride(e.merchant, ev.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                      </select>
                    </td>
                    <td className={`dshsp-num${e.spend < 0 ? ' dshsp-refund' : ''}`}>{money(e.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dshsp-pager">
            <span className="dshsp-more">修改分类会应用到该商户的所有交易。</span>
            <div className="dshsp-pager-controls">
              <label className="dshsp-label">
                每页
                <select className="dshsp-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                  {PAGE_SIZES.map(n => <option key={n} value={n}>{`${n} 条`}</option>)}
                </select>
              </label>
              <span className="dshsp-label">
                {listed.length ? `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, listed.length)} / ${listed.length}` : '0 / 0'}
              </span>
              <button type="button" className="dshsp-btn dshsp-btn-sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>上一页</button>
              <span className="dshsp-label">{`第 ${current} / ${pages} 页`}</span>
              <button type="button" className="dshsp-btn dshsp-btn-sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>下一页</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export const name = 'dsh-spending-insights'
export const inject = ['slots']

export function apply(ctx) {
  ctx.effect(() => {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return () => {}
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = CSS
    document.head.appendChild(el)
    return () => el.remove()
  }, 'dsh-spending-insights: styles')

  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, SpendingPage))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 20,
    label: () => '消费分析',
  }, SpendingIcon))
}
