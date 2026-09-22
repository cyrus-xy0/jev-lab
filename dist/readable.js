/* Presentation only: original API bodies stay intact in request details. */
/*
 * Display-only Chinese labels for the 38 cases / 42 requests in
 * outputs/jev-lab/dist/template-catalog.js. Covers all 99 English state keys
 * plus the existing Chinese key 灯. Never mutate request bodies or values.
 *
 * Suggested label precedence: case + full state path, generic full state path,
 * then field key. Normalize array indices to * for path lookup.
 * Enum aliases are optional display labels, not replacements in source data.
 */
const stateFieldLabelsV18 = Object.freeze({
  query: "用户问题",
  passages: "候选材料",
  p1: "材料一",
  p2: "材料二",
  p3: "材料三",
  abstract: "论文摘要",
  review_scope: "筛选条件",
  message: "消息原文",
  handlers: "可用处理方式",
  lookup: "查询程序",
  writer: "文字生成模型",
  reasoner: "分析模型",
  human: "人工服务",
  user_request: "用户需求",
  retrieved_text: "检索到的内容",
  proposed_call: "拟执行的操作",
  name: "名称",
  scope: "操作范围",
  allowed_scope: "允许的操作范围",
  code: "待检查代码",
  rule: "检查规则",
  note: "记录原文",
  resume: "简历片段",
  job_requirements: "岗位要求",
  profile: "客户情况",
  ideal_customer: "目标客户条件",
  ticket: "客户工单",
  product: "产品说明",
  report: "报案说明",
  submission_checklist: "所需材料",
  transaction_note: "交易附言",
  alert_summary: "异常提示",
  records: "已有记录",
  declared_vendor: "申报的服务商",
  payment_recipient: "实际收款方",
  contract_excerpt: "合同条款",
  internal_checklist: "内部检查要求",
  listing: "商品描述",
  policy: "适用规则",
  ad_copy: "广告文案",
  landing_page: "落地页内容",
  brand_rule: "宣传规则",
  player_message: "玩家反馈",
  incident: "事件说明",
  business_context: "受影响的业务",
  rubric: "判断标准",
  sales_note: "销售记录",
  evidence: "依据原文",
  candidate_relation: "待核对的关系",
  subject: "主体名称",
  object: "对象名称",
  relation: "关系描述",
  coverage: "保障范围",
  documents_rule: "材料要求",
  claim: "待核对内容",
  description: "说明",
  items: "申请项目",
  provided_documents: "已收到的材料",
  missing_documents: "尚缺的材料",
  post: "帖子正文",
  context: "相关背景",
  author_history: "作者历史记录",
  source: "材料来源",
  text: "正文",
  candidate_passage: "候选片段",
  request: "用户需求",
  recent_context: "已有对话背景",
  entity_a: "商品记录一",
  brand: "品牌或制造商",
  model: "型号",
  edition: "版本",
  entity_b: "商品记录二",
  passage: "检索片段",
  id: "标识",
  title: "标题",
  source_type: "来源类型",
  section: "引用章节原文",
  reply: "待检查的回复",
  source_text: "来源原文",
  schema: "提取结果的格式要求",
  type: "类型",
  properties: "各字段要求",
  trial_days: "试用天数",
  monthly_price: "每月价格",
  required: "必须包含的字段",
  additionalProperties: "允许增加其他字段",
  extraction: "已有提取结果",
  extraction_instruction: "提取要求",
  document: "文档原文",
  date_role: "要找的日期",
  reference_date: "参考日期",
  email: "邮件原文",
  current_path: "当前分类",
  business_description: "企业业务说明",
  request_text: "用户需求",
  available_rooms: "可用房间",
  supported_capabilities: "支持的设备操作",
  "灯": "灯",
  devices: "已接入设备",
  room: "所在房间"
});

