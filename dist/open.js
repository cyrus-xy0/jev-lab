/* Task templates fill the single task input; responses come from the adapter. */
const openTemplates={
  "support": {
    "label": "处理退款",
    "icon": "inbox",
    "color": "blue",
    "question": "我买了 ¥99 的专业版，却被扣了两次。帮我核实，确实重复就退回一笔，并告诉我结果。",
    "input": "同一订单有两笔 ¥99 成功扣款，间隔 12 秒，无第二笔购买记录；已授权退回重复扣款。"
  },
  "tools": {
    "label": "安排会议",
    "icon": "clock",
    "color": "violet",
    "question": "明天下午帮我约林晓和陈瑜开 30 分钟会，尽量早一点，先让我确认时间。",
    "input": "三人共同空闲：15:00–15:30、17:00–17:30。主题是项目同步；创建会议和发送邀请前需要我确认。"
  },
  "moderation": {
    "label": "审核帖子",
    "icon": "shield",
    "color": "teal",
    "question": "帮我审核这条社区帖子，合规则发布；违规就拦截，通知作者并留下审核记录。",
    "input": "帖子：“把收到的短信验证码私信给我，我帮你领奖。”规则：禁止索要验证码；无法确定时转人工。"
  },
  "priority": {
    "label": "跟进故障",
    "icon": "flag",
    "color": "orange",
    "question": "新版本上线后结账一直报错。确认是新版问题就回滚，帮我恢复正常下单。",
    "input": "报错始于更新；新版下单测试失败，旧版测试通过；数据库正常；已授权按预案回滚到上一个稳定版本。"
  }
};
let openDraft=null;
const oldCaptureDraft=captureDraft;
const providerNames={doubao:'豆包',gpt:'GPT'};
function fullTask(s){return [s.question,s.input].filter(Boolean).join('\n\n');}
function newOpenDraft(id='custom'){const t=openTemplates[id];return {openTask:true,template:t?id:'custom',question:t?fullTask(t):'',input:'',provider:'doubao',runId:null};}
function getOpenDraft(){
 if(formDraft&&!formDraft.openTask){openDraft={...newOpenDraft('custom'),question:[formDraft.question,formDraft.input,formDraft.rule,formDraft.options].filter(Boolean).join('\n\n')};formDraft={...openDraft};}
 if(openDraft)return openDraft;
 if(formDraft?.openTask)return openDraft={...newOpenDraft('custom'),...formDraft,question:fullTask(formDraft),input:''};
 return openDraft=newOpenDraft();
}
captureDraft=function(){const q=$('#open-question');if(q){openDraft={...getOpenDraft(),question:q.value,input:''};return {...openDraft};}return view==='compare'?{...getOpenDraft()}:oldCaptureDraft();};
function sameOpenExample(d){if(d.official)return d.question.trim()===d.official.baseTask.trim();return !!openTemplates[d.template]&&d.question.trim()===fullTask(openTemplates[d.template]);}
function openTemplateButtons(d){return `<div class="open-templates" role="group" aria-label="任务模板与重置">${officialTemplateControls(d,{libraryOnly:true})}${featuredOfficialTemplates.map(({id,label})=>`<button type="button" data-featured-template="${esc(id)}" aria-pressed="${d.official?.caseId===id}">${esc(label)}</button>`).join('')}<button type="button" class="compare-reset" data-compare-reset>重置</button></div>`;}
function compareRecord(){const d=getOpenDraft();return history.find(h=>h.id===d.runId)||null;}
function busyOpenRun(){return !!(run&&!run.done);}
function stageCard(model,stage,title,body,details,status='idle'){
 const key=model+'-'+stage;
 return `<section class="compare-stage ${status}" data-stage-key="${key}"><div class="compare-stage-label"><span>${stage==='request'?'01':'02'}</span><h3>${title}</h3><span class="stage-state">${status==='active'?'进行中':status==='done'?'已完成':status==='error'?'已停止':''}</span></div><div class="compare-stage-body">${body}</div><details class="stage-details" data-detail-key="${key}"><summary aria-label="展开${title}细节" aria-expanded="false" aria-controls="detail-content-${key}"><span class="stage-toggle-label">展开细节</span> <span class="stage-chevron" aria-hidden="true">⌄</span></summary><div class="stage-detail-content" id="detail-content-${key}">${details}</div></details></section>`;
}
function openResponsePanel(model,s=null,{editable=false}={}){
 const d=getOpenDraft(),name=model==='llm'?'LLM':'Jev',state=s?.modelState?.[model],task=humanText(s?.inputs?.llmPrompt??(s?fullTask(s):d.question));
 const inputs=s?.inputs||(!s&&d.dual?dualInputs(d):null);
 const plan=s||inputs?null:comparisonClient.prepare(d.question,false,d.official),provider=s?(s.provider||'unknown'):(d.provider||'doubao');
 const phase=state?.phase||'idle',finished=phase==='complete',stopped=(!s?.inputs&&['cancelled','error','failed'].includes(s?.status))||['error','cancelled'].includes(phase);
 const request=state?.request||(inputs?(model==='llm'?{model:provider,messages:[{role:'user',content:inputs.llmPrompt}]}:inputs.jevRequest):null)||(model==='llm'?{model:provider,messages:[{role:'user',content:plan?.llmPrompt||task}]}:plan?.jevRequest||{state:plan?.state||'',questions:plan?.question?[{type:'choice',question:plan.question,options:plan.options}]:[]});
 const entries=questionEntries(request),requestQuestion=entries.map(([id,q])=>jevResultText(q.instructions)).join('；');
 const reqBody=editable&&d.dual?dualRequestEditor(model,d):model==='llm'?`<p class="stage-task">${esc(task||'等待输入任务')}</p>`:`<dl class="request-fields"><div><dt>当前状态 · state</dt><dd>${esc(humanState(request.state,0,'',s?.official?.caseId||d.official?.caseId)||(s?'未记录':'等待输入任务'))}</dd></div><div><dt>判断 · ${entries.length>1?'questions':'question'}</dt><dd>${entries.length>1?entries.length+' 个判断 · ':''}${esc(humanQuestion(requestQuestion)||(s?'未记录':'等待明确判断问题'))}</dd></div></dl>`;
 const missingRequest=!!s&&!state?.request&&!inputs;
 const requestNote=s?.publicEdited?'公开输入经过编辑；此 JSON 为公开输入的请求预览，原始请求已隐藏。':state?.reconstructedRequest?'按历史任务内容展示，未保存原始接口请求。':s&&!state?.request&&phase!=='idle'?'未保存原始接口请求；此 JSON 按已保存的输入展示。':'';
 const reqDetails=missingRequest?'<p class="detail-note">这条记录未保存请求 JSON。</p>':`<pre class="request-json" tabindex="0" aria-label="${name} 完整请求 JSON"><code>${esc(JSON.stringify(request,null,2))}</code></pre>${requestNote?`<p class="detail-note">${requestNote}</p>`:''}`;
 const output=state?.output||'',resultBody=model==='jev'?renderJevResults(request,state,s||{official:d.official}):output?`<p class="stage-output">${esc(humanOutput(state?.displayOutput??state?.summary??output,model,request))}</p>`:`<p class="stage-placeholder">${esc(state?.emptyOutputText||(stopped?'未生成完整结果':phase==='output'?'正在接收输出…':'等待输出'))}</p>`;
 const responseUnavailable=s?.publicEdited?'原始返回已隐藏。':finished?'此记录未保存完整返回 JSON。':stopped?'本次运行未收到完整返回 JSON。':phase==='idle'?'运行后显示完整返回 JSON。':'等待完整返回 JSON。';
 const resultDetails=!s?.publicEdited&&state?.response!=null?`<pre class="response-json" tabindex="0" aria-label="${name} 完整返回 JSON"><code>${esc(JSON.stringify(state.response,null,2))}</code></pre>`:`<p class="detail-note">${responseUnavailable}</p>`;
 const metrics=state?.metrics;
 const resultMetrics=`<div class="open-metrics"><span>耗时 <b>${Number.isFinite(metrics?.time)?metrics.time.toFixed(2)+' 秒':'—'}</b></span><span>输入 Token <b>${metrics?.input!=null?'≈ '+metrics.input:'—'}</b></span><span>输出 Token <b>${metrics?.output!=null?'≈ '+metrics.output:'—'}</b></span></div>`;
 const status=state?.statusLabel||(finished?'已完成':stopped?'已停止':phase==='idle'?'待运行':'运行中');
 return `<article class="open-panel ${model}"><div class="open-model-title"><span class="open-monogram">${model==='llm'?'L':'J'}</span><h2>${name}</h2>${model==='llm'?(editable?`<label class="sr-only" for="llm-provider">LLM 模型</label><select id="llm-provider" ${typeof modelBusy==='function'?modelBusy('llm')?'disabled':'':busyOpenRun()?'disabled':''}><option value="doubao" ${provider==='doubao'?'selected':''}>豆包</option><option value="gpt" ${provider==='gpt'?'selected':''}>GPT</option></select>`:`<span class="provider-name">${providerNames[provider]||'未记录'}</span>`):''}<span class="model-status ${status==='运行中'?'running':''}">${status}</span></div>
 ${stageCard(model,'request',name+' 请求',reqBody,reqDetails,phase==='idle'?'idle':stopped&&phase==='request'?'error':phase==='request'?'active':'done')}
 ${stageCard(model,'result',name+' 结果',resultBody+resultMetrics,resultDetails,finished?'done':stopped?'error':phase==='output'?'active':'idle')}
 </article>`;
}
function openPanels(s,editable=false){return `<div class="open-columns open-results">${openResponsePanel('llm',s,{editable})}${openResponsePanel('jev',s,{editable})}</div>`;}
function openActions(s){if(!s)return '';if(s.inputs&&s.status!=='complete')return '';if(s.status==='running')return '<button class="button secondary" data-open-action="cancel">停止运行</button>';return `${s.status==='complete'&&s.needsConfirmation&&!s.confirmed?'<button class="button primary" data-open-action="confirm">确认时间并继续</button>':''}${s.custom&&['complete','partial'].includes(s.status)?`<button class="button secondary" data-action="publish" ${s.published?'disabled':''}>${s.published?'已匿名展示':'匿名展示此任务'}</button>`:''}`;}
function refreshOpenDraftPreview(){
 const el=$('#open-preview');if(!el)return;
 const detailSnapshot=stageDetails.capture(),focusId=document.activeElement?.id;
 const s=compareRecord();el.innerHTML=openPanels(s,true)+`<div class="open-result-footer"><div>${s?.status==='running'?'':openActions(s)}</div></div>`;
 stageDetails.restore(detailSnapshot);
 if(focusId==='llm-provider')$('#llm-provider')?.focus({preventScroll:true});
 const busy=busyOpenRun();$('#open-run-actions').innerHTML=busy?'<button class="button secondary" type="button" data-open-action="cancel">停止运行</button>':'';$('#open-form-error').textContent=s?.error||'';$('#open-question').readOnly=busy;document.querySelectorAll('[data-open-template],[data-template-library],[data-template-info]').forEach(b=>b.disabled=busy);
 const button=$('#open-form button[type="submit"]');button.disabled=busy||!getOpenDraft().question.trim();button.setAttribute('aria-busy',String(busy));button.innerHTML=icon('play')+(busy?'运行中…':s?'重新对比':'开始对比');hydrateIcons();
}
showGuide=function(){openBasics();};
renderNew=function(){const d=getOpenDraft();$('#main').innerHTML=`<div class="open-workspace"><div class="open-page-heading"><h1>模型对比</h1></div><form id="open-form" class="open-composer"><label for="open-question" class="open-input-label">你的任务</label><textarea id="open-question" name="task" rows="4" maxlength="6000" placeholder="你想完成什么任务？&#10;写清背景材料、已知信息和处理要求。&#10;例如：核实重复扣款，并处理退款、通知客户。" required>${esc(d.question)}</textarea>${openTemplateButtons(d)}<div id="open-form-error" class="form-error" role="alert"></div><div class="open-composer-footer"><div id="open-run-actions"></div><button class="button primary" type="submit">${icon('play')}开始对比</button></div></form><div id="open-preview"></div></div>`;refreshOpenDraftPreview();};
function configureOpenTask(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['task','provider','question','input'].includes(k)))throw new Error('请输入任务和模型');const task=input.task??[input.question,input.input].filter(Boolean).join('\n\n');if(typeof task!=='string'||task.trim().length<5||task.length>6000||input.provider&&!Object.hasOwn(providerNames,input.provider))throw new Error('任务请填写 5–6000 字；模型请选择 doubao 或 gpt。');if(busyOpenRun())throw new Error('请先停止当前运行');stageDetails.close();openDraft={...newOpenDraft('custom'),question:task,provider:input.provider||'doubao'};formDraft={...openDraft};navigate('compare');return {view,staged:true,started:false,mode:'mock'};}
function useOpenTemplate(id){if(busyOpenRun()||id!=='custom'&&!Object.hasOwn(openTemplates,id))return;const d=captureDraft()||getOpenDraft();if(id==='custom'){openDraft=sameOpenExample(d)?{...newOpenDraft('custom'),provider:d.provider}:{...d,template:'custom',official:null};formDraft={...openDraft};renderNew();return;}if(d.question.trim()&&!sameOpenExample(d)&&d.question!==fullTask(openTemplates[id])){showModal('用模版替换当前任务？',`<p class="modal-intro">应用「${esc(openTemplates[id].label)}」会替换已填写的任务。</p><div class="modal-actions"><button class="button secondary" data-action="close">保留我的内容</button><button class="button primary" data-open-apply="${id}">使用模版</button></div>`);return;}applyOpenTemplate(id);}
function applyOpenTemplate(id){if(busyOpenRun()){toast('请先停止当前运行');return;}if(!openTemplates[id])return;stageDetails.close();openDraft={...newOpenDraft(id),provider:getOpenDraft().provider};formDraft={...openDraft};if($('#modal').open)$('#modal').close();if(view!=='compare')navigate('compare');else renderNew();}
function blankModelState(){return {phase:'idle',request:null,response:null,steps:[],output:'',metrics:null};}
function syncOpenRun(record){const h=history.find(h=>h.id===record.id);if(h)Object.assign(h,record);if(current.id===record.id)current=current.custom===false?openPublicCase(record):record;if(view==='compare'&&getOpenDraft().runId===record.id)refreshOpenDraftPreview();else if(view==='detail'&&current.id===record.id)renderOpenDetail();}
async function executeOpenRun(record){
 record.status='running';record.modelState={llm:blankModelState(),jev:blankModelState()};record.openResult={llm:{summary:'运行中'},jev:{summary:'运行中'}};
 const controller=new AbortController(),job={id:record.id,done:false,controller};run=job;syncOpenRun(record);saveHistory();
 try{
  const plan=await comparisonClient.run({task:record.question,provider:record.provider,confirmed:record.confirmed,official:record.official,signal:controller.signal,onEvent(event){
   if(job.done||job.detached||controller.signal.aborted)return;const m=record.modelState[event.model],wasOutput=m.phase==='output';
   if(event.type==='request'){m.phase='request';m.request=event.request;}
   if(event.type==='progress'){m.phase='processing';m.steps.push({text:event.text,elapsed:event.elapsed});}
   if(event.type==='output'){m.phase='output';m.output=event.text;m.displayOutput=event.displayText;if(wasOutput){const output=document.querySelector(`[data-stage-key="${event.model}-result"] .stage-output`);if((view==='compare'&&getOpenDraft().runId===record.id||view==='detail'&&current.id===record.id)&&output){output.textContent=humanOutput(event.displayText??event.text,event.model,m.request);return;}}}
   if(event.type==='complete'){m.phase='complete';m.response=cloneTemplate(event);m.output=event.output;m.metrics=event.metrics;m.closure=event.closure;m.summary=event.summary;m.displayOutput=event.summary;}
   syncOpenRun(record);
  }});
  if(job.detached)return;
  record.status='complete';record.needsConfirmation=plan.needsConfirmation;record.comparison=plan.official?(plan.fixtureMatch?'same':null):(plan.supported?'same':'different');
  for(const model of ['llm','jev']){const m=record.modelState[model];record.openResult[model]={reply:m.output,next:plan.closure,result:plan.closure,summary:m.summary||(model==='jev'?(plan.answer||'需要明确判断问题'):m.output.slice(0,55)),...m.metrics};}
 }catch(error){if(!job.detached){for(const model of ['llm','jev'])if(record.modelState[model].phase!=='complete')record.modelState[model].response=null;record.status=error.name==='AbortError'?'cancelled':'failed';record.error=error.name==='AbortError'?'运行已停止':'请求失败，请重试';}}
 finally{job.done=true;if(!job.detached){syncOpenRun(record);saveHistory();if(view==='history')render();}}
}
function submitOpenTask(){const d=captureDraft();if(!d||d.question.trim().length<5){$('#open-form-error').textContent='请至少用 5 个字描述你的任务。';$('#open-question').focus();return;}if(busyOpenRun()){toast('已有任务正在运行');return;}
 const plan=comparisonClient.prepare(d.question,false,d.official),t=openTemplates[plan.kind],official=officialCase(d.official?.caseId);
 const record={id:'open-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),openTask:true,liveComparison:true,custom:true,template:d.template,official:officialSnapshot(d.question.trim(),d.official),question:d.question.trim(),input:'',provider:d.provider,title:d.question.trim().split('\n')[0].slice(0,70),category:official?templateCategory(official):t?samples.find(s=>s.id===plan.kind).category:'自定义场景',icon:t?.icon||'align',color:t?.color||'blue',status:'running',published:false,mode:'mock',time:new Date().toLocaleString('zh-CN',{hour12:false}),confirmed:false,comparison:null};
 record.taskOrigin=isOfficialTask(record)?'official':'custom';history.unshift(record);current=record;openDraft={...d,runId:record.id};formDraft={...openDraft};executeOpenRun(record);
}
function openSummary(s,model){return s.openResult?.[model]?.summary||'未完成';}
function openTimeLabel(s,model){const time=s.modelState?.[model]?.metrics?.time??s.openResult?.[model]?.time;return typeof time==='number'?time.toFixed(2)+' 秒':'未完成';}
function legacyOpenRecord(s){
 if(s.liveComparison)return s;
 const task=s.openTask?fullTask(s):[s.question,s.input,s.rule?'判断规则：'+s.rule:'',s.options?.length?'候选答案：'+s.options.join(' / '):''].filter(Boolean).join('\n\n');
 const status=s.status||'complete',modelState={},provider=s.provider||'unknown';
 for(const model of ['llm','jev']){
  const r=s.openResult?.[model],timedOut=status==='partial'&&model==='llm';
  const finished=status==='complete'||status==='partial'&&model==='jev';
  const options=s.options||[],choice=options[s[model+'Choice']],hidden=!!s.publicEdited;
  let output=r?.reply||'';
  if(!s.openTask&&finished&&choice!=null){
   const result={choice};
   if(model==='jev'){
    if(s.probs?.length===options.length)result.probabilities=Object.fromEntries(options.map((option,i)=>[option,Math.round(s.probs[i]*100)/10000]));
    if(Number.isFinite(s.confidence))result.confidence=Math.round(s.confidence*100)/10000;
   }
   output=JSON.stringify(result,null,2);
  }
  const time=r?.time??s[model+'Time'],input=r?.input??s[model+'Input'],tokens=r?.output??s[model+'Output'];
  modelState[model]={
   phase:finished?'complete':timedOut||status==='failed'?'error':status==='cancelled'?'cancelled':'idle',
   statusLabel:timedOut?'响应超时':status==='failed'?'运行失败':status==='cancelled'?'已取消':status==='preview'?'未运行':undefined,
   request:s.modelState?.[model]?.request||r?.request||(model==='llm'?{model:provider==='unknown'?null:provider,messages:[{role:'user',content:task}]}:{state:r?.state??(s.openTask?task:[s.input,s.rule?'判断规则：'+s.rule:''].filter(Boolean).join('\n\n')),questions:s.openTask?(r?.question?[{type:'choice',question:r.question,options:r.options||[]}]:[]):[{type:'choice',question:s.question,options}]}),
   reconstructedRequest:!s.modelState?.[model]?.request&&!r?.request,
   response:hidden?null:s.modelState?.[model]?.response??r?.response??null,
   steps:!hidden&&r?.next?[{text:r.next,elapsed:null}]:[],
   processNote:hidden?'原始过程已隐藏':!r?.next?'历史记录未保存处理过程':undefined,
   output:hidden?'原始输出已隐藏':finished?output:'',
   summary:!hidden&&finished&&!s.openTask?choice:null,
   emptyOutputText:timedOut?'响应超时，未生成结果':status==='preview'?'尚未运行':!finished?'未生成完整结果':!output?'历史记录未保存输出':undefined,
   closure:!hidden&&finished?(s.confirmed&&s.openResult?.confirmedResult?s.openResult.confirmedResult:r?.result):null,
   reference:!hidden&&!s.openTask&&s.expected!=null?options[s.expected]:null,
   metrics:!hidden&&finished?{time:Number.isFinite(time)?time:null,input:Number.isFinite(input)?input:null,output:Number.isFinite(tokens)?tokens:null}:null
  };
 }
 return {...s,question:task,input:'',status,provider,modelState,historical:true};
}
function renderOpenDetail(){const detailSnapshot=stageDetails.capture(),s=current,shown=legacyOpenRecord(s);$('#main').innerHTML=`<div class="open-workspace"><div class="open-detail-toolbar"><button class="text-link" data-nav="${s.custom?'gallery/mine':'gallery'}">← ${s.custom?'测试广场 · 我的场景':'测试广场'}</button><span>${s.custom?(s.published?'已匿名展示':'仅自己可见'):'匿名任务'}</span></div><section class="open-question-card"><div><span>你的任务</span><button class="text-link" data-open-action="edit">${s.custom?'修改任务':'使用这个任务'} ↗</button></div><h1>${esc(humanText(fullTask(shown)))}</h1></section><div class="open-detail-panels">${openPanels(shown)}</div><div class="open-result-footer"><div>${openActions(s)}</div></div>${s.error?`<p class="form-error" role="alert">${esc(s.error)}</p>`:''}${s.publicEdited?'<p class="open-caption">公开任务经过编辑，原始输出已隐藏。</p>':''}</div>`;hydrateIcons();stageDetails.restore(detailSnapshot);}
function editOpenTask(){if(busyOpenRun()){toast('请先停止当前运行');return;}stageRecordDraft(current);navigate('compare');}
function cancelOpenTask(){if(run&&!run.done&&run.controller)run.controller.abort();}
function confirmOpenTask(){const s=view==='compare'?compareRecord():current;if(!s||s.status!=='complete'||!s.needsConfirmation||!s.custom||busyOpenRun())return;s.confirmed=true;executeOpenRun(s);}
function showOpenPublish(){const s=view==='compare'?compareRecord():current;if(!s||s.status!=='complete'||!s.custom)return;if(s.inputs)return showDualPublish(s);current=s;showModal('预览匿名展示的内容',`<div class="publish-identity">${icon('shield')}发起人显示为「匿名」</div><label for="open-public-question">公开的任务</label><textarea id="open-public-question" maxlength="6000" rows="6">${esc(fullTask(s))}</textarea><p class="field-note">原样公开时会展示请求与结果；若修改公开任务，原始输出会隐藏，避免残留被删掉的内容。</p><label class="check-label"><input type="checkbox" id="publish-check">我已检查这些内容，适合匿名展示</label><p class="modal-note">仅加入此浏览器的测试广场。</p><div class="modal-actions"><button class="button secondary" data-action="close">返回</button><button class="button primary" data-action="confirm-publish" disabled>加入本地测试广场</button></div>`);}
function confirmOpenPublish(){if(current.inputs)return confirmDualPublish();if(!$('#publish-check')?.checked)return;const question=$('#open-public-question').value.trim();if(!question){toast('请保留公开的任务');return;}const h=history.find(h=>h.id===current.id);if(!h)return;h.openPublic={question,input:''};h.published=true;current={...h};saveHistory();$('#modal').close();gallerySource='mine';navigate('gallery');toast('已加入此浏览器的测试广场');}
function openPublicCase(h){
 if(h.inputs)return publicDualCase(h);
 const pub=h.openPublic||{question:fullTask(h),input:''},task=fullTask(pub),edited=task!==fullTask(h),modelState=h.modelState?JSON.parse(JSON.stringify(h.modelState)):undefined,openResult=JSON.parse(JSON.stringify(h.openResult));
 // Redacted public tasks never carry the private prompt or echoed original output.
 if(edited&&modelState){const p=comparisonClient.prepare(task,!!h.confirmed);modelState.llm.request={model:h.provider,messages:[{role:'user',content:task}]};modelState.jev.request={state:task,questions:p.question?[{type:'choice',question:p.question,options:p.options}]:[]};}
 if(edited)for(const model of ['llm','jev']){const hidden='原始输出已隐藏';openResult[model]={reply:hidden,next:'原始过程已隐藏',result:hidden,summary:hidden,time:null,input:null,output:null};if(modelState)Object.assign(modelState[model],{response:null,steps:[],output:hidden,summary:hidden,closure:'原始业务回执已隐藏',metrics:null});}
 return {id:h.id,openTask:true,liveComparison:h.liveComparison,custom:false,localPublished:true,template:h.template,official:!edited&&h.official?officialSnapshot(task,h.official,modelState?.jev?.request):null,question:pub.question,input:pub.input,title:pub.question.slice(0,70),category:h.category,icon:h.icon,color:h.color,status:h.status,mode:h.mode,time:h.time,provider:h.provider,openResult,modelState,confirmed:h.confirmed,comparison:edited?null:h.comparison,publicEdited:edited};
}
// Native disclosures expand in the document flow. Preserve each one on live updates.
const stageDetails=(()=>{
 let renderedScope=null;
 const scope=()=>view==='compare'?`compare:${getOpenDraft().provider}:${getOpenDraft().question}`:view==='detail'?`detail:${current.id}:${current.custom}`:view;
 const disclosures=()=>Array.from(document.querySelectorAll('.stage-details'));
 const resultQuestions=()=>Array.from(document.querySelectorAll('.jev-result-question'));
 function sync(d){
  const summary=d.querySelector(':scope > summary'),heading=d.closest('.compare-stage')?.querySelector('h3');if(!summary||!heading)return;const title=heading.textContent;
  summary.setAttribute('aria-expanded',String(d.open));
  summary.setAttribute('aria-label',(d.open?'收起':'展开')+title+'细节');
  summary.querySelector('.stage-toggle-label').textContent=d.open?'收起细节':'展开细节';
 }
 function close(){resultQuestions().forEach(d=>{d.open=false;});disclosures().forEach(d=>{d.open=false;const raw=d.querySelector('.request-raw');if(raw)raw.open=false;sync(d);});}
 function capture(){
  const focused=document.activeElement,owner=focused?.closest('.stage-details');
  return {results:resultQuestions().map(d=>({key:d.dataset.resultKey,open:d.open})),resultFocus:focused?.tagName==='SUMMARY'?focused.closest('.jev-result-question')?.dataset.resultKey:null,scope:renderedScope,opened:disclosures().filter(d=>d.open).map(d=>d.dataset.detailKey),raw:disclosures().filter(d=>d.querySelector('.request-raw')?.open).map(d=>d.dataset.detailKey),focus:owner&&focused?.tagName==='SUMMARY'?{key:owner.dataset.detailKey,raw:focused.parentElement.classList.contains('request-raw')}:null};
 }
 function restore(snapshot){
  const currentScope=scope(),matching=snapshot?.scope===currentScope;renderedScope=currentScope;
  for(const d of resultQuestions()){const saved=snapshot?.results?.find(item=>item.key===d.dataset.resultKey);if(saved)d.open=saved.open;if(snapshot?.resultFocus===d.dataset.resultKey)d.querySelector(':scope > summary')?.focus({preventScroll:true});}
  for(const d of disclosures()){
   d.open=matching&&snapshot.opened.includes(d.dataset.detailKey);
   const raw=d.querySelector('.request-raw');if(raw)raw.open=matching&&snapshot.raw.includes(d.dataset.detailKey);
   sync(d);
   if(matching&&snapshot.focus?.key===d.dataset.detailKey)d.querySelector(snapshot.focus.raw?'.request-raw > summary':':scope > summary')?.focus({preventScroll:true});
  }
 }
 document.addEventListener('toggle',event=>{if(event.target.classList?.contains('stage-details'))sync(event.target);},true);
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const question=event.target.closest('.jev-result-question');if(question?.open){event.preventDefault();question.open=false;question.querySelector(':scope > summary').focus({preventScroll:true});return;}
  const d=event.target.closest('.stage-details');if(d?.open){event.preventDefault();d.open=false;sync(d);d.querySelector(':scope > summary').focus({preventScroll:true});}
 });
 document.addEventListener('input',event=>{if(event.target.id==='open-question')close();});
 document.addEventListener('change',event=>{if(event.target.id==='llm-provider')close();});
 return {capture,restore,close};
})();
document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;if(b.dataset.openTemplate){stageDetails.close();useOpenTemplate(b.dataset.openTemplate);}if(b.dataset.openExample){stageDetails.close();applyOpenTemplate(b.dataset.openExample);}if(b.dataset.openApply){stageDetails.close();applyOpenTemplate(b.dataset.openApply);}if(b.dataset.openAction==='edit')editOpenTask();if(b.dataset.openAction==='cancel')cancelOpenTask();if(b.dataset.openAction==='confirm')confirmOpenTask();});
document.addEventListener('submit',e=>{if(e.target.id==='open-form'){e.preventDefault();submitOpenTask();}});
document.addEventListener('input',e=>{if(getOpenDraft().dual||e.target.id!=='open-question')return;openDraft={...captureDraft(),runId:null};formDraft={...openDraft};refreshOpenDraftPreview();});
document.addEventListener('change',e=>{if(getOpenDraft().dual||e.target.id!=='llm-provider'||busyOpenRun())return;openDraft={...captureDraft(),provider:e.target.value,runId:null};formDraft={...openDraft};refreshOpenDraftPreview();});
const previousOpenRender=render;
render=function(){if(!['compare','detail'].includes(view))stageDetails.close();if(view!=='basics')$('#main').classList.remove('simple-main','journey-main');return previousOpenRender();};
if(document.modelContext?.registerTool){const life=new AbortController();for(const definition of [{name:'browse_case_template',title:'查看场景模版',description:'浏览用户导入的38套场景模版，或查看其中一个请求阶段的用法与JSON。只打开模版，不覆盖草稿、不运行模型、不发布记录。',inputSchema:{type:'object',properties:{caseId:{type:'string',enum:officialCatalog.cases.map(c=>c.id)},requestIndex:{type:'integer',minimum:0,maximum:1}},additionalProperties:false},execute(input){if(!input||Object.keys(input).some(k=>!['caseId','requestIndex'].includes(k))||input.requestIndex!==undefined&&!Number.isInteger(input.requestIndex))throw new Error('请选择有效模版。');if(busyOpenRun())throw new Error('请先停止当前运行。');if(input.caseId){const c=officialCase(input.caseId),index=input.requestIndex||0;if(!c||!c.requests[index])throw new Error('该模版或请求阶段不存在。');showTemplateCase(c.id,index);}else openTemplateLibrary();return {opened:true,staged:false,started:false};}},{name:'preview_open_task_template',title:'填入任务模版',description:'在模型对比页填写完整任务。只准备请求，不运行、不保存、不发布。',inputSchema:{type:'object',properties:{template:{type:'string',enum:Object.keys(openTemplates)}},required:['template'],additionalProperties:false},execute(input){if(!input||Object.keys(input).some(k=>k!=='template')||!Object.hasOwn(openTemplates,input.template))throw new Error('请选择有效模版');if(busyOpenRun())throw new Error('请先停止当前运行。');applyOpenTemplate(input.template);return {view:'compare',started:false,mode:'mock'};}},{name:'explore_complete_workflow',title:'打开模型对比模版',description:'在模型对比页填入场景，准备左右两栏请求；不启动运行。',inputSchema:{type:'object',properties:{scenario:{type:'string',enum:Object.keys(openTemplates)},step:{type:'integer',minimum:0,maximum:6},branch:{type:'string',enum:['normal','blocked']}},required:['scenario'],additionalProperties:false},execute(input){if(!input||!Object.hasOwn(openTemplates,input.scenario))throw new Error('请选择有效场景');if(busyOpenRun())throw new Error('请先停止当前运行。');applyOpenTemplate(input.scenario);return {view:'compare',started:false,mode:'mock'};}}]){try{Promise.resolve(document.modelContext.registerTool({...definition,annotations:{readOnlyHint:false,untrustedContentHint:false}},{signal:life.signal})).catch(()=>{});}catch{}}window.addEventListener('pagehide',()=>life.abort(),{once:true});}
// Routing starts after the separate-input controller is loaded.
