# Jev 结果展示契约核对

> 历史开发记录：反映该轮实现与验证，提及的开发验证脚本未随发布包提供。当前行为以 [项目 README](../README.md) 和 [原型说明](prototype.md) 为准。

核对日期：2026-09-22。来源为 TypeSafe 官方文档及用户提供的三张官方界面截图。

## 官方响应与当前 Mock

官方 HTTP 响应为 `{model, answers, usage}`，`answers` 按请求的 question ID 返回。`usage` 含 `input_tokens`、`output_tokens`。当前原型保存的是本地适配器的完整 `complete` 事件；其 `output` 字符串内含模拟答案。这两层不得互换或伪装。

- Choice：`choice` 是候选 key；`probabilities` 是候选 key 到 0–1 概率的映射；`confidence` 为 0–1 的分布集中程度统计。空描述应显示候选 key。
- Noul：`noul` 是“是”的概率，“否”的概率为 `1 - noul`。没有独立 `confidence`。不能把它当程度评分，也不把界面阈值判断称为 API 原始布尔输出。
- Score：`score` 是按等级下标计算的连续期望位置，范围为 0 到 N−1。`legend`、`probabilities` 的 HTTP 键为数字字符串。不得用最高概率等级或四舍五入代替返回分数。等级描述可能是结构化内容。
- `confidence` 不等于最大概率，也不是实测正确率。官方未公开完整计算公式；缺少该字段时不补算。概率缺失时不画虚构的条长。

当前官方场景 Mock 只含 Choice 选择、Noul 模拟概率、整数 Score 与数组形式的 legend，没有 Choice/Score 分布或 confidence。保持这些返回值；兼容旧记录单题输出和数组 legend。

## 展示与状态边界

每题单独展示问题标识、实际问题说明、类型和结论，标准与分布通过内嵌展开查看。未运行与运行中只呈现预览/等待，不预选答案；只有完整返回才解读结果。用户提供的 Choice 截图明确是未运行预览。

标题、候选与标准使用当次保存的请求/返回，不读取新草稿。公开副本经过编辑后必须继续隐藏旧结果和原始响应。完整响应 JSON 保持原样；格式化不能丢失 0、false、多行和未知扩展字段。

## 官方来源

- [HTTP API 契约](https://docs.typesafe.ai/api)
- [Choice](https://docs.typesafe.ai/primitives/choice)
- [Noul](https://docs.typesafe.ai/primitives/noul)
- [Score](https://docs.typesafe.ai/primitives/score)
- [Confidence](https://docs.typesafe.ai/confidence)
- [Python 响应类型](https://docs.typesafe.ai/sdk/python/api/types/responses)
