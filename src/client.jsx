// Browser half: a "消费分析" row in the left sidebar's panel list (above the
// Workspace section) that opens a full spending dashboard in the main column.
// Statements are read by the host half from a folder the user picks; category
// edits are stored there too, shared with the agent tools.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORIES, bucketize, categoryTotals, customBounds, daysBetween, incomeOf, rangeCoversAll, rangeEnd, rangeStart, spendingOf,
} from './data.js'
import { bindConnection, call } from './remote.js'
import { clearLegacy, legacyOverrides } from './storage.js'
import { CSS } from './styles.js'
import { CategoryDonut, Swatch, TrendChart, money, setMoneyCurrency } from './charts.jsx'
import { catLabel } from './i18n.js'
import { PRESETS, askInWorkspace, bindWorkspaces, buildPrompt, lastWorkspace, useWorkspaces } from './ai.js'

const PANEL_ID = 'spending-insights'
const STYLE_ID = 'dsh-spending-insights-style'
const PAGE_SIZES = [20, 50, 100]

const RANGES = [['lastmonth', '上个月'], ['3m', '近3个月'], ['6m', '近6个月'], ['12m', '近12个月'], ['ytd', '今年'], ['all', '全部'], ['custom', '自定义']]
const GRANULARITIES = [['week', '周'], ['month', '月'], ['year', '年']]
const METRICS = [['income', '收入'], ['spend', '支出'], ['surplus', '盈余']]
const ACCOUNT_LABELS = { credit: '信用卡', debit: '借记卡', alipay: '支付宝' }
const CURRENCIES = [['EUR', '€ 欧元'], ['CNY', '¥ 人民币']]

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

/**
 * Pick any period: two date fields (the native calendar pops up on click),
 * bounded by the statement data. Either end may be left empty (open-ended).
 */
