/**
 * Extrae los diccionarios `en` del cliente de un checkout de DeepSeek Harness.
 * Los valores quedan en ingles a proposito: un diccionario `es` resuelve las
 * claves que no trae por su fallback `en`, asi que un esqueleto en ingles se
 * comporta como uno vacio pero le da al traductor la lista completa de claves.
 *
 * Usage: tsx extract-dictionaries.ts <repo-root> <output-json>
 */
import { globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const [repoRoot, outputPath] = process.argv.slice(2)
if (repoRoot === undefined || outputPath === undefined) {
  console.error('usage: tsx extract-dictionaries.ts <repo-root> <output-json>')
  process.exit(1)
}

const PATTERNS = [
  'packages/*/*/src/client/locales.ts',
  'packages/*/*/src/client/locale.ts',
  'packages/*/*/src/client/*/locales.ts',
  'packages/client/locale/src/locales/*.ts',
]

/** Namespaces cuyo modulo no exporta ni constante NS ni comentario etiquetado. */
const NAMESPACE_OVERRIDES: Record<string, string> = {
  'packages/client/locale/src/locales/en.ts': 'common',
  'packages/client/ui-agent-preset/src/client/locales.ts': 'settings.agentPreset',
  'packages/client/ui-settings-general/src/client/locales.ts': 'settings',
  'packages/client/ui-settings-models/src/client/locales.ts': 'settings.models',
  'packages/client/ui-settings-plugin-inventory/src/client/locales.ts': 'settings.pluginInventory',
  'packages/client/ui-settings-plugins/src/client/locales.ts': 'settings.plugins',
  'packages/client/ui-sidebar-documentpreview/src/client/code/locales.ts': 'sidebarCodePreview',
  'packages/client/ui-sidebar-documentpreview/src/client/html/locales.ts': 'documentHtml',
  'packages/client/ui-sidebar-documentpreview/src/client/image/locales.ts': 'sidebarImage',
  'packages/client/ui-sidebar-documentpreview/src/client/markdown/locales.ts': 'documentMarkdown',
  'packages/client/ui-sidebar-documentpreview/src/client/pdf/locales.ts': 'sidebarPdf',
}

/** Diccionarios registrados desde un array literal en el plugin, no desde un modulo. */
const INLINE_SOURCES: readonly { readonly relative: string; readonly ns: string }[] = [
  { relative: 'packages/client/ui-directory-picker-browse/src/client/index.ts', ns: 'directory-browser' },
]

const ENGLISH_BLOCK_MARKER = "'en', {"

/** Lee un diccionario inline balanceando llaves desde su marcador. */
function extractInlineDictionary(source: string): Record<string, string> | undefined {
  const marker = source.indexOf(ENGLISH_BLOCK_MARKER)
  if (marker === -1) return undefined
  const bodyStart = marker + ENGLISH_BLOCK_MARKER.length
  let depth = 1
  let end = bodyStart
  while (end < source.length && depth > 0) {
    const character = source[end]
    if (character === '{') depth += 1
    else if (character === '}') depth -= 1
    end += 1
  }
  const entries: Record<string, string> = {}
  for (const match of source.slice(bodyStart, end - 1).matchAll(/'([^']+)': '([^']*)'/gu)) {
    entries[match[1]] = match[2]
  }
  return Object.keys(entries).length > 0 ? entries : undefined
}

const isDictionary = (value: unknown): value is Record<string, string> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
  && Object.values(value).every(entry => typeof entry === 'string')

/** Diccionario ingles de un modulo: `en` o un `<nombre>En` con sufijo. */
function pickDictionary(module: Record<string, unknown>): Record<string, string> | undefined {
  const entries = Object.entries(module)
  const exact = entries.find(([name, value]) => name === 'en' && isDictionary(value))
  if (exact !== undefined) return exact[1] as Record<string, string>
  const suffixed = entries.find(([name, value]) => /En$/u.test(name) && isDictionary(value))
  return suffixed?.[1] as Record<string, string> | undefined
}

/** Namespace de un modulo, en orden de declaracion. */
function pickNamespace(module: Record<string, unknown>, source: string): string | undefined {
  const direct = module.NS
  if (typeof direct === 'string') return direct
  const suffixed = Object.entries(module)
    .find(([name, value]) => /NS$/u.test(name) && typeof value === 'string')?.[1]
  if (typeof suffixed === 'string') return suffixed
  const leading = /^\s*\/\*\*([\s\S]*?)\*\//u.exec(source)?.[1]
  return leading?.match(/`([^`]+)`/u)?.[1]
}

const files = [...new Set(PATTERNS.flatMap(pattern => globSync(pattern, { cwd: repoRoot })))].sort()
const namespaces: Record<string, Record<string, string>> = {}
const skipped: string[] = []
const collisions: string[] = []

function merge(ns: string, dictionary: Record<string, string>, origin: string): void {
  const target = namespaces[ns] ??= {}
  for (const [key, value] of Object.entries(dictionary)) {
    const existing = target[key]
    if (existing !== undefined && existing !== value) {
      collisions.push(ns + '.' + key + ' (' + origin + ')')
      continue
    }
    target[key] = value
  }
}

for (const relative of files) {
  const source = readFileSync(join(repoRoot, relative), 'utf8')
  let module: Record<string, unknown>
  try {
    module = await import(pathToFileURL(join(repoRoot, relative)).href) as Record<string, unknown>
  } catch {
    skipped.push(relative + ' (import failed)')
    continue
  }
  const dictionary = pickDictionary(module)
  const ns = NAMESPACE_OVERRIDES[relative.split(sep).join('/')] ?? pickNamespace(module, source)
  if (dictionary === undefined || ns === undefined) {
    skipped.push(relative + ' (' + (dictionary === undefined ? 'no en dict' : 'no ns') + ')')
    continue
  }
  merge(ns, dictionary, relative)
}

for (const { relative, ns } of INLINE_SOURCES) {
  const source = readFileSync(join(repoRoot, relative), 'utf8')
  const dictionary = extractInlineDictionary(source)
  if (dictionary === undefined) {
    skipped.push(relative + ' (no inline en dict)')
    continue
  }
  merge(ns, dictionary, relative)
}

const sorted = Object.fromEntries(
  Object.entries(namespaces).sort(([a], [b]) => a.localeCompare(b)).map(([ns, dict]) => [
    ns,
    Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b))),
  ]),
)
const totalKeys = Object.values(sorted).reduce((sum, dict) => sum + Object.keys(dict).length, 0)
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, JSON.stringify(sorted, null, 2) + String.fromCharCode(10))

console.log('namespaces: ' + Object.keys(sorted).length)
console.log('keys: ' + totalKeys)
console.log('read: ' + (files.length - skipped.length) + '/' + files.length)
if (skipped.length > 0) console.log('skipped: ' + skipped.join(' | '))
if (collisions.length > 0) console.log('collisions: ' + collisions.join(' | '))
