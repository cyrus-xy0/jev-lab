/* LLM starts with a prompt. Jev starts with explicit state and questions. */
const equalInput=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let jevAnswerSequence=0;
function jevNoulFields(value,path=[]){
 if(value!==null&&typeof value==='object')return Object.entries(value).flatMap(([key,child])=>jevNoulFields(child,[...path,key]));
 const text=value==null?'':String(value);
 return [{id:'jev-answer-'+(++jevAnswerSequence),path,kind:value===null?'null':typeof value,value:text,baseValue:text}];
}
function jevNoulRow(key,criteria){
 const present=criteria!==null&&criteria!==undefined&&Object.hasOwn(criteria,key),native=present?criteria[key]:null;
 const structured=native!==null&&typeof native==='object',value=structured?humanState(native):native==null?'':String(native);
 return {id:'jev-answer-'+(++jevAnswerSequence),key,value,baseValue:value,present,native:cloneTemplate(native),structured,textMode:false,fields:structured?jevNoulFields(native):[]};
}
function jevAnswerConfig(criteria,type){
 const present=criteria!==undefined,array=Array.isArray(criteria),object=criteria!==null&&typeof criteria==='object'&&!array;
 if(type==='noul'&&(object||criteria==null))return {answerNoul:true,answerOriginal:present?cloneTemplate(criteria):null,answerShape:'object',answerPresent:present,answerUnsupported:false,answerOpaque:null,answerRows:['true','false'].map(key=>jevNoulRow(key,criteria))};
 const entries=array?criteria.map((value,i)=>[String(i),value]):object?Object.entries(criteria):[];
 const opaque=present&&(!array&&!object||entries.some(([,value])=>typeof value!=='string'));
 return {answerNoul:false,answerShape:array?'array':object?'object':type==='score'?'array':'object',answerPresent:present,answerUnsupported:opaque,answerOpaque:opaque?cloneTemplate(criteria):null,answerRows:opaque?[]:entries.map(([key,value])=>({id:'jev-answer-'+(++jevAnswerSequence),key,value}))};
}
function jevAnswerConfigSnapshot(q){return cloneTemplate({answerNoul:q.answerNoul,answerOriginal:q.answerOriginal,answerShape:q.answerShape,answerPresent:q.answerPresent,answerUnsupported:q.answerUnsupported,answerOpaque:q.answerOpaque,answerRows:q.answerRows});}
function jevNoulRowChanged(row){return row.textMode||row.value!==row.baseValue||row.fields.some(field=>field.value!==field.baseValue);}
function jevNoulRowValue(row){
 if(!jevNoulRowChanged(row))return row.present?cloneTemplate(row.native):undefined;
 if(!row.structured||row.textMode)return row.value.trim()?row.value:undefined;
 const value=cloneTemplate(row.native);
 for(const field of row.fields){
  if(field.value===field.baseValue)continue;
  let parent=value;for(const key of field.path.slice(0,-1))parent=parent[key];
  const next=field.kind==='number'?Number(field.value):field.kind==='boolean'?field.value==='true':field.value;
  Object.defineProperty(parent,field.path.at(-1),{value:next,writable:true,enumerable:true,configurable:true});
 }
 return value;
}
function jevCriteriaValue(q){
 if(q.answerNoul){
  if(!q.answerRows.some(jevNoulRowChanged))return q.answerPresent?cloneTemplate(q.answerOriginal):undefined;
  const criteria=q.answerOriginal!==null&&typeof q.answerOriginal==='object'?cloneTemplate(q.answerOriginal):{};
  for(const row of q.answerRows){const value=jevNoulRowValue(row);if(value===undefined)delete criteria[row.key];else criteria[row.key]=value;}
  return Object.keys(criteria).length?criteria:undefined;
 }
 if(q.answerUnsupported)return cloneTemplate(q.answerOpaque);
 if(!q.answerPresent&&!q.answerRows.length)return undefined;
 const criteria=q.answerShape==='array'?q.answerRows.map(row=>row.value):Object.fromEntries(q.answerRows.map(row=>[row.key,row.value]));
 if(q.type==='noul'&&q.answerRows.length&&q.answerRows.every(row=>!row.value.trim())&&!equalInput(criteria,q.original[q.criteriaKey]))return undefined;
 return criteria;
}
function addJevAnswer(q){
 if(!['choice','score'].includes(q.type)||q.answerUnsupported)return null;
 let key;do{key='option_'+(++q.answerKeySequence);}while(q.answerKeys.includes(key));q.answerKeys.push(key);
 const row={id:'jev-answer-'+(++jevAnswerSequence),key,value:''};q.answerRows.push(row);q.answerPresent=true;q.settingsOpen=true;return row;
}
function removeJevAnswer(q,rowId){
 if(!['choice','score'].includes(q.type))return;
 q.answerRows=q.answerRows.filter(row=>row.id!==rowId);q.settingsOpen=true;
}
function setJevAnswerValue(q,rowId,value){const row=q.answerRows.find(row=>row.id===rowId)||q.answerRows.flatMap(row=>row.fields||[]).find(field=>field.id===rowId);if(row)row.value=value;}
function jevFormFromRequest(body={state:'',questions:{}}){
 const stateText=humanState(body.state),array=Array.isArray(body.questions),entries=array?body.questions.map((q,i)=>[String(i+1),q]):Object.entries(body.questions||{});
 return {model:body.model||'jev-1.13.0',originalRequest:cloneTemplate(body),questionsArray:array,stateText,baseStateText:stateText,originalState:cloneTemplate(Object.hasOwn(body,'state')?body.state:''),active:0,error:'',errorField:'',questions:(entries.length?entries:[['decision',{type:'choice',instructions:'',criteria:{}}]]).map(([id,q])=>{
  const instructionKey=array&&!Object.hasOwn(q,'instructions')?'question':'instructions',criteriaKey=array&&!Object.hasOwn(q,'criteria')?'options':'criteria';
  const text=humanQuestion(jevResultText(q[instructionKey])),config=jevAnswerConfig(q[criteriaKey],q.type);
  return {id,type:q.type,text,original:cloneTemplate(q),instructionKey,criteriaKey,baseText:text,baseType:q.type,...config,answerConfigs:{},answerKeys:config.answerRows.map(row=>row.key),answerKeySequence:0};
 })};
}
function getDualJevRequest(d){
 const f=d.jev,questions=f?.questionsArray?[]:Object.create(null);if(!f)return {model:'jev-1.13.0',state:'',questions};
 for(const q of f.questions){
  const next={...cloneTemplate(q.original),type:q.type},criteria=jevCriteriaValue(q);
  if(q.text!==q.baseText)next[q.instructionKey]=q.text;
  if(criteria===undefined)delete next[q.criteriaKey];else next[q.criteriaKey]=criteria;
  if(f.questionsArray)questions.push(next);else questions[q.id]=next;
 }
 return {...cloneTemplate(f.originalRequest),model:f.model,state:f.stateText===f.baseStateText?cloneTemplate(f.originalState):f.stateText.trim(),questions};
}
function dualInputs(d){return {llmPrompt:d.question,jevRequest:getDualJevRequest(d)};}
function setJevAnswerType(q,type){
 if(q.type===type||!Object.hasOwn(questionTypeNames,type))return;
 q.answerConfigs[q.type]=jevAnswerConfigSnapshot(q);q.type=type;
 Object.assign(q,q.answerConfigs[type]?cloneTemplate(q.answerConfigs[type]):jevAnswerConfig(type==='noul'?undefined:type==='score'?[]:{},type));
}
function jevAnswerIssue(q){
 if(q.answerNoul){
  const invalid=q.answerRows.flatMap(row=>row.structured&&!row.textMode?row.fields:[]).find(field=>field.kind==='number'&&(!field.value.trim()||!Number.isFinite(Number(field.value))));
  return invalid?{field:invalid.id,message:'请保留有效的数字标准。'}:null;
 }
 if(q.answerUnsupported)return null;
 const values=q.answerRows.map(row=>row.value.trim()),label=q.type==='score'?'评分标准':'选项';
 if(q.type==='noul'&&values.every(value=>!value))return null;
 const empty=values.findIndex(value=>!value);if(empty>=0)return {field:q.answerRows[empty].id,message:q.type==='noul'?'请补充这条判断标准。':'请填写'+(q.type==='score'?empty+' 分的标准':'选项 '+(empty+1)+' 的内容')+'。'};
 if(q.type==='noul')return null;
 if(values.length<2)return {field:'jev-answer-add',message:q.type==='score'?'至少添加两个评分等级，按从低到高的顺序填写标准。':'至少添加两个候选答案。'};
 const duplicate=values.findIndex((value,i)=>values.indexOf(value)!==i);if(duplicate>=0)return {field:q.answerRows[duplicate].id,message:label+'内容不要重复。'};
 return null;
}
function jevAnswerError(q){return jevAnswerIssue(q)?.message||'';}
function jevAnswerSummary(q){
 const count=q.answerRows.length;
 if(q.answerNoul){const described=q.answerRows.filter(row=>{const value=jevNoulRowValue(row);return value!=null&&(typeof value!=='string'||!!value.trim());}).length;return questionTypeNames[q.type]+' · '+(described?described+' 项标准':'选填');}
 return (questionTypeNames[q.type]||'扩展设置')+(jevAnswerError(q)?' · 待完善':q.answerUnsupported?' · 原设置已保留':q.type==='noul'?'':q.type==='score'?' · '+count+' 个等级':' · '+count+' 个候选答案');
}
// Each row keeps its native key and complete value, including embedded line breaks.
function captureJevAnswerRows(q){for(const row of q.answerRows){const field=document.getElementById(row.id);if(field)row.value=field.value;for(const leaf of row.fields||[]){const input=document.getElementById(leaf.id);if(input)leaf.value=input.value;}}}
function jevNoulEditor(q,{scope='compare',question=0,errorField='',errorId='jev-input-error'}={}){
 const attributes=`data-answer-scope="${scope}" data-answer-question="${question}"`;
 const field=(id,value,label,kind='string',placeholder='未设置，可补充',path='')=>{
  const attrs=`id="${id}" data-jev-answer-value="${id}" ${attributes}${errorField===id?` aria-invalid="true" aria-describedby="${errorId}"`:''}`;
  const input=kind==='boolean'?`<select ${attrs}><option value="true" ${value==='true'?'selected':''}>是</option><option value="false" ${value==='false'?'selected':''}>否</option></select>`:kind==='number'?`<input ${attrs} type="number" step="any" value="${esc(value)}">`:`<textarea ${attrs} rows="1" placeholder="${placeholder}">${esc(value)}</textarea>`;
  return `<div class="jev-criterion-field"><label for="${id}">${esc(label)}${path?`<small>${esc(path)}</small>`:''}</label>${input}</div>`;
 };
 return `<fieldset class="jev-answer-editor noul-answers"><legend class="sr-only">问题 ${question+1} 的判断标准</legend><div class="jev-answer-heading"><span>是 / 否的判断依据</span><small>选填</small></div>${q.answerRows.map(row=>{
  const label=row.key==='true'?'是的判断标准':'否的判断标准';
  if(!row.structured||row.textMode)return field(row.id,row.value,label,'string',row.key==='true'?'什么情况下判断为「是」':'什么情况下判断为「否」');
  return `<fieldset class="jev-criterion-group"><legend class="jev-criterion-title">${label}</legend>${row.fields.length?row.fields.map(leaf=>field(leaf.id,leaf.value,humanQuestion(leaf.path.at(-1)),leaf.kind,'未设置，可补充',leaf.path.length>1?leaf.path.slice(0,-1).map(humanQuestion).join(' / '):'')).join(''):'<p class="jev-answer-note">尚未填写具体标准。</p>'}<button type="button" class="text-link jev-criterion-convert" data-noul-text="${row.id}" ${attributes}>改用文字标准</button></fieldset>`;
 }).join('')}</fieldset>`;
}

