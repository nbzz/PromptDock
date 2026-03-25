# PromptDock 开发计划

## 项目概述

**PromptDock** — 轻量级 Prompt 工作台，导入 Markdown 模板、填写变量、一键复制跳转到 AI 平台。

- **技术栈**: Next.js 15, React 19, Tailwind CSS, TypeScript
- **在线地址**: promptdock.ittz.top
- **Stars**: 1

---

## 一、现有功能梳理

### 核心功能
1. **模板解析** — `lib/template-parser.ts`
   - 自动识别 `[]` 变量
   - Frontmatter YAML 解析
   - 变量类型推断（stock/date/time/text）
   - 模板渲染

2. **自动填充** — `lib/auto-fill.ts`
   - 时间变量：`[今天]`、`[最近交易日]`、`[本季度]` 等
   - 股票变量：`[股票]` 自动识别
   - 支持 `autoFill` Frontmatter 配置

3. **股票搜索** — `components/stock-input.tsx` + `lib/stocks.ts`
   - A/H/US 三市场股票联想
   - 本地 JSON 数据（`data/stocks.base.json` + `data/stocks.meta.json`）

4. **平台跳转** — `components/platform-actions.tsx` + `lib/platforms.ts`
   - 9 个平台：Perplexity, Grok, OpenAI, Gemini, Claude, 元宝, DeepSeek, Kimi, 豆包
   - "先复制，再跳转"模式

5. **PWA 支持** — `public/sw.js` + `app/manifest.ts`

6. **历史记录** — `components/history-panel.tsx` + `lib/history.ts`

---

## 二、优先级排序

### P0 — 必须修复（影响核心体验）
1. **Bug**: 设置页小数点/备注设置无效（converasset issue）
2. **Bug**: 股票数据更新不及时

### P1 — 重要改进（提升留存）
1. **功能**: 添加更多内置模板（DCF、Comps、LBO 等金融模板）
2. **功能**: 模板搜索/筛选
3. **功能**: 模板收藏/标签系统
4. **功能**: 暗色模式
5. **功能**: 移动端优化

### P2 — 增强功能（差异化竞争力）
1. **功能**: 模板市场（公开分享模板）
2. **功能**: 模板版本历史
3. **功能**: AI 辅助模板生成（根据描述自动生成模板）
4. **功能**: 模板导入/导出增强（支持更多格式）
5. **功能**: 团队协作/同步

### P3 — 技术升级
1. **优化**: 添加单元测试
2. **优化**: 添加 ESLint + Prettier
3. **优化**: CI/CD 流水线

---

## 三、近期改进建议（AI 自动开发循环候选）

### 第一轮（已完成 ✅）
1. ✅ 添加 5 个金融相关内置模板
2. ✅ 添加暗色模式切换（分支: feat/dark-mode）
3. ✅ 添加模板搜索功能（分支: feat/template-search）
4. ✅ 股票数据自动更新（分支: feat/stocks-update）

### 第二轮（进行中 🔄）
1. 🔄 添加更多内置模板（News/Audit/DataCleaning/Report/Macro）
2. 🔄 CI/CD 流水线配置
3. ⬜ 模板收藏功能
4. ⬜ 移动端优化

### 第三轮（待开发）
1. ⬜ AI 模板生成助手
2. ⬜ 模板市场基础架构
3. ⬜ 社区模板提交

---

## 四、技术债务

1. 没有单元测试
2. 没有 ESLint/Prettier 配置
3. `data/stocks.meta.json` 可能过期
4. 没有正式的 CI/CD

---

## 五、GitHub Actions CI/CD

已创建的工作流：
- `.github/workflows/ci.yml` — 待配置

待添加：
- `preview.yml` — Vercel Preview 部署
- `production.yml` — 合并到 main 后自动部署

## 六、竞争力分析

### 优势（继续保持）
- `[]` 变量 + 自动填充的独特组合
- 股票搜索增强（市场上无类似功能）
- 多平台一键跳转
- PWA 支持

### 差异化方向
- **金融场景深度** — 内置金融模板、市场数据
- **模板市场** — 分享、发现、评分
- **AI 辅助** — AI 帮助写模板

---

## 六、指标目标

| 指标 | 当前 | 3个月目标 |
|------|------|----------|
| GitHub Stars | 1 | 100 |
| 模板数量 | 12 | 50 |
| 平台支持 | 9 | 12+ |
| PWA 安装 | N/A | 100+ |

---

*本计划由 AI 协调者生成，等待 Claude Code 执行*
