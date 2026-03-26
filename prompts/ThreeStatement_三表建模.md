---
title: ThreeStatement 三表建模
variables:
  公司名称:
    type: text
    required: true
    placeholder: 输入公司名称
  预测年数:
    type: text
    default: "5"
    placeholder: 如 5
  收入增长率:
    type: text
    default: "15%"
    placeholder: 如 15%
  利润率假设:
    type: text
    default: "20%"
    placeholder: 如 20%
---
请为 [公司名称] 构建三表联动财务模型。

公司名称：[公司名称]
预测期：[预测年数] 年
收入增长率假设：[收入增长率]
稳定期利润率假设：[利润率假设]

请分步输出：
1. 利润表预测（[预测年数]年）
2. 资产负债表预测（资产、负债、权益）
3. 现金流量表预测（经营/投资/融资现金流）
4. 三表勾稽关系验证
5. 关键比率分析（ROE、资产负债率、现金流覆盖率）
6. 假设敏感性分析

数据来源请注明。
