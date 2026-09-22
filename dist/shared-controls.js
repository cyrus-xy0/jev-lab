/* Tom Select enhances native values and change events; business handlers stay unchanged. */
const sharedSelects=new Map();
const selectIds=['llm-provider','jev-question-index','jev-answer-type','template-request-stage'];
const checkIcon='<svg class="select-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
function enhanceSharedControls(){
 if(typeof TomSelect!=='function')return;
 for(const [element,control] of sharedSelects){if(!element.isConnected){control.destroy();sharedSelects.delete(element);}}
 for(const id of selectIds){
  const element=document.getElementById(id);if(!element)continue;
  let control=sharedSelects.get(element);
  if(!control){
   const model=id==='llm-provider';
   control=new TomSelect(element,{controlInput:null,create:false,maxItems:1,hideSelected:false,searchField:[],openOnFocus:false,closeAfterSelect:true,selectOnTab:false,onDelete:()=>false,
    render:{item:(data,escape)=>`<div class="select-value">${escape(data.text)}</div>`,option:(data,escape)=>`<div><span class="select-option-label">${escape(data.text)}</span>${checkIcon}</div>`},
    onDropdownOpen(){const selected=this.getOption(this.getValue());if(selected)this.setActiveOption(selected);}
   });
   sharedSelects.set(element,control);
   element.setAttribute('aria-hidden','true');
   control.hook('instead','onClick',function(){if(this.isDisabled)return;if(this.isOpen){this.close();return;}this.focus();this.refreshOptions(false);this.open();});
   control.wrapper.classList.add('shared-select',model?'model-select':'field-select');
   const label=element.labels?.[0]?.textContent?.trim()||element.getAttribute('aria-label')||({
    'llm-provider':'LLM 模型','jev-question-index':'选择判断问题','jev-answer-type':'答案类型','template-request-stage':'选择请求'
   })[id];
   if(!control.focus_node.hasAttribute('aria-labelledby'))control.focus_node.setAttribute('aria-label',label);
   control.focus_node.setAttribute('aria-autocomplete','none');
   // Complete the select-only keyboard pattern while Tom Select owns focus and options.
   let typed='',typeTimer;
   control.focus_node.addEventListener('keydown',event=>{
    if(control.isDisabled)return;
    if((event.key==='Enter'||event.key===' '||event.key==='ArrowUp')&&!control.isOpen){event.preventDefault();event.stopImmediatePropagation();control.open();return;}
    if(event.key==='Home'||event.key==='End'){
     event.preventDefault();event.stopImmediatePropagation();control.open();
     const options=control.dropdown_content.querySelectorAll('[data-selectable]');const option=event.key==='Home'?options[0]:options[options.length-1];if(option)control.setActiveOption(option);return;
    }
    if(event.key===' '&&control.isOpen){event.preventDefault();event.stopImmediatePropagation();control.activeOption?.click();return;}
    if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key!==' '){
     clearTimeout(typeTimer);typed+=event.key.toLocaleLowerCase();typeTimer=setTimeout(()=>{typed='';},600);
     const option=Array.from(element.options).find(o=>!o.disabled&&o.text.toLocaleLowerCase().startsWith(typed));
     if(option){event.preventDefault();control.open();control.setActiveOption(control.getOption(option.value));}
    }
   },true);
   control.on('destroy',()=>clearTimeout(typeTimer));
  }
  const disabled=element.matches(':disabled');
  if(disabled!==control.isDisabled){const ownDisabled=element.disabled;disabled?control.disable():control.enable();element.disabled=ownDisabled;}
  control.focus_node.setAttribute('aria-disabled',String(disabled));
  if(String(control.getValue())!==element.value)control.setValue(element.value,true);
 }
}
// A question/request change can replace its editor synchronously. Keep focus on its replacement.
document.addEventListener('change',event=>{
 const element=event.target;if(!selectIds.includes(element.id)||!sharedSelects.has(element))return;
 const control=sharedSelects.get(element),restore=control.wrapper.contains(document.activeElement);
 if(restore)queueMicrotask(()=>{if(element.isConnected)return;const replacement=document.getElementById(element.id);replacement?.tomselect?.focus();});
},true);
const dialogTriggers=new WeakMap();
function rememberDialogTrigger(dialog){
 if(!dialogTriggers.has(dialog)){
  dialogTriggers.set(dialog,null);
  dialog.addEventListener('cancel',event=>{for(const [element,control] of sharedSelects){if(dialog.contains(element)&&control.isOpen){event.preventDefault();control.close();return;}}});
  dialog.addEventListener('close',()=>{
   for(const [element,control] of sharedSelects){if(dialog.contains(element))control.close();}
   const trigger=dialogTriggers.get(dialog);if(trigger?.isConnected)trigger.focus({preventScroll:true});
   else document.querySelector('[data-template-library]')?.focus({preventScroll:true});
  });
 }
 if(!dialog.open)dialogTriggers.set(dialog,document.activeElement);
}
