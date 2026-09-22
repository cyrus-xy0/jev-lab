# 模型接口接入说明

`dual-input.js` 管理独立输入、Jev 同页表单和每侧运行状态；`mock-client.js` 提供模拟适配器；`open.js` 展示请求和结果并兼容旧记录；`jev-results.js` 负责从保存的请求/返回生成逐题结果卡片。

## 两种输入

LLM 发送用户实际填写的提示词，不追加 Jev 材料或问题。Jev 发送明确的 state 和 questions，不从左侧提示词自动猜测。

```js
record.inputs = {
  llmPrompt: "用户实际填写的提示词",
  jevRequest: {
    model: "jev-1.13.0",
    state: "字符串，或原始 state 对象",
    questions: {
      decision: {
        type: "choice", // choice | noul | score
        instructions: "明确的判断问题",
        criteria: { option_1: "候选一", option_2: "候选二" }
      }
    }
  }
};
```

`jevFormFromRequest` 生成可读表单，`getDualJevRequest` 还原请求。未改动的字段原样保留；修改 state 只更新 state，修改 question 不影响 LLM 提示词。Choice 使用 answerRows 保存稳定原候选键（新增项使用不冲突的 option_N），Score 保留有序字符串数组，界面按 0 起始等级显示。原有多行值与额外字段保留，类型切换缓存对应 rows/shape；这些界面字段不进入请求。Noul 的 criteria 可省略或为 null，true/false 可只提供一侧。表单始终提供两侧编辑入口，空占位不进入请求；未编辑时保留省略、null、单侧及未知字段。结构化标准逐叶编辑保留对象/数组形态、数值与布尔值；明确点击改用文字标准才转换该侧结构。清空一侧不要求补齐另一侧。同页表单只校验和准备输入。问题描述对应 instructions，判断标准对应 criteria，分别序列化；判断标准可折叠，Noul 默认展开；`q.settingsOpen` 仅属界面状态，不进入请求载荷。`publicJevDraft` 使用独立快照和同一逐项序列化入口；匿名预览中的完整请求随编辑更新，重置会清除此快照。

## 独立调用

```js
await comparisonClient.run({
  task: record.inputs.llmPrompt, // 旧接口兼容字段
  llmPrompt: record.inputs.llmPrompt,
  jevRequest: record.inputs.jevRequest,
  provider: "doubao",           // doubao | gpt，只用于 LLM
  official: record.official,    // 可选模版来源，不替代实际输入
  models: ["llm"],              // 或 ["jev"]；适配器也支持同时指定
  signal,
  onEvent
});
```

`startDualRun(model)` 只启动指定侧。两侧各有 AbortController 和运行对象，旧回调不能覆盖新运行。编辑正在运行的该侧被禁用，但另一侧仍可编辑或启动。更改一侧输入后，该侧旧结果暂不展示；只有当前两侧输入与完成结果匹配，才形成可公开的完整对比。

三个旧 WebMCP 示例载入入口在运行中明确报错，不再把未载入误报为成功。

`resetCompareDraft` 先断开当前 run，再停止并隔离旧 jobs；旧回调无法覆盖新草稿。保留已完成侧的历史响应和 provider，运行中的历史侧标为停止。

每侧事件：

```js
{ model, type: "request", request }
{ model, type: "progress", text: "可观察的处理事件", elapsed: 0.45 }
{ model, type: "output", text: "累计原始输出", displayText: "累计可读输出" }
{ model, type: "complete", source: "local_mock", output, summary, closure,
  metrics: { time, input, output } }
```

完整 complete 事件深拷贝保存于 `modelState[model].response`，结果详情原样格式化展示；旧记录缺少该字段时不伪造响应。当前事件属于本地适配器，并非真实厂商响应外壳。停止、失败或公开内容经编辑时清空不适用的原始响应。

原始 `text/output` 用于记录和详情；LLM 主界面优先使用 `displayText/summary`，Jev 结果由 `jev-results.js` 在完整返回后解析保存的原始输出。不要把半截 JSON 写进可读输出。`closure` 只能显示真实业务系统已确认的回执；当前 Mock 不执行外部动作。后台 progress/steps 仅保留适配器与旧历史兼容，页面不再展示过程卡、时间线或进度条；这些本地事件不是模型内部思考。

