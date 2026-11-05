// Builds lib/client.js in the DSH Web Client module format:
//   window.__ModuleLoader__.load({ id: <package name>, factory: require => module.exports })
// React comes from the host's shared module table (never bundled).
import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(`${root}/package.json`, 'utf8'))

const result = await build({
  entryPoints: [`${root}/src/client.jsx`],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  minify: process.argv.includes('--minify'),
  write: false,
  legalComments: 'none',
})

const body = result.outputFiles[0].text
const out = `/**
 * ${pkg.name} v${pkg.version} — ${pkg.description}
 */
window.__ModuleLoader__.load({id:${JSON.stringify(pkg.name)},factory:require=>{var module={exports:{}},exports=module.exports;
${body}
return module.exports}});
`
writeFileSync(`${root}/lib/client.js`, out)
console.log(`lib/client.js written (${(out.length / 1024).toFixed(1)} KiB)`)