function jevAnswerRowsEditor(q,{scope='compare',question=0,errorField='',errorId='jev-input-error'}={}){
 if(q.answerNoul)return jevNoulEditor(q,{scope,question,errorField,errorId});
 if(q.answerUnsupported)return '<p class="jev-answer-note">原有答案设置已保留，可在请求详情中查看。</p>';
 if(q.type==='noul'&&!q.answerRows.length)return '<p class="jev-answer-note">返回“是”的概率，无需填写候选答案。</p>';
 const score=q.type==='score',editable=['choice','score'].includes(q.type),ordered=score&&q.answerShape==='array';
 const title=score?'评分标准 · 从低到高':q.type==='noul'?'判断标准':'候选答案';
 const attributes=`data-answer-scope="${scope}" data-answer-question="${question}"`;
 const addId=scope==='compare'?'jev-answer-add':'public-jev-answer-add-'+question;
 return `<div class="jev-answer-editor ${score?'score-answers':'choice-answers'}"><div class="jev-answer-heading"><span>${title}</span>${ordered&&q.answerRows.length>1?`<small>0–${q.answerRows.length-1} 分</small>`:''}</div><div class="jev-answer-list">${q.answerRows.map((row,i)=>{
  const badge=ordered?i+' 分':q.type==='noul'?humanQuestion(row.key):String(i+1).padStart(2,'0');
  const label=ordered?i+' 分的标准':q.type==='noul'?humanQuestion(row.key)+'的判断标准':(score?'评分标准 ':'选项 ')+(i+1);
  return `<div class="jev-answer-row"><label class="jev-answer-badge" for="${row.id}"><span aria-hidden="true">${esc(badge)}</span><span class="sr-only">${esc(label)}</span></label><textarea id="${row.id}" rows="1" data-jev-answer-value="${row.id}" ${attributes} placeholder="${score?'填写这一等级的标准':'填写选项内容'}"${errorField===row.id?` aria-invalid="true" aria-describedby="${errorId}"`:''}>${esc(row.value)}</textarea>${editable?`<button type="button" class="jev-answer-remove" data-jev-answer-remove="${row.id}" ${attributes} aria-label="删除${esc(label)}" title="删除${esc(label)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>`:''}</div>`;
 }).join('')}</div>${!q.answerRows.length?`<p class="jev-answer-empty">${score?'添加评分等级，按从低到高排列。':'添加可供 Jev 判断的候选答案。'}</p>`:''}${editable?`<button id="${addId}" type="button" class="jev-answer-add" data-jev-answer-add ${attributes}${errorField==='jev-answer-add'?` aria-describedby="${errorId}"`:''}>${icon('plus')}添加${score?'评分等级':'选项'}</button>`:''}</div>`;
}
function sizeJevAnswerFields(){for(const field of document.querySelectorAll('textarea[data-jev-answer-value]')){field.style.height='auto';field.style.height=Math.max(44,field.scrollHeight+2)+'px';}}
function quickJevRequest(id){const t=openTemplates[id],p=comparisonClient.prepare(fullTask(t));return {model:'jev-1.13.0',state:t.input,questions:{decision:{type:'choice',instructions:p.question,criteria:Object.fromEntries(p.options.map((v,i)=>['option_'+(i+1),v]))}}};}
function dualSeed(d){return JSON.stringify([d.template,d.official?.caseId,d.official?.index,d.official?.body]);}
function initializeDualDraft(d){
 const seed=dualSeed(d);if(d.dual&&d.dualSeed===seed)return d;
 const body=d.official?officialInput(d.question,d.official):openTemplates[d.template]?quickJevRequest(d.template):{state:'',questions:{}};
 d.dual=true;d.dualSeed=seed;d.jev=jevFormFromRequest(body);d.errors={};return d;
}
const singleGetOpenDraft=getOpenDraft;
getOpenDraft=function(){return initializeDualDraft(singleGetOpenDraft());};
const singleCaptureDraft=captureDraft;
captureDraft=function(){
 const d=getOpenDraft();if(view!=='compare')return d;
 if($('#open-question'))d.question=$('#open-question').value;
 if($('#jev-state'))d.jev.stateText=$('#jev-state').value;
 const q=d.jev.questions[d.jev.active];if($('#jev-question'))q.text=$('#jev-question').value;captureJevAnswerRows(q);if($('#jev-answer-settings'))q.settingsOpen=$('#jev-answer-settings').open;
 formDraft={...d};return d;
};
const singleSameExample=sameOpenExample;
sameOpenExample=function(d){if(!d.dual)return singleSameExample(d);if(d.official){const c=officialCase(d.official.caseId),r=c?.requests[d.official.index];return !!r&&matchesOfficialTask(d.question,c,r.body)&&equalInput(getDualJevRequest(d),r.body);}return !!openTemplates[d.template]&&d.question===fullTask(openTemplates[d.template])&&equalInput(getDualJevRequest(d),quickJevRequest(d.template));};
function modelBusy(model){return !!(run?.jobs?.[model]&&!run.jobs[model].done);}
function inputMatches(record,d,model){return model==='llm'?record.inputs?.llmPrompt===d.question&&record.provider===d.provider:equalInput(record.inputs?.jevRequest,getDualJevRequest(d));}
function shownDualRecord(){
 const d=getOpenDraft(),record=history.find(h=>h.id===d.runId);if(!record)return null;
 const shown={...record,provider:d.provider,inputs:dualInputs(d),modelState:{...record.modelState}};
 for(const model of ['llm','jev'])if(!inputMatches(record,d,model))shown.modelState[model]=blankModelState();
 if(!['llm','jev'].every(m=>shown.modelState[m]?.phase==='complete'))shown.status=['llm','jev'].some(modelBusy)?'running':'draft';
 return shown;
}
compareRecord=shownDualRecord;
function dualRequestEditor(model,d){
 if(model==='llm')return `<div class="dual-entry llm-entry"><label for="open-question">提示词</label><textarea id="open-question" rows="6" maxlength="6000" placeholder="输入提示词" ${modelBusy('llm')?'readonly':''}>${esc(d.question)}</textarea><p class="form-error" id="llm-input-error" role="alert">${esc(d.errors.llm||'')}</p><div class="dual-entry-actions"><button class="button primary" type="button" data-dual-run="llm" ${modelBusy('llm')?'disabled':''}>${modelBusy('llm')?'运行中…':'运行 LLM'}</button>${modelBusy('llm')?'<button class="text-link" data-dual-stop="llm">停止</button>':''}</div></div>`;
 const f=d.jev,q=f.questions[f.active],busy=modelBusy('jev');
 const invalid=id=>f.error&&f.errorField===id?' aria-invalid="true" aria-describedby="jev-input-error"':'';
 const error=`<p id="jev-input-error" class="form-error" role="alert">${esc(f.error||'')}</p>`;
 const stateError=f.errorField==='jev-state';
 const state=`<section class="jev-input-section"><label for="jev-state">state <span>当前状态</span></label><textarea id="jev-state" rows="3" maxlength="6000"${invalid('jev-state')} placeholder="描述当前情况和判断规则。例如：同一订单有两笔 ¥99 成功扣款，无第二次购买记录。">${esc(f.stateText)}</textarea>${stateError?error:''}</section>`;
 const criteriaError=f.errorField==='jev-answer-add'||q.answerRows.some(row=>row.id===f.errorField||(row.fields||[]).some(field=>field.id===f.errorField)),settingsOpen=q.settingsOpen??(q.type==='noul'||!!jevAnswerError(q));
 const settings=`<details id="jev-answer-settings" class="jev-answer-settings" data-question-id="${esc(q.id)}" ${settingsOpen?'open':''}><summary><span class="jev-settings-label">判断标准 <small>criteria</small></span><span id="jev-answer-summary">${esc(jevAnswerSummary(q))}</span><span class="jev-settings-chevron" aria-hidden="true">⌄</span></summary><div class="jev-settings-body"><div class="jev-type-field"><label for="jev-answer-type">答案类型</label><select id="jev-answer-type">${Object.entries(questionTypeNames).map(([type,label])=>`<option value="${type}" ${q.type===type?'selected':''}>${label}</option>`).join('')}</select></div>${jevAnswerRowsEditor(q,{question:f.active,errorField:f.errorField})}${criteriaError?error:''}</div></details>`;
 const question=`<section class="jev-input-section"><div class="jev-question-heading"><div class="jev-question-title">question <span>判断问题</span></div>${f.questions.length>1?`<label class="sr-only" for="jev-question-index">选择问题（共 ${f.questions.length} 个）</label><select id="jev-question-index">${f.questions.map((x,i)=>`<option value="${i}" ${f.active===i?'selected':''}>问题 ${i+1} / ${f.questions.length} · ${esc(resultLabelsV18[d.official?.caseId]?.[x.id]||x.text.slice(0,32)||'未填写问题')}</option>`).join('')}</select>`:''}</div><label class="jev-description-label" for="jev-question">问题描述 <small>description</small></label><textarea id="jev-question" rows="3" maxlength="1000"${invalid('jev-question')} placeholder="例如：这笔退款申请应该怎样处理？">${esc(q.text)}</textarea>${!stateError&&!criteriaError?error:''}${settings}</section>`;
 return `<div class="dual-entry jev-entry"><fieldset ${busy?'disabled':''}>${state}${question}<div class="dual-entry-actions"><button class="button primary" type="button" data-dual-run="jev">${busy?'运行中…':'运行 Jev'}</button></div></fieldset>${busy?'<button class="text-link dual-stop" data-dual-stop="jev">停止 Jev</button>':''}</div>`;
}
renderNew=function(){const d=getOpenDraft();$('#main').innerHTML=`<div class="open-workspace dual-workspace"><div class="open-page-heading"><h1>模型对比</h1></div><div class="dual-template-bar">${openTemplateButtons(d)}</div><div id="open-preview">${openPanels(shownDualRecord(),true)}</div><div class="open-result-footer"><div id="dual-result-actions"></div></div></div>`;refreshDualResponses();};
function refreshDualResponses(editorModel){
 if(view!=='compare'||!$('#open-preview'))return;
 const d=getOpenDraft(),s=shownDualRecord(),snapshot=stageDetails.capture();
 for(const model of ['llm','jev']){
  const existing=document.querySelector('.open-panel.'+model);if(!existing)continue;
  const staging=document.createElement('div');staging.innerHTML=openResponsePanel(model,s,{editable:true});
  for(const selector of ['.model-status',...(editorModel!==model?[`[data-stage-key="${model}-request"] .compare-stage-label`,`[data-stage-key="${model}-request"] .stage-details`]:[]),`[data-stage-key="${model}-result"]`,...(editorModel===model?[`[data-stage-key="${model}-request"]`]:[])]){const old=existing.querySelector(selector),fresh=staging.querySelector(selector);if(old&&fresh)old.replaceWith(fresh);}
 }
 if($('#jev-answer-summary'))$('#jev-answer-summary').textContent=jevAnswerSummary(d.jev.questions[d.jev.active]);
 if($('#llm-input-error'))$('#llm-input-error').textContent=d.errors.llm||'';if($('#jev-input-error'))$('#jev-input-error').textContent=d.jev.error||'';
 const provider=$('#llm-provider');if(provider)provider.disabled=modelBusy('llm');
 const prompt=$('#open-question');if(prompt)prompt.readOnly=modelBusy('llm');
 for(const b of document.querySelectorAll('[data-open-template],[data-featured-template],[data-template-library],[data-template-info]'))b.disabled=busyOpenRun();
 $('#dual-result-actions').innerHTML=s?.status==='complete'?openActions(s):'';
 stageDetails.restore(snapshot);hydrateIcons();sizeJevAnswerFields();
}
refreshOpenDraftPreview=function(){refreshDualResponses();};
function validateJev(d){
 const f=d.jev;f.errorField='';
 const fail=(field,message)=>{f.errorField=field;return message;};
 if(!f.stateText.trim())return fail('jev-state','请填写当前状态，描述当前情况和判断规则。');
 for(const [i,q] of f.questions.entries()){
  if(!q.text.trim()){f.active=i;return fail('jev-question','请填写 question'+(f.questions.length>1?'（问题 '+(i+1)+'）':'')+'，说明要判断什么。');}
  const issue=jevAnswerIssue(q);if(issue){f.active=i;q.settingsOpen=true;return fail(issue.field,issue.message);}
 }
 return '';
}
const savedSyncOpenRun=syncOpenRun;
syncOpenRun=function(record){if(record.inputs){if(current.id===record.id)current=current.custom===false?publicDualCase(record):record;if(view==='compare'&&getOpenDraft().runId===record.id)refreshDualResponses();else if(view==='detail'&&current.id===record.id)renderOpenDetail();}else savedSyncOpenRun(record);};
function dualRecordStatus(record){if(Object.values(record.modelState).some(m=>['request','processing','output'].includes(m.phase)))return 'running';if(['llm','jev'].every(m=>record.modelState[m].phase==='complete'))return 'complete';if(Object.values(record.modelState).some(m=>m.phase==='error'))return 'failed';if(Object.values(record.modelState).some(m=>m.phase==='cancelled'))return 'cancelled';return 'partial';}
function createDualRecord(d,previous){
 const inputs=dualInputs(d),record={id:'open-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),openTask:true,liveComparison:true,custom:true,template:d.template,inputs:cloneTemplate(inputs),question:d.question,input:'',provider:d.provider,title:(d.question||d.jev.questions[0].text).split('\n')[0].slice(0,70),category:d.official?templateCategory(officialCase(d.official.caseId)):samples.find(x=>x.id===d.template)?.category||'自定义场景',icon:'panels',color:'blue',mode:'mock',time:new Date().toLocaleString('zh-CN',{hour12:false}),published:false,status:'partial',comparison:null,official:d.official?{caseId:d.official.caseId,index:d.official.index,body:cloneTemplate(inputs.jevRequest),baseTask:d.question}:null,modelState:{llm:blankModelState(),jev:blankModelState()},openResult:{llm:{},jev:{}}};
 if(previous)for(const model of ['llm','jev'])if(inputMatches(previous,d,model)&&previous.modelState[model].phase==='complete'){record.modelState[model]=cloneTemplate(previous.modelState[model]);record.openResult[model]=cloneTemplate(previous.openResult[model]);}
 history.unshift(record);d.runId=record.id;current=record;return record;
}
async function startDualRun(model){
 const d=captureDraft();if(modelBusy(model))return;
 if(model==='llm'&&!d.question.trim()){d.errors.llm='请输入提示词。';refreshDualResponses('llm');$('#open-question').focus();return;}
 if(model==='jev'){d.jev.error=validateJev(d);if(d.jev.error){refreshDualResponses('jev');$('#'+d.jev.errorField)?.focus();return;}}
 let record=history.find(h=>h.id===d.runId);
 if(busyOpenRun()&&run.id!==record?.id){toast('请先停止正在运行的任务');return;}
 if(!record||!busyOpenRun()&&record.modelState?.[model]?.phase!=='idle')record=createDualRecord(d,record);
 const inputs=dualInputs(d);record.inputs[model==='llm'?'llmPrompt':'jevRequest']=cloneTemplate(inputs[model==='llm'?'llmPrompt':'jevRequest']);
 if(model==='llm'){record.question=d.question;record.provider=d.provider;record.title=d.question.split('\n')[0].slice(0,70);}
 record.official=d.official?{caseId:d.official.caseId,index:d.official.index,body:cloneTemplate(record.inputs.jevRequest),baseTask:record.question}:null;record.taskOrigin=isOfficialTask(record)?'official':'custom';record.comparison=null;record.published=false;delete record.openPublic;delete record.dualPublic;
 const m={...blankModelState(),phase:'request'},controller=new AbortController(),job={done:false,controller};record.modelState[model]=m;record.openResult[model]={};
 if(!run||run.done||run.id!==record.id)run={id:record.id,done:false,jobs:{}};run.jobs[model]=job;run.done=false;record.status='running';d.errors[model]='';refreshDualResponses(model);saveHistory();
 try{
  await comparisonClient.run({task:record.inputs.llmPrompt,llmPrompt:record.inputs.llmPrompt,jevRequest:cloneTemplate(record.inputs.jevRequest),provider:record.provider,official:record.official,models:[model],signal:controller.signal,onEvent(event){
   if(job.done||job.detached||controller.signal.aborted||record.modelState[model]!==m)return;
   if(event.type==='request'){m.request=event.request;m.phase='request';}
   if(event.type==='progress'){m.phase='processing';m.steps.push({text:event.text,elapsed:event.elapsed});}
   if(event.type==='output'){m.phase='output';m.output=event.text;m.displayOutput=event.displayText;}
   if(event.type==='complete'){Object.assign(m,{phase:'complete',response:cloneTemplate(event),output:event.output,summary:event.summary,displayOutput:event.summary,metrics:event.metrics,closure:event.closure});record.openResult[model]={reply:m.output,summary:m.summary,next:m.closure,result:m.closure,...m.metrics};}
   syncOpenRun(record);
  }});
 }catch(error){if(!job.detached&&record.modelState[model]===m){m.response=null;m.phase=error.name==='AbortError'?'cancelled':'error';m.statusLabel=error.name==='AbortError'?'已停止':'请求失败';m.emptyOutputText=error.name==='AbortError'?'本侧运行已停止':'本侧请求失败，可重试';}}
 finally{job.done=true;if(!job.detached){if(run?.jobs?.[model]===job)run.done=Object.values(run.jobs).every(x=>x.done);record.status=dualRecordStatus(record);record.comparison=null;saveHistory();syncOpenRun(record);if(view==='compare'&&getOpenDraft().runId===record.id)refreshDualResponses(model);if(view==='history'||view==='gallery')render();}}
}
cancelOpenTask=function(){if(run?.jobs)Object.values(run.jobs).forEach(j=>{if(!j.done)j.controller.abort();});else if(run&&!run.done)run.controller?.abort();};
function resetCompareDraft(){
 const provider=getOpenDraft().provider,previousRun=run;
 // Detach before aborting: a slow client may still resolve or reject after reset.
 run=null;
 if(previousRun&&!previousRun.done){
  previousRun.detached=true;previousRun.done=true;
  if(previousRun.timer)clearInterval(previousRun.timer);
  for(const job of Object.values(previousRun.jobs||{})){job.detached=true;job.done=true;job.controller.abort();}
  previousRun.controller?.abort();
  const record=history.find(h=>h.id===previousRun.id);
  if(record){
   for(const m of Object.values(record.modelState||{}))if(['request','processing','output'].includes(m.phase))Object.assign(m,{phase:'cancelled',response:null,statusLabel:'已停止',emptyOutputText:'本侧运行已停止'});
   record.status=record.inputs?dualRecordStatus(record):'cancelled';record.comparison=null;saveHistory();
  }
 }
 stageDetails.close();if($('#modal')?.open)$('#modal').close();publicJevDraft=null;
 templateLibrary={...templateLibrary,caseId:null,index:0,confirm:false,fromDraft:false};
 openDraft=initializeDualDraft({...newOpenDraft(),provider});formDraft={...openDraft};current={};
 renderNew();$('[data-compare-reset]')?.focus({preventScroll:true});
}
// Every template or reuse creates an input-only draft. Old history remains readable.
const singleStageRecordDraft=stageRecordDraft;
stageRecordDraft=function(record){
 if(!record.inputs){const result=singleStageRecordDraft(record),saved=legacyOpenRecord(record).modelState?.jev?.request;if(saved&&Object.hasOwn(saved,'state')&&questionEntries(saved).length)getOpenDraft().jev=jevFormFromRequest(saved);return result;}
 stageDetails.close();openDraft={...newOpenDraft(),template:record.template||'custom',question:record.inputs.llmPrompt,provider:providerNames[record.provider]?record.provider:'doubao',official:record.official?cloneTemplate(record.official):null};initializeDualDraft(openDraft);openDraft.jev=jevFormFromRequest(record.inputs.jevRequest);formDraft={...openDraft};return true;
};
const singleUseOpenTemplate=useOpenTemplate;
useOpenTemplate=function(id){
 if(id!=='custom')return singleUseOpenTemplate(id);if(busyOpenRun())return;const d=captureDraft();
 if(sameOpenExample(d)){openDraft={...newOpenDraft(),provider:d.provider};}
 else{d.template='custom';d.official=null;d.dualSeed=dualSeed(d);openDraft=d;}
 formDraft={...openDraft};renderNew();
};
const singleIsOfficialTask=isOfficialTask;
isOfficialTask=function(record){if(!record.inputs)return singleIsOfficialTask(record);const c=officialCase(record.official?.caseId),r=c?.requests[record.official?.index];return !!r&&matchesOfficialTask(record.inputs.llmPrompt,c,r.body)&&equalInput(record.inputs.jevRequest,r.body);};
document.addEventListener('input',event=>{
 if(event.target.dataset.answerScope==='publish'||event.target.id.startsWith('public-jev-')||event.target.id==='public-llm-prompt'){capturePublicJevDraft();clearPublicJevInputError();refreshPublicJevRequest();sizeJevAnswerFields();return;}
 if(!['open-question','jev-state','jev-question'].includes(event.target.id)&&!event.target.hasAttribute('data-jev-answer-value'))return;
 const d=captureDraft(),model=event.target.id==='open-question'?'llm':'jev';d.errors[model]='';if(model==='jev'){d.jev.error='';d.jev.errorField='';for(const field of document.querySelectorAll('.jev-entry [aria-invalid]')){field.removeAttribute('aria-invalid');field.removeAttribute('aria-describedby');}}refreshDualResponses();
});
document.addEventListener('change',event=>{
 if(event.target.id==='llm-provider'&&!modelBusy('llm')){getOpenDraft().provider=event.target.value;refreshDualResponses();}
 if(event.target.id==='jev-answer-type'&&!modelBusy('jev')){const d=captureDraft(),q=d.jev.questions[d.jev.active];setJevAnswerType(q,event.target.value);q.settingsOpen=true;d.jev.error='';d.jev.errorField='';refreshDualResponses('jev');$('#jev-answer-type')?.focus({preventScroll:true});}
 if(event.target.id==='jev-question-index'){const d=captureDraft();d.jev.active=Number(event.target.value);d.jev.error='';refreshDualResponses('jev');}
});
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-jev-answer-add')||b.hasAttribute('data-jev-answer-remove')||b.hasAttribute('data-noul-text')){editJevAnswerRows(b);return;}
 if(b.dataset.dualRun)startDualRun(b.dataset.dualRun);
 if(b.dataset.dualStop)run?.jobs?.[b.dataset.dualStop]?.controller.abort();
 if(b.hasAttribute('data-compare-reset'))resetCompareDraft();
 if(b.dataset.featuredTemplate&&!busyOpenRun()&&featuredOfficialTemplates.some(t=>t.id===b.dataset.featuredTemplate)&&stageOfficialDraft(b.dataset.featuredTemplate)){if(view==='compare')renderNew();else navigate('compare');$('[data-featured-template="'+b.dataset.featuredTemplate+'"]')?.focus({preventScroll:true});}
});
document.addEventListener('toggle',event=>{
 const el=event.target;if(el.id!=='jev-answer-settings'||!el.isConnected||view!=='compare')return;
 const q=getOpenDraft().jev.questions.find(q=>q.id===el.dataset.questionId);if(q)q.settingsOpen=el.open;if(el.open)sizeJevAnswerFields();
},true);
function dualHistoryStatus(record){const phases={idle:'待运行',request:'运行中',processing:'运行中',output:'运行中',complete:'已完成',error:'失败',cancelled:'已停止'};return ['llm','jev'].map(m=>(m==='llm'?'LLM':'Jev')+' '+(phases[record.modelState?.[m]?.phase]||'待运行')).join(' · ');}
let publicJevDraft=null;
function capturePublicJevDraft(){
 const f=publicJevDraft;if(!f)return null;
 if($('#public-jev-state'))f.stateText=$('#public-jev-state').value;
 for(const [i,q] of f.questions.entries()){if($('#public-jev-question-'+i))q.text=$('#public-jev-question-'+i).value;captureJevAnswerRows(q);}
 return f;
}
function editJevAnswerRows(button){
 const published=button.dataset.answerScope==='publish';if(!published&&modelBusy('jev'))return;
 const f=published?capturePublicJevDraft():captureDraft().jev;if(!f)return;
 const index=published?Number(button.dataset.answerQuestion):f.active,q=f.questions[index];if(!q)return;
 let focusId;
 if(button.hasAttribute('data-noul-text')){const row=q.answerRows.find(row=>row.id===button.dataset.noulText);if(row){const value=jevNoulRowValue(row);row.textMode=true;row.value=row.fields.length?humanState(value):'';focusId=row.id;}}
 else if(button.hasAttribute('data-jev-answer-add'))focusId=addJevAnswer(q)?.id;
 else{const position=q.answerRows.findIndex(row=>row.id===button.dataset.jevAnswerRemove);removeJevAnswer(q,button.dataset.jevAnswerRemove);focusId=q.answerRows[Math.min(position,q.answerRows.length-1)]?.id;}
 f.error='';f.errorField='';
 if(published){$('#public-jev-answers-'+index).innerHTML=jevAnswerRowsEditor(q,{scope:'publish',question:index});hydrateIcons();sizeJevAnswerFields();refreshPublicJevRequest();}
 else refreshDualResponses('jev');
 document.getElementById(focusId||(published?'public-jev-answer-add-'+index:'jev-answer-add'))?.focus({preventScroll:true});
}
function clearPublicJevInputError(){
 if(publicJevDraft)publicJevDraft.error='';
 document.getElementById('public-jev-input-error')?.remove();
 for(const field of document.querySelectorAll('.dual-public-fields [aria-invalid]')){field.removeAttribute('aria-invalid');field.removeAttribute('aria-describedby');}
}
function showPublicJevInputError(f,fieldId,error){
 clearPublicJevInputError();f.error=error;
 const question=f.questions[f.active],container=document.getElementById('public-jev-answers-'+f.active);
 if(container)container.innerHTML=jevAnswerRowsEditor(question,{scope:'publish',question:f.active,errorField:fieldId,errorId:'public-jev-input-error'})+`<p class="form-error" id="public-jev-input-error" role="alert">${esc(error)}</p>`;
 const field=document.getElementById(fieldId);field?.setAttribute('aria-invalid','true');field?.setAttribute('aria-describedby','public-jev-input-error');field?.focus();sizeJevAnswerFields();
}
function refreshPublicJevRequest(){const preview=$('#public-jev-request');if(preview&&publicJevDraft)preview.textContent=JSON.stringify(getDualJevRequest({jev:publicJevDraft}),null,2);}
function showDualPublish(record){
 current=record;const f=publicJevDraft=jevFormFromRequest(record.inputs.jevRequest);
 showModal('预览匿名展示的内容',`<div class="publish-identity">${icon('shield')}发起人显示为「匿名」</div><div class="dual-public-fields"><label for="public-llm-prompt">LLM 提示词</label><textarea id="public-llm-prompt" rows="4" maxlength="6000">${esc(record.inputs.llmPrompt)}</textarea><label for="public-jev-state">Jev 当前状态 · state</label><textarea id="public-jev-state" rows="4" maxlength="6000">${esc(f.stateText)}</textarea>${f.questions.map((q,i)=>`<label for="public-jev-question-${i}">Jev 问题 ${i+1} · 问题描述</label><textarea id="public-jev-question-${i}" rows="2" maxlength="1000">${esc(q.text)}</textarea><div class="jev-public-criteria"><div class="jev-settings-label">判断标准 <small>criteria</small></div><div id="public-jev-answers-${i}">${jevAnswerRowsEditor(q,{scope:'publish',question:i})}</div></div>`).join('')}</div><details class="stage-details"><summary>完整 Jev 请求<span class="stage-chevron">⌄</span></summary><div class="stage-detail-content"><pre id="public-jev-request" class="request-json" tabindex="0">${esc(JSON.stringify(getDualJevRequest({jev:f}),null,2))}</pre></div></details><p class="field-note">任一输入经过编辑，原始结果都会隐藏。</p><label class="check-label"><input type="checkbox" id="publish-check">我已检查这些内容，适合匿名展示</label><p class="modal-note">仅加入此浏览器的测试广场。</p><div class="modal-actions"><button class="button secondary" data-action="close">返回</button><button class="button primary" data-action="confirm-publish" disabled>加入本地测试广场</button></div>`,true);sizeJevAnswerFields();
}
function confirmDualPublish(){
 if(!$('#publish-check')?.checked)return;const record=history.find(h=>h.id===current.id);if(!record)return;
 const f=capturePublicJevDraft();if(!f)return;
 const prompt=$('#public-llm-prompt').value,d={question:prompt,jev:f},error=validateJev(d);
 if(!prompt.trim()||error){toast(error||'请保留完整的公开提示词。');const field=f.errorField==='jev-state'?'public-jev-state':f.errorField==='jev-question'?'public-jev-question-'+f.active:f.errorField==='jev-answer-add'?'public-jev-answer-add-'+f.active:f.errorField;showPublicJevInputError(f,prompt.trim()?field:'public-llm-prompt',error||'请保留完整的公开提示词。');return;}
 record.dualPublic={inputs:dualInputs(d)};record.published=true;saveHistory();$('#modal').close();publicJevDraft=null;gallerySource='mine';navigate('gallery');toast('已加入此浏览器的测试广场');
}

