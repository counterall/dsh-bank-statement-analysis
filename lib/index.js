// Host half of dsh-spending-insights. All work happens in the browser half
// (lib/client.js): the CSV is parsed and stored locally in the Web Client, so
// the host only needs to be present for the client-module scan to pick us up.
export const name = 'dsh-spending-insights'

export function apply() {}
