# dsh-locale-es

[Español](README.md) | English | [中文](README.zh.md)

Spanish (es) language pack for the **DeepSeek Harness** Web UI — a community DSH
client plugin that adds **Español** to *Settings → General → Language*.

It does not patch `node_modules` or the DeepSeek Harness source. It registers
through the official locale registry (`@deepseek-ai/dsh-client-locale`), and keys
it does not cover fall back to English automatically.

## Install

```sh
dsh plugin --profile web add github:GuidoMaxier/dsh-locale-es
```

Restart DSH, then open **Settings → General → Language** and pick **Español**.

## Scope

- **42 namespaces · 1305 keys** — 1174 translated.
- Covers the shell and settings (`settings`, `settings.models`, `settings.plugins`,
  `settings.agentPreset`, `settings.pluginInventory`, `settings.permission`), chat
  and conversation (`chat`, `conversation`), `trajectory`, `workspace`, `subagent`,
  `workflowRun`, `cordis`, `deliverables`, `approval`, `plan`, `job`, `feedback`,
  `sidebar`, `common`, and the rest.
- Missing keys fall back to English (`es` → `en`), which is the official DSH
  mechanism, so a newer DSH never breaks the UI.

## How it works

A regular DSH **client plugin**, in two halves:

| File | Role |
|---|---|
| `index.js` | Host half — empty on purpose. Plain JavaScript, no build step. |
| `lib/client.js` | Browser half — generated, and **committed**; this is what the browser downloads. |
| `cordis.patch.yml` | Profile layer that mounts the plugin as a loader row. |
| `data/es-dictionaries.json` | Translation source of truth. |
| `data/en-dictionaries.json` | Generated: the English corpus extracted from a DSH checkout. |
| `data/patches/*.json` | Translation batches, applied in order. |
| `data/terminology.json` | Phrase substitutions that keep labels short. |
| `tools/*.ts` | Extraction, build, sync, check and progress scripts. |

### The bundle protocol

`lib/client.js` is **not** plain ESM. `client-modules` composes one bundle with
every client plugin, and each module registers itself:

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

A bundle that only exports ESM symbols **loads without registering**, and the
loader then reports the failure against a *different* plugin, because the
registration count desynchronizes. `tools/build-client.ts` emits the correct form.

## Development

The scripts need `tsx` from a DeepSeek Harness checkout, so run them there:

```sh
# Re-extract the English corpus from an updated checkout
node --import tsx/esm tools/extract-dictionaries.ts <repo-root> data/en-dictionaries.json

# Bring new keys into es without overwriting translations (seeded in English)
node --import tsx/esm tools/sync-es.ts data/en-dictionaries.json data/es-dictionaries.json

# Apply a translation batch (replaces existing keys only)
node --import tsx/esm tools/apply-patch.ts data/es-dictionaries.json data/patches/38-nuevo.json

# Rebuild the browser bundle — commit the result
node --import tsx/esm tools/build-client.ts data/es-dictionaries.json lib/client.js

# What is still pending
node --import tsx/esm tools/report-progress.ts data/en-dictionaries.json data/es-dictionaries.json
```

To test without installing, mount the pack as an overlay. **`--patch` must come
before the app's own flags** (the `web` subcommand uses `passThroughOptions()`, so
an app flag first cuts the launcher's parse):

```sh
pnpm dsh web --patch <repo>/cordis.patch.yml --no-open      # correct
pnpm dsh web --no-open --patch <repo>/cordis.patch.yml      # error: unknown option
```

## Terminology

- Technical terms stay in English where Spanish-speaking developers already use
  them: **workspace, plugin, prompt, shell, token, timeline, tool calls**.
- Command tokens (`compact`, `export`, `plan`…) are never translated: they are what
  you type on the command line.
- Labels are kept short on purpose. Spanish runs longer than English, and
  fixed-width elements (buttons, chips, sidebar rows) have little room; the
  `terminology.json` table is the reviewed record of those choices.

## What the locale registry cannot translate

- **Permission preset identifiers** (`Read Only`, `Workspace Write`, `Full access`)
  — the core defines them without display names.
- **Tool names** (`Bash`, `Read`, `Write`, …) — technical identifiers.
- Model output, file paths and other data, obviously.

## Credits

**Hernán Casasola** — [LinkedIn](https://www.linkedin.com/in/hernan-casasola) ·
GitHub [@GuidoMaxier](https://github.com/GuidoMaxier)

## License and disclaimer

MIT. Unofficial community project, independently developed and maintained; not
reviewed or endorsed by DeepSeek.
