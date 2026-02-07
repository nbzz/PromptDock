---
title: Nano Banana Pro 图像规格生成器
description: 先生成 JSON 规格，再去 Nano Banana Pro 出图
variables:
  创作需求:
    type: textarea
    required: true
    placeholder: 例如：做一个赛博风电影海报，主角是女性机甲战士，4K，竖版
  参考图说明:
    type: textarea
    placeholder: 可留空；例如：有1张人脸参考图，需要保持五官一致
  输出比例:
    type: select
    options: ["16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "21:9"]
    default: "2:3"
  输出清晰度:
    type: select
    options: ["1K", "2K", "4K"]
    default: "2K"
  是否需要文字:
    type: select
    options: ["否", "是"]
    default: "否"
  文字内容:
    type: text
    placeholder: 例如：MARS 2050（不需要可留空）
---
# 使用方式（先看）
1. 先在当前 AI 平台生成完整 JSON 规格（只要 JSON，不要解释）。
2. 复制 JSON。
3. 打开 Nano Banana Pro，把 JSON 作为生成规格使用；如有参考图，在对应平台上传。

# 任务
你是 Nano Banana Pro 图像规格架构师。请把用户需求转成可直接用于 **gemini-3-pro-image-preview** 的高质量 JSON。

## 输入
- 创作需求：[创作需求]
- 参考图说明：[参考图说明]
- 输出比例：[输出比例]
- 输出清晰度：[输出清晰度]
- 是否需要文字：[是否需要文字]
- 文字内容：[文字内容]

## 输出规则
1. 只输出一个 JSON 代码块。
2. 顶层必须包含：
   - `model_config`
   - `instruction`
   - `fusion_strategy`
   - `visual_elements`
   - `style_config`
3. 若“是否需要文字=是”，必须包含 `text_rendering`；否则不输出该字段。
4. 若需求涉及实时信息（天气/地点实时状态等），在 `model_config.tools` 中添加 `google_search`。
5. 若涉及人物一致性，在 `identity_lock_description` 写清不可改变特征。
6. `negative_prompt` 至少包含：`blurry text`, `distorted face`, `mutated hands`；若有文字再加 `misspelled text`, `illegible text`。
