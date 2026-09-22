/* Replace this adapter with API calls later. Events describe application activity,
   never hidden model reasoning. Mock results use only the submitted task. */
const comparisonClient=(()=>{
 const estimateTokens=text=>Math.max(1,Math.ceil(String(text).length/1.6));
 const excerpt=(text,n=75)=>text.length>n?text.slice(0,n)+'…':text;
 function prepare(task,confirmed=false,official=null){
  if(official)return prepareOfficial(task,official);
  const state=task.trim();let kind='custom',question='',options=[],answer='',output='',closure='',steps=[],needsConfirmation=false;
  if(/退款|扣款|退费/.test(state)){
   kind='support';question='当前退款请求应该如何处理？';options=['退回重复扣款','不退款','补充材料','等待授权'];
   const amount=state.match(/[¥￥]\s*(\d+(?:\.\d{1,2})?)/)?.[1]||state.match(/(\d+(?:\.\d{1,2})?)\s*元/)?.[1];
   const facts=state.split(/\n\s*\n/).at(-1);
   const known=/同一订单/.test(facts)&&/两笔[^。；\n]{0,16}成功扣款|两笔[^。；\n]{0,16}扣款成功|重复扣款已确认/.test(facts)&&/无第二笔|没有第二笔|无其他购买/.test(facts)&&!/失败|未成功|如果|假设|尚未核实|待核实|缺少|暂无/.test(facts);
   const denied=/没有重复|并未重复|仅一笔成功|另一笔失败/.test(state);
   const allowed=/已授权|允许.{0,6}退款/.test(state)&&!/未授权|暂不退款|不要退款|没有授权|授权未知/.test(state);
   answer=denied?'不退款':!known||!amount?'补充材料':!allowed?'等待授权':'退回重复扣款';
   output=answer==='退回重复扣款'?`已提交 ¥${amount} 的重复扣款退款申请。可向客户回复：“重复扣款已核实，我们已申请退回 ¥${amount}，到账进度以支付渠道回执为准。”`:answer==='不退款'?'当前材料未显示两笔成功的重复扣款，不提交退款。请向客户说明扣款状态。':answer==='等待授权'?'已具备重复扣款信息，请确认退款授权后再提交申请。':'需要补充同一订单的两笔扣款状态、金额，以及是否存在第二笔购买记录，才能核实退款。';
   closure=answer==='退回重复扣款'?`退款申请：¥${amount}；通知内容已准备。`:`未提交退款：${answer}。`;
   steps=['读取订单与扣款信息','核对退款条件和授权','生成处理结果与通知内容'];
  }else if(/会议|约.{0,30}开\s*(?:\d+\s*分钟)?会|日历/.test(state)){
   kind='tools';question='会议应该安排在哪个时段？';
   const duration=Number(state.match(/(\d+)\s*分钟/)?.[1]||0);
   const slots=[...new Set(state.match(/\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2}/g)||[])].filter(slot=>{const [a,b,c,d]=slot.match(/\d+/g).map(Number);return a<24&&c<24&&b<60&&d<60&&c*60+d-a*60-b>=duration&&c*60+d>a*60+b;});
   options=slots.length?[...slots,'补充忙闲信息']:['补充忙闲信息'];
   const hasDate=/明天|后天|今天|(?:下周|周)[一二三四五六日天]|\d{4}[-年]\d{1,2}[-月]\d{1,2}|\d{1,2}月\d{1,2}日/.test(state);
   const hasPeople=/约[^。；\n]{1,25}(?:和|、)[^。；\n]{1,15}(?:开|在)|参会人[：:]\s*[^。；\n]+/.test(state);
   const available=hasDate&&hasPeople&&duration>0&&/共同空闲|大家都有空|均有空/.test(state)&&!/没有共同空闲|无共同空闲|如果|假设/.test(state);
   answer=available&&slots.length?slots.slice().sort((a,b)=>parseInt(a)-parseInt(b))[0]:'补充忙闲信息';
   needsConfirmation=answer!=='补充忙闲信息'&&!confirmed;
   output=answer==='补充忙闲信息'?'请提供参会人、日期、时长和共同空闲时间，再确定会议安排。':confirmed?`会议时间为 ${answer}。会议已创建，邀请已提交发送。`:`建议安排在 ${answer}。这是材料中最早的共同空闲时段，确认后可创建会议并发送邀请。`;
   closure=answer==='补充忙闲信息'?'尚未创建会议。':confirmed?`会议已创建：${answer}；邀请已提交。`:`等待确认：${answer}。`;
   steps=['读取参会要求与共同空闲时间','按时间偏好选择时段',confirmed?'生成建会与邀请回执':'准备安排，等待用户确认'];
  }else if(/审核|帖子|社区|评论/.test(state)){
   kind='moderation';question='根据给定规则，这条内容应该怎样处理？';options=['发布','拦截','转人工'];
   const hasRule=/规则[：:]|禁止|允许/.test(state),asksCode=/验证码.{0,12}(私信|发给|给我)|提供.{0,5}验证码/.test(state);
   answer=hasRule&&asksCode&&/禁止索要验证码/.test(state)?'拦截':'转人工';
   output=answer==='拦截'?'这条内容要求他人提供短信验证码，违反了给定的社区规则。已拦截发布，并准备了要求作者移除相关内容的通知。':'当前材料不足以可靠确定内容是否符合全部规则。请转人工复核，并补充正文与审核标准。';
   closure=answer==='拦截'?'帖子未发布；审核记录与作者通知已生成。':'内容暂不发布，进入人工复核。';
   steps=['读取正文与审核规则','匹配规则，检查处理边界','生成审核记录与通知内容'];
  }else if(/故障|回滚|结账|上线|报错/.test(state)){
   kind='priority';question='当前故障下一步应该如何处理？';options=['回滚','继续排查','等待授权'];
   const facts=state.split(/\n\s*\n/).at(-1);
   const evidence=/新版.{0,10}失败/.test(facts)&&/旧版.{0,10}通过/.test(facts)&&/数据库正常/.test(facts)&&!/如果|假设|若|没有.{0,10}测试结果|尚未.{0,10}测试|不确定|未知|未验证/.test(facts);
   answer=evidence?(/已授权/.test(state)&&!/未授权|不要回滚/.test(state)?'回滚':'等待授权'):'继续排查';
   output=answer==='回滚'?'材料显示新版下单测试失败、旧版通过，且数据库正常。已按授权预案提交回滚；后续需要用下单测试和监控确认是否恢复。':answer==='等待授权'?'现有材料支持考虑回滚，请先确认执行授权与回滚预案。':'现有信息不足以确认故障来自新版本。请补充新旧版本测试、错误日志和数据库状态，再选择处置方式。';
   closure=answer==='回滚'?'回滚指令已提交；恢复状态等待验证。':`未执行回滚：${answer}。`;
   steps=['读取故障影响与测试记录','核对处置依据和执行授权','生成处置回执与验证事项'];
  }else{
   const first=state.split(/\n/).filter(Boolean)[0]||state;
   output=`已收到任务：“${excerpt(first,110)}”。\n当前 mock 未匹配到具体业务规则。请明确预期交付物、可用材料与限制条件；接入模型后，会在这里输出针对这项任务的完整回答。`;
   closure='尚未执行业务操作。';steps=['读取完整任务','检查可用上下文与任务类型','返回当前处理状态'];
  }
  return {kind,state,question,options,answer,needsConfirmation,steps,closure,llmOutput:output,jevSummary:question?'判断结果：'+answer:'任务尚未转成明确的判断问题。',jevOutput:question?JSON.stringify({choice:answer},null,2):'任务尚未转成明确的判断问题。',supported:!!question};
 }
 function prepareOfficial(task,selection){
  const c=officialCase(selection.caseId),item=c?.requests[selection.index],body=officialInput(task,selection);
  if(!c||!item||!body)throw new Error('模版不存在，请重新选择。');
  const fixtureMatch=JSON.stringify(body)===JSON.stringify(item.body),values=officialMockValues[c.id]?.[selection.index],answers={},lines=[];
  for(const [id,q] of Object.entries(body.questions)){
   const value=values?.[id];let label='待接口返回';
   if(fixtureMatch&&value!==undefined){
    if(q.type==='choice'){answers[id]={choice:value};label=q.criteria[value];}
    if(q.type==='noul'){answers[id]={noul:value};label=value===.5?'证据不足':value>.5?'是':'否';label+='（“是”的模拟概率 '+Math.round(value*100)+'%）';}
    if(q.type==='score'){answers[id]={score:value,legend:q.criteria};label=value+' / '+(q.criteria.length-1)+' · '+q.criteria[value];}
   }else answers[id]={status:'awaiting_model'};
   lines.push(humanQuestion(q.instructions)+'\n'+humanQuestion(label));
  }
  const count=lines.length,pending='任务或判断标准已修改。请求已准备，当前 mock 未覆盖这份输入，接入模型后返回判断。';
  const llmOutput=fixtureMatch?'模拟回答：\n\n'+lines.map((line,i)=>(i+1)+'. '+line).join('\n\n'):pending;
  const jevOutput=JSON.stringify({mock:true,answers},null,2);
  const short=fixtureMatch?Object.entries(body.questions).map(([id,q],i)=>{const v=values[id];return (resultLabelsV18[c.id]?.[id]||humanQuestion(q.instructions))+'：'+(q.type==='choice'?q.criteria[v]:q.type==='noul'?(v===.5?'证据不足':v>.5?'是':'否'):q.criteria[v]);}).join('\n'):pending;
  return {official:true,kind:'official',state:body.state,question:Object.values(body.questions).map(q=>q.instructions).join('；'),options:[],answer:fixtureMatch?count+' 项模拟判断':'等待模型接入',supported:true,needsConfirmation:false,fixtureMatch,jevRequest:body,llmPrompt:task,steps:['读取相同材料和 '+count+' 道判断要求','模拟生成逐题回答',fixtureMatch?'整理判断结果与后续处理说明':'保留请求，等待模型接入'],jevSteps:['读取任务材料和 '+count+' 道判断要求','逐题匹配候选答案或评分等级',fixtureMatch?'逐题返回模拟结果':'保留请求，等待模型接入'],llmOutput,jevOutput,llmSummary:fixtureMatch?'模拟回答 · '+count+' 项\n'+short:pending,jevSummary:fixtureMatch?'模拟判断 · '+count+' 项\n'+short:pending,closure:'后续由程序处理：'+c.postprocess+'\n本次仅运行 mock，未执行业务动作。'};
 }
 function wait(ms,signal){return new Promise((resolve,reject)=>{if(signal.aborted){reject(new DOMException('Aborted','AbortError'));return;}const abort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);signal.addEventListener('abort',abort,{once:true});});}
 function independentPlan(model,task,jevRequest,official,confirmed){
  const c=officialCase(official?.caseId),item=c?.requests[official?.index];
  if(model==='llm'){
   if(item&&matchesOfficialTask(task,c,item.body))return prepareOfficial(task,{caseId:c.id,index:official.index,body:item.body,baseTask:task});
   return prepare(task,confirmed);
  }
  if(item)return prepareOfficial(task,{caseId:c.id,index:official.index,body:jevRequest,baseTask:task});
  const state=typeof jevRequest.state==='string'?jevRequest.state:humanState(jevRequest.state),p=prepare(state,confirmed),entries=questionEntries(jevRequest),q=entries[0]?.[1];
  if(entries.length===1&&q.type==='choice'&&q.instructions===p.question&&equalInput(Object.values(q.criteria||{}),p.options))return {...p,jevRequest,jevSteps:['读取 state 中的事实和规则','按给定 question 和候选项判断','返回选择，交由程序继续处理']};
  const count=entries.length,pending='已收到材料和 '+count+' 个判断问题。当前 Mock 未覆盖这份输入，接入模型后返回判断。';
  return {kind:'custom',supported:false,jevRequest,jevSteps:['读取已知材料 state','校验 '+count+' 个问题与答案要求','请求已准备，等待模型接入'],jevOutput:JSON.stringify({mock:true,status:'awaiting_model'}),jevSummary:pending,closure:'尚未执行业务操作。'};
 }
 async function run({task,provider,confirmed=false,official=null,signal,onEvent,models=['llm','jev'],llmPrompt,jevRequest}){
  const combined=llmPrompt===undefined&&!jevRequest?prepare(task,confirmed,official):null;
  const plans={};
  await Promise.all(models.map(async model=>{
   const prompt=llmPrompt??task,plan=combined||independentPlan(model,prompt,jevRequest,official,confirmed);plans[model]=plan;
   const start=performance.now(),emit=event=>{if(!signal.aborted)onEvent({model,...event});};
   const request=model==='llm'?{model:provider,messages:[{role:'user',content:llmPrompt??plan.llmPrompt??task}]}:jevRequest||plan.jevRequest||{state:plan.state,questions:plan.question?[{type:'choice',question:plan.question,options:plan.options}]:[]};
   emit({type:'request',request});await wait(550,signal);
   const steps=model==='llm'?plan.steps:plan.jevSteps||['读取已知情况 state','按明确问题进行判断','返回判断结果'];
   for(const text of steps){emit({type:'progress',text,elapsed:(performance.now()-start)/1000});await wait(650,signal);}
   const output=model==='llm'?plan.llmOutput:plan.jevOutput,displayOutput=model==='llm'?humanText(output):(plan.jevSummary||humanOutput(output,model,request));
   emit({type:'output',text:'',displayText:''});
   const chunk=plan.official?Math.max(12,Math.ceil(output.length/32)):12;
   for(let end=chunk;end<output.length+chunk;end+=chunk){await wait(36,signal);emit({type:'output',text:output.slice(0,end),displayText:displayOutput.slice(0,Math.ceil(Math.min(1,end/output.length)*displayOutput.length))});}
   // This full completion event is the local mock's response, not a vendor API envelope.
   emit({type:'complete',source:'local_mock',output,summary:model==='llm'?plan.llmSummary:plan.jevSummary,closure:plan.closure,needsConfirmation:plan.needsConfirmation,metrics:{time:(performance.now()-start)/1000,input:estimateTokens(JSON.stringify(request)),output:estimateTokens(output)}});
  }));
  return combined||plans[models[0]];
 }
 return {mode:'mock',prepare,run};
})();
