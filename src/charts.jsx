import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CATEGORIES, bucketLabel, bucketShortLabel } from './data.js'
import { catLabel } from './i18n.js'

export const colorOf = category => `var(--sp-s${CATEGORIES.indexOf(category)})`

const eur = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'EUR' })
const eur0 = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const money = n => eur.format(n)
export const money0 = n => eur0.format(n)

const GRANULARITY_UNIT = { week: '周', month: '月', year: '年' }

/** Width of an element, tracked with ResizeObserver. */
export function useWidth(fallback = 600) {
  const ref = useRef(null)
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setWidth(el.clientWidth || fallback)
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.floor(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

export function Swatch({ category }) {
  return <span className="dshsp-sw" style={{ background: colorOf(category) }} />
}

// ---- Donut -----------------------------------------------------------------

function arcPath(cx, cy, r0, r1, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const p = (r, a) => `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    return `M ${p(r1, 0)} A ${r1} ${r1} 0 1 1 ${p(r1, Math.PI)} A ${r1} ${r1} 0 1 1 ${p(r1, 0)} `
      + `M ${p(r0, 0)} A ${r0} ${r0} 0 1 0 ${p(r0, Math.PI)} A ${r0} ${r0} 0 1 0 ${p(r0, 0)} Z`
  }
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`
}

/**
 * Category share donut for the currently filtered categories. Category names
 * and amounts are labelled once, in the shared filter bar above the charts;
 * here hovering a slice shows its share in the centre.
 */
export function CategoryDonut({ totals, onPick }) {
  const [hover, setHover] = useState(undefined)
  const [ref, width] = useWidth(320)
  const size = Math.max(180, Math.min(300, width))
  const c = size / 2
  const r1 = c - 4
  const r0 = r1 - Math.round(size * 0.17)
  const sum = totals.reduce((a, t) => a + t.total, 0)
  let angle = 0
  const slices = totals.map(t => {
    const a0 = angle
    angle += (t.total / sum) * Math.PI * 2
    return { ...t, a0, a1: angle }
  })
  const shownTotal = hover ? totals.find(t => t.category === hover)?.total ?? 0 : sum
  return (
    <div className="dshsp-donut" ref={ref}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={`分类消费占比，合计 ${money(sum)}`}>
        {slices.map(s => (
          <path
            key={s.category}
            d={arcPath(c, c, hover === s.category ? r0 - 3 : r0, hover === s.category ? r1 + 3 : r1, s.a0, s.a1)}
            fill={colorOf(s.category)}
            stroke="var(--sp-card)"
            strokeWidth={slices.length > 1 ? 2 : 0}
            strokeLinejoin="round"
            opacity={hover && hover !== s.category ? 0.55 : 1}
            style={{ cursor: 'pointer', transition: 'opacity .15s' }}
            onMouseEnter={() => setHover(s.category)}
            onMouseLeave={() => setHover(undefined)}
            onClick={() => onPick(s.category)}
          >
            <title>{`${catLabel(s.category)}：${money(s.total)}（${((s.total / sum) * 100).toFixed(1)}%）`}</title>
          </path>
        ))}
        <text x={c} y={c - 8} textAnchor="middle" className="dshsp-axis" style={{ fontSize: 12 }}>
          {hover ? catLabel(hover) : '合计'}
        </text>
        <text x={c} y={c + 16} textAnchor="middle" fill="var(--sp-text)" style={{ fontSize: 22, fontWeight: 600 }}>
          {money0(shownTotal)}
        </text>
        {hover && (
          <text x={c} y={c + 36} textAnchor="middle" className="dshsp-axis" style={{ fontSize: 12 }}>
            {`${((shownTotal / sum) * 100).toFixed(1)}%`}
          </text>
        )}
      </svg>
    </div>
  )
}

// ---- Stacked columns over time --------------------------------------------

function niceMax(v) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p
  return 10 * p
}

/** Rect with only the top corners rounded (data end), anchored to the baseline. */
function topRounded(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h)
  return `M ${x} ${y + h} V ${y + rr} Q ${x} ${y} ${x + rr} ${y} H ${x + w - rr} Q ${x + w} ${y} ${x + w} ${y + rr} V ${y + h} Z`
}

