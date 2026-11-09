// Preset questions and the prompt sent to a new chat from the 问 AI card.
import { catLabel } from './i18n.js'

export const PRESETS = [
  ['总结消费', '总结这段时间的消费情况：总额、主要分类、变化趋势，以及值得注意的地方。'],
  ['节省建议', '根据这段时间的消费，找出可以节省的开支，给出具体可行的建议。'],
  ['环比变化', '把这段时间的消费和之前同样长度的时间段对比，说明哪些分类变化最大，以及可能的原因。'],
  ['归类「其他」', '看看「其他」分类里的商户，建议它们应该归到哪个分类。先列出建议，等我确认后再用 spending_set_category 修改。'],
  ['异常检查', '检查有没有异常的消费，比如重复扣款、金额异常大的交易，或新出现的订阅。'],
]

/**
 * The question plus the dashboard's current filters, so the agent queries the
 * same period and categories the user is looking at.
 */
export function buildPrompt(question, { from, to, categories, granularity }) {
  const unit = { week: '周', month: '月', year: '年' }[granularity] ?? '月'
  const scope = categories?.length ? categories.map(catLabel).join('、') : '全部分类'
  return `${question.trim()}\n`
    + `（来自「消费分析」面板。当前筛选：${from} 至 ${to}，${scope}，趋势按${unit}。`
    + '请使用 spending_overview 和 spending_transactions 工具查询我的银行账单数据，'
    + '日期用 YYYY-MM-DD，金额单位为欧元，用中文回答。）'
}
