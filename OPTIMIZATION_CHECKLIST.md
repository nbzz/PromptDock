# PromptDock 优化清单

## 一、代码质量 🔧

### 1.1 类型安全
- [ ] `lib/types.ts` 有些 interface 分散在其他文件（template-parser.ts），统一集中
- [ ] `VariableForm` 的 `labels` prop 类型定义不清，建议用 `Partial<typeof DEFAULT_VARIABLE_FORM_LABELS>`
- [x] `storage.ts` 末尾的 `export interface BookmarkMeta` 等已经集中 ✅
- [x] `BookmarkHistoryEntry` 接口已添加到 storage.ts ✅

### 1.2 错误处理
- [ ] `parseTemplate` 中 `yaml.load` 失败只是静默降级，建议加 console.warn 或 toast
- [ ] `loadLocalTemplates` / `loadBookmarks` 等 storage 函数多处 try-catch 返回空值，行为一致但可追溯
- [ ] 考虑用 `window.localStorage` 封装一层，加 try-catch 并记录错误

### 1.3 代码重复
- [x] `VariableForm` 中 input/textarea/select 的 className 条件分支重复率高，提取 `FIELD_BASE` / `FIELD_NORMAL_CLASSES` / `FIELD_INVALID_CLASSES` 常量 ✅
- [x] 暗色模式覆盖已全面检查，组件均有 `dark:` 变体 ✅
- [ ] `BookmarkIcon` 组件虽小但内联在组件内部，考虑提到单独文件

### 1.4 性能
- [ ] `VariableForm` 每次 render 都 `loadBookmarks()`，应该用 state + event 避免重复读取
- [ ] `bookmarkedVars` 在 render 内部 filter，每次数组都遍历，应该 memo
- [ ] `focusNextField` 查询全量 DOM，考虑用 ref 替代

### 1.5 可维护性
- [ ] `PLACEHOLDER_RE`、`IGNORED_PLACEHOLDER_NAMES` 这些 magic strings/values 加上注释说明
- [ ] `parseFrontmatter` 支持 `\r\n` 但系统主要是 macOS，检查是否必要
- [ ] `storage.ts` 的 localStorage key 散落多处，抽取 `const STORAGE_KEYS = {...}`

---

## 二、用户体验 🚀

### 2.1 交互优化
- [ ] 变量表单提交前 validation 可以加震动反馈（移动端）
- [ ] 书签填充后应该有视觉反馈（toast 或高亮闪烁）
- [ ] `handleEnterToNext` 对 textarea 允许 shift+enter 换行，但 select/date 等场景缺少明确提示
- [ ] 必填字段校验失败时应该 scroll 到第一个错误字段

### 2.2 移动端
- [x] 分类标签栏滚动：移除 min-w-max，改用隐藏滚动条 ✅
- [x] StockInput placeholder 缩短 ✅
- [x] 书签快速填充按钮移动端优化（内边距、截断宽度） ✅
- [x] VariableForm 区块标题移动端对齐修复 ✅
- [ ] 书签面板 `BookmarkPanel` 抽屉在移动端是否流畅

### 2.3 暗色模式
- [x] 全面检查完成，所有组件均有 `dark:` 变体 ✅
- [ ] 考虑用 CSS 变量统一管理颜色主题

### 2.4 空状态 & 边界情况
- [ ] 模板列表为空时应该有引导页（创建第一个模板）
- [ ] 股票搜索无结果时的用户体验
- [ ] localStorage 满或不可用时的错误提示

---

## 三、功能增强 ✨

### 3.1 模板管理
- [ ] 模板编辑功能（目前只能导入/导出）
- [x] 模板删除/批量删除确认弹窗 ✅
- [ ] 模板列表支持排序（按名称/更新时间/使用频率）
- [ ] 最近使用的模板置顶

### 3.2 书签系统
- [x] 书签历史：每次填充记录，支持查看/清空 ✅
- [x] 书签批量管理：清空全部书签 ✅
- [ ] 书签过期机制（可设置有效期）

### 3.3 搜索 & 筛选
- [x] 模板搜索支持模糊匹配（Fuse.js） ✅
- [ ] 标签筛选（多选/排除）
- [ ] 搜索历史记录

### 3.4 导入/导出
- [ ] 支持导入单个 `.md` 文件
- [ ] 导出时可选择包含/不包含书签
- [ ] 导入冲突处理（同名模板覆盖策略）

---

## 四、技术债务 📋

### 4.1 测试
- [x] 添加 Vitest 单元测试框架和核心函数测试（template-parser 16 tests, auto-fill 18 tests） ✅
- [ ] 添加组件 snapshot 测试
- [ ] 配置 CI 测试流水线

### 4.2 构建 & 部署
- [ ] `.github/workflows/ci.yml` 完善
- [ ] 添加 `preview.yml` 和 `production.yml`
- [ ] 检查 `.eslintrc.json` 是否生效

### 4.3 PWA
- [x] sw.js 更新策略：新增 SW_UPDATE_AVAILABLE 消息广播，用户可见更新横幅 ✅
- [ ] 添加离线模板访问能力
- [ ] 安装后引导（首次安装弹窗介绍功能）

### 4.4 数据
- [ ] `data/stocks.meta.json` 定期更新机制
- [ ] 考虑用增量更新替代全量更新

---

## 五、性能监控 📊

### 5.1 指标
- [ ] 首屏加载时间（FCP、LCP）
- [ ] 模板渲染时间（大模板下可能卡顿）
- [ ] localStorage 读写性能

### 5.2 优化方向
- [ ] 大模板考虑虚拟滚动（如果模板数量超过 50）
- [ ] 股票数据懒加载（按需加载 CN/HK/US 而非全量）
- [ ] 考虑用 IndexedDB 替代 localStorage（更大的存储空间）

---

## 六、安全 🔒

- [ ] 导入模板时 `rawMarkdown` 的 XSS 过滤（虽然不执行 JS，但可能注入恶意链接/样式）
- [ ] 书签数据多端同步时的数据校验
- [ ] CSP 配置检查

---

## 七、国际化 (i18n)

- [x] VariableForm 硬编码中文字符串（selectPlaceholder、validationFailed）提取到 I18N ✅
- [ ] 日期/货币格式化考虑 locale
- [ ] 剩余硬编码中文字符串检查

---

## 优先级建议

| 优先级 | 任务 | 状态 |
|--------|------|------|
| P0 | 移动端适配 | ✅ 已完成 |
| P0 | 书签系统完善 | ✅ 已完成 |
| P0 | 模板编辑（删除弹窗） | ✅ 已完成 |
| P1 | 代码重复清理 | ✅ 已完成 |
| P1 | 暗色模式全面覆盖 | ✅ 已完成 |
| P1 | 单元测试 | ✅ 已完成 |
| P2 | PWA 更新策略 | ✅ 已完成 |
| P2 | 搜索增强（Fuzzy） | ✅ 已完成 |
| P3 | i18n（部分） | ✅ 进行中 |
| P2 | 数据更新机制 | ⏳ 待处理 |
| P3 | 安全审计 | ⏳ 待处理 |
| P3 | 性能监控 | ⏳ 待处理 |
