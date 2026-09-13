/**
 * Etiquetas cortas cuya traduccion se estira demasiado: donde el ingles es
 * telegrafico (botones, chips, pestanas) el layout reserva poco ancho y el
 * texto desborda en vez de envolver.
 *
 * Con --visible excluye las claves que son descripcion, ayuda o nombre
 * accesible: esas envuelven en varias lineas y su longitud no rompe nada.
 *
 * Usage: tsx find-long.ts <en.json> <es.json> [minRatio] [maxEnLength] [minDelta] [--visible]
 */
import { readFileSync } from 'node:fs'

const [enPath, esPath] = process.argv.slice(2)
if (enPath === undefined || esPath === undefined) {
  console.error('usage: tsx find-long.ts <en.json> <es.json> [minRatio] [maxEnLength] [minDelta] [--visible]')
  process.exit(1)
}

const minRatio = Number(process.argv[4] ?? '1.3')
const maxEnLength = Number(process.argv[5] ?? '30')
const minDelta = Number(process.argv[6] ?? '5')
const onlyVisible = process.argv.includes('--visible')

/** Claves cuyo texto envuelve en varias lineas: su longitud no rompe el layout. */
const WRAPPING_KEY = /aria|hint|description|body|placeholder|tooltip|Detail/i

const en = JSON.parse(readFileSync(enPath, 'utf8')) as Record<string, Record<string, string>>
const es = JSON.parse(readFileSync(esPath, 'utf8')) as Record<string, Record<string, string>>

const rows: { ns: string; key: string; enText: string; esText: string; delta: number }[] = []

for (const ns of Object.keys(en)) {
  for (const [key, enText] of Object.entries(en[ns])) {
    if (onlyVisible && WRAPPING_KEY.test(key)) continue
    const esText = es[ns]?.[key]
    if (typeof esText !== 'string' || esText === enText) continue
    if (enText.length > maxEnLength) continue
    if (esText.length - enText.length < minDelta) continue
    if (esText.length / enText.length < minRatio) continue
    rows.push({ ns, key, enText, esText, delta: esText.length - enText.length })
  }
}

rows.sort((a, b) => b.delta - a.delta)
console.log('etiquetas cortas en riesgo: ' + rows.length)
for (const row of rows.slice(0, 40)) {
  console.log('+' + row.delta + '  ' + row.ns + '.' + row.key)
  console.log('     en: ' + row.enText)
  console.log('     es: ' + row.esText)
}
