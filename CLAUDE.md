# PromptDock — AI 协同开发规范

## 项目信息

- **类型**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **目录**: `~/Documents/project/PromptDock`
- **Stars**: 1 (刚创建)
- **定位**: 轻量级 Prompt 工作台

## 核心文件

| 文件 | 作用 |
|------|------|
| `lib/template-parser.ts` | 模板解析、变量提取 |
| `lib/auto-fill.ts` | 时间变量自动填充 |
| `lib/stocks.ts` | 股票数据搜索 |
| `lib/platforms.ts` | AI 平台配置 |
| `components/variable-form.tsx` | 变量填写表单 |
| `components/stock-input.tsx` | 股票输入组件 |
| `components/platform-actions.tsx` | 平台跳转按钮 |
| `prompts/*.md` | 内置模板 |
| `data/stocks.*.json` | 股票库数据（base + delta + meta） |
| `scripts/fetch-local-stocks.mjs` | 刷新股票库脚本 |

## 内置模板的排序与分类

全部在 `app/page.tsx` 顶部的常量里控制，改动模板时记得同步：

- `PINNED_BUILTIN_TITLES`：内置模板置顶顺序（取不到则排到 100 之后）
- `DEFAULT_TEMPLATE_TITLE`：打开页面默认选中的模板
- `FINANCIAL_KEYWORDS` / `WRITING_KEYWORDS`：分类标签的命中关键词（按标题或 frontmatter description 匹配）
- `STOCK_TEMPLATE_KEYWORDS`：命中后展示「股票库」数据同步状态
- 标题里含下划线的模板会被归入「Claude金融分析」分类

模板正文里除真实变量外，不要使用半角 `[]` 包住说明性文字——`lib/template-parser.ts`
会把它们一并解析成变量。说明文字请改用全角 `（）` 或 `【】`。

## 响应式布局约定

移动端与桌面端是两套呈现，分界在 `lg`（1024px）：

- 布局容器用 `lg:` 前缀切换（如模板列表 `grid grid-cols-2 lg:block lg:space-y-2`）
- 移动端专属隐藏项统一写 `hidden lg:block` / `hidden lg:flex`
- 触控目标 ≥ 44px；输入框字号保持 `text-base`（16px），否则 iOS 聚焦会缩放
- 吸底操作条在 `components/platform-actions.tsx` 内双渲染（桌面卡片 + 手机 `fixed` 条）

移动端刻意隐藏的功能（避免页面过长）：新建 / 上传 .md / 从链接导入、最近使用、
高级设置、自动变量、模板来源标签、收藏星标、顶部介绍文案。桌面端不受影响。
移动端侧栏不允许横向滑动（列表 `overflow-x-hidden touch-pan-y`、分类标签 `flex-wrap`）；
预览区移动端限高 `max-h-[45vh]` 内部滚动，桌面端 `lg:max-h-none`。

## 开发命令

```bash
cd ~/Documents/project/PromptDock
npm install
npm run dev      # 开发
npm run build    # 构建
npm run lint     # 检查
```

## 开发规范

1. **变量命名**: 英文驼峰或中文（按现有风格）
2. **组件**: 使用 Tailwind CSS + `shadcn/ui` 风格
3. **类型**: 严格 TypeScript
4. **提交**: 用中文描述，格式 `feat:`, `fix:`, `chore:`

## 自动开发循环

当收到"开始自动开发"指令时：
1. 读取 `DEVELOPMENT_PLAN.md` 了解优先级
2. 选择 P0 或 P1 任务开始执行
3. 每完成一个任务，汇报并询问是否继续
4. 每次 commit 描述清楚改了什么

## 当前任务

查看 `DEVELOPMENT_PLAN.md` 了解优先级，按顺序执行。

**第一轮目标**:
1. 添加 5 个金融相关内置模板
2. 添加暗色模式切换
3. 添加模板搜索功能
