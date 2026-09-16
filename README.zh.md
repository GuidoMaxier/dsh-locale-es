# dsh-locale-es

[Español](README.md) | [English](README.en.md) | 中文

[![dsh.fish](https://dsh.fish/a/dsh-locale-es/badge.svg)](https://dsh.fish/a/dsh-locale-es)

面向 **DeepSeek Harness** Web UI 的**西班牙语（es）**语言包 —— 一个社区开发的 DSH
客户端插件，在*设置 → 通用 → 语言*中新增 **Español**。

它不修改 `node_modules`，也不改动 DeepSeek Harness 源码。它通过官方本地化注册表
（`@deepseek-ai/dsh-client-locale`）注册，未覆盖的键会自动回退到英文。

> **怎么把 DeepSeek Harness 界面改成西班牙语？** 安装本包，在 *设置 → 通用 → 语言*
> 选择 **Español**：它翻译整个 Web UI，不修改 DSH 安装。

## 已验证的版本

| 组件 | 版本 |
|---|---|
| DeepSeek Harness（`@deepseek-ai/*`） | **0.1.6-alpha.1** |
| Node.js | **≥ 22**（在 24 上测试） |

### 兼容性

一个 pack 版本可服务多个 DSH 版本：字典是各版本读取过的 namespace 的并集，多余的
键会被忽略，缺少的键回退英文。

| Pack | DSH |
|---|---|
| 0.1.2 | 0.1.5-rc.1 → 0.1.6-alpha.1 |
| 0.1.1 | 0.1.5-rc.1 → 0.1.5-rc.2 |

升级 DSH 不需要重装本包；见[更新语言包](#更新语言包)。


> DSH 处于 *developer preview* 阶段，会有破坏性变更。本包只使用 locale 注册表的公开
> API（`ctx.locale.addLanguage` / `ctx.locale.register`），因此 DSH 升级不需要改动代码，
> 只需补充新的键（见[开发](#开发)）。

### 全局安装 DSH

```sh
npm install -g @deepseek-ai/dsh@0.1.6-alpha.1
```

**不要用 `@latest`**：npm 注册表上该 tag 指向 `0.1.5-rc.1`，比本包测试所用的版本更旧；
`alpha` tag 指向 `0.1.6-alpha.1`。`dsh --version` 与 `@deepseek-ai/*` 包版本不一致是正常的 —— CLI 与包分别发布。

## 安装

> [!WARNING]
> **不要用 `npm install` 安装本包。** 它不是独立库，而是 DSH 插件。`npm i dsh-locale-es`
> 会把它装到你当前所在的目录，多拉一批 peer dependencies，而 DSH 根本不会加载它 —— 界面
> 仍然是英文。正确的安装方式是下面这一行。

```sh
dsh plugin --profile web add dsh-locale-es
```

包已发布到 npm，该命令安装最新发布版本。要固定到某个 commit（例如测试尚未发布的改动）：

```sh
dsh plugin --profile web add github:GuidoMaxier/dsh-locale-es#<commit>
```

重启 DSH，然后在**设置 → 通用 → 语言**中选择 **Español**。

## 更新语言包

profile 会把安装锁定在 `pnpm-lock.yaml` 里：新版本**不会自动生效**。从 npm 安装时锁定的是
已发布的版本，从 GitHub 安装时锁定的是 commit。两种情况都一样：

```sh
dsh plugin --profile web update
```

之后重启 DSH。`dsh plugin` 是 pnpm 的转发器：`update` 会重新解析依赖，再按实际安装
状态重新对齐 `dsh.profile.bundles`，因此**不需要先卸载再安装**。

更新 **DSH** 本身不需要任何操作。profile 不会自装 harness 包，而是用符号链接指向全局
安装（`~/.dsh/profiles/node_modules/@deepseek-ai/*` → npm 安装目录），所以升级 DSH
版本后本语言包照常加载。

> 为什么没有声明 `@deepseek-ai/dsh-client-locale` 的 `peerDependencies`：node-semver
> 只有当版本区间指明了相同的 `major.minor.patch` 时才接受 prerelease，所以
> `>=0.1.0-rc.6` **不满足** `0.1.6-alpha.1`。已验证的版本见上表；本语言包只使用 locale
> 注册表的公开 API（`ctx.locale.addLanguage` / `ctx.locale.register`）。

## 可以用 pnpm 代替 npm 吗？

**对本包来说，没有可选项。** `dsh plugin` *本身*就是 pnpm 的转发器：它在 profile 目录里
执行 `pnpm <args>`（`apps/cli/src/plugin.ts`）。profile 插件一直由 pnpm 管理 —— 你只需
保证 pnpm 在 PATH 上。

**安装 DSH 本体请用 npm：**

```sh
npm install -g @deepseek-ai/dsh@0.1.6-alpha.1
```

用 pnpm *全局*安装 DSH 会在启动时报 `ERR_MODULE_NOT_FOUND`：DSH 会导入未声明为依赖的包，
而 pnpm 只向每个包暴露它声明的依赖 —— 模块在磁盘上却无法访问。npm 的扁平树可以解析。
已在 Windows / Node 24 + pnpm 11.7.0（本仓库锁定的版本）上复现。

## 卸载

```sh
dsh plugin --profile web remove dsh-locale-es
```

重启 DSH 后界面会回到之前的语言。你保存的偏好（`settings.yaml` 中的
`locale.preference`）会保留，因此重新安装本包时会自动恢复西班牙语；如果希望语言
重新交给浏览器决定，删掉它即可。

## 如何把界面切换成西班牙语

1. 打开**设置**。
2. 进入**通用**。
3. 在**语言**一行选择 **Español**。

该选择保存在 DSH 的设置文档里，重启服务端与浏览器后依然有效。如果你的浏览器本身
就是西班牙语，DSH 会自动检测并启用，无需任何操作。

## 常见问题

**怎么把 DeepSeek Harness 界面改成西班牙语？**
安装本包，重启 DSH，在 *设置 → 通用 → 语言* 选择 **Español**。步骤见[安装](#安装)。

**DSH 自带西班牙语吗？**
不带。界面只有 **English** 和 **中文**，西班牙语来自这样的语言包。

**它翻译模型的回复吗？**
不翻译。它翻译界面：菜单、设置、按钮和可见的工具文案。回复与思考的语言靠提示词
或其它插件设置。

**它和多语言插件有什么不同？**
它把一种语言做深：当前版本 1349 条字串，加上旧版本仍在读取的 26 个键，并有经过
审核的术语表，而不是把精力分摊到多种语言。

**支持哪些 DSH 版本？**
覆盖 0.1.5-rc.1 到 0.1.6-alpha.1，见[兼容性](#兼容性)。

**升级 DSH 会出问题吗？**
不会。该版本不认识的键会被忽略，缺少的键回退英文。

**会改动 DSH 的安装吗？**
不会改动 `node_modules` 或 DeepSeek Harness 源码：它通过公开的本地化 API 注册。

## 截图

![西班牙语界面下的 DSH](docs/screenshots/01-idioma.png)

其余见 [`docs/screenshots/`](docs/screenshots/)。

## 报告翻译问题

请开 issue：<https://github.com/GuidoMaxier/dsh-locale-es/issues>

如果知道，请附上 namespace 与键名（例如 `workspace.rename.session.title`）、你看到的
文本与你的建议、一张截图，以及你的 DSH 版本（`dsh --version`）。文本在
`data/es-dictionaries.json` 中修改；见[开发](#开发)。

## 覆盖范围

- **44 个 namespace · 1349 个键**（对应当前 DSH）—— 已翻译 1214 个。
- **另有 26 个 legacy 键**，属于 5 个 DSH 已不再声明、但 0.1.5 仍在读取的
  namespace，因此用 `@latest` 的用户也不会看到新的英文。
- 覆盖 shell 与设置（`settings`、`settings.models`、`settings.plugins`、
  `settings.agentPreset`、`settings.pluginInventory`、`permission.access`）、
  对话（`chat`、`conversation`）、`trajectory`、`workspace`、`subagent`、
  `workflowRun`、`cordis`、`deliverables`、`approval`、`plan`、`job`、`feedback`、
  `sidebar`、`common` 等。
- 未覆盖的键回退到英文（`es` → `en`），这是 DSH 的官方机制，因此更新的 DSH 也不会
  破坏界面。

## 工作原理

一个普通的 DSH **客户端插件**，分两半：

| 文件 | 作用 |
|---|---|
| `index.js` | Host 半边 —— 有意留空。纯 JavaScript，无构建步骤。 |
| `lib/client.js` | 浏览器半边 —— 生成后**提交入库**；这是浏览器实际下载的文件。 |
| `cordis.patch.yml` | profile 层，把插件挂载为 loader 的一行。 |
| `data/es-dictionaries.json` | 翻译的唯一真实来源。 |
| `data/en-dictionaries.json` | 生成：从 DSH 检出中提取的英文语料。 |
| `data/legacy-dictionaries.json` | 上游已删除、但旧版 DSH 仍在读取的键。 |
| `data/patches/*.json` | 按顺序应用的翻译批次。 |
| `data/terminology.json` | 保持标签简短的短语替换表。 |
| `tools/*.ts` | 提取、构建、同步、检查与进度脚本。 |

### bundle 协议

`lib/client.js` **不是**普通 ESM。`client-modules` 会把所有客户端插件合成一个
bundle，每个模块需要自行注册：

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

只导出 ESM 符号的 bundle 会**加载但不注册**，而 loader 会把这个失败报告到**另一个**
插件上，因为注册计数错位了。`tools/build-client.ts` 输出的是正确形式。

## 开发

脚本需要 DeepSeek Harness 检出中的 `tsx`，因此在检出目录中运行：

```sh
# 从更新后的检出重新提取英文语料
node --import tsx/esm tools/extract-dictionaries.ts <repo-root> data/en-dictionaries.json

# 把新键并入 es，不覆盖已有翻译（新键以英文播种）
# 把上游删除的键移入 legacy，而不是直接丢弃。
node --import tsx/esm tools/sync-es.ts data/en-dictionaries.json data/es-dictionaries.json \
  data/legacy-dictionaries.json

# 应用一个翻译批次（只替换已存在的键）
node --import tsx/esm tools/apply-patch.ts data/es-dictionaries.json data/patches/38-nuevo.json

# 重新生成 bundle —— 并提交结果
node --import tsx/esm tools/build-client.ts data/es-dictionaries.json lib/client.js

# 还剩多少
node --import tsx/esm tools/report-progress.ts data/en-dictionaries.json data/es-dictionaries.json
```

若要在不安装的情况下试用，把本包作为 overlay 挂载。**`--patch` 必须放在 app 自身
的旗标之前**（`web` 子命令使用 `passThroughOptions()`，app 旗标在前会截断 launcher
的解析）：

```sh
pnpm dsh web --patch <repo>/cordis.patch.yml --no-open      # 正确
pnpm dsh web --no-open --patch <repo>/cordis.patch.yml      # error: unknown option
```

如果 profile 里已经安装本包，overlay 会以 `duplicate loader entry id:
dsh-locale-es` 失败。先移除（`dsh plugin --profile web remove dsh-locale-es`），
验证完再装回去。

## 术语

- 西班牙语开发者已在使用的技术术语保留英文：**workspace、plugin、prompt、shell、
  token、timeline、tool calls**。
- 命令 token（`compact`、`export`、`plan`…）一律不翻译：它们是命令行里实际输入的内容。
- 标签有意保持简短。西班牙语比英文长，而定宽元素（按钮、chip、侧边栏行）空间有限；
  `terminology.json` 表记录了这些取舍。

## locale 注册表无法翻译的部分

- **权限预设标识符**（`Read Only`、`Workspace Write`、`Full access`）—— 核心定义它们时
  没有显示名。
- **工具名**（`Bash`、`Read`、`Write`…）—— 技术标识符。
- 模型输出、文件路径等数据，显然不在翻译范围。

## 致谢

**Hernán Casasola** — [LinkedIn](https://www.linkedin.com/in/hernan-casasola) ·
GitHub [@GuidoMaxier](https://github.com/GuidoMaxier)

## 许可与声明

MIT。非官方社区项目，独立开发与维护；未经 DeepSeek 审核或背书。
