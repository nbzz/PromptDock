---
title: LBO 杠杆收购分析
variables:
  收购标的:
    type: text
    required: true
    placeholder: 输入收购标的名称
  收购价格:
    type: text
    required: true
    placeholder: 如 100亿
  股权比例:
    type: text
    default: "30%"
    placeholder: 如 30%
  债务成本:
    type: text
    default: "5%"
    placeholder: 如 5%
  退出倍数:
    type: text
    default: "8x"
    placeholder: 如 8x
  持有年限:
    type: text
    default: "5"
    placeholder: 如 5
---
请为 [收购标的] 构建 LBO 杠杆收购分析模型。

收购标的：[收购标的]
收购价格：[收购价格]
股权比例：[股权比例]
债务成本：[债务成本]
目标退出倍数：[退出倍数]
持有年限：[持有年限] 年

请分步输出：
1. 交易结构（股权/债务比例、融资金额）
2. 债务还款计划（[持有年限]年）
3. 预测利润表与现金流
4. IRR 计算
5. MOIC 计算
6. 敏感性分析（退出倍数 vs IRR）
7. 风险提示

数据来源请注明。本分析仅供参考。
