---
title: DCF 现金流折现分析
variables:
  公司名称:
    type: text
    required: true
    placeholder: 输入公司名称
  股票代码:
    type: stock
    required: true
    placeholder: 输入股票代码
  预测年数:
    type: text
    default: "5"
    placeholder: 如 5
  终端增长率:
    type: text
    default: "2.5%"
    placeholder: 如 2.5%
  WACC假设:
    type: text
    default: "9%"
    placeholder: 如 9%
  情景类型:
    type: select
    options: ["基准", "乐观", "悲观"]
    default: "基准"
---
请为 [公司名称]（[股票代码]）构建 DCF 现金流折现分析模型。

分析日期：[今天]
预测期：[预测年数] 年
终端增长率：[终端增长率]
WACC：[WACC假设]
情景：[情景类型]

请分步输出：
1. 历史财务数据摘要（收入、利润率、ROIC）
2. 收入预测（[预测年数]年分年度）
3. 自由现金流计算（EBIT→NOPAT→FCFF）
4. WACC 计算（CAPM）
5. DCF 估值（预测期 FCFF 现值 + 终值现值）
6. EV→股权价值桥
7. 敏感性分析表（WACC vs 终端增长率）
8. 估值结论

数据来源请注明。本分析仅供参考，不构成投资建议。
