/**
 * Aplica la tabla de terminologia al diccionario es: sustituciones de frase que
 * acortan la traduccion para que las etiquetas entren en el ancho que el layout
 * reserva. La tabla es el registro revisable de cada cambio de termino.
 *
 * Usage: tsx apply-terminology.ts <es.json> <terminology.json>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [esPath, tablePath] = process.argv.slice(2)
if (esPath === undefined || tablePath === undefined) {
  console.error('usage: tsx apply-terminology.ts <es.json> <terminology.json>')
  process.exit(1)
}

const es = JSON.parse(readFileSync(esPath, 'utf8')) as Record<string, Record<string, string>>
const table = JSON.parse(readFileSync(tablePath, 'utf8')) as [string, string][]

let changed = 0
for (const ns of Object.keys(es)) {
  for (const key of Object.keys(es[ns])) {
    const before = es[ns][key]
    let value = before
    for (const [from, to] of table) value = value.split(from).join(to)
    if (value !== before) {
      es[ns][key] = value
      changed += 1
    }
  }
}

writeFileSync(esPath, JSON.stringify(es, null, 2) + String.fromCharCode(10))
console.log('valores acortados: ' + changed)
