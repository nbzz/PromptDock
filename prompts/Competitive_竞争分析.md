---
title: Competitive 竞争分析
variables:
  公司名称:
    type: text
    required: true
    placeholder: 输入目标公司名称
  竞争对手列表:
    type: textarea
    required: true
    placeholder: 输入竞争对手，用逗号分隔
  分析维度:
    type: select
    options: ["产品", "技术", "市场", "成本", "品牌", "全维度"]
    default: "全维度"
---
请对 [公司名称] 进行竞争格局分析。

目标公司：[公司名称]
竞争对手：[竞争对手列表]
分析维度：[分析维度]

请分步输出：
1. 市场格局概览（市场份额、增速）
2. 竞争格局地图（可视化描述）
3. 波特五力分析
4. 核心竞争优势（[公司名称] vs [竞争对手列表]）
5. 护城河评估
6. 风险与机会
7. 竞争策略建议

数据来源请注明。
