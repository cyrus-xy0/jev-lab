/* Read-only result presentation. Request snapshots and raw responses stay untouched. */
function jevResultObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function jevResultJSON(value){if(jevResultObject(value))return value;if(typeof value==='string')try{const parsed=JSON.parse(value);return jevResultObject(parsed)?parsed:null;}catch{}return null;}
function jevResultNumber(value){return typeof value==='number'&&Number.isFinite(value);}
function jevResultProbability(value){return jevResultNumber(value)&&value>=0&&value<=1?value:null;}
function jevResultPercent(value){return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(value*100)+'%';}
function jevResultText(value){return typeof value==='string'?value:typeof value==='number'||typeof value==='boolean'?String(value):value==null?'':humanState(value);}
function jevResultFingerprint(value){let hash=2166136261;for(const char of JSON.stringify(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(36);}
function jevResultRequestEntries(request){return Array.isArray(request?.questions)?request.questions.map((q,i)=>[String(i+1),{...q,instructions:Object.hasOwn(q,'instructions')?q.instructions:q.question,criteria:Object.hasOwn(q,'criteria')?q.criteria:q.options}]):Object.entries(request?.questions||{});}
function jevResultCriteria(q,legend){
 const criteria=q.type==='score'&&(Array.isArray(legend)||jevResultObject(legend))?legend:q.criteria;
 if(Array.isArray(criteria))return criteria.map((label,i)=>({key:String(i),label:jevResultText(label),level:q.type==='score'?i:null}));
 const rows=jevResultObject(criteria)?Object.entries(criteria).map(([key,label])=>({key,label:jevResultText(label),level:q.type==='score'&&/^(0|[1-9]\d*)$/.test(key)?Number(key):null})):[];
 return q.type==='score'&&rows.every(row=>row.level!==null)?rows.sort((a,b)=>a.level-b.level):rows;
}
function jevResultPayload(state){
 const response=jevResultJSON(state?.response);
 // The current adapter's completion event wraps its output; older records saved only output.
 if(response?.source==='local_mock'&&response.type==='complete')return jevResultJSON(response.output);
 return response||jevResultJSON(state?.output);
}
function jevResultData(request,state,record={}){
 const phase=state?.phase||'idle',hidden=!!record?.publicEdited,complete=phase==='complete'&&!hidden;
 const payload=complete?jevResultPayload(state):null,entries=jevResultRequestEntries(request).filter(([,q])=>q&&jevResultText(q.instructions).trim());
 const mock=record?.mode==='mock'||state?.response?.source==='local_mock'||payload?.mock===true;
 const scope=jevResultFingerprint([record?.id||'draft',request,hidden]);
 const questions=entries.map(([id,q],index)=>{
  const answer=jevResultObject(payload?.answers)&&Object.hasOwn(payload.answers,id)?payload.answers[id]:entries.length===1?payload:null;
  const original=typeof officialCase==='function'?officialCase(record?.official?.caseId)?.requests[record?.official?.index]?.body?.questions?.[id]:null;
  const title=original&&JSON.stringify(q)===JSON.stringify(original)?resultLabelsV18[record?.official?.caseId]?.[id]||'':'';
  const a=jevResultObject(answer)&&(!Object.hasOwn(answer,'type')||answer.type===q.type)?answer:null,rows=jevResultCriteria(q,a?.legend);
  let value=null,selectedKey=null,probability=null,confidence=null;
  if(complete&&a){
   confidence=['choice','score'].includes(q.type)?jevResultProbability(a.confidence):null;
   if(q.type==='choice'&&(typeof a.choice==='string'||typeof a.choice==='number'||typeof a.choice==='boolean')){
    const key=String(a.choice),labels=rows.filter(row=>row.label===key);
    selectedKey=rows.find(row=>row.key===key)?.key??(labels.length===1?labels[0].key:null);
    value=rows.find(row=>row.key===selectedKey)?.label||key;
   }
   if(q.type==='score'&&jevResultNumber(a.score))value=a.score;
   if(q.type==='noul'){
    probability=jevResultProbability(a.noul);
    if(probability!==null)value=probability===.5?'未偏向任一侧':probability>.5?'是':'否';
    else if(typeof a.noul==='boolean')value=a.noul?'是':'否';
   }
  }
  const probabilities=complete&&jevResultObject(a?.probabilities)?a.probabilities:null;
  const distribution=rows.map(row=>({...row,probability:probabilities?jevResultProbability(Object.hasOwn(probabilities,row.key)?probabilities[row.key]:rows.filter(other=>other.label===row.label).length===1&&Object.hasOwn(probabilities,row.label)?probabilities[row.label]:null):null,selected:selectedKey===row.key}));
  const awaiting=complete&&(a?.status==='awaiting_model'||payload?.status==='awaiting_model');
  const status=hidden?'已隐藏':phase==='idle'?'待运行':['request','processing','output'].includes(phase)?'等待返回':['cancelled','error'].includes(phase)?'未获得完整结果':awaiting?'等待模型接入':value===null?'未返回结果':'已返回';
  return {id,index,key:scope+':'+index,type:q.type,instructions:humanQuestion(jevResultText(q.instructions)),title,rows:distribution,value,selectedKey,probability,confidence,status,max:q.type==='score'&&rows.length&&rows.every((row,i)=>row.level===i)?rows.length-1:null};
 });
 return {phase,hidden,mock,complete,questions};
}
function jevResultMeter(probability){return probability===null?'':`<div class="jev-probability"><div class="jev-probability-track" aria-hidden="true"><span style="width:${probability*100}%"></span></div><span>${jevResultPercent(probability)}</span></div>`;}
function jevResultRows(question){
 const {rows,type,probability}=question;
 if(type==='noul'){
  return `<div class="jev-binary-results">${[['true','是',probability],['false','否',probability===null?null:1-probability]].map(([key,label,p])=>`<div class="jev-binary-option"><div class="jev-distribution-label"><strong>${label}</strong>${p!==null?`<b>${jevResultPercent(p)}</b>`:''}</div>${jevResultMeter(p)}${rows.find(row=>row.key===key)?.label?`<p>${esc(rows.find(row=>row.key===key).label)}</p>`:''}</div>`).join('')}</div>`;
 }
 if(!rows.length)return '<p class="jev-result-note">这份请求未记录可展示的答案标准。</p>';
 return `<div class="jev-distribution">${rows.map(row=>`<div class="jev-distribution-row ${row.selected?'is-selected':''}"><div class="jev-distribution-label"><span class="jev-criterion-key">${esc(type==='score'&&row.level!==null?row.level+' 分':row.key)}</span>${row.selected?'<span class="jev-selected-label">已选</span>':''}</div>${row.label?`<p>${esc(row.label)}</p>`:''}${jevResultMeter(row.probability)}</div>`).join('')}</div>`;
}
function jevScoreAxis(question){
 if(question.type!=='score'||!jevResultNumber(question.value)||!(question.max>0)||question.value<0||question.value>question.max)return '';
 return `<div class="jev-score-axis" aria-label="得分 ${esc(question.value)}，范围 0 至 ${question.max}"><div class="jev-score-track" aria-hidden="true"><span style="left:${question.value/question.max*100}%"></span></div><div class="jev-score-ticks"><span>0</span><span>${question.max}</span></div></div>`;
}
function renderJevResults(request,state,record){
 if(record?.publicEdited)return '<p class="stage-placeholder">原始输出已隐藏</p>';
 if(!state?.phase||state.phase==='idle')return '<p class="stage-placeholder">点击「运行 Jev」后查看结果</p>';
 const data=jevResultData(request,state,record);
 if(!data.questions.length)return `<p class="stage-placeholder">${esc(state?.emptyOutputText||(data.complete?'未返回可展示的判断结果':'等待输出'))}</p>`;
 const caption=data.complete?(data.mock?'模拟结果':'判断结果'):['error','cancelled'].includes(data.phase)?'本次运行未完成':'正在处理';
 return `<div class="jev-results"><div class="jev-results-caption"><span>${caption}</span><span>${data.questions.length} 项判断</span></div>${data.questions.map(q=>{
  const hasValue=q.value!==null,fullResult=hasValue?q.value:q.status;
  const firstLine=String(fullResult).split('\n')[0],result=q.type==='choice'&&hasValue?(firstLine.length>56?firstLine.slice(0,56)+'…':String(fullResult).includes('\n')?firstLine+'…':fullResult):fullResult;
  const extra=q.type==='score'&&hasValue&&q.max!==null?`<small>/ ${q.max}</small>`:'';
  const headline=q.type==='noul'&&q.probability!==null?`<strong>${jevResultPercent(q.probability)}</strong><small>是</small><span class="jev-noul-complement">${jevResultPercent(1-q.probability)} 否</span>`:`<strong>${esc(result)}</strong>${extra}`;
  const label={choice:'选择 · Choice',score:'评分 · Score',noul:'是 / 否 · Noul'}[q.type]||'其他类型';
  const hasDistribution=q.probability!==null||q.rows.some(row=>row.probability!==null),expandLabel=hasDistribution?'查看标准与分布':q.type==='choice'?'查看候选答案':q.type==='score'?'查看评分标准':'查看判断标准';
  const meta=q.type==='score'&&q.max!==null?q.rows.length+' 个等级 · 0–'+q.max+' 分':q.type==='choice'?q.rows.length+' 个候选答案':q.probability!==null?'是 / 否概率':'判断标准';
  return `<details class="jev-result-question" data-result-key="${q.key}"><summary><div class="jev-result-meta"><span class="jev-result-name">${esc(q.title||'问题 '+(q.index+1))}</span><span class="jev-result-type">${esc(label)}</span><span class="jev-result-chevron" aria-hidden="true">⌄</span></div><span class="jev-question-key">${esc(q.id)}</span><p class="jev-result-instructions">${esc(q.instructions)}</p><div class="jev-result-answer ${hasValue?'':'is-pending'}">${headline}</div>${jevScoreAxis(q)}<div class="jev-result-expand"><span>${esc(meta)}</span><span class="jev-result-expand-label">${expandLabel}</span></div></summary><div class="jev-result-breakdown">${jevResultRows(q)}${q.confidence!==null?`<div class="jev-result-confidence">置信度 <strong>${jevResultPercent(q.confidence)}</strong></div>`:''}</div></details>`;
 }).join('')}</div>`;
}
