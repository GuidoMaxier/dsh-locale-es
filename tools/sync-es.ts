/**
 * Brings the Spanish dictionary in line with a freshly extracted English one:
 * adds keys the translation is missing (seeded with the English text, which the
 * `es` fallback would have shown anyway) and drops keys upstream removed.
 * Existing translations are never overwritten.
 *
 * Usage: tsx sync-es.ts <en-dictionaries.json> <es-dictionaries.json>
 */

import { readFileSync, writeFileSync } from 'node:fs'

const [enPath, esPath] = process.argv.slice(2)
if (enPath === undefined || esPath === undefined) {
  console.error('usage: tsx sync-es.ts <en-dictionaries.json> <es-dictionaries.json>')
  process.exit(1)
}

const en = JSON.parse(readFileSync(enPath, 'utf8')) as Record<string, Record<string, string>>
const es = JSON.parse(readFileSync(esPath, 'utf8')) as Record<string, Record<string, string>>

let added = 0
let removed = 0
let translated = 0

for (const [ns, dictionary] of Object.entries(en)) {
  const target = es[ns] ??= {}
  for (const [key, value] of Object.entries(dictionary)) {
    const current = target[key]
    if (current === undefined) {
      target[key] = value
      added += 1
    } else if (current !== value) {
      translated += 1
    }
  }
}

for (const [ns, dictionary] of Object.entries(es)) {
  for (const key of Object.keys(dictionary)) {
    if (en[ns]?.[key] === undefined) {
      delete dictionary[key]
      removed += 1
    }
  }
  // Un namespace que se quedo sin claves solo registraria un diccionario vacio.
  if (Object.keys(dictionary).length === 0) delete es[ns]
}

writeFileSync(esPath, JSON.stringify(es, null, 2) + String.fromCharCode(10))
console.log('seeded from English: ' + added)
console.log('kept translations: ' + translated)
console.log('dropped (gone upstream): ' + removed)
