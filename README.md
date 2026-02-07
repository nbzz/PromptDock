# PromptDock

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nbzz/PromptDock)

PromptDock 是一个极简的 Prompt 工作台：导入模板、填变量、一键复制并跳转到 AI 平台。  
在线体验: [promptdock.ittz.top](https://promptdock.ittz.top)

PromptDock is a lightweight prompt workspace: import templates, fill variables, then copy and jump to AI platforms.
Live demo: [promptdock.ittz.top](https://promptdock.ittz.top)

## Features

- 导入和管理 `.md` Prompt 模板
- 自动识别 `[]` 变量并生成可视化表单
- 多平台快捷动作（复制并打开）
- 历史记录一键复用
- 模板导出 Markdown
- 股票搜索增强（A/H/US，多市场联想）

## Supported Platforms

- Perplexity
- Grok
- OpenAI
- Gemini
- Claude
- 元宝
- DeepSeek
- Kimi
- 豆包

说明 / Note: 大多数第三方站点限制跨站自动填充，所以采用“复制后打开”模式。

## Template Format

### Basic

```md
请分析 [股票] 在 [今天] 的走势。
```

### Optional YAML Front Matter

```md
---
title: 个股分析
variables:
  股票:
    type: stock
    required: true
    placeholder: 输入股票代码或名称
  今天:
    autoFill: date
---
请分析 [股票] 在 [今天] 的走势。
```

### Auto-fill Whitelist

Only these placeholders are auto-filled. Others in `[]` are manual fields.

- `[今天]`
- `[日期]`
- `[当前日期]`
- `[时间]`
- `[当前时间]`
- `[日期时间]`
- `[当前日期时间]`
- `[星期]`
- `[本月]`
- `[本季度]`
- `[时间戳]`
- `[最近交易日]`

## Add Public Prompts

推荐方式（推荐）: GitHub Pull Request  
Recommended way: submit via GitHub Pull Request

1. 在 `prompts/` 目录新增或修改 `.md` 文件
2. 文件名尽量语义清晰，例如 `a-share-analysis.md`
3. 变量使用 `[]`，例如 `[股票]` `[今天]`
4. 提交 PR，描述用途和输入变量

仓库: [nbzz/PromptDock](https://github.com/nbzz/PromptDock)  
PR 地址: [https://github.com/nbzz/PromptDock/pulls](https://github.com/nbzz/PromptDock/pulls)

你也可以通过邮件投稿模板: [tz@ittz.top](mailto:tz@ittz.top)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy

### Vercel (One Click)

Click the deploy button at the top of this README.

### Manual

1. Import this repo into Vercel
2. Optionally set `CRON_SECRET`
3. Deploy
4. Check `vercel.json` cron schedule

## Stock Data (Short)

- API: `/api/stocks`
- Cron update: `/api/cron/update-stocks`
- Local base+delta mode is supported
- Data sources are from maintained GitHub datasets

## Tech Stack

- Next.js 15 + TypeScript
- Tailwind CSS
- PWA (Service Worker + Manifest)
- Vercel (Hosting + Cron)

## Project Structure

```text
app/            # pages and api routes
components/     # UI components
lib/            # parser, storage, stocks logic
prompts/        # built-in markdown templates
data/           # stock base/delta data
scripts/        # stock data fetch scripts
```

## Roadmap

- Template Market UI (reserved schema already exists)
- Better community template ranking/filtering
- More robust cross-platform actions

## License

[MIT](./LICENSE)
