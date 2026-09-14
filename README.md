# dsh-locale-es

Español | [English](README.en.md) | [中文](README.zh.md)

Paquete de idioma **español (es)** para la interfaz web de **DeepSeek Harness** —
un plugin de cliente de la comunidad que agrega **Español** a
*Ajustes → General → Idioma*.

No modifica `node_modules` ni el código de DeepSeek Harness. Se registra a través
del sistema oficial de localización (`@deepseek-ai/dsh-client-locale`), y las
claves sin traducir caen al inglés automáticamente.

## Versiones verificadas

| Componente | Versión |
|---|---|
| DeepSeek Harness (`@deepseek-ai/*`) | **0.1.5-rc.2** |
| Node.js | **≥ 22** (probado en 24) |

> DSH está en *developer preview* y tiene cambios que rompen compatibilidad. Este pack
> solo usa el API público del registro de locale (`ctx.locale.addLanguage` /
> `ctx.locale.register`), así que las actualizaciones de DSH no exigen cambios de
> código: solo agregar las claves nuevas (ver [Desarrollo](#desarrollo)).

### Si instalás DSH globalmente

```sh
npm install -g @deepseek-ai/dsh@0.1.5-rc.2
```

**No uses `@latest`**: en el registro de npm ese tag apunta a `0.1.5-rc.1`, anterior a
la versión contra la que se probó este pack. Es normal que `dsh --version` difiera de
la versión de los paquetes `@deepseek-ai/*` — el CLI y los paquetes se publican por
separado.

## Instalación

```sh
dsh plugin --profile web add github:GuidoMaxier/dsh-locale-es
```

Reiniciá DSH y elegí **Español** en *Ajustes → General → Idioma*.

## Actualizar el pack

El profile fija esta dependencia a un commit — pnpm escribe la resolución en su
`pnpm-lock.yaml` — así que **un push nuevo al repositorio no llega solo**. Para traerlo:

```sh
dsh plugin --profile web update
```

Reiniciá DSH después. `dsh plugin` es un pasamanos de pnpm
([`apps/cli/src/plugin.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/plugin.ts)):
`update` vuelve a resolver la dependencia y después reconcilia `dsh.profile.bundles`
contra lo instalado, así que **no hace falta desinstalar y volver a instalar**.

Actualizar **DSH** no requiere nada de esto. El profile no instala sus propios
paquetes del harness: los enlaza por symlink a la instalación global
(`~/.dsh/profiles/node_modules/@deepseek-ai/*` → la instalación de npm), así que al
subir de versión DSH el pack sigue cargando sin tocar nada.

> Por qué no hay `peerDependencies` sobre `@deepseek-ai/dsh-client-locale`: node-semver
> solo acepta un prerelease si el rango nombra ese mismo `major.minor.patch`, así que
> `>=0.1.0-rc.6` **no** satisface a `0.1.5-rc.2`. La versión verificada está en la tabla
> de arriba; el pack solo usa el API público del registro de locale
> (`ctx.locale.addLanguage` / `ctx.locale.register`).

## ¿Se puede usar pnpm en vez de npm?

**Para el pack no hay nada que elegir.** `dsh plugin` *es* un pasamanos de pnpm: ejecuta
`pnpm <args>` dentro del directorio del profile (`apps/cli/src/plugin.ts`). pnpm ya es lo
que gestiona los plugins del profile — solo necesita estar en el PATH.

**Para instalar DSH en sí, usá npm:**

```sh
npm install -g @deepseek-ai/dsh@0.1.5-rc.2
```

Una instalación *global* de DSH con pnpm falla al arrancar con `ERR_MODULE_NOT_FOUND`:
DSH importa paquetes que no declara como dependencias, y pnpm solo le expone a cada
paquete sus dependencias declaradas — así que los módulos están en disco pero son
inaccesibles. El árbol plano de npm los resuelve. Comprobado en Windows / Node 24 con
pnpm 11.7.0, la versión que fija este repositorio.

## Desinstalar

```sh
dsh plugin --profile web remove dsh-locale-es
```

Reiniciá DSH y la interfaz vuelve al idioma anterior. Tu preferencia guardada
(`locale.preference` en `settings.yaml`) se conserva, así que si volvés a instalar el
pack el español se activa solo; borrala si querés que la elección vuelva a depender del
navegador.

## Cómo elegir el idioma

1. Abrí **Ajustes**.
2. Entrá en **General**.
3. En la fila **Idioma**, elegí **Español**.

La elección se guarda en el documento de ajustes de DSH y sobrevive reinicios del
servidor y del navegador. Si tu navegador ya está en español, DSH lo detecta y lo activa
sin que toques nada.

## Capturas

![La interfaz de DSH en español](docs/screenshots/01-idioma.png)

Ver [`docs/screenshots/`](docs/screenshots/) para el resto.

## Reportar un error de traducción

Abrí un issue: <https://github.com/GuidoMaxier/dsh-locale-es/issues>

Incluí el namespace y la clave si los conocés (por ejemplo
`workspace.rename.session.title`), el texto que ves y tu propuesta, una captura, y tu
versión de DSH (`dsh --version`). Los textos se editan en `data/es-dictionaries.json`;
ver [Desarrollo](#desarrollo).

## Cobertura

- **42 namespaces · 1305 claves** — 1174 traducidas.
- Cubre el shell y los ajustes (`settings`, `settings.models`, `settings.plugins`,
  `settings.agentPreset`, `settings.pluginInventory`, `settings.permission`), chat
  y conversación (`chat`, `conversation`), `trajectory`, `workspace`, `subagent`,
  `workflowRun`, `cordis`, `deliverables`, `approval`, `plan`, `job`, `feedback`,
  `sidebar`, `common` y el resto.
- Las claves sin cubrir caen al inglés (`es` → `en`), que es el mecanismo oficial
  de DSH: una versión más nueva nunca rompe la interfaz.

## Cómo funciona

Un **plugin de cliente** de DSH normal, en dos mitades:

| Archivo | Rol |
|---|---|
| `index.js` | Mitad Host — vacía a propósito. JavaScript plano, sin build. |
| `lib/client.js` | Mitad navegador — generado, y **commiteado**; es lo que descarga el navegador. |
| `cordis.patch.yml` | Capa de perfil que monta el plugin como fila del loader. |
| `data/es-dictionaries.json` | Fuente de verdad de la traducción. |
| `data/en-dictionaries.json` | Generado: el corpus inglés extraído de un checkout de DSH. |
| `data/patches/*.json` | Lotes de traducción, aplicados en orden. |
| `data/terminology.json` | Sustituciones de frase que mantienen las etiquetas cortas. |
| `tools/*.ts` | Scripts de extracción, build, sincronización, control y progreso. |

### El protocolo del bundle

`lib/client.js` **no** es ESM plano. `client-modules` compone un único bundle con
todos los plugins de cliente, y cada módulo se registra a sí mismo:

```js
window.__ModuleLoader__.load({
  id: "dsh-locale-es",
  factory: () => {
    const module = { exports: {} }
    exports.inject = ["locale"]
    exports.apply = function apply(ctx) { /* … */ }
    return module.exports
  },
})
```

Un bundle que solo exporta símbolos ESM **carga sin registrarse**, y el loader
reporta el error contra **otro** plugin, porque el conteo de registros se
desalinea. `tools/build-client.ts` emite la forma correcta.

## Desarrollo

Los scripts necesitan `tsx` de un checkout de DeepSeek Harness, así que corren ahí:

```sh
# Re-extraer el corpus inglés de un checkout actualizado
node --import tsx/esm tools/extract-dictionaries.ts <repo-root> data/en-dictionaries.json

