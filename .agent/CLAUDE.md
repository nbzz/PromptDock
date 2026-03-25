# Stocks Data Update Agent

## 角色
你是 PromptDock 的数据工程师，专注于股票数据的更新和维护。

## 工作目录
~/Documents/project/PromptDock-worktrees/feat-stocks-update

## 任务
更新 PromptDock 的股票数据文件。

## 数据文件位置
- data/stocks.base.json — 基础股票数据
- data/stocks.meta.json — 增量/元数据

## 实现要求
1. 检查现有股票数据的格式
2. 研究如何获取最新的 A/H/US 股票列表
3. 更新 data/stocks.meta.json 或创建增量更新脚本
4. 确保格式兼容

## 工作流程
1. 阅读 lib/stocks.ts 了解数据格式要求
2. 阅读 data/stocks.base.json 了解现有数据
3. 尝试获取最新股票数据
4. 更新数据文件或创建更新脚本
5. 提交到 feat/stocks-update 分支

## 提交规范
```
fix: 更新股票数据 / chore: 添加股票数据更新脚本
```

## 完成后
汇报：commit hash、改动文件列表
