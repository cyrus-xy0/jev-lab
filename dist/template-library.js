/* The original request is retained until the user changes the task or request.
   This module only prepares inputs. It never calls models or business systems. */
const templateGroups=templateBusinessGroups;
const questionTypeNames={choice:'选哪个',noul:'是 / 否',score:'评分'};
const cloneTemplate=value=>JSON.parse(JSON.stringify(value));
const officialCase=id=>officialCatalog.cases.find(c=>c.id===id);
let templateLibrary={group:'all',search:'',caseId:null,index:0,confirm:false,body:null};
function displayState(state){return typeof state==='string'?state:JSON.stringify(state,null,2);}
function promptText(value){
 if(value===null)return 'null';
 if(Array.isArray(value))return value.map(promptText).join('、');
 if(value&&typeof value==='object')return Object.entries(value).map(([key,item])=>(stateFieldLabelsV18[key]||key)+'为'+promptText(item)).join('；');
 return String(value);
}
function promptChoices(question){return Object.values(question?.criteria||{}).map(value=>'“'+promptText(value)+'”').join('；');}
function templateQuestionCriteria(q){
 const criteria=q.criteria;if(!criteria)return '';
 if(Array.isArray(criteria))return criteria.map((value,i)=>i+' · '+value).join('\n');
 return Object.entries(criteria).map(([key,value])=>(q.type==='noul'?({true:'是',false:'否'}[key]||key):key)+' · '+value).join('\n');
}
function officialTemplateInputs(c,body,promptOverride){
 // Same evidence and business goal, with an independent natural-language LLM brief.
 const form=jevFormFromRequest(body),questions=form.questions.map(q=>({id:q.id,type:q.type,text:q.text,criteria:templateQuestionCriteria(q.original)}));
 const recipe=businessPromptRecipes[c.id]||workflowPromptRecipes[c.id];
 const llmPrompt=promptOverride??recipe(body);
 return {llmPrompt,stateText:form.stateText,questions,jevRequest:cloneTemplate(body)};
}
function officialTaskText(c,body){return officialTemplateInputs(c,body).llmPrompt;}
function structuredOfficialTaskText(c,body){
 // v22 recognition only. Do not rewrite inputs in saved experiments.
 const form=jevFormFromRequest(body);
 return form.stateText+'\n\n需要判断：\n'+form.questions.map((q,i)=>(i+1)+'. '+q.text+'\n答案类型：'+questionTypeNames[q.type]+(q.original.criteria?'\n'+templateQuestionCriteria(q.original):'')).join('\n\n');
}
function legacyOfficialTaskText(c,body){
 // Recognition only: saved experiments keep the exact inputs they originally used.
 let state=humanState(body.state,0,'',c.id);
 const code=officialCase('B05')?.requests[0].body.state.code;
 if(c.id==='B05'&&body.state?.code===code)state=state.replace(code,'登录时，先将完整的请求内容写入日志，再使用这些内容进行身份验证。');
 return c.scenario+'\n\n任务材料：\n'+state+'\n\n需要判断：\n'+questionEntries(body).map(([id,q],i)=>(i+1)+'. '+humanQuestion(q.instructions)+(q.criteria?'\n'+(q.type==='score'?'评分等级：':'候选答案：')+(Array.isArray(q.criteria)?q.criteria:Object.values(q.criteria)).map(humanQuestion).join('；'):'')).join('\n\n');
}
function matchesPriorNaturalTask(task,c,body){
 const stages=priorNaturalTemplatePrompts[c.id];if(!stages)return false;
 return Object.entries(stages).some(([index,prompt])=>task===prompt&&JSON.stringify(body)===JSON.stringify(c.requests[index]?.body));
}
function matchesOfficialTask(task,c,body){return task===officialTaskText(c,body)||matchesPriorNaturalTask(task,c,body)||task===structuredOfficialTaskText(c,body)||task===legacyOfficialTaskText(c,body);}
function selectedTemplateInputs(c,body){
 const d=templateLibrary.fromDraft?getOpenDraft():null;
 const selected=d?.official?.caseId===c.id&&d.official.index===templateLibrary.index&&JSON.stringify(body)===JSON.stringify(d.dual?getDualJevRequest(d):officialInput(d.question,d.official));
 return officialTemplateInputs(c,body,selected?d.question:undefined);
}
function templateInputsHTML(inputs){
 return `<div class="template-more"><label for="template-llm-preview">LLM 提示词</label><textarea id="template-llm-preview" class="template-input-preview" aria-label="LLM 提示词预览" readonly rows="9">${esc(inputs.llmPrompt)}</textarea></div>`;
}

