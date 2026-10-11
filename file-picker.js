/* Attachment windows own their context independently of a source page's DOM. */
(function(root){'use strict';
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normal=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'');
 function create(api){
  let context=null,origin=null,dialog=null;
  const current=()=>context?.fieldId?document.getElementById(context.fieldId):null;
  function target(){const field=current();if(field)return field.closest('.file-field')?.querySelector(`[data-file-${context.mode==='preview'?'preview':'pick'}="${field.id}"]`);return origin?.isConnected?origin:null;}
  function ensure(){if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='file-picker';dialog.setAttribute('aria-label','选择附件');document.body.append(dialog);dialog.addEventListener('close',()=>{const back=target();context=null;back?.focus({preventScroll:true});});return dialog;}
  function filter(){const q=normal(dialog.querySelector('#file-search')?.value);let found=0;dialog.querySelectorAll('[data-file-row]').forEach(row=>{row.hidden=!normal(row.dataset.fileRow).includes(q);if(!row.hidden)found++;});const empty=dialog.querySelector('#file-empty');if(empty)empty.hidden=!!found;}
  function render(preserve=false){
   if(!context||!current()){dialog?.close();return;}
   const query=preserve?dialog.querySelector('#file-search')?.value||'':'',active=document.activeElement,wasFocused=active?.closest('dialog')===dialog,scroll=dialog.scrollTop,preview=preserve?dialog.querySelector('.file-preview'):null;
   const focus=active?.dataset?.fileChoice?['file-choice',active.dataset.fileChoice]:active?.dataset?.pickerPreview?['picker-preview',active.dataset.pickerPreview]:active?.id==='file-close'?['id','file-close']:['id','file-search'];
   if(context.mode==='preview'){dialog.innerHTML=`<header><h2>附件预览</h2><button type="button" id="file-close">关闭</button></header>${api.previewHtml(current().value)}`;dialog.querySelector('#file-close').onclick=()=>dialog.close();return;}
   const files=api.files(context.operation);
   dialog.innerHTML=`<header><h2>选择附件</h2><button type="button" id="file-close">关闭</button></header><label for="file-search">搜索文件</label><input id="file-search" type="search" autocomplete="off"><ul>${files.map(f=>`<li data-file-row="${escape(api.searchText(f))}"><button type="button" data-file-choice="${escape(f.id)}">${api.thumbnail(f)}<span>${escape(f.title)}<small>${escape(api.sourceTitle(f))}</small></span></button><button type="button" data-picker-preview="${escape(f.id)}">预览</button></li>`).join('')}</ul><p id="file-empty" role="status" hidden>没有匹配文件。</p>`;
   const search=dialog.querySelector('#file-search');search.value=query;search.oninput=filter;dialog.querySelector('#file-close').onclick=()=>dialog.close();
   dialog.querySelectorAll('[data-file-choice]').forEach(button=>button.onclick=()=>{const field=current(),file=api.files(context.operation).find(f=>f.id===button.dataset.fileChoice);if(!field||!file){sync();return;}if(api.choose(field,file)!==false)dialog.close();});
   dialog.querySelectorAll('[data-picker-preview]').forEach(button=>button.onclick=()=>{const file=api.files(context.operation).find(f=>f.id===button.dataset.pickerPreview);if(!file)return;if(file.image)api.zoom(file.image,button);else{let pane=dialog.querySelector('.file-preview');if(!pane){pane=document.createElement('section');pane.className='file-preview';dialog.append(pane);}pane.innerHTML=api.previewHtml(file.id);pane.scrollIntoView({block:'start'});}});
   if(preview)dialog.append(preview);filter();
   if(preserve){dialog.scrollTop=scroll;const next=focus[0]==='id'?dialog.querySelector('#'+focus[1]):dialog.querySelector(`[data-${focus[0]}="${focus[1]}"]`);if(wasFocused)(next||search).focus({preventScroll:true});}
  }
  function open(button){origin=button;context={fieldId:button.dataset.filePick,operation:+button.dataset.operation,mode:'choose'};ensure();render();dialog.showModal();dialog.querySelector('#file-search').focus();}
  function preview(button){origin=button;context={fieldId:button.dataset.filePreview,mode:'preview'};ensure();render();dialog.showModal();dialog.querySelector('#file-close').focus();}
  function sync(reset=false){if(!dialog?.open)return;if(reset||!current()){dialog.close();return;}render(true);}
  function zoomTarget(asset){if(!dialog?.open)return null;const files=context?.operation?api.files(context.operation):[];return [...dialog.querySelectorAll('[data-picker-preview]')].find(b=>b.dataset.pickerPreview===asset||files.find(f=>f.id===b.dataset.pickerPreview)?.image===asset)||dialog.querySelector('#file-close');}
  return {open,preview,sync,zoomTarget};
 }
 root.MYFilePicker={create};
})(window);
