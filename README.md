# PromptDock

<!-- Badges -->
![Stars](https://img.shields.io/github/stars/nbzz/PromptDock?style=flat-square&label=Stars)
![Forks](https://img.shields.io/github/forks/nbzz/PromptDock?style=flat-square&label=Forks)
![Issues](https://img.shields.io/github/issues/nbzz/PromptDock?style=flat-square&label=Issues)
![License](https://img.shields.io/github/license/nbzz/PromptDock?style=flat-square&label=License)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![PWA](https://img.shields.io/badge/PWA-Supported-0ea5a9?style=flat-square)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/nbzz/PromptDock)

<!-- Star History -->
[![Star History](https://api.star-history.com/svg?repos=nbzz/PromptDock&type=Timeline)](https://star-history.com/#nbzz/PromptDock&Timeline)

---

**Language**: 中文 | [English](#english)

> ⚡ 导入 Markdown 模板 → 填写变量 → 一键复制并跳转到 AI 平台

**在线地址**: [promptdock.ittz.top](https://promptdock.ittz.top)

---

## ✨ 功能特点

| | |
|---|---|
| 📋 **模板管理** | 导入/编辑/删除本地 `.md` 模板，内置 16+ 精品模板 |
| 🔍 **变量自动识别** | 自动解析 `[]` 变量，生成可视化填写表单 |
| ⏰ **时间变量自动填充** | `[今天]` `[日期]` `[当前时间]` 等自动填入，无需手动输入 |
| 🏢 **股票搜索增强** | 支持 A/H/US 股代码和名称联想，适用金融分析模板 |
| 🚀 **一键跳转** | 复制 Prompt 内容，自动打开并粘贴到主流 AI 平台 |
| 📱 **PWA 支持** | 手机端可安装为 App，离线可用核心功能 |

---

## 🚀 快速开始

```bash
git clone https://github.com/nbzz/PromptDock.git
cd PromptDock
npm install
npm run dev
```

然后访问 [http://localhost:3000](http://localhost:3000)

### Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nbzz/PromptDock)

---

## 📦 内置模板

| 模板 | 说明 |
|------|------|
| 🏛️ **个股分析** | 深度策略 + 估值建模 + 筹码博弈 + 极限风控，输出交易指令和目标价 |
| 📰 **由新闻分析个股板块影响** | 输入新闻，自动拆解供应链逻辑，输出受益/受损标的矩阵 |
| 🌐 **枯燥报告转生动网页** | 将财报/研报转为一个可运行的 Apple 风格 HTML 页面 |
| 🏢 **企业竞争优势分析** | AFI 战略框架，深度拆解企业护城河与竞争格局 |
| 📊 **竞争分析** | 多维度竞争格局对比分析 |
| 📈 **可比公司分析** | DCF + 可比公司法，输出估值区间 |
| 💰 **DCF 现金流折现分析** | 完整 DCF 建模，输出自由现金流与股权价值 |
| 🏗️ **LBO 杠杆收购分析** | 杠杆收购建模，输出 IRR 与退出倍数 |
| 📋 **三表建模** | 资产负债表 + 利润表 + 现金流量表联动建模 |
| 🎯 **证据检索回答器（Lite）** | 先证据后结论，适合需要时效与可信度的问答 |
| ✍️ **根据需求生成高质量提示词** | 把模糊需求转成可直接使用的高质量 Prompt |
| 📝 **长提示词压缩器** | 在不丢失核心信息的前提下压缩长 Prompt |
| 📚 **学术论文结构化阅读** | 系统化拆解论文核心论点与论证逻辑 |
| 🎓 **体育营销论文** | 体育营销领域论文研究与分析框架 |
| ⚽ **西甲体育营销** | 西甲联赛商业价值与体育营销案例分析 |
| 🏷️ **通用型品牌体育营销** | 品牌体育营销策略制定框架 |

---

## 🔧 支持平台

Perplexity · Grok · OpenAI · Gemini · Claude · 元宝 · DeepSeek · Kimi · 豆包

> 💡 多数第三方站点限制跨站自动填充，采用"先复制内容，再跳转页面"的通用方式，体验流畅。

---

## 📖 模板写法

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

以下变量名会自动填充（其余 `[]` 需手动输入）：

| 变量名 | 填充内容 |
|--------|----------|
| `今天` `今日` `日期` `当前日期` `current_date` `today` | 当前日期 |
| `时间` `当前时间` `current_time` | 当前时间 |
| `日期时间` `当前日期时间` `current_datetime` `now` | 日期 + 时间 |
| `星期` `周几` | 星期几 |
| `本月` `当前月份` `当前年月` | 年月 |
| `本季度` `当前季度` | 季度 |
| `时间戳` `UNIX时间戳` `Unix时间戳` | Unix 时间戳 |
| `最近交易日` `交易日` `最新交易日` | 最近交易日 |

另外，frontmatter 的 `autoFill` 支持以下类型：`date | time | datetime | weekday | month | quarter | timestamp | trading_day`

---

## 🌐 数据与联网行为

- **模板**: `prompts/*.md`（内置） + 浏览器本地缓存（用户上传）
- **股票**: `/api/stocks` 读取本地 `base + delta` 数据
- **外网请求**:
  - 点击平台按钮跳转
  - 股票增量同步脚本/cron 拉取 GitHub 数据源

---

## 🤝 贡献

### 提交模板

欢迎提交新的 Prompt 模板！

1. Fork 本仓库
2. 在 `prompts/` 目录下创建新的 `.md` 文件
3. 参考 [模板写法](#模板写法) 添加 frontmatter 和变量说明
4. 提交 PR

> 📧 也可将模板发送到 [tz@ittz.top](mailto:tz@ittz.top)

### 贡献代码

```bash
# 克隆并安装
git clone https://github.com/nbzz/PromptDock.git
cd PromptDock
npm install

# 开发
npm run dev

# 构建
npm run build

# 代码检查
npm run lint
```

---

## 🔗 相关链接

- 🐛 问题反馈: [GitHub Issues](https://github.com/nbzz/PromptDock/issues)
- 🔄 PR: [提交 Pull Request](https://github.com/nbzz/PromptDock/pulls)
- 🐙 源码: [nbzz/PromptDock](https://github.com/nbzz/PromptDock)

---

## 📄 License

[MIT](./LICENSE)

---

## English

**PromptDock** is a lightweight prompt workspace:

- 📋 Import and manage Markdown templates
- 🔍 Auto-parse `[]` variables into a fillable form
- ⏰ Auto-fill date/time variables (`[today]`, `[date]`, etc.)
- 🏢 Stock search enhancement for A/H/US stocks
- 🚀 One-click copy & jump to 10+ AI platforms
- 📱 PWA support (installable on mobile)

**Live**: [promptdock.ittz.top](https://promptdock.ittz.top)

```bash
# Quick Start
git clone https://github.com/nbzz/PromptDock.git
cd PromptDock && npm install && npm run dev
```
