// Chinese UI labels. Category keys stay English internally (they are stored in
// per-merchant overrides), and only their display names are translated here.

export const CATEGORY_LABELS = {
  'Groceries': '日用杂货',
  'Restaurants & cafés': '餐饮外卖',
  'Transport & car': '交通出行',
  'Subscriptions': '订阅与通讯',
  'Health & fitness': '健康健身',
  'Shopping': '购物',
  'Pets': '宠物',
  'Other': '其他',
  'Housing & utilities': '住房与生活缴费',
}

export const catLabel = c => CATEGORY_LABELS[c] ?? c
