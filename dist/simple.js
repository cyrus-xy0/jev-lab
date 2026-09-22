/* The first layer teaches one idea. Operational evidence lives one level deeper. */
const simpleCases={
 support:{tab:'退回重复扣款',title:'客户多付了 ¥99，怎么帮他退回？',request:'“这笔订单扣了两次钱，请退回多扣的 ¥99，处理好告诉我。”',llm:{story:'把退款要求告诉 LLM。它请系统查订单，提出退款方案，并写好给客户的回复。'},jev:{story:'系统先查好订单，让 Jev 判断该怎么处理。它选出处理方式，系统按事先设定的流程继续办理。'},execution:'客服确认后，两边都由系统退款并通知客户；Jev 这边使用预写的通知。',result:'¥99 退回了，客户也收到了通知。',insight:'这个例子里，LLM 交出方案和文案；Jev 交出处理选择。'},
 tools:{tab:'安排一次会议',title:'三个人的会议，怎么约到一起？',request:'“明天下午和林晓、陈瑜约 30 分钟，尽量早一点，先让我确认。”',llm:{story:'把开会要求告诉 LLM。它请系统查大家的日历，推荐合适的时间，并写好邀请。'},jev:{story:'系统先找出大家共同有空的时间，再让 Jev 按“尽量早”选择。系统用预写内容发邀请。'},execution:'你确认后，两边都由日历系统建会、发送邀请。',result:'会议已安排，两位同事都收到了邀请。',resultNote:'收到邀请不代表已经接受。',insight:'这个例子里，LLM 组织安排与邀请；Jev 负责挑选时间。'},
 moderation:{tab:'审核一条帖子',title:'这条徒步分享，能不能发出去？',request:'“审核这条徒步分享，符合社区规则就发布，再把结果告诉作者。”',llm:{story:'把帖子和社区规则交给 LLM。它给出审核决定，并写好面向作者的说明。'},jev:{story:'系统把帖子、规则和处理选项交给 Jev。它做出选择，系统负责发布和发送预写通知。'},execution:'两边都由社区系统实际发布，确认作者通知已送达。',result:'帖子公开了，作者收到了审核通知。',insight:'这个例子里，LLM 做判断并写说明；Jev 做判断，说明用模板。'},
 priority:{tab:'跟进线上故障',title:'支付出问题，怎么跟进到恢复？',request:'“用户说支付失败，请找人处理，恢复后告诉受影响的用户。”',llm:{story:'LLM 查看系统提供的故障信息，提出处理优先级和负责人，并在恢复后撰写通知。'},jev:{story:'系统收集故障信息，让 Jev 选择优先级和负责人，再按设定流程跟进并发送预写通知。'},execution:'修复由工程师完成。两边都等到监控确认恢复，再通知用户。',result:'服务恢复了，82 位受影响用户收到通知。',insight:'这个例子里，LLM 给跟进方案和通知；Jev 做流程中的选择。'}
};
const fullJourneyRender=renderSamples;
function simpleModel(model,c){const v=c[model];return `<article class="simple-model ${model}"><h3 class="simple-model-name">${model==='llm'?'LLM':'Jev'}</h3><p>${v.story}</p></article>`;}
renderSamples=function(){
 if(!current._journey||current.id!==journey.id)selectJourney(current.id);
 if(journey.step>=0){$('#main').classList.remove('simple-main');fullJourneyRender();const back=document.createElement('button');back.className='text-link simple-back';back.dataset.jAction='overview';back.textContent='← 返回简明对比';$('#main').prepend(back);return;}
 const c=simpleCases[journey.id];$('#main').classList.add('simple-main');$('#main').classList.remove('journey-main');
 $('#main').innerHTML=`<div class="simple-heading"><h1>同一件事，两种做法</h1><button class="button secondary" data-j-action="own">试试我的任务 ${icon('plus')}</button></div><nav class="simple-case-nav" aria-label="选择案例">${Object.entries(simpleCases).map(([id,item])=>`<button data-j-case="${id}" aria-pressed="${journey.id===id}" class="${journey.id===id?'selected':''}">${item.tab}</button>`).join('')}</nav><section class="simple-case"><div class="simple-demand"><span>用户想办的事</span><h2>${c.title}</h2><p>${c.request}</p></div><div class="simple-comparison">${simpleModel('llm',c)}${simpleModel('jev',c)}</div><div class="simple-result"><div class="simple-result-symbol">✓</div><div><span>最终得到</span><h3>${c.result}</h3><p>${c.execution}${c.resultNote?' '+c.resultNote:''}</p></div></div><div class="simple-insight">${c.insight}</div></section><div class="simple-more"><button class="text-link" data-j-action="walk">查看处理细节 ↗</button><button class="text-link" data-j-action="metrics">耗时与 Token ↗</button></div><p class="simple-demo">演示案例，未连接真实模型或业务系统。</p>`;hydrateIcons();
};
const simpleNavigate=navigate;
navigate=function(next){if(next!=='samples')$('#main').classList.remove('simple-main');return simpleNavigate(next);};
// The help entry should use the same plain-language framing as the main screen.
showGuide=function(){showModal('从一个具体例子开始',`<div class="simple-guide"><p>先选一件熟悉的事，看看两边分别交出什么，以及事情最后有没有办成。</p><p><b>LLM</b> 可以给出方案、做判断，也能写回复。</p><p><b>Jev</b> 负责明确的判断，系统根据它的选择继续处理。</p><p>想深入时，再打开处理细节或耗时与 Token。当前内容均为模拟演示。</p></div>`);};
if(view==='samples')renderSamples();
