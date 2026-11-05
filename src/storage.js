// Local persistence for imported rows and per-merchant category overrides.
// Lives in the Web Client's localStorage: data never leaves this machine.

const KEY = 'dsh-spending-insights:v1'

export function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY)
    if (!raw) return { rows: [], overrides: {}, files: [] }
    const v = JSON.parse(raw)
    return {
      rows: Array.isArray(v.rows) ? v.rows : [],
      overrides: v.overrides && typeof v.overrides === 'object' ? v.overrides : {},
      files: Array.isArray(v.files) ? v.files : [],
    }
  } catch {
    return { rows: [], overrides: {}, files: [] }
  }
}

export function save(state) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
