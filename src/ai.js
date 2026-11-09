// "问 AI": open a new DSH chat in a chosen Workspace with a spending question
// prefilled in the composer. Uses the Web Client's own navigation service
// (`ctx.uiWorkspace.startSession`, the same call the sidebar's New Session
// makes) and the Workspace list store (`ctx.workspaces.list`). Nothing is sent
// until the user presses Enter, so they see exactly what goes to the model.
import { useSyncExternalStore } from 'react'
export { PRESETS, buildPrompt } from './prompt.js'

const LAST_WORKSPACE_KEY = 'dsh-spending-insights:ai-workspace'

let ui
let workspaces
let layout
let defaultName = '默认工作区'
let snapshot = { available: false, items: [] }
const listeners = new Set()

function recompute() {
  const list = workspaces?.list?.getSnapshot?.()
  const items = (list?.items ?? []).map(w => ({
    id: w.workspaceId,
    label: w.title === 'default-workspace' ? defaultName : w.title,
    path: w.path,
  }))
  snapshot = { available: Boolean(ui && workspaces), items }
  for (const l of listeners) l()
}

/** Called from apply(): track the navigation and Workspace services while available. */
export function bindWorkspaces(ctx) {
  ctx.inject(['uiWorkspace', 'workspaces', 'layout', 'locale'], c => {
    c.effect(() => {
      ui = c.uiWorkspace
      workspaces = c.workspaces
      layout = c.layout
      try {
        const t = c.locale?.bind?.('workspace')
        const label = t?.('workspace.defaultName')
        if (typeof label === 'string' && label && label !== 'workspace.defaultName') defaultName = label
      } catch { /* keep the fallback name */ }
      const unsubscribe = workspaces.list?.subscribe?.(recompute)
      recompute()
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe()
        ui = undefined
        workspaces = undefined
        layout = undefined
        recompute()
      }
    }, 'dsh-spending-insights: workspaces')
  })
}

const subscribe = l => { listeners.add(l); return () => listeners.delete(l) }
const read = () => snapshot

/** `{ available, items: [{ id, label, path }] }`, live. */
export function useWorkspaces() {
  return useSyncExternalStore(subscribe, read, read)
}

export function lastWorkspace() {
  try { return globalThis.localStorage?.getItem(LAST_WORKSPACE_KEY) ?? undefined } catch { return undefined }
}

function rememberWorkspace(id) {
  try { globalThis.localStorage?.setItem(LAST_WORKSPACE_KEY, id) } catch { /* not persisted */ }
}

/** Open a new session in `workspaceId` with `prompt` in its composer. */
export function askInWorkspace(workspaceId, prompt) {
  if (!ui) throw new Error('当前环境不支持打开对话。')
  rememberWorkspace(workspaceId)
  // Leave this panel for the Conversation first: selecting a panel aborts any
  // pending navigation, so doing it after startSession would cancel the draft.
  layout?.selectPanel?.(null)
  ui.startSession(workspaceId, { prompt, clearPreviousDraft: true })
}