function publicDualCase(record){
 const inputs=cloneTemplate(record.dualPublic?.inputs||record.inputs),edited=!equalInput(inputs,record.inputs),states=cloneTemplate(record.modelState),results=cloneTemplate(record.openResult||{llm:{},jev:{}});
 if(edited)for(const model of ['llm','jev']){states[model]={...blankModelState(),request:model==='llm'?{model:record.provider,messages:[{role:'user',content:inputs.llmPrompt}]}:cloneTemplate(inputs.jevRequest),processNote:'公开输入经过编辑，原始过程已隐藏',emptyOutputText:'原始输出已隐藏'};results[model]={summary:'原始输出已隐藏'};}
 return {id:record.id,openTask:true,liveComparison:true,custom:false,localPublished:true,template:record.template,inputs,question:inputs.llmPrompt,input:'',title:inputs.llmPrompt.split('\n')[0].slice(0,70),category:record.category,icon:record.icon,color:record.color,status:edited?'preview':record.status,mode:'mock',time:record.time,provider:record.provider,official:!edited&&record.official?{caseId:record.official.caseId,index:record.official.index,body:cloneTemplate(inputs.jevRequest),baseTask:inputs.llmPrompt}:null,modelState:states,openResult:results,publicEdited:edited,comparison:null};
}
let interruptedDualRuns=false;
for(const record of history)if(record.inputs&&record.modelState){for(const model of ['llm','jev']){const m=record.modelState[model];if(m&&['request','processing','output'].includes(m.phase)){m.phase='cancelled';m.statusLabel='已停止';m.emptyOutputText='页面刷新，本侧运行已停止';interruptedDualRuns=true;}}record.status=dualRecordStatus(record);}
if(interruptedDualRuns)saveHistory();
readRoute();render();
