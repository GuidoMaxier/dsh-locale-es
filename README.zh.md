# dsh-locale-es

[Español](README.md) | [English](README.en.md) | 中文

面向 **DeepSeek Harness** Web UI 的**西班牙语（es）**语言包 —— 一个社区开发的 DSH
客户端插件，在*设置 → 通用 → 语言*中新增 **Español**。

它不修改 `node_modules`，也不改动 DeepSeek Harness 源码。它通过官方本地化注册表
（`@deepseek-ai/dsh-client-locale`）注册，未覆盖的键会自动回退到英文。

## 已验证的版本

| 组件 | 版本 |
|---|---|
| DeepSeek Harness（`@deepseek-ai/*`） | **0.1.5-rc.2** |
| Node.js | **≥ 22**（在 24 上测试） |

> DSH 处于 *developer preview* 阶段，会有破坏性变更。本包只使用 locale 注册表的公开
> API（`ctx.locale.addLanguage` / `ctx.locale.register`），因此 DSH 升级不需要改动代码，
> 只需补充新的键（见[开发](#开发)）。

### 全局安装 DSH

```sh
npm install -g @deepseek-ai/dsh@0.1.5-rc.2
```

**不要用 `@latest`**：npm 注册表上该 tag 指向 `0.1.5-rc.1`，比本包测试所用的版本更旧。
`dsh --version` 与 `@deepseek-ai/*` 包版本不一致是正常的 —— CLI 与包分别发布。

## 安装

```sh
dsh plugin --profile web add github:GuidoMaxier/dsh-locale-es
```

重启 DSH，然后在**设置 → 通用 → 语言**中选择 **Español**。

## 覆盖范围

- **42 个 namespace · 1305 个键** —— 已翻译 1174 个。
- 覆盖 shell 与设置（`settings`、`settings.models`、`settings.plugins`、
  `settings.agentPreset`、`settings.pluginInventory`、`settings.permission`）、
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
node --import tsx/esm tools/sync-es.ts data/en-dictionaries.json data/es-dictionaries.json

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
