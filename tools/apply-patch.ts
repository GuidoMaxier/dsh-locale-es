/**
 * Aplica un parche de traduccion sobre el diccionario es. Cada parche es un
 * JSON { namespace: { clave: "texto en espanol" } }; solo se reemplazan claves
 * que ya existen, asi que una clave renombrada upstream se reporta en vez de
 * crear texto huerfano.
 *
 * Usage: tsx apply-patch.ts <es-dictionaries.json> <patch.json> [patch2.json ...]
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [esPath, ...patchPaths] = process.argv.slice(2)
if (esPath === undefined || patchPaths.length === 0) {
  console.error('usage: tsx apply-patch.ts <es-dictionaries.json> <patch.json> ...')
  process.exit(1)
}

const es = JSON.parse(readFileSync(esPath, 'utf8')) as Record<string, Record<string, string>>
let applied = 0
const unknown: string[] = []

for (const patchPath of patchPaths) {
  const patch = JSON.parse(readFileSync(patchPath, 'utf8')) as Record<string, Record<string, string>>
  for (const [ns, dictionary] of Object.entries(patch)) {
    const target = es[ns]
    if (target === undefined) {
      unknown.push('namespace ' + ns)
      continue
    }
    for (const [key, value] of Object.entries(dictionary)) {
      if (target[key] === undefined) {
        unknown.push(ns + '.' + key)
        continue
      }
      target[key] = value
      applied += 1
    }
  }
}

writeFileSync(esPath, JSON.stringify(es, null, 2) + String.fromCharCode(10))
console.log('applied: ' + applied)
if (unknown.length > 0) console.log('unknown (revisar): ' + unknown.join(' | '))
