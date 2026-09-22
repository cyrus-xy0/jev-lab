/* Source is explicit. Browser-owned records never become other people's tasks. */
let gallerySource='official';
const gallerySources={official:'官方场景',mine:'我的场景',others:'其他场景'};
function isOfficialTask(record){
 if(record.taskOrigin)return record.taskOrigin==='official';
 if(!record.official)return false;
 const c=officialCase(record.official.caseId),item=c?.requests[record.official.index];
 return !!item&&JSON.stringify(officialInput(fullTask(record),record.official))===JSON.stringify(item.body);
}
function galleryItems(source){
 if(source==='official')return officialCatalog.cases.map(c=>({id:c.id,title:c.title,task:templateBusinessMeta[c.id].brief,category:templateCategory(c),source:'official',case:c}));
 if(source==='mine')return history.map(h=>({id:h.id,title:h.title,task:humanText(fullTask(h))||humanState(h.inputs?.jevRequest?.state||''),category:h.category||'自定义场景',source:'mine',record:h}));
 // Replace with anonymous public snapshots from the sharing API later.
 return [];
}
function stageOfficialDraft(id,index=0,overrides={}){
 const c=officialCase(id),item=c?.requests[index];if(!item)return false;
 const body=cloneTemplate(overrides.body||item.body),provider=overrides.provider||getOpenDraft().provider,task=overrides.llmPrompt??officialTaskText(c,body);
 stageDetails.close();openDraft={...newOpenDraft(),question:task,provider,official:{caseId:id,index,body,baseTask:task}};formDraft={...openDraft};return true;
}
function stageRecordDraft(record){
 const task=humanText(fullTask(legacyOpenRecord(record))),official=record.official?officialSnapshot(fullTask(record),record.official,record.modelState?.jev?.request):null;
 if(official)official.baseTask=task;
 stageDetails.close();openDraft={...newOpenDraft(),template:record.template||'custom',question:task,provider:Object.hasOwn(providerNames,record.provider)?record.provider:'doubao',official};formDraft={...openDraft};return true;
}
function stageGalleryCase(id,{route=false}={}){
 if(busyOpenRun()){toast('请先停止当前运行');return false;}
 let staged=false;
 if(officialCase(id))staged=stageOfficialDraft(id);
 else {
  // Old public links only use the public snapshot, including any redaction.
  const saved=history.find(h=>h.id===id&&h.published),record=saved?publicCase(saved):gallery.find(h=>h.id===id);
  if(record)staged=stageRecordDraft(record);
 }
 if(!staged)return false;
 if(route){view='compare';window.history.replaceState(null,'','#compare');}
 else navigate('compare');
 return true;
}
function selectGallerySource(source){
 if(!Object.hasOwn(gallerySources,source))return;
 if(gallerySource!==source){filter='全部场景';search='';outcome='all';}
 gallerySource=source;
}
function galleryRecordCard(item){
 const h=item.record,status=h.inputs?dualHistoryStatus(h):({running:'模拟运行中',complete:'模拟已完成',partial:'一侧未完成',cancelled:'已停止',preview:'流程预览',failed:'运行失败'})[h.status]||'待运行';
 return `<article class="gallery-card task-gallery-card gallery-record-card"><div class="gallery-card-top"><span class="source-badge mine">${isOfficialTask(h)?'来自官方模版':'自定义任务'}</span><span class="gallery-record-privacy">${h.published?'已在本地匿名展示':'仅自己可见'}</span></div><h3>${esc(humanText(item.title||'未命名任务'))}</h3><p>${esc(item.task)}</p><div class="gallery-record-status">${esc(status)}</div><div class="case-bottom"><span>${esc(h.time||'本地记录')}</span></div><div class="gallery-record-actions"><button class="button secondary" data-history="${esc(h.id)}">查看记录</button><button class="text-link" data-gallery-mine="${esc(h.id)}">复用任务 ↗</button></div></article>`;
}
function galleryTemplateCard(item){
 return `<button type="button" class="gallery-card task-gallery-card" data-case="${esc(item.id)}"><div class="gallery-card-top"><span class="source-badge official">官方场景</span><span class="case-category">${esc(item.category)}</span><span class="case-arrow">↗</span></div><h3>${esc(humanText(item.title))}</h3><p>${esc(item.task)}</p><div class="task-card-tags">${[...new Set(item.case.requests.flatMap(r=>Object.values(r.body.questions).map(q=>questionTypeNames[q.type])))].map(t=>`<span>${t}</span>`).join('')}</div><div class="case-bottom"><span>${item.case.requests.length} 个请求模版</span><strong>使用任务 →</strong></div></button>`;
}
renderGallery=function(){
 const all=galleryItems(gallerySource),term=search.trim().toLowerCase(),categories=gallerySource==='official'?Object.values(templateGroups):[...new Set(all.map(s=>s.category))],mine=gallerySource==='mine';
 const list=all.filter(s=>(filter==='全部场景'||s.category===filter)&&[s.title,s.task,s.category,s.id].join(' ').toLowerCase().includes(term));
 const searching=term||filter!=='全部场景';
 const empty=`<div class="empty-state"><span class="empty-icon">${icon('grid')}</span><h3>${searching?'没有匹配的任务':gallerySource==='others'?'暂无其他场景':'暂无我的场景'}</h3>${searching?'<button class="button secondary" data-action="clear-filters">清除筛选</button>':mine?'<button class="button primary" data-nav="compare">发起我的对比</button>':''}</div>`;
 $('#main').innerHTML=heading('测试广场','','TEST GALLERY',`<button class="button primary" data-nav="compare">${icon('plus')}发起我的对比</button>`).replace('<p></p>','')+`<div class="gallery-source-tabs" role="group" aria-label="场景来源">${Object.entries(gallerySources).map(([key,label])=>`<button type="button" data-gallery-source="${key}" aria-pressed="${gallerySource===key}">${label}<span>${galleryItems(key).length}</span></button>`).join('')}</div>${all.length?`<div class="gallery-toolbar"><div class="filter-buttons" aria-label="场景筛选">${['全部场景',...categories].map(c=>`<button class="${filter===c?'selected':''}" data-filter="${esc(c)}" aria-pressed="${filter===c}">${esc(c)}</button>`).join('')}</div><div class="gallery-search"><input id="gallery-search" placeholder="${mine?'搜索我的场景':'搜索任务内容'}" aria-label="${mine?'搜索我的场景':'搜索任务内容'}" value="${esc(search)}"></div></div><div class="section-label"><h2>${list.length} ${mine?'条记录':'个任务'}</h2></div>`:''}<div class="gallery-grid">${list.length?list.map(s=>mine?galleryRecordCard(s):galleryTemplateCard(s)).join(''):empty}</div>`;
 hydrateIcons();
};
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.gallerySource&&Object.hasOwn(gallerySources,b.dataset.gallerySource)){navigate('gallery/'+b.dataset.gallerySource);}
 if(b.dataset.galleryMine){if(busyOpenRun()){toast('请先停止当前运行');return;}const h=history.find(h=>h.id===b.dataset.galleryMine);if(h){stageRecordDraft(h);navigate('compare');}}
});
