# Noul 判断标准核对

> 历史开发记录：反映该轮实现与验证，提及的开发验证脚本未随发布包提供。当前行为以 [项目 README](../README.md) 和 [原型说明](prototype.md) 为准。

核对日期：2026-09-22，基线 v27。

## 官方契约

Noul 的问题描述在 `instructions`；判断标准在 `criteria`，两者独立。官方 Python SDK 的 NoulCriteria schema 使用 `true`、`false` 两个可选属性，没有要求两个属性同时提供。每侧可用字符串、对象、数组或 null；criteria 本身可省略或为 null。顶层字符串/数组不是当前官方 NoulCriteria 形状，旧扩展数据应保留而不是静默转换。

因此：可为用户提供两侧标准编辑入口，但空占位符不能变成请求字段；只提供一侧标准是合法的。未编辑时保留原请求中省略、null、单侧与结构化值的区别，不从模板描述推造业务标准。

依据：[官方 Noul 类型与 JSON schema](https://docs.typesafe.ai/sdk/python/api/types/questions)、[HTTP API](https://docs.typesafe.ai/api)、[Noul 用法](https://docs.typesafe.ai/primitives/noul)。

## 原始模板覆盖

共 38 案例、42 请求、115 道题：Noul 60、Choice 42、Score 13。

Noul 有 criteria 15 道，省略 criteria 45 道。已有 15 道均为含 true、false 的对象；30 条标准全部是非空字符串，无 null、空串、单侧缺省、额外键或结构化标准。

有标准的题目（请求序号从 1 开始）：

- C01 / 1：rental_eligible、documents_sufficient
- C03 / 1：reporting_required、annual_training
- C04 / 1：answers_query
- C05 / 1：answer_exists
- C06 / 1：join_L002、join_L004
- C06 / 2：ordered_B002、ordered_B003
- C12 / 1：bypass_attempt
- C12 / 2：secret_disclosure
- C13 / 1：trial_unsupported、price_omitted
- C17 / 1：short_finish

根目录 template-catalog.js 与用户 ZIP 内 catalog.json 深比较一致；42 个 body 与 ZIP 内独立 request JSON 也全部一致。45 道缺标准的问题来自原始资料，并非导入丢失。

## v27 缺口定位

已有字符串标准经表单序列化、实际调用、历史和公开快照保留；结果按保存请求读取 true/false 标准。主要问题在于默认折叠的“答案设置”没有提示标准，而没有标准的 Noul 仅显示“无需填写候选答案”，无法添加。结构化标准虽原样保存，却只能从完整 JSON 查看。

本轮改进应同时覆盖可见入口、独立编辑、实际载荷与运行快照展示；修改公开标准后继续隐藏旧结果，不能复现被删除的原材料。