const statePathLabelsV18 = Object.freeze({
  "proposed_call.name": "操作名称",
  "proposed_call.scope": "涉及的账户",
  "claim.description": "事故经过",
  "entity_a.name": "商品名称",
  "entity_b.name": "商品名称",
  "passage.id": "片段标识",
  "schema.type": "整体格式",
  "schema.properties.*.type": "允许的值类型",
  "schema.properties.*.description": "字段说明",
  "devices.*.id": "设备标识",
  "devices.*.type": "设备类型"
});

const stateCaseLabelsV18 = Object.freeze({
  B03: { message: "用户需求" },
  B06: { note: "客户回访记录" },
  B08: { message: "客户咨询" },
  B14: { message: "待审核内容", policy: "社区规则" },
  B19: {
    "candidate_relation.subject": "收购方",
    "candidate_relation.object": "被收购对象"
  },
  C01: { policy: "保单条款", claim: "索赔申请" },
  C02: { policy: "社区规则" },
  C03: { text: "政策正文" },
  C11: { claim: "待核查的说法" },
  C12: { text: "用户消息", policy: "信息保密规则" },
  C17: { note: "品鉴文字" }
});

/* Optional aliases for exact values at the specified paths only.
 * For arrays, use their containing path or a trailing .* as appropriate.
 * Retain the original value separately; never translate substrings in prose,
 * code, names, email addresses, dates, record IDs, or model numbers.
 */
const stateEnumLabelsV18 = Object.freeze({
  "proposed_call.name": {
    export_all_orders: "导出全部订单"
  },
  "proposed_call.scope": {
    all_accounts: "全部账户"
  },
  "schema.type": {
    object: "按字段组织"
  },
  "schema.properties.*.type": {
    integer: "整数",
    number: "数字",
    null: "空值"
  },
  "schema.required": {
    trial_days: "试用天数",
    monthly_price: "每月价格"
  }
});

/* Type-aware display labels. Test types explicitly: false, 0, and null must
 * not disappear through a truthiness check. Null is an empty value, NOT proof
 * that the source omitted information (C13 deliberately contains an omission).
 */
const stateValueLabelsV18 = Object.freeze({
  boolean: { true: "是", false: "否" },
  null: "空值（null）",
  emptyString: "空文本",
  emptyArray: "空列表",
  emptyObject: "空记录"
});

/* These state values are complete strings, not objects. Preserve newlines,
 * blank lines, and Lxxx/Bxxx identifiers exactly; do not iterate characters,
 * strip the identifiers, or merge C06 lines before the illustrated decision.
 */
const stateTextStatesV18 = Object.freeze({
  "C05:0": "已编号的条款原文",
  "C06:0": "待恢复结构的原文",
  "C06:1": "假设合并后的文本块"
});

/* D01 audit: devices is an array of three separate records, each with id,
 * room and type. Render all records recursively, keeping each group intact.
 * supported_capabilities is an object: 灯 -> [打开, 关闭]. Keep the Chinese key
 * and action values unchanged. This state lists devices, not execution receipts.
 */
const stateLabelAssetV18 = Object.freeze({
  fields: stateFieldLabelsV18,
  paths: statePathLabelsV18,
  cases: stateCaseLabelsV18,
  enums: stateEnumLabelsV18,
  values: stateValueLabelsV18,
  textStates: stateTextStatesV18
});

