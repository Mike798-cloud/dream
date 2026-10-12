(function(root){'use strict';
function create(api){
 const scope=new URL(api.root,location.href).pathname,base='mengyan-support:'+encodeURIComponent(scope)+':';
 let timer=null,dialog=null,back=null,previousOverflow='',seen=false,paid=false;
 const cookieKey=key=>encodeURIComponent(base+key);
 function get(key){for(const storage of ['localStorage','sessionStorage']){try{if(root[storage].getItem(base+key))return true;}catch{}}try{return document.cookie.split(';').some(v=>v.trim().startsWith(cookieKey(key)+'=1'));}catch{return false;}}
 function set(key){for(const storage of ['localStorage','sessionStorage']){try{root[storage].setItem(base+key,'1');}catch{}}try{document.cookie=cookieKey(key)+'=1;max-age=31536000;path='+scope+';SameSite=Lax';}catch{}}
 function hasSeen(){return seen||get('seen');}function hasPaid(){return paid||get('paid');}
 function markSeen(){seen=true;set('seen');clearTimeout(timer);timer=null;}
 function toast(text){let el=document.getElementById('support-status');if(!el){el=document.createElement('p');el.id='support-status';el.setAttribute('role','status');document.body.append(el);}el.textContent=text;el.hidden=false;clearTimeout(el._timer);el._timer=setTimeout(()=>el.hidden=true,4500);}
 function ensure(){if(dialog)return;dialog=document.createElement('dialog');dialog.id='support-dialog';dialog.setAttribute('aria-labelledby','support-title');
 dialog.innerHTML=`<button type="button" data-support-close class="support-close" aria-label="关闭支持窗口">×</button><header><p>abc studio / 写给正在游玩的你</p><h2 id="support-title">如果喜欢《梦演（魇）时分》</h2><p>自愿支持 1 元，完整内容都可以继续玩。</p></header><div class="support-body"><figure><img src="${api.root}assets/support-paycode.png" width="940" height="1128" alt="作者的1元支持收款码"><figcaption>扫码支持 1 元<br><a href="${api.root}assets/support-paycode.png" target="_blank" rel="noopener">打开收款码原图</a></figcaption><p class="support-image-error" hidden>收款码没能载入，可以打开原图重试，也可以先继续游玩。</p></figure><div><p>你好，我是 abc。故事还没讲完，先在这里和你打个招呼。</p><p>做这部作品时，我花了不少时间改那些很普通的对话：问柜子多少钱，催人拿雨衣，商量周一的班。我希望你查着查着，还会记得这些人在过什么日子。</p><p>如果你玩到这里觉得还不错，愿意留一块钱支持我做下一部，我会很开心。不方便也没关系，关掉这个窗口就能接着玩。</p><p class="support-small">这里只会自动出现这一次。以后想找我，页脚的“支持作者”还在。</p></div></div><footer><button type="button" data-support-done>我支持了一下</button><button type="button" data-support-close>先继续游玩</button></footer><p class="support-small">扫码在支付应用中完成；下面的按钮只记住你的选择，不会查询支付结果。</p>`;
 document.body.append(dialog);dialog.querySelector('img').addEventListener('error',()=>{dialog.querySelector('img').hidden=true;dialog.querySelector('.support-image-error').hidden=false;});
 dialog.querySelectorAll('[data-support-close]').forEach(b=>b.onclick=()=>dialog.close());dialog.querySelector('[data-support-done]').onclick=()=>{paid=true;set('paid');sync();dialog.close();toast('谢谢你愿意支持这部作品。接着玩吧。');};
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;back?.isConnected&&back.focus({preventScroll:true});});
 }
 function show(){if(hasPaid()){toast('你已经在这里记下支持了，谢谢。');return false;}if(document.hidden||document.querySelector('dialog[open]'))return false;ensure();back=document.activeElement;previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';markSeen();dialog.querySelector('[data-support-close]').focus({preventScroll:true});return true;}
 function canAuto(){return !hasSeen()&&!hasPaid()&&!document.hidden&&api.eligible()&&!document.querySelector('dialog[open]')&&!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');}
 async function fire(){timer=null;if(hasSeen()||hasPaid()||!api.eligible())return;if(!canAuto()){timer=setTimeout(fire,1000);return;}const attempt=()=>{if(canAuto())show();};if(navigator.locks?.request){try{await navigator.locks.request(base+'auto',attempt);}catch{attempt();}}else attempt();}
 function sync(){document.querySelectorAll('[data-support-open]').forEach(b=>{b.textContent=hasPaid()?'已记下支持':'支持作者';});if(hasSeen()||hasPaid()||!api.eligible()){clearTimeout(timer);timer=null;return;}if(timer===null)timer=setTimeout(fire,4800);}
 document.addEventListener('click',e=>{if(e.target.closest('[data-support-open]')){e.preventDefault();show();}});
 document.addEventListener('visibilitychange',sync);window.addEventListener('storage',e=>{if(e.key===null||e.key?.startsWith(base)){if(hasSeen()||hasPaid()){clearTimeout(timer);timer=null;}sync();}});
 return {sync};
}
root.MYSupport={create};
})(window);
