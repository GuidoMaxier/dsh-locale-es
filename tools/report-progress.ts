/**
 * Informa el avance de traduccion por namespace: claves totales, traducidas
 * (valor distinto del ingles) y pendientes. Con --pending <ns> lista las claves
 * que faltan de un namespace.
 *
 * Usage: tsx report-progress.ts <en.json> <es.json> [--pending <ns>]
 */
import { readFileSync } from 'node:fs'

const [enPath, esPath] = process.argv.slice(2)
if (enPath === undefined || esPath === undefined) {
  console.error('usage: tsx report-progress.ts <en.json> <es.json> [--pending <ns>]')
  process.exit(1)
}

const en = JSON.parse(readFileSync(enPath, 'utf8')) as Record<string, Record<string, string>>
const es = JSON.parse(readFileSync(esPath, 'utf8')) as Record<string, Record<string, string>>
const extra = process.argv.slice(4)

const pendingByNs: Record<string, string[]> = {}
let total = 0
let done = 0

for (const ns of Object.keys(en)) {
  const enDict = en[ns]
  const esDict = es[ns] ?? {}
  const pending: string[] = []
  for (const [key, value] of Object.entries(enDict)) {
    total += 1
    if (esDict[key] !== undefined && esDict[key] !== value) done += 1
    else pending.push(key)
  }
  pendingByNs[ns] = pending
}

if (extra[0] === '--pending' && extra[1] !== undefined) {
  const ns = extra[1]
  console.log('pendientes en ' + ns + ' (' + (pendingByNs[ns]?.length ?? 0) + '):')
  for (const key of pendingByNs[ns] ?? []) console.log('  ' + key)
} else {
  const rows = Object.keys(en)
    .map(ns => ({ ns, n: Object.keys(en[ns]).length, p: pendingByNs[ns].length }))
    .sort((a, b) => b.p - a.p)
  console.log('TOTAL: ' + done + '/' + total + ' traducidas (' + Math.round(done / total * 100) + '%)')
  console.log('')
  console.log('pendientes  total  namespace')
  for (const row of rows) {
    if (row.p === 0) continue
    console.log(String(row.p).padStart(9) + '  ' + String(row.n).padStart(5) + '  ' + row.ns)
  }
  const complete = rows.filter(r => r.p === 0).length
  console.log('')
  console.log('namespaces: ' + rows.length + ' (' + complete + ' completos)')
}