# Traer las claves nuevas sin pisar lo traducido (se siembran en inglés)
node --import tsx/esm tools/sync-es.ts data/en-dictionaries.json data/es-dictionaries.json

# Aplicar un lote de traducción (reemplaza solo claves existentes)
node --import tsx/esm tools/apply-patch.ts data/es-dictionaries.json data/patches/38-nuevo.json

# Regenerar el bundle — commitear el resultado
node --import tsx/esm tools/build-client.ts data/es-dictionaries.json lib/client.js

# Qué falta todavía
node --import tsx/esm tools/report-progress.ts data/en-dictionaries.json data/es-dictionaries.json
```

Para probar sin instalar, montá el pack como overlay. **`--patch` va antes de los
flags del app** (el subcomando `web` usa `passThroughOptions()`, así que un flag
del app primero corta el parseo del launcher):

```sh
pnpm dsh web --patch <repo>/cordis.patch.yml --no-open      # correcto
pnpm dsh web --no-open --patch <repo>/cordis.patch.yml      # error: unknown option
```

## Terminología

- Los términos técnicos se quedan en inglés donde los desarrolladores hispanos ya
  los usan: **workspace, plugin, prompt, shell, token, timeline, tool calls**.
- Los tokens de comando (`compact`, `export`, `plan`…) no se traducen nunca: son lo
  que se escribe en la línea de comandos.
- Las etiquetas se mantienen cortas a propósito. El español es más largo que el
  inglés y los elementos de ancho fijo (botones, chips, filas del sidebar) tienen
  poco espacio; la tabla `terminology.json` es el registro revisado de esas
  decisiones.

## Lo que el registro de locale no puede traducir

- **Identificadores de presets de permisos** (`Read Only`, `Workspace Write`,
  `Full access`) — el core los define sin nombres para mostrar.
- **Nombres de herramientas** (`Bash`, `Read`, `Write`, …) — identificadores técnicos.
- La salida del modelo, las rutas de archivos y otros datos, obviamente.

## Créditos

**Hernán Casasola** — [LinkedIn](https://www.linkedin.com/in/hernan-casasola) ·
GitHub [@GuidoMaxier](https://github.com/GuidoMaxier)

## Licencia y aviso

MIT. Proyecto no oficial de la comunidad, desarrollado y mantenido de forma
independiente; no fue revisado ni respaldado por DeepSeek.
