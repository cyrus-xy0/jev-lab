/* Five consistent topic disclosures: brief first, details on click or keyboard. */
/* Content checked against first-party documentation on 2026-09-22:
 * https://docs.typesafe.ai/introduction
 * https://docs.typesafe.ai/introduction/machine-learning-primer
 * https://docs.typesafe.ai/concepts/state
 * https://docs.typesafe.ai/primitives
 * https://docs.typesafe.ai/confidence
 * https://docs.typesafe.ai/concepts/how-to-build-with-system-one
 * https://docs.typesafe.ai/models
 * The support message below is an illustrative example, not an API result.
 */
let basicsType='choice';
const basicsExamples={
 choice:{label:'选哪个',name:'Choice',description:'从给定选项中选一个',question:'这条消息应交给哪个团队处理？',criteria:'候选团队是支付支持、账号支持和其他。',answer:'支付支持',note:'若选择“支付支持”，工单系统再把消息分给对应团队。'},
 noul:{label:'是 / 否',name:'Noul',description:'判断一件事是否成立',question:'客户是否在要求退款？',criteria:'判断依据是客户是否明确提出退回款项。',answer:'倾向「是」',note:'系统根据回答“是”的概率和业务规则，决定是否进入退款核查流程。'},
 score:{label:'评分',name:'Score',description:'按给定的等级标准打分',question:'客户表达的着急程度如何？',criteria:'评分等级是不着急、希望尽快处理、要求立即处理。',answer:'希望尽快处理',note:'系统根据评分安排处理优先级。'}
};
function basicsTopics(){
 const e=basicsExamples[basicsType];
 return [
  {id:'purpose',title:'Jev 是干嘛的',brief:'Jev 是面向决策的 AI 模型，他最擅长的是根据状态做出判断和决策。',points:[
   ['判断是他的核心任务','Jev 专门围绕判断结果及其概率进行训练。它需要理解你提供的材料，再按问题和标准给出三类答案：从候选项中选择、按标准评分，或回答“是”的概率。'],
   ['并不是给人类使用的','Jev 设计出来是供程序使用的，而不是给人对话的，它只是一个无情的做题机器。']
  ]},
  {id:'difference',title:'Jev 和 LLM 的区别',brief:'LLM 根据提示词理解并生成自然语言回复；JEV 根据现状做出判断和选择',points:[
   ['JEV 是后训练出来的','JEV 通过后训练，学习根据现状做出判断和选择。'],
   ['与 LLM 可以分工配合','LLM 也能分类和做判断，并能生成解释、文章或回复。Jev 聚焦于判断，不生成这类文字；在同一业务中，可以由 Jev 给出处理判断，再由 LLM 根据处理结果组织回复。']
  ]},
  {id:'usage',title:'Jev 怎么用',brief:'使用 Jev，要分开准备判断依据（state）和明确的问题（question），并说明答案标准；模型返回判断后，由业务系统完成后续操作。',points:[
   ['先说清依据和问题','state 是供模型判断的事实、背景和规则；question 是你要它回答的具体判断。同一份材料可以提出多个问题，但每个问题应只判断一件事。'],
   ['再约定答案怎么用','选择题要给出候选项，评分题要说明各等级的含义，是非题要说清成立条件。得到结果后，业务系统再按规则分流、排序或转人工，模型不会自行完成这些操作。']
  ],example:'把客户留言“同一笔订单扣了两次，请尽快退回多扣的钱”作为 state，再提出 question：“'+e.question+'”'+e.criteria+e.note},
  {id:'strengths',title:'JEV 适合哪些任务',brief:'JEV 适合在信息和判断标准已给定时，完成范围明确的分类、选择、是非判断或评分，并把结果交给系统继续处理。',points:[
   ['范围明确，材料足够','任务应能用已有候选项、一个是非条件或评分标准来表达。相关事实与业务规则需要事先提供；如果涉及几个独立因素，可以分别判断，再由业务系统组合结果。'],
   ['判断之后还有下一步','JEV 返回的选择或分数可用于分流、筛选和排序。它提供判断及概率信息，具体动作仍由业务系统执行；不确定的情况可以补充材料或交给人工复核。']
  ],example:'客服收到“重置密码后仍然登录失败，请帮我处理”。任务是从“账号支持、支付支持、其他”中选择负责团队。JEV 可判断应归入哪个团队，再由工单系统完成分派。'},
  {id:'limits',title:'JEV 不适合哪些任务',brief:'JEV 不适合以自由文本为主要产出的任务，例如长篇写作、开放创作和知识讲解；这类任务通常更适合交给 LLM。',points:[
   ['目标是写出或解释完整内容','文章、宣传文案、故事和知识讲解，需要组织语言、展开解释并不断修改。JEV 的输出聚焦选择、是非判断和评分，不直接产出这类自由文本成品。'],
   ['可以参与其中的判断环节','如果能拆出“是否符合要求”“哪份候选更合适”等明确问题，JEV 可以参与评估。内容生成和后续修改仍需由 LLM、人工或其他工具完成。']
  ],example:'为一家即将开业的咖啡店，根据“社区小店、适合朋友聊天”的简短需求，写一篇完整宣传文案，再改得更亲切。这项任务主要要求生成并润色文字，通常更适合 LLM；JEV 可用于判断已有文案是否符合给定风格要求。'}
 ];
}
function renderBasics(){
 $('#main').classList.add('simple-main');$('#main').classList.remove('journey-main');
 $('#main').innerHTML=`<div class="basics-heading"><h1>认识 Jev</h1><button class="button primary" data-nav="compare">开始对比 <span aria-hidden="true">→</span></button></div>
 <div class="basics-modules">${basicsTopics().map((t,i)=>`<details class="basics-topic" data-basics-topic="${t.id}"><summary aria-controls="basics-detail-${t.id}" aria-expanded="false" aria-labelledby="basics-question-${t.id} basics-toggle-${t.id}" aria-describedby="basics-answer-${t.id}"><span class="basics-topic-number" aria-hidden="true">0${i+1}</span><h2 id="basics-question-${t.id}">${t.title}</h2><span class="basics-topic-action"><span class="basics-topic-toggle" id="basics-toggle-${t.id}">展开详情</span><svg class="basics-topic-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="basics-topic-rail" aria-hidden="true"></span><p class="basics-topic-answer" id="basics-answer-${t.id}">${t.brief}</p></summary><div class="basics-topic-detail" id="basics-detail-${t.id}"><ul>${t.points.map(([title,text])=>`<li><h3>${title}</h3><p>${text}</p></li>`).join('')}</ul>${t.example?`<div class="basics-topic-example"><h3>一个例子</h3><p>${esc(t.example)}</p></div>`:''}</div></details>`).join('')}</div>
 <div class="basics-footer"><button class="text-link" data-open-example="support">用退款任务开始对比 →</button><a class="text-link" href="https://docs.typesafe.ai/introduction" target="_blank" rel="noreferrer">TypeSafe 官方说明 ↗</a></div>`;
 hydrateIcons();bindBasicsTopics();
}
function bindBasicsTopics(){
 for(const card of document.querySelectorAll('.basics-topic')){
  const summary=card.querySelector('summary');
  const sync=()=>{
   summary.setAttribute('aria-expanded',String(card.open));
   card.querySelector('.basics-topic-toggle').textContent=card.open?'收起详情':'展开详情';
  };
  // Native details/summary handles clicks, Enter and Space without pointer timers.
  card.addEventListener('toggle',sync);
  card.addEventListener('keydown',event=>{if(event.key==='Escape'&&card.open){event.preventDefault();card.open=false;sync();summary.focus({preventScroll:true});}});
  sync();
 }
}
function openBasics(type){basicsType=type||'choice';if($('#modal').open)$('#modal').close();navigate('basics');if(type)document.querySelector('[data-basics-topic="usage"] > summary')?.click();}
if(document.modelContext?.registerTool){const life=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'explore_jev_basics',title:'认识 Jev：材料、问题与三类答案',description:'打开背景标签，展开所选问题类型的使用说明与输入示例。只切换界面，不调用模型或执行业务。',inputSchema:{type:'object',properties:{answer_type:{type:'string',enum:['choice','noul','score']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='answer_type')||input.answer_type!==undefined&&!Object.hasOwn(basicsExamples,input.answer_type))throw new Error('answer_type 请选择 choice、noul 或 score');openBasics(input.answer_type||'choice');return {view:'basics',answerType:basicsType,realModelsCalled:false};}},{signal:life.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>life.abort(),{once:true});}
