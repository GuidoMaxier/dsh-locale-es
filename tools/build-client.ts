/**
 * Genera el bundle de navegador (`lib/client.js`) a partir del diccionario es.
 *
 * El bundle NO es ESM plano: client-modules compone un bundle compuesto con los
 * demas plugins y espera que cada modulo se registre llamando a
 * `window.__ModuleLoader__.load({ id, factory })`. Un bundle que solo exporta
 * los simbolos carga sin registrarse y desalinea el resto del bundle, que
 * termina fallando con "loaded without registering <otro-plugin>".
 *
 * Usage: tsx build-client.ts <dictionaries.json> <output-client-js>
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const [inputPath, outputPath] = process.argv.slice(2)
if (inputPath === undefined || outputPath === undefined) {
  console.error('usage: tsx build-client.ts <dictionaries.json> <output-client-js>')
  process.exit(1)
}

const packRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const manifest = JSON.parse(readFileSync(join(packRoot, 'package.json'), 'utf8')) as { name: string }
const dictionaries = JSON.parse(readFileSync(inputPath, 'utf8')) as Record<string, Record<string, string>>
const namespaces = Object.keys(dictionaries)

const source = [
  '/**',
  ' * Paquete de idioma espanol (es) para el texto de cliente de DeepSeek Harness.',
  ' *',
  ' * Generado por tools/build-client.ts — no editar a mano; editar',
  ' * data/es-dictionaries.json y regenerar.',
  ' */',
  'window.__ModuleLoader__.load({',
  '  id: ' + JSON.stringify(manifest.name) + ',',
  '  factory: () => {',
  '    const module = { exports: {} }',
  '    const exports = module.exports',
  '    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })',
  '    exports.inject = ["locale"]',
  '    exports.apply = function apply(ctx) {',
  '      ctx.effect(',
  '        () => ctx.locale.addLanguage({ id: "es", label: "Español", fallback: "en" }),',
  '        "' + manifest.name + ': language",',
  '      )',
  '      const dictionaries = ' + JSON.stringify(dictionaries, null, 2),
  '      for (const ns of Object.keys(dictionaries)) {',
  '        ctx.effect(',
  '          () => ctx.locale.register(ns, "es", dictionaries[ns]),',
  '          "' + manifest.name + ': " + ns + " dictionary",',
  '        )',
  '      }',
  '    }',
  '    return module.exports',
  '  },',
  '})',
  '',
].join(String.fromCharCode(10))

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, source)
console.log('client bundle: ' + outputPath)
console.log('id: ' + manifest.name)
console.log('namespaces: ' + namespaces.length)