function statePath(path){return path.replace(/\.\d+(?=\.|$)/g,'.*');}
function stateLabel(key,path,caseId){return stateCaseLabelsV18[caseId]?.[statePath(path)]||statePathLabelsV18[statePath(path)]||stateFieldLabelsV18[key]||key.replace(/_/g,' ');}
function humanState(value,depth=0,path='',caseId=''){
 const pad='  '.repeat(depth),normalized=statePath(path),pattern=normalized.replace(/schema\.properties\.[^.]+\.type(?=\.|$)/,'schema.properties.*.type');
 if(value===undefined)return '未提供';
 if(value===null)return '空值';
 if(typeof value==='boolean')return value?'是':'否';
 if(typeof value!=='object')return stateEnumLabelsV18[pattern]?.[value]||stateEnumLabelsV18[pattern.replace(/\.\*$/,'')]?.[value]||String(value);
 if(Array.isArray(value))return value.length?value.map((v,i)=>pad+(i+1)+'. '+humanState(v,depth+1,path+'.'+i,caseId).trimStart()).join('\n'):'无';
 return Object.keys(value).length?Object.entries(value).map(([key,v])=>{
  const next=path?path+'.'+key:key;
  return pad+stateLabel(key,next,caseId)+'：'+(v&&typeof v==='object'?'\n'+humanState(v,depth+1,next,caseId):humanState(v,depth+1,next,caseId));
 }).join('\n'):'无';
}
function humanText(value){
 const text=String(value??'');
 const clean=text.trim().replace(/^```(?:json)?\s*\n?/,'').replace(/\n?```$/,'');
 try{const parsed=JSON.parse(clean);if(parsed&&typeof parsed==='object')return humanState(parsed);}catch{}
 // Older saved official tasks were a plain-language heading followed by JSON.
 const start=text.search(/\n\s*\n\s*[\[{]/);
 if(start>=0){try{return text.slice(0,start)+'\n\n'+humanState(JSON.parse(text.slice(start).trim()));}catch{}}
 return text;
}
function humanOutput(value,model,request){
 const text=String(value??'');if(!text)return '正在接收输出…';
 try{
  const result=JSON.parse(text);
  if(result&&typeof result==='object'){
   if(result.choice!=null)return '判断结果：'+result.choice;
   if(result.answers){return Object.entries(result.answers).map(([id,a],i)=>{
    const q=questionEntries(request).find(([key])=>key===id)?.[1];
    const label=a.choice!=null?(q?.criteria?.[a.choice]||a.choice):a.noul!=null?(a.noul===.5?'证据不足':a.noul>.5?'是':'否'):a.score!=null?(q?.criteria?.[a.score]||'评分 '+a.score):'待接口返回';
    return (i+1)+'. '+(q?.instructions?q.instructions+'\n':'')+label;
   }).join('\n\n');}
   return humanState(result);
  }
 }catch{if(/^[\s`]*[\[{]/.test(text))return '正在接收判断…';}
 return humanText(text);
}

function humanQuestion(text){
 return String(text??'').replace(/\b[A-Za-z_][A-Za-z_0-9]*\b/g,word=>stateFieldLabelsV18[word]||({state:'任务材料',question:'判断问题',questions:'判断问题',true:'是',false:'否',null:'空值'})[word]||word);
}

/* Display-only result labels: case ID -> original question ID -> Chinese label.
 * Covers all 115 question occurrences in 42 requests. C08.which_skill and
 * C16.category each occur in two requests and deliberately share one label.
 * These labels describe judgments or recommendations, never executed actions.
 */
const resultLabelsV18 = Object.freeze({
  B01: {
    best_passage: "选中知识片段",
    answer_exists: "是否找到答案"
  },
  B02: {
    in_scope: "研究主题匹配",
    has_experiment: "是否开展实验",
    method_reporting: "方法说明完整度"
  },
  B03: {
    intent: "主要需求类别",
    complexity: "分析复杂程度"
  },
  B04: {
    injection: "越权指令风险",
    scope_violation: "操作范围越界",
    fits_request: "符合用户需求"
  },
  B05: {
    logs_sensitive_payload: "敏感日志违规",
    rule_applicable: "规则是否适用"
  },
  B06: {
    competitor_trial: "竞品试用迹象",
    renewal_refusal: "已决定不续费",
    product_frustration: "使用受阻程度"
  },
  B07: {
    python_evidence: "岗位语言开发证据",
    distributed_evidence: "分布式任务经验"
  },
  B08: {
    fit: "目标客户匹配",
    buying_intent: "试点评估意向",
    route: "后续沟通方向"
  },
  B09: {
    department: "处理团队",
    urgent: "紧急需求",
    refund_requested: "退款诉求",
    frustration: "不满程度"
  },
  B10: {
    event_type: "报案事件类型",
    other_vehicle_stated: "其他车辆说明",
    needs_clarification: "材料补充需求"
  },
  B11: {
    identity_evidence: "同一主体依据",
    purpose_specific: "具体项目标识"
  },
  B12: {
    deletion_clause: "终止后删除安排",
    subcontract_notice: "分包前通知要求"
  },
  B13: {
    category: "商品所属类别",
    material: "接触食品材料",
    electric: "电加热功能"
  },
  B14: {
    personal_attack: "针对个人攻击",
    focus: "批评主要对象",
    severity: "违规严重程度"
  },
  B15: {
    offer_matches: "宣传条件一致",
    rule_violation: "宣传规则违规",
    topic_match: "产品主题相关度"
  },
  B16: {
    issue: "玩家主要问题",
    churn_signal: "停止游玩意向",
    frustration: "玩家不满程度"
  },
  B17: {
    delivery_disruption: "交付中断风险",
    data_exposure_evidence: "数据暴露证据",
    impact: "主要业务影响"
  },
  B18: {
    purchase_plan: "新增采购计划",
    supply_concern: "供货担忧迹象",
    product_interest: "关注产品类别"
  },
  B19: {
    supported: "关系证据支持",
    relationship: "双方关系类型"
  },
  C01: {
    rental_eligible: "租车费用保障",
    documents_sufficient: "索赔材料完整"
  },
  C02: {
    category: "主要违规类别",
    queue: "建议审核队列"
  },
  C03: {
    reporting_required: "是否要求上报",
    reporting_deadline: "规定上报时限",
    annual_training: "年度培训要求"
  },
  C04: {
    answers_query: "片段能否回答"
  },
  C05: {
    answer_line: "答案所在原文",
    answer_exists: "是否找到答案"
  },
  C06: {
    join_L002: "迁移说明是否续接",
    join_L004: "操作步骤是否续接",
    type_B000: "首块内容类型",
    type_B001: "第二块内容类型",
    type_B002: "第三块内容类型",
    type_B003: "第四块内容类型",
    heading_level_B000: "标题所属层级",
    ordered_B002: "备份是否要求顺序",
    ordered_B003: "重启是否要求顺序"
  },
  C07: {
    tool: "建议使用工具",
    plot_symbol: "目标证券名称",
    plot_window: "价格历史范围",
    plot_window_stated: "是否指定时间范围",
    plot_include_volume: "是否要求成交量"
  },
  C08: {
    which_skill: "建议使用技能",
    needs_action: "是否需要实际操作",
    needs_procedure: "是否需要专门流程",
    prose_suffices: "仅文字能否满足",
    fits_create: "新建技能适用",
    fits_edit: "编辑技能适用",
    fits_sheet: "表格技能适用"
  },
  C09: {
    link_state: "商品关联程度",
    same_name: "名称指向一致",
    same_brand: "品牌主体一致",
    same_edition: "型号版本一致"
  },
  C10: {
    is_relevant: "片段主题相关",
    contains_answer_evidence: "可用回答依据",
    contradicts_query_premise: "与问题前提冲突",
    contains_prompt_injection: "片段越权指令"
  },
  C11: {
    relation: "引文与说法关系"
  },
  C12: {
    bypass_attempt: "越权请求迹象",
    severity: "信息泄露严重度",
    secret_disclosure: "回复实际泄密"
  },
  C13: {
    trial_unsupported: "试用天数缺乏依据",
    price_omitted: "原文价格被遗漏"
  },
  C14: {
    mode: "日期表达方式",
    month: "明确月份",
    day: "月内日期",
    year: "明确年份",
    day_anchor: "相对日期表达",
    weekday: "对应星期",
    week_offset: "对应周次"
  },
  C15: {
    receipt_email: "收据接收邮箱"
  },
  C16: {
    category: "商品所属类别"
  },
  C17: {
    fruit_intensity: "果香强调程度",
    short_finish: "是否表明短余味"
  },
  C18: {
    industry: "细分行业类别"
  },
  D01: {
    category: "用户请求类别",
    multiple_actions: "是否包含多个操作",
    scope: "设备操作范围",
    device_type: "目标设备类型",
    light_action: "建议灯控动作"
  }
});
