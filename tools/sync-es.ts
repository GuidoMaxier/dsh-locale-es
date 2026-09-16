/**
 * Brings the Spanish dictionary in line with a freshly extracted English one:
 * adds keys the translation is missing (seeded with the English text, which the
 * `es` fallback would have shown anyway) and moves to the legacy dictionary the
 * keys upstream removed, which older DSH builds still read. Existing
 * translations are never overwritten.
 *
 * Usage: tsx sync-es.ts <en-dictionaries.json> <es-dictionaries.json> [legacy-dictionaries.json]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const [enPath, esPath, legacyPath] = process.argv.slice(2)
if (enPath === undefined || esPath === undefined) {
  console.error('usage: tsx sync-es.ts <en-dictionaries.json> <es-dictionaries.json> [legacy-dictionaries.json]')
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

const legacy = legacyPath !== undefined && existsSync(legacyPath)
  ? JSON.parse(readFileSync(legacyPath, 'utf8')) as Record<string, Record<string, string>>
  : {}

for (const [ns, dictionary] of Object.entries(es)) {
  for (const key of Object.keys(dictionary)) {
    if (en[ns]?.[key] === undefined) {
      // Una version anterior de DSH todavia lee esta clave.
      ;(legacy[ns] ??= {})[key] = dictionary[key]
      delete dictionary[key]
      removed += 1
    }
  }
  // Un namespace que se quedo sin claves solo registraria un diccionario vacio.
  if (Object.keys(dictionary).length === 0) delete es[ns]
}

// Clave que volvio upstream: gana la viva y se elimina la copia legacy.
for (const [ns, entries] of Object.entries(legacy)) {
  for (const key of Object.keys(entries)) {
    if (en[ns]?.[key] !== undefined || es[ns]?.[key] !== undefined) delete entries[key]
  }
  if (Object.keys(entries).length === 0) delete legacy[ns]
}

writeFileSync(esPath, JSON.stringify(es, null, 2) + String.fromCharCode(10))
console.log('seeded from English: ' + added)
console.log('kept translations: ' + translated)
console.log('moved to legacy: ' + removed)
if (legacyPath !== undefined) {
  const sortedLegacy = Object.fromEntries(
    Object.entries(legacy).sort(([a], [b]) => a.localeCompare(b)).map(([ns, entries]) => [
      ns,
      Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))),
    ]),
  )
  writeFileSync(legacyPath, JSON.stringify(sortedLegacy, null, 2) + String.fromCharCode(10))
  const kept = Object.values(sortedLegacy).reduce((sum, entries) => sum + Object.keys(entries).length, 0)
  console.log('legacy keys kept: ' + kept)
}
