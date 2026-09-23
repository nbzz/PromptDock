# PromptDock

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![PWA](https://img.shields.io/badge/PWA-supported-0ea5a5)

**Language**: 中文 | [English](#english)

PromptDock 是一个轻量、直接可用的 Prompt 工作台：
导入模板、填写变量、复制并跳转到 AI 平台。

在线地址: [promptdock.ittz.top](https://promptdock.ittz.top)

## 核心功能

- 导入和管理 `.md` 模板
- 自动识别 `[]` 变量并生成可视化表单
- 快捷动作：复制并跳转到多个 AI 平台
- 模板编辑、导出 Markdown、删除本地模板
- 股票搜索增强（A/H/US 联想）
- PWA 支持（手机可安装）

## 移动端（< 1024px）布局约定

移动端与桌面端是两套呈现，统一用 Tailwind 的 `lg:` 前缀区分（≥1024px 走桌面版）。

- 模板列表：移动端为 **2 列卡片**、标题自动换行；桌面端为单列长列表
- 搜索框与分类标签在移动端常显（已移除「筛选」开关）
- 「模板与预览」默认展开，点标题可收起
- 以下功能**仅桌面端显示**：新建 / 上传 .md / 从链接导入、最近使用、高级设置、自动变量、模板来源标签（「内置模板」）
- 底部为常驻吸底操作条：「仅复制」+ 各 AI 平台按钮，两行平铺

## 内置模板（当前顺序）

1. 30分钟投资备忘录（默认进入即选中）
2. 个股分析
3. 由新闻分析个股板块影响
4. 枯燥报告转生动网页
5. 其他通用模板

## 支持平台

- Perplexity
- Grok
- OpenAI
- Gemini
- Claude
- 元宝
- DeepSeek
- Kimi
- 豆包

说明：多数第三方站点限制跨站自动填充，因此采用“先复制，再跳转”的通用方式。

## 模板写法

模板正文可直接使用，不需要固定“开场吟唱语法”。

### 最简模板

```md
请分析 [股票] 在 [今天] 的走势。
```

### 可选 Front Matter

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

### 自动变量白名单

以下变量名会自动填充（其余 `[]` 一律手动输入）：

- `[今天]`
- `[今日]`
- `[日期]`
- `[当前日期]`
- `[current_date]`
- `[today]`
- `[时间]`
- `[当前时间]`
- `[current_time]`
- `[日期时间]`
- `[当前日期时间]`
- `[current_datetime]`
- `[now]`
- `[星期]`
- `[周几]`
- `[本月]`
- `[当前月份]`
- `[当前年月]`
- `[本季度]`
- `[当前季度]`
- `[时间戳]`
- `[UNIX时间戳]`
- `[Unix时间戳]`
- `[最近交易日]`
- `[交易日]`
- `[最新交易日]`

另外，若模板 frontmatter 显式配置 `autoFill`，也支持以下类型：
`date | time | datetime | weekday | month | quarter | timestamp | trading_day`

## 快速开始

```bash
npm install
npm run dev
```

访问: [http://localhost:3000](http://localhost:3000)

## 部署

### Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nbzz/PromptDock)

### 手动部署

1. 导入本仓库到 Vercel
2. 可选设置 `CRON_SECRET`
3. Deploy
4. 检查 `vercel.json` 的 cron 是否生效

## 数据与联网行为

- 模板：`prompts/*.md`（内置） + 浏览器本地缓存（用户上传）
- 股票：`/api/stocks` 读取本地 `base + delta` 数据
- 外网请求主要发生在：
  - 你点击平台按钮跳转
  - 股票增量同步脚本/cron 拉取 GitHub 数据源

### 更新股票库

```bash
node scripts/fetch-local-stocks.mjs
```

从 GitHub 数据源重新拉取 A 股 / 港股 / 美股清单，写入 `data/stocks.base.json`，
同时重置 `data/stocks.delta.json` 并刷新 `data/stocks.meta.json` 的统计信息。

## 贡献

欢迎通过 PR 提交模板或功能优化。

- 仓库: [nbzz/PromptDock](https://github.com/nbzz/PromptDock)
- PR: [https://github.com/nbzz/PromptDock/pulls](https://github.com/nbzz/PromptDock/pulls)
- 公共模板投稿邮箱: [tz@ittz.top](mailto:tz@ittz.top)

## AI Usage

PromptDock can be used by AI agents to dynamically fetch and fill prompts.

### List templates

```
GET /api/prompt?search=股票
```

### Get template details

```
GET /api/prompt?id=个股分析
```

### Fill variables

```
POST /api/prompt/fill
Content-Type: application/json

{
  "id": "个股分析",
  "values": {
    "股票名称": "贵州茅台",
    "日期": "2026-03-26"
  }
}
```

Response:
```
{
  "rendered": "你是一位顶级券商分析师...",
  "template": { "id": "...", "title": "..." }
}
```

## License

[MIT](./LICENSE)

---

## English

PromptDock is a lightweight prompt workspace:
import Markdown templates, fill variables, then copy-and-jump to AI platforms.

- Local dev: `npm install && npm run dev`
- Deploy: Vercel one-click button above
- Template syntax: plain Markdown + optional front matter + `[]` placeholders
- Default built-in template: `30分钟投资备忘录`