function DateRangePicker({ from, to, min, max, onChange }) {
  return (
    <span className="dshsp-daterange" role="group" aria-label="自定义时间范围">
      <input type="date" className="dshsp-input dshsp-date" value={from} min={min} max={to || max}
        onChange={e => onChange(e.target.value, to)} aria-label="开始日期" />
      <span className="dshsp-label">至</span>
      <input type="date" className="dshsp-input dshsp-date" value={to} min={from || min} max={max}
        onChange={e => onChange(from, e.target.value)} aria-label="结束日期" />
      <button type="button" className="dshsp-link" onClick={() => onChange(min ?? '', max ?? '')}
        title="重置为全部账单日期">重置</button>
    </span>
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

const EMPTY = { folder: null, overrides: {}, currency: 'EUR', rows: [], files: [] }
const errorText = e => (e instanceof Error ? e.message : String(e))

/** "汇率 1 € = ¥7.4485（欧洲央行，2026-11-06）" for the currencies the statements use. */
function rateText(data) {
  const r = data.rate
  if (!r) return ''
  const others = Object.keys(r.rates).filter(c => c !== 'EUR')
  const pairs = others.map(c => `1 € = ${Number(r.rates[c].toFixed(4))} ${c === 'CNY' ? '元' : c}`)
  const when = r.date ? `，${r.date}` : ''
  return `汇率 ${pairs.join('，')}（${r.source}${when}）${r.stale ? ' · 获取最新汇率失败，使用上次的汇率' : ''}`
}

function unconvertedNotice(data) {
  return { error: true, text: `无法获取汇率，${data.unconverted.join('、')} 账单暂未计入。请检查网络后点击刷新。` }
}

function readSummary(data) {
  const ok = data.files.filter(f => !f.error)
  const bad = data.files.filter(f => f.error)
  const skipped = ok.reduce((a, f) => a + f.skipped, 0)
  let text = `已读取 ${ok.length} 个账单文件，共 ${data.rows.length} 条记录`
  if (skipped) text += `（跳过 ${skipped} 行无法识别的内容）`
  text += '。'
  if (bad.length) text += ` 无法读取：${bad.map(f => `${f.name}（${f.error}）`).join('；')}`
  return { error: bad.length > 0, text }
}

/** Folder bar: picker, manual path entry (for hosts without a native chooser) and refresh. */
function FolderControls({ folder, busy, onPick, onSetPath, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [path, setPath] = useState('')
  const submit = async e => {
    e.preventDefault()
    if (await onSetPath(path)) setEditing(false)
  }
  if (editing) {
    return (
      <form className="dshsp-actions" onSubmit={submit}>
        <input className="dshsp-input dshsp-path" autoFocus value={path} placeholder="/Users/…/账单 或 ~/Documents/账单"
          aria-label="账单文件夹路径" onChange={e => setPath(e.target.value)} />
        <button type="submit" className="dshsp-btn dshsp-btn-primary" disabled={busy}>保存</button>
        <button type="button" className="dshsp-btn" onClick={() => setEditing(false)}>取消</button>
      </form>
    )
  }
  return (
    <div className="dshsp-actions">
      <button type="button" className="dshsp-link" onClick={() => { setPath(folder ?? ''); setEditing(true) }}>输入路径</button>
      <button type="button" className={`dshsp-btn${folder ? '' : ' dshsp-btn-primary'}`} disabled={busy}
        onClick={async () => { if ((await onPick()) === 'unsupported') { setPath(folder ?? ''); setEditing(true) } }}>
        {folder ? '更换文件夹…' : '选择文件夹…'}
      </button>
      {folder && (
        <button type="button" className="dshsp-btn dshsp-btn-primary" disabled={busy} onClick={onRefresh}>
          {busy ? '读取中…' : '刷新'}
        </button>
      )}
    </div>
  )
}

/**
 * "问 AI": pick a Workspace, then a preset or your own question. Opens a new
 * chat there with the question and the current filters in the composer.
 */
function AskAiCard({ filters }) {
  const { available, items } = useWorkspaces()
  const [chosen, setChosen] = useState(lastWorkspace)
  const [question, setQuestion] = useState('')
  const [error, setError] = useState(undefined)
  if (!available) return null
  const workspace = items.find(w => w.id === chosen) ?? items[0]
  const ask = q => {
    if (!q.trim() || !workspace) return
    setError(undefined)
    try {
      askInWorkspace(workspace.id, buildPrompt(q, filters))
      setQuestion('')
    } catch (e) {
      setError(errorText(e))
    }
  }
  return (
    <section className="dshsp-card dshsp-ai" aria-label="问 AI">
      <div className="dshsp-card-head">
        <h2 className="dshsp-card-title">问 AI</h2>
        <span className="dshsp-card-sub">在所选工作区新建对话，问题和当前筛选条件会填入输入框，按回车发送</span>
        <label className="dshsp-label dshsp-push">
          工作区
          {items.length
            ? (
              <select className="dshsp-select" value={workspace?.id} onChange={e => setChosen(e.target.value)} aria-label="在哪个工作区新建对话">
                {items.map(w => <option key={w.id} value={w.id} title={w.path}>{w.label}</option>)}
              </select>
            )
            : <span className="dshsp-more">（还没有工作区，请先在侧边栏添加）</span>}
        </label>
      </div>
      <div className="dshsp-ai-presets" role="group" aria-label="常用问题">
        {PRESETS.map(([label, q]) => (
          <button key={label} type="button" className="dshsp-chip" disabled={!workspace} title={q} onClick={() => ask(q)}>{label}</button>
        ))}
      </div>
      <form className="dshsp-ai-ask" onSubmit={e => { e.preventDefault(); ask(question) }}>
        <input className="dshsp-input" value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="输入你的问题，例如：上个月餐饮比平时多吗？" aria-label="向 AI 提问" />
        <button type="submit" className="dshsp-btn dshsp-btn-primary" disabled={!workspace || !question.trim()}>问 AI</button>
      </form>
      {error && <div className="dshsp-notice dshsp-error">{error}</div>}
    </section>
  )
}

export function SpendingPage() {
  const [store, setStore] = useState(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [range, setRange] = useState('all')
  /** Custom range bounds (YYYY-MM-DD or ''), used when range is 'custom'. */
  const [custom, setCustom] = useState({ from: '', to: '' })
  const [granularity, setGranularity] = useState('month')
  const [metric, setMetric] = useState('spend')
  /** Selected categories; `undefined` means all. */
  const [selected, setSelected] = useState(undefined)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [notice, setNotice] = useState(undefined)
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])

  /** Re-read the folder on the host; `announce` shows what was read. */
  const refresh = useCallback(async announce => {
    setBusy(true)
    try {
      const data = await call('state')
      if (!mounted.current) return
      setStore(data)
      if (data.error) setNotice({ error: true, text: `无法读取账单文件夹：${data.error}` })
      else if (data.unconverted) setNotice(unconvertedNotice(data))
      else if (announce && data.folder) setNotice(readSummary(data))
    } catch (e) {
      if (mounted.current) setNotice({ error: true, text: `读取失败：${errorText(e)}` })
    } finally {
      if (mounted.current) { setBusy(false); setLoaded(true) }
    }
  }, [])

  // First open: hand v0.1's category edits to the host, then load.
  useEffect(() => {
    (async () => {
      const legacy = legacyOverrides()
      if (legacy) {
        try { await call('importOverrides', { overrides: legacy }); clearLegacy() } catch { /* retried next open */ }
      }
      await refresh(false)
    })()
  }, [refresh])

  const pickFolder = async () => {
    setBusy(true)
    try {
      const r = await call('pickFolder')
      if (!r.supported) return 'unsupported'
      if (r.folder) await refresh(true)
      return r.folder ? 'picked' : 'cancelled'
    } catch (e) {
      setNotice({ error: true, text: `无法打开文件夹选择器：${errorText(e)}` })
      return 'unsupported'
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  const changeCurrency = async currency => {
    if (currency === store.currency) return
    setBusy(true)
    try {
      const r = await call('setCurrency', { currency })
      if (!r.ok) throw new Error(r.error)
      if (!mounted.current) return
      setStore(r.state)
      setNotice(r.state.unconverted ? unconvertedNotice(r.state) : undefined)
    } catch (e) {
      if (mounted.current) setNotice({ error: true, text: `切换货币失败：${errorText(e)}` })
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  const setFolderPath = async path => {
    try {
      const r = await call('setFolder', { folder: path })
      if (!r.ok) { setNotice({ error: true, text: r.error }); return false }
      await refresh(true)
      return true
    } catch (e) {
      setNotice({ error: true, text: errorText(e) })
      return false
    }
  }

  setMoneyCurrency(store.currency) // every amount below is in the display currency

  // Period filter first (gives the per-category amounts shown in the filter bar),
  // then the category filter, which every chart, tile and the table share.
  const all = useMemo(() => spendingOf(store.rows, store.overrides), [store])
  const allIncome = useMemo(() => incomeOf(store.rows), [store.rows])
  const hasDebit = useMemo(() => store.rows.some(r => r.account === 'debit'), [store.rows])
  const allDates = [...all, ...allIncome].map(e => e.date)
  const latest = allDates.length ? allDates.reduce((a, d) => (d > a ? d : a)) : undefined
  const earliest = allDates.length ? allDates.reduce((a, d) => (d < a ? d : a)) : undefined
  const coversAll = r => r !== 'all' && r !== 'custom' && rangeCoversAll(r, earliest, latest)
  const bounds = range === 'custom' ? customBounds(custom.from, custom.to) : { from: rangeStart(range, latest), to: rangeEnd(range, latest) }
  const { from, to } = bounds
  const inRange = d => (!from || d >= from) && (!to || d <= to)
  const inPeriod = useMemo(() => all.filter(e => inRange(e.date)), [all, from, to])
  const incomeInPeriod = useMemo(() => allIncome.filter(e => inRange(e.date)), [allIncome, from, to])
  // Displayed period: the preset's bounds, narrowed to the imported data.
  const periodStart = from && earliest && from > earliest ? from : earliest
  const periodEnd = to && latest && to < latest ? to : latest

  const selectRange = r => {
    // Entering 自定义 starts from the period currently shown.
    if (r === 'custom' && range !== 'custom') setCustom({ from: periodStart ?? '', to: periodEnd ?? '' })
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
  useEffect(() => { setPage(1) }, [from, to, query, pageSize, active.join('|')])

  const setOverride = async (merchant, category) => {
    const previous = store.overrides
    setStore(s => ({ ...s, overrides: { ...s.overrides, [merchant]: category } })) // optimistic
    try {
      const r = await call('setOverride', { merchant, category })
      if (!r.ok) throw new Error(r.error)
      setStore(s => ({ ...s, overrides: r.overrides }))
    } catch (e) {
      setStore(s => ({ ...s, overrides: previous }))
      setNotice({ error: true, text: `分类保存失败：${errorText(e)}` })
    }
  }

  const header = (
    <div className="dshsp-head">
      <div>
        <h1 className="dshsp-title">消费分析</h1>
        <div className="dshsp-sub">
          {store.folder
            ? <>账单文件夹 <code className="dshsp-folder" title={store.folder}>{store.folder}</code>
              {` · ${store.files.length} 个文件 · ${store.rows.length} 条记录`}</>
            : '根据银行账单（CSV / XML）和支付宝账单生成消费图表，数据仅保存在本机。'}
        </div>
        {store.rate && <div className="dshsp-rate">{rateText(store)}</div>}
      </div>
      <div className="dshsp-actions">
        <Segmented label="显示货币" options={CURRENCIES} value={store.currency} onChange={changeCurrency}
          isDisabled={() => busy} />
        <FolderControls folder={store.folder} busy={busy} onPick={pickFolder} onSetPath={setFolderPath}
          onRefresh={() => refresh(true)} />
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
          {loaded && (
            <div className="dshsp-empty">
              <SpendingIcon size={40} />
              {store.folder && !store.error
                ? (
                  <>
                    <h2>文件夹中没有可识别的账单</h2>
                    <p>把银行账单（CSV 或 XML）或支付宝账单放进 <code>{store.folder}</code>（可以放在一层子文件夹里，例如按年份），然后点击<strong>刷新</strong>。</p>
                  </>
                )
                : (
                  <>
                    <h2>选择账单文件夹</h2>
                    <p>点击<strong>选择文件夹…</strong>，选择存放银行账单（CSV / XML）的文件夹，例如 Google Drive 或 iCloud 同步的文件夹，
                      这样在每台电脑上都能用同一份账单。以后有新账单时，放进这个文件夹再点<strong>刷新</strong>即可。<br />
                      支持 Nordea 信用卡 CSV（Nordea Gold…csv）、信用卡电子发票 XML（…_INVOICE.xml）、借记卡 CSV（Current Account…csv），
                      以及支付宝账单 CSV（Alipay…csv，人民币，可在页面右上角切换显示为欧元或人民币）；
                      重叠的账单（包括同一时期的 CSV 和 XML）会自动去重，借记卡中给信用卡的还款不会重复计入支出。</p>
                  </>
                )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="dshsp-root">
      <div className="dshsp-inner">
        {header}
        {noticeEl}

        <AskAiCard filters={{ from: periodStart, to: periodEnd, categories: isAll ? [] : active, granularity, currency: store.currency }} />

        <section className="dshsp-filters" aria-label="筛选">
          <div className="dshsp-filter-row">
            <span className="dshsp-label">时间范围</span>
            <Segmented label="时间范围" options={RANGES} value={range} onChange={selectRange}
              isDisabled={coversAll}
              disabledTitle={`已导入的账单只覆盖 ${earliest} 至 ${latest}，此范围与「全部」相同。导入更早的账单后即可使用。`} />
            {range === 'custom' && (
              <DateRangePicker from={custom.from} to={custom.to} min={earliest} max={latest}
                onChange={(f, t) => setCustom({ from: f, to: t })} />
            )}
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
                    <td className={`dshsp-num${e.spend < 0 ? ' dshsp-refund' : ''}`}>
                      {money(e.spend)}
                      {e.original && <span className="dshsp-orig">{money(-e.original.amount, e.original.currency)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dshsp-pager">
            <span className="dshsp-more">修改分类会应用到该商户的所有交易。也可以在对话中让 AI 帮你分析或归类消费。</span>
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
  bindConnection(ctx)
  bindWorkspaces(ctx)

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
