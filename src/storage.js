// v0.1 kept imported rows and category edits in the Web Client's localStorage.
// Statements now come from a folder read by the host, and edits live on the
// host too; this only hands the old category edits over once.

const KEY = 'dsh-spending-insights:v1'

/** Category edits saved by v0.1, or undefined when there are none. */
export function legacyOverrides() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY)
    if (!raw) return undefined
    const v = JSON.parse(raw)
    return v?.overrides && typeof v.overrides === 'object' && Object.keys(v.overrides).length ? v.overrides : undefined
  } catch {
    return undefined
  }
}

/** Drop the v0.1 store once its edits are safely on the host. */
export function clearLegacy() {
  try {
    globalThis.localStorage?.removeItem(KEY)
  } catch {
    // storage unavailable: nothing to clear
  }
}