Noul 标准经 getDualJevRequest 进入实际调用和历史请求快照；结果按该快照显示标准。匿名编辑使用独立草稿，同一序列化规则；任一公开标准改变后隐藏旧结果。原始目录 60 道 Noul 中 15 道已有标准、45 道缺省，资料未被补写。契约依据：[官方 NoulCriteria schema](https://docs.typesafe.ai/sdk/python/api/types/questions)。

## Jev 结果字段

官方 HTTP 返回 `{model, answers, usage}`；`answers` 按 question ID 返回。当前本地 `complete` 事件保持原样，renderer 读取其 `output` 内的答案，并兼容旧记录仅保存输出、单题 Choice 及数组 legend 的形态。

- Choice 使用返回的 `choice` key；候选描述来自保存的请求。空描述回退 key，旧中文标签仅在唯一匹配时标记候选。可用时展示返回的 `probabilities` 与 `confidence`。
- Noul 的 `noul` 是“是”的概率，另一侧为 `1 - noul`；没有独立 confidence。旧布尔返回只显示是/否，不推算概率。
- Score 的 `score` 是连续等级期望位置，范围 0…N−1，不用 argmax 或整数取整替换。等级优先来自返回 `legend`，缺失时取保存的请求 criteria；支持数字字符串键映射及旧 Mock 数组。
- 分布与 confidence 仅显示有效的返回字段。confidence 不是最大概率或准确率，不自行推导；现 Mock 未返回的 Choice/Score 概率和 confidence 保持缺失。

未运行时仅显示待运行提示；运行中、失败/停止均不复用旧答案。公开编辑仍隐藏旧响应；结果标准不读取当前草稿，原始完整 JSON 不经结果格式化改写。结构化问题与标准递归转为可读文字，卡片长结论可省略，展开保留完整内容。

官方契约：[API](https://docs.typesafe.ai/api)、[Choice](https://docs.typesafe.ai/primitives/choice)、[Noul](https://docs.typesafe.ai/primitives/noul)、[Score](https://docs.typesafe.ai/primitives/score)、[Confidence](https://docs.typesafe.ai/confidence)。

## 中间状态的数据来源

当前 comparisonClient 固定使用本地 Mock，没有连接豆包、GPT 或 Jev 的真实中间状态 API。预设步骤按本地计时器发出 progress 事件；输出分块也是本地字符串模拟。页面只显示请求、结果和必要的运行/失败/取消状态。保存的历史 steps、原始 complete 返回、计时和取消控制不因移除 UI 而丢弃。不能从当前原型推断所有厂商 API 都不支持进度或流式输出；流式内容与模型内部推理阶段也应区分。

## 模版与 Mock

`template-catalog.js` 原样保留 38 套模版的元数据和 42 个原始请求。`officialTemplateInputs` 从实际请求 body 生成两侧输入：Jev 用 `jevFormFromRequest` 保留原始请求，LLM 用 38 套业务自然语言配方生成独立提示词；详情预览、载入和实际发送保持一致。`template-business.js` 管理六类业务元数据与四个精选入口；两个 `template-prompts-*.js` 保存配方，须在首次渲染前加载。`readable.js` 转换展示文字，并保留作为判断材料的原始代码。`template-prompt-history.js` 保存本轮受影响的 16 个旧自然语言提示词，仅按 case、阶段原 body 和旧文本精确识别。`structuredOfficialTaskText` 与 `legacyOfficialTaskText` 继续识别更早官方提示词；这些路径不用于新表单，不改写历史输入。多题、Choice/Noul/Score、对象或字符串 state 均保留。

官方模版的 LLM 和 Jev 分别匹配各自实际输入，任一侧改动不改变另一侧的请求。Mock 原样值来自本原型的 `official-mock-values.js`，并非官方实测返回；未覆盖的输入返回等待接口接入的状态。不得用这些值报告真实速度、准确率或成本。

C06/C08/C16 的后续阶段来自资料中的假设中间材料，C12 是独立输入/输出检查。真实应用需要自行实现依赖编排。

## 历史和匿名展示

历史记录保存 `inputs`、每侧 `modelState`、指标和公开状态。停止、失败、仅一侧完成、全部完成分别展示；页面刷新会停止未结束的本地运行。复用历史或广场任务只准备新草稿，不自动恢复旧结果或执行模型。

`publicDualCase` 只返回显式允许的公开字段。公开预览涵盖 LLM 提示词、Jev state、每道题和所有 criteria，包含 Noul 可选依据。任一输入经过编辑，公开副本中原始请求、过程、输出、摘要、指标和模版快照全部隐藏或替换，避免旧材料泄漏。

广场使用官方目录、本机自定义记录、远端匿名公开快照三种来源。当前他人列表为空；`published` 本机标记不等于真实共享权限。接后端后需单独实现所有权、公开版本、读取权限和持久化。

## 接入所需信息

- 豆包、GPT、Jev 的服务端地址、模型标识、请求/响应和流式协议。
- LLM 工具或上下文获取方式，以及业务系统的执行回执。
- 真实输入/输出 Token、统一计时口径与错误、重试、取消语义。

密钥仅配置在服务端环境变量中；浏览器调用应用接口。当前静态原型没有模型密钥。