/** Spending per period, stacked by the selected categories (fixed order, bottom-up). */
export function TrendChart({ buckets, granularity, series }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(undefined)
  useEffect(() => { setHover(undefined) }, [buckets])
  const height = 320
  const m = { top: 14, right: 8, bottom: 26, left: 60 }
  const iw = Math.max(10, width - m.left - m.right)
  const ih = height - m.top - m.bottom
  const ordered = CATEGORIES.filter(c => series.includes(c))
  const valueOf = (b, c) => Math.max(0, b.byCategory[c])
  const totalOf = b => ordered.reduce((a, c) => a + valueOf(b, c), 0)
  const max = niceMax(Math.max(0, ...buckets.map(totalOf)))
  const y = v => m.top + ih - (v / max) * ih
  const n = Math.max(1, buckets.length)
  const band = iw / n
  const barW = Math.max(2, Math.min(64, band * 0.68))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max)
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 64))))
  const avg = buckets.length ? buckets.reduce((a, b) => a + totalOf(b), 0) / buckets.length : 0

  const hb = hover !== undefined ? buckets[hover] : undefined
  const tipLeft = hover !== undefined ? m.left + band * hover + band / 2 : 0

  return (
    <div className="dshsp-chart" ref={ref}>
      <svg width={width} height={height} role="img" aria-label={`每${GRANULARITY_UNIT[granularity]}消费趋势`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={m.left} x2={m.left + iw} y1={y(t)} y2={y(t)}
              stroke={t === 0 ? 'var(--sp-border)' : 'var(--sp-grid)'} strokeWidth={t === 0 ? 1 : 0.5} />
            <text x={m.left - 8} y={y(t) + 4} textAnchor="end" className="dshsp-axis">{money0(t)}</text>
          </g>
        ))}
        {buckets.map((b, i) => {
          const x = m.left + band * i + (band - barW) / 2
          let acc = 0
          const segs = []
          const drawn = ordered.filter(c => valueOf(b, c) > 0)
          drawn.forEach((c, j) => {
            const v = valueOf(b, c)
            const y0 = y(acc)
            const y1 = y(acc + v)
            acc += v
            const gap = j > 0 ? 2 : 0 // 2px surface gap between stacked fills
            const h = Math.max(0, y0 - y1 - gap)
            if (h <= 0) return
            segs.push(j === drawn.length - 1
              ? <path key={c} d={topRounded(x, y1, barW, h, 4)} fill={colorOf(c)} />
              : <rect key={c} x={x} y={y1} width={barW} height={h} fill={colorOf(c)} />)
          })
          return (
            <g key={b.start} opacity={hover !== undefined && hover !== i ? 0.55 : 1}>
              {segs}
              {i % labelEvery === 0 && (
                <text x={m.left + band * i + band / 2} y={height - 8} textAnchor="middle" className="dshsp-axis">
                  {bucketShortLabel(b.start, granularity)}
                </text>
              )}
            </g>
          )
        })}
        {buckets.length > 1 && avg > 0 && (
          <g>
            <line x1={m.left} x2={m.left + iw} y1={y(avg)} y2={y(avg)} stroke="var(--sp-text-2)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={m.left + iw} y={y(avg) - 5} textAnchor="end" className="dshsp-axis">
              {`平均 ${money0(avg)} / ${GRANULARITY_UNIT[granularity]}`}
            </text>
          </g>
        )}
        {buckets.map((b, i) => (
          <rect key={`hit-${b.start}`} x={m.left + band * i} y={m.top} width={band} height={ih} fill="transparent"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(undefined)} />
        ))}
      </svg>
      {hb && (
        <div className="dshsp-tip" style={{
          top: 8,
          left: tipLeft > width / 2 ? undefined : tipLeft + 12,
          right: tipLeft > width / 2 ? width - tipLeft + 12 : undefined,
        }}>
          <div className="dshsp-tip-title">{bucketLabel(hb.start, granularity)}</div>
          {[...ordered].reverse().filter(c => hb.byCategory[c] !== 0).map(c => (
            <div className="dshsp-tip-row" key={c}>
              <Swatch category={c} />
              <span>{catLabel(c)}</span>
              <span className="dshsp-num">{money(hb.byCategory[c])}</span>
            </div>
          ))}
          <div className="dshsp-tip-total"><span>合计</span><span>{money(totalOf(hb))}</span></div>
        </div>
      )}
    </div>
  )
}
