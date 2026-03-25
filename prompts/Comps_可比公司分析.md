---
title: Comps 可比公司分析
variables:
  目标公司:
    type: text
    required: true
    placeholder: 输入目标公司名称
  可比公司列表:
    type: textarea
    required: true
    placeholder: 输入可比公司，用逗号分隔
  分析日期:
    type: date
    autoFill: date
  估值指标:
    type: select
    options: ["PE", "EV/EBITDA", "EV/Revenue", "PB", "PS"]
    default: "EV/EBITDA"
---
请对 [目标公司] 进行可比公司估值分析。

分析日期：[分析日期]
目标公司：[目标公司]
可比公司：[可比公司列表]
主要估值指标：[估值指标]

请分步输出：
1. 可比公司概况（市值、收入、EBITDA）
2. 各指标汇总表
3. 统计摘要（中位数、平均值）
4. 目标公司相对估值分析
5. 估值区间建议
6. 注意事项

数据来源请注明。