function officialInput(task,selection){
 if(!selection)return null;
 const c=officialCase(selection.caseId),item=c?.requests[selection.index];if(!item)return null;
 const body=cloneTemplate(selection.body||item.body);
 if(task.trim()!==(selection.baseTask||officialTaskText(c,body)).trim())body.state=task.trim();
 return body;
}
function officialSnapshot(task,selection,request=null){
 if(!selection)return null;
 return {caseId:selection.caseId,index:selection.index,body:cloneTemplate(request||officialInput(task,selection)),baseTask:task};
}
function questionEntries(request){
 if(Array.isArray(request?.questions))return request.questions.map((q,i)=>[String(i+1),{type:q.type,instructions:q.question,criteria:q.options}]);
 return Object.entries(request?.questions||{});
}
function questionDescription(q){
 const criteria=q.criteria;
 if(Array.isArray(criteria))return criteria.map((v,i)=>(q.type==='score'?String(i)+' · ':'')+v).join(' / ');
 return criteria&&typeof criteria==='object'?Object.entries(criteria).map(([k,v])=>k+' · '+v).join(' / '):'';
}
function questionsHTML(request){return questionEntries(request).map(([id,q])=>`<div class="template-question"><div><b>${esc(id)}</b><span>${esc(questionTypeNames[q.type]||q.type)}</span></div><p>${esc(q.instructions)}</p>${questionDescription(q)?`<small>${esc(questionDescription(q))}</small>`:''}</div>`).join('');}
function officialTemplateControls(d,{libraryOnly=false}={}){
 const c=officialCase(d.official?.caseId);
 return `<button type="button" class="template-library-button" data-template-library>${icon('grid')}模板库 <small>${officialCatalog.cases.length}</small></button>${c&&!libraryOnly?`<button type="button" class="selected-official-template" data-template-info>${esc(c.title)}${c.requests.length>1?' · '+(d.official.index+1)+'/'+c.requests.length:''} <span>模版详情 ↗</span></button>`:''}`;
}
function templateCategory(c){return templateGroups[templateBusinessMeta[c.id].group];}
function openTemplateLibrary(){
 if(busyOpenRun())return;stageDetails.close();templateLibrary={...templateLibrary,caseId:null,confirm:false,body:null};
 showModal('选择模版',`<div class="template-library"><input type="search" id="template-search" placeholder="搜索场景、任务或关键词" aria-label="搜索模版" value="${esc(templateLibrary.search)}"><div class="template-group-tabs" role="group" aria-label="模版分组"><button type="button" data-template-group="all" aria-pressed="${templateLibrary.group==='all'}">全部 <span>${officialCatalog.cases.length}</span></button>${Object.entries(templateGroups).map(([key,label])=>`<button type="button" data-template-group="${key}" aria-pressed="${templateLibrary.group===key}">${label} <span>${officialCatalog.cases.filter(c=>templateBusinessMeta[c.id].group===key).length}</span></button>`).join('')}</div><div id="template-library-results"></div><p class="template-provenance">场景依据官方资料；中文材料与题目为整理者编写的示例。</p></div>`,true);renderTemplateResults();
}
function renderTemplateResults(){
 const term=templateLibrary.search.trim().toLowerCase();
 const list=officialCatalog.cases.filter(c=>(templateLibrary.group==='all'||templateBusinessMeta[c.id].group===templateLibrary.group)&&[c.id,c.title,templateBusinessMeta[c.id].brief,templateCategory(c),c.slug].join(' ').toLowerCase().includes(term));
 $('#template-library-results').innerHTML=`<div class="template-result-count">${list.length} 套模版</div><div class="template-card-list">${list.map(c=>`<button type="button" class="template-case-card" data-template-case="${c.id}"><div><span>${esc(templateCategory(c))}</span><small>${c.requests.length>1?c.requests.length+' 个请求':'1 个请求'}</small></div><h3>${esc(c.title)}</h3><p class="template-input-excerpt">${esc(templateBusinessMeta[c.id].brief)}</p><footer>${[...new Set(c.requests.flatMap(r=>Object.values(r.body.questions).map(q=>questionTypeNames[q.type])))].map(t=>`<span>${esc(t)}</span>`).join('')}<b>查看模版 ↗</b></footer></button>`).join('')||'<p class="template-empty">没有匹配的模版，试试其他关键词或分组。</p>'}</div>`;
}
function showTemplateCase(id,index=0,fromDraft=false){
 const c=officialCase(id);if(!c||!c.requests[index])return;
 const selected=fromDraft&&getOpenDraft().official?.caseId===id&&getOpenDraft().official.index===index;
 const body=cloneTemplate(selected?(getOpenDraft().dual?getDualJevRequest(getOpenDraft()):officialInput(getOpenDraft().question,getOpenDraft().official)):c.requests[index].body);
 templateLibrary={...templateLibrary,caseId:id,index,confirm:false,fromDraft,body};
 const source=/^https:\/\/docs\.typesafe\.ai\//.test(c.source)?`<a href="${esc(c.source)}" target="_blank" rel="noreferrer">官方来源 ↗</a>`:'';
 showModal(c.title,`<div class="template-case-detail"><button type="button" class="text-link" data-template-library>← 模版库</button><section class="template-scene-brief" aria-label="场景说明"><span>${esc(templateCategory(c))}</span><p class="template-scenario">${esc(templateBusinessMeta[c.id].brief)}</p></section>${c.requests.length>1?`<label for="template-request-stage">选择请求</label><select id="template-request-stage">${c.requests.map((r,i)=>`<option value="${i}" ${index===i?'selected':''}>${i+1}. ${esc(r.label)}</option>`).join('')}</select>`:''}<div id="template-input-preview">${templateInputsHTML(selectedTemplateInputs(c,body))}</div><p class="template-provenance">${source}</p><p id="template-apply-error" class="form-error" role="alert"></p><div class="template-modal-footer"><span>${c.id} · 请求 ${index+1}/${c.requests.length}</span><button type="button" class="button primary" data-template-apply>使用这个模版</button></div></div>`,true);
}
function validateOfficialRequest(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['model','state','questions'].includes(k))||typeof body.model!=='string'||!body.model.trim()||body.state==null||typeof body.state!=='object'&&typeof body.state!=='string')throw new Error('请保留 model、state 和 questions。');
 const entries=questionEntries(body);if(!entries.length||Array.isArray(body.questions))throw new Error('questions 应为包含题目 ID 的对象。');
 for(const [id,q] of entries){if(!q||!['choice','noul','score'].includes(q.type)||typeof q.instructions!=='string'||!q.instructions.trim())throw new Error(id+'：请填写题型和 instructions。');if(q.type==='choice'&&(!q.criteria||Array.isArray(q.criteria)||typeof q.criteria!=='object'||Object.keys(q.criteria).length<2||!Object.values(q.criteria).every(v=>typeof v==='string')))throw new Error(id+'：请提供至少两个候选项。');if(q.type==='score'&&(!Array.isArray(q.criteria)||q.criteria.length<2||!q.criteria.every(v=>typeof v==='string')))throw new Error(id+'：请按顺序提供评分等级。');}
 return body;
}
function applyOfficialTemplate(){
 if(busyOpenRun())return;
 const c=officialCase(templateLibrary.caseId);if(!c)return;
 let body;try{body=validateOfficialRequest(cloneTemplate(templateLibrary.body));}catch(e){$('#template-apply-error').textContent=e.message;return;}
 const d=captureDraft()||getOpenDraft(),same=templateLibrary.fromDraft&&d.official?.caseId===c.id&&d.official.index===templateLibrary.index;
 if(d.question.trim()&&!same&&!sameOpenExample(d)&&!templateLibrary.confirm){templateLibrary.confirm=true;$('#template-apply-error').textContent='这会替换当前填写的任务。确认后再次点击使用。';$('[data-template-apply]').textContent='替换并使用模版';return;}
 const task=selectedTemplateInputs(c,body).llmPrompt;
 if(task.length>6000){$('#template-apply-error').textContent='任务超过 6000 字，请精简后再使用。';return;}
 stageOfficialDraft(c.id,templateLibrary.index,{body,llmPrompt:task,provider:d.provider});$('#modal').close();if(view!=='compare')navigate('compare');else renderNew();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-template-library'))openTemplateLibrary();
 if(b.hasAttribute('data-template-info')){const d=getOpenDraft();showTemplateCase(d.official.caseId,d.official.index,true);}
 if(b.dataset.templateGroup){templateLibrary.group=b.dataset.templateGroup;document.querySelectorAll('[data-template-group]').forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.templateGroup===templateLibrary.group)));renderTemplateResults();}
 if(b.dataset.templateCase)showTemplateCase(b.dataset.templateCase);
 if(b.hasAttribute('data-template-apply'))applyOfficialTemplate();
});
document.addEventListener('input',e=>{if(e.target.id==='template-search'){templateLibrary.search=e.target.value;renderTemplateResults();}});
document.addEventListener('change',e=>{if(e.target.id==='template-request-stage')showTemplateCase(templateLibrary.caseId,Number(e.target.value),templateLibrary.fromDraft);});
