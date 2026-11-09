// Browser-side calls into the host half's `spendingInsights` Remote service,
// over the Client connection's unary RPC channel (`/api/<namespace>/<method>`).

const NAMESPACE = 'spendingInsights'

let connection
const waiters = new Set()

/** Called from apply(): track the Client connection while it is available. */
export function bindConnection(ctx) {
  ctx.inject(['connection'], c => {
    c.effect(() => {
      connection = c.connection
      for (const w of waiters) w()
      waiters.clear()
      return () => { connection = undefined }
    }, 'dsh-spending-insights: connection')
  })
}

function ready(signal) {
  if (connection) return Promise.resolve(connection)
  return new Promise((resolve, reject) => {
    const done = () => resolve(connection)
    waiters.add(done)
    signal?.addEventListener('abort', () => { waiters.delete(done); reject(signal.reason) }, { once: true })
  })
}

/**
 * Call one host method with named arguments.
 * @returns the method's value; throws with a readable message on failure.
 */
export async function call(method, args = {}, signal) {
  const conn = await ready(signal)
  const result = await conn.rpc.call('/api', `${NAMESPACE}/${method}`, { args }, signal)
  if (!result?.ok) {
    const error = result?.error
    const message = error?.message ?? error?.code ?? 'unknown error'
    if (/invocation-unavailable|not found|404/i.test(String(error?.code ?? message))) {
      throw new Error('宿主端插件未加载，请重启 DeepSeek Harness 后再试。')
    }
    throw new Error(message)
  }
  return result.value
}
