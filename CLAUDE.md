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
