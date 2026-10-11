(function(){'use strict';
const D=window.MYData,C=window.MYCore,byId=Object.fromEntries(D.pages.map(p=>[p.id,p])),P=document.body.dataset.page||'entry',p=byId[P],ROOT=document.body.dataset.root||'./',PREFIX='mengyan-v1:'+new URL(ROOT,location.href).pathname+':event:';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let memory=[],lastTick=Date.now(),state,zoomReturn,zoomAsset,zoomScale=1,zoomScroll=0,saveWarning=false;
const legacyPrefix='mengyan-v1-event-';
try{if(!localStorage.getItem(PREFIX+'migrated')){const prior=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(legacyPrefix)){try{const e=JSON.parse(localStorage.getItem(k));if(C.validEvent(e))prior.push(e);}catch{}}}for(const e of prior)localStorage.setItem(PREFIX+e.id,JSON.stringify(e));localStorage.setItem(PREFIX+'migrated','true');}}catch{saveWarning=true;}
function sessionEvents(){try{const a=JSON.parse(sessionStorage.getItem(PREFIX+'session')||'[]');return Array.isArray(a)?a.filter(C.validEvent):[];}catch{return[];}}
function events(){let out=[...sessionEvents(),...memory];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(PREFIX)){try{const v=JSON.parse(localStorage.getItem(k));if(Array.isArray(v))out.push(...v.filter(C.validEvent));else if(C.validEvent(v))out.push(v);}catch{}}}}catch{saveWarning=true;}return [...new Map(out.map(e=>[e.id,e])).values()];}
function persist(key,value,list){try{localStorage.setItem(key,JSON.stringify(value));}catch{memory.push(...list);saveWarning=true;try{const all=C.ordered([...new Map([...sessionEvents(),...memory].map(e=>[e.id,e])).values()]),reset=all.filter(e=>e.type==='reset').at(-1);sessionStorage.setItem(PREFIX+'session',JSON.stringify([...(reset?[reset]:[]),...C.compactEvents(all)]));}catch{}}}
function refresh(){state=C.reduce(events());return state;}
function nextTick(){let t=Math.max(Date.now(),lastTick+1);for(const e of events())t=Math.max(t,e.t+1);return t;}
function nonce(){return (window.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).replaceAll('-','');}
function commit(type,data){const t=nextTick();lastTick=t;const id=t.toString(36)+'-'+nonce();const e={v:1,id,t,type,data};persist(PREFIX+id,e,[e]);refresh();return e;}
refresh();
const sites={hotel:['回水宾馆','住宿、交通与服务记录','p01'],forum:['回水生活','旧街与新街的日常留言','p09'],paper:['回水周报','地方版 · 历史版面与更正','p16'],store:['镇西旧物保管目录','物件编号 / 历史流转 / 签领附件','p21'],album:['许家的相册','陈玉枝分享 · 按底片卷查看','p25'],hospital:['回水市医院','门诊咨询 · 历史资料服务','p31'],message:['随身来信','收件、引用与授权附件','p29'],scene:['','', 'p37'],author:['梦演（魇）时分','abc · 作品与回看','entry']};
function href(id,source=P){if(byId[id])return ROOT+byId[id].path+(source&&source!=='entry'?'?from='+encodeURIComponent(source):'');return ROOT+({entry:'index.html',notes:'notes.html',help:'help.html',strategy:'strategy.html',author:'author.html',settings:'settings.html',search:'search.html'}[id]||'index.html');}
function link(id,label,cls=''){const x=byId[id],cross=x&&p&&x.site!==p.site;return `<a href="${E(href(id))}" ${x?`data-page-link="${id}"`:''} ${cross?`data-cross="${x.site}"`:''} class="${cls}">${E(label||x?.title||id)}</a>`;}
function para(body){return body.map(t=>`<p>${E(t)}</p>`).join('');}
function offered(page){const why=gating(page);return !why||why==='access';}
function breadcrumbs(page){const q=new URLSearchParams(location.search).get('from'),src=byId[q],home=sites[page.site]?.[2];return `<div class="crumb">${src?link(src.id,'返回来源：'+src.title):home&&home!==page.id?link(home,'返回'+sites[page.site][0]):link('entry','返回入住前的来信')}</div>`;}
function gating(page){if(page.revealAfter&&!state.solved[page.revealAfter])return 'private';if(page.gate&&!state.access[page.gate])return 'access';let n=Number(page.id.slice(1));if(n===35||n===36)return state.solved[7]&&[1,2,3,4,5].every(q=>state.solved[q])?null:'q8ready';if(n===37||n===38||n===42)return state.solved[8]?null:'q8';if(n===43||n===44)return state.returns.yuan&&state.returns.chen?'': 'returns';if(n>=45&&n<=47)return state.activeEnding==='morning'&&C.canEnd(state,'morning')?'':'morning';if(n===48)return state.activeEnding==='stay'&&C.canEnd(state,'stay')?'':'stay';return null;}
function blocked(page,why){let desc='',to='help',lbl='查看相关核对';if(why==='access'){const album=page.gate==='album';return `<section class="gate"><h1>${album?'许家相册分享':'张岚历史资料附件'}</h1><p>${album?'玉枝将这四卷底片单独分享给你。请输入来信里的分享口令。':'这份护理附件凭张岚的领取函开放。请输入函中的领取凭据。'}</p>${link(album?'entry':'p32',album?'回玉枝来信':'回领取函')}<form id="access-form" data-access="${page.gate}"><label for="access-input">${album?'分享口令':'领取凭据'}</label><input id="access-input" name="code" required autocomplete="off"><button type="submit">${album?'打开家庭卷':'领取授权资料'}</button></form><p id="access-feedback" role="status"></p></section>`;}
if(why==='private'){desc='这册私人附页尚未寄到。';to=page.revealAfter===6?'p30':'p35';lbl=page.revealAfter===6?'回到玉枝的补洗卷':'回到晨间联系';}
if(why==='q8ready'){desc='张岚的回信还没有写完。知遥先把入住、两家的事实与她当年的三个晚上对清，再去读手机里的新联系。';to='help';}
if(why==='q8'){desc='知遥还没有读清晨间的照片与那条用自己账号发出的消息。沈梁说她起来了，她的手却仍不能离开木沿。';to='p35';lbl='回晨间消息核对';}
if(why==='returns'){desc='袁与陈还没有分别回话。把各自的身体位置材料交给他们，等他们自己认清那条联系。';to='p42';lbl='回身体核对';}
if(why==='morning'||why==='stay'){desc='这份后续联系尚未收到。知遥和母亲的对话还停在木沿边，她还没有回答这一次由谁走出去。';to='p44';lbl='回最后对话';}
return `<section class="gate"><h1>${E(page.site==='scene'?'木沿边的联系':'联系记录')}</h1><p>${desc}</p>${link(to,lbl)}</section>`;}
function indexRows(site){return D.pages.filter(x=>x.site===site&&!x.event&&x.id!==p?.id&&C.available(x,state)).map(x=>{
 const kind=site==='forum'?['p11','p13'].includes(x.id)?'家庭附照':`${x.thread?.length||x.body.length} 楼`:site==='album'?({p26:'卷一',p27:'卷二',p28:'卷三',p30:'补洗卷'}[x.id]||'卷目'):site==='paper'?'原刊留存':'登记附件';
 return `<li><div class="index-subject"><span class="index-kind">${E(kind)}</span>${link(x.id,x.title)}</div><small>${E(x.date)}</small></li>`;
 }).join('');}
function usefulTables(page){const n=page.id;let rows,heads;if(n==='p01'||n==='p02'){heads=['房务项目','说明'];rows=[['306单床房','128元 / 晚；三楼，无电梯'],['312单床房','停用核查，暂不接单'],['入住与退房','入住14时后 / 退房12时前'],['早餐与交通','早餐隔壁自理；街口公共停车位']];}if(['p07','p21'].includes(n)){heads=['物件编号','来源 / 当前去向','登记说明'];rows=[['B-0312','旧312 → 当前312','2014旧物；2023仅床垫更新'],['B-0306','旧306 → 当前306','2014同批签领'],['B-0211','旧211 → 库房北排第三位','2019返库，侧板固定'],['C-0306','衣铺修补柜 → 当前306','门板两道锉痕']];}if(n==='p19'){heads=['当时姓名','职业与位置','日期'];rows=[['宋大勇','货运 / 旧312 / 货站31号','2009年7月18日'],['林素秋','护理 / 旧211 / 西排','2009年7月18日'],['梁秀琴、许知遥','修衣母女 / 旧306','2009年7月18日']];}if(n==='p40'){heads=['原身份 / 原位置','借用活体 / 时间','原件归还栏'];rows=[['梁秀琴 / B-0306','张岚 / 2012年8月12日至15日','已归还'],['宋大勇 / B-0312','袁志强 / 2026年9月','空白'],['林素秋 / B-0211','陈慧 / 2019年6月','空白'],['梁秀琴 / B-0306','许知遥 / 2026年10月9日','空白']];}
return rows?`<div class="table-scroll" tabindex="0" role="region" aria-label="原件字段表，可横向滚动"><table><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${E(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';}
function optionalHtml(page){
 const extras=page.optional?.length?`<details class="local-addendum"><summary>${E(page.optionalTitle||'附记')}</summary><div class="optional-body">${para(page.optional)}</div></details>`:'';
 const key=page.id==='p15'?'deposit':page.id==='p26'?'orders':page.id==='p25'?'album':null;if(!key)return extras;const op=D.optional[key];
 const label={deposit:'信封里的收支单',orders:'衣铺留下的几张单',album:'玉枝的冲印袋'}[key];
 return extras+`<details class="optional-investigation" ${state.optional[key]||Object.keys(state.drafts).some(k=>k.startsWith('op_'+key+'_'))?'open':''}><summary>${label}</summary><section class="question" data-optional="${key}"><h2>${E(op.title)}</h2>${para(op.body)}${state.optional[key]?`<p>${E(op.result)}</p>`:`<form data-optional-form="${key}">${op.fields.map((f,i)=>`<label>${E(f.label)}<select name="o${i}" data-draft="op_${key}_${i}"><option value="">请选择</option>${f.options.map(v=>`<option ${state.drafts[`op_${key}_${i}`]===v?'selected':''}>${E(v)}</option>`).join('')}</select></label>`).join('')}<button type="submit">${key==='album'?'按拍摄日整理':key==='orders'?'记回委托单':'把账对清'}</button></form><p data-optional-feedback="${key}" role="status"></p>`}</section></details>`;
}

function contactHtml(){if(!state.solved[11])return '';return `<section id="contact-rows" class="outgoing-material"><h2>袁与陈的回话</h2>${[['yuan','袁志强','B-0312原身体；活体在镇西家中'],['chen','陈慧','B-0211原身体；活体在镇南家中']].map(([key,name,pos])=>`<div class="contacts" data-recipient="${key}"><div class="contact-route"><h3>${name}</h3><span>${state.returns[key]?'已收到本人回话':'材料待送'}</span></div><p>${pos}。物件身份、活体存活和当前位置已核对，亲身记忆由本人确认。</p>${state.returns[key]?`<p class="return-reply">${E(D.returnMessages[key])}</p>`:`<button type="button" data-return="${key}">将材料交给${name}</button>`}</div>`).join('')}${state.returns.yuan&&state.returns.chen?link('p43','继续读他们的新联系'):''}</section>`;}

function choiceHtml(){
 if(!state.solved[12])return '';if(state.choice==='morning'&&state.activeEnding!=='morning')return endActionHtml();
 if(state.activeEnding)return `<section class="boundary"><p>这次决定已经完成。</p>${link(state.activeEnding==='morning'?'p45':'p48','回到这次决定的后续')} <button type="button" data-rewind>返回正式决定之前</button></section>`;
 return `<section class="choice"><h2>知遥把手留在木沿上</h2><p>她知道外面的身体在哪里，也知道这一次不能让母亲替自己答。</p><form id="choice-form"><fieldset><legend>这一次，由知遥决定</legend><label><input type="radio" name="choice" value="morning" required><span>取回自己的身体，等所有人归还后结束借醒</span></label><p>知遥回到仍在306入睡的活体，随后撤下三份梦中凭据。母亲的寄留结束，不能继续陪伴。</p><label><input type="radio" name="choice" value="stay" required><span>让母亲代替自己离开，自己留下</span></label><p>母亲用知遥的脸与身份继续生活，知遥的意识留在母亲原身体内，两个人无法一起回家。</p></fieldset><button type="submit">就这样回答她</button></form><p id="choice-feedback" role="status"></p></section>`;
}

function endActionHtml(){if(state.choice!=='morning')return '';const returned=state.returns.self,rows=[['song','宋大勇','B-0312'],['mother','梁秀琴','B-0306'],['lin','林素秋','B-0211']];return `<section class="sign-area question"><h2 tabindex="-1">床首的三张纸</h2>${!returned?'<p>床沿仍压着知遥的手。306那一端的衣服、位置与她自己的记忆都已经对上，先沿这条联系回去。</p><button type="button" data-return="self">认回306里的身体</button>':'<p>她松开右手，再让食指按自己的意思弯下去。床首的纸还在，三个人都已归还；她暂时没有睁开眼。</p>'}<figure class="sign-scene"><div class="scene-frame"><img id="sign-photo" src="${ROOT}assets/signBacking.webp?v=20261011v8" width="1448" height="1086" alt="共同梦中三张封闭床台，左、中、右床首各有一张可撤下的纸。">${rows.map(([k,name,bed],i)=>`<button type="button" class="paper-sign sign-${k} ${state.removed[k]?'removed':''}" data-remove="${k}" aria-label="${state.removed[k]?'已撤下':'撤下'}${name} ${bed}床首凭据" aria-describedby="sign-legend" ${!returned||state.removed[k]?'disabled':''}><span>${state.removed[k]?'已撤':i+1}</span><span>${E(name)}</span><span class="sign-bed">${bed}</span></button>`).join('')}</div><figcaption id="sign-legend">左：宋大勇 / B-0312；中：梁秀琴 / B-0306；右：林素秋 / B-0211。现实的原件仍留在调查材料里。</figcaption></figure><p id="sign-feedback" role="status">${rows.filter(([k])=>state.removed[k]).map(([_,name])=>name+'的凭据已经撤下').join('；')}</p><details class="sign-access"><summary>以文字定位这三张纸</summary><p>与图中三处使用相同状态。触屏可以直接点纸签，键盘按Tab定位；无法看清图片时，可在这里按姓名核对。</p><div class="sign-links">${rows.map(([k,name,bed])=>`<button type="button" data-remove="${k}" ${!returned||state.removed[k]?'disabled':''}>${state.removed[k]?'已撤下':'撤下'}：${name} / ${bed}</button>`).join('')}</div></details>${rows.every(([k])=>state.removed[k])?'<button type="button" id="finish-morning">离开这张床，真正醒来</button>':''}</section>`;}

function supplementHtml(page){if(!page.laterAfter||!state.solved[page.laterAfter])return '';return `<section class="late-supplement"><h2>${E(page.laterLabel||'另寄的私人附页')}</h2>${para(page.laterBody||[])}<div class="photographs">${(page.laterImages||[]).map(photoHtml).join('')}</div></section>`;}
function threadHtml(page){return `<div class="thread">${(page.thread||page.body.map((text,i)=>({who:page.byline,time:page.date,text}))).map((post,i)=>`<section class="forum-floor"><header><strong>${E(post.who)}</strong><small>${E(post.time)}</small><span>${i?'回复 '+i:'楼主'}</span></header><div class="floor-copy"><p>${E(post.text)}</p>${i===0?pics(page):''}</div></section>`).join('')}</div>`;}
function nodeLink(n,label){const compose=[5,6,7,10].includes(n.id);return compose?`<a href="${E(ROOT+byId[n.page].path+'?compose='+n.id)}">${E(label)}</a>`:link(n.page,label);}
function objective(){const next=D.nodes.find(n=>!state.solved[n.id]);return next?`<p>${nodeLink(next,'继续核对：'+next.title)}。提示由你主动展开，公开资料可以按自己的顺序读。</p>`:'<p>事实核对已完成，可回最后对话作决定，或查便笺中的原件。</p>';}
function help(){return `<header class="help-manual-title"><span>操作手册 / 随时可返回材料</span><h1>阅读与提示</h1></header><div class="help-routing"><p>回水宾馆服务记录是最初入口。材料中列出的引用说明下一份材料为什么有关；跨站链接标出站名，照片返回原记录，已读出处会留在便笺。公开站点可以自由查阅。回信先选取材料中的表述；另外想说的话可以自行填写，不参与事实判定。</p>${objective()}</div><section class="help-current"><h2>当前可以核对的问题</h2><ul class="list">${D.nodes.filter(n=>!state.solved[n.id]&&n.deps.every(q=>state.solved[q])).map(n=>`<li>${nodeLink(n,n.title)} · 可在这处操作主动展开三级提示</li>`).join('')}</ul></section><div class="help-appendices"><section><h2>授权资料</h2><p>家庭卷使用玉枝给出的“蓝线袖口”；张岚附件使用领取函中的“ZL-0816”。需要返回授权来源时，资料页会保留入口。</p></section><section><h2>照片与存档</h2><p>拆检一次只看一张，按附件顺序推进；普通照片不自动全屏。原图查看有放大、缩小与复位，手机可在放大后滑动照片；键盘可以用加减键和方向键，Escape返回原入口。</p><p>刷新保留已经填写的记录和阅读位置。跨站第一次可开新标签，浏览器阻止则在当前页继续；阅读设置可以关闭新标签。请通过启动游戏.bat打开，或部署完整web目录，以便所有页面共用同一存档。</p>${link('strategy','独立攻略（默认折叠答案）')}</section></div>`;}
function strategy(){return `<header class="strategy-title"><span>按需展开 / 含剧透</span><h1>独立攻略</h1></header><nav class="strategy-jump" aria-label="问题索引">${D.nodes.map(n=>`<a href="#answer-${n.id}">${n.id}</a>`).join('')}</nav><p>按问题展开，仅打开需要的部分。下方结局说明另行折叠；使用提示不影响成就。</p>${D.nodes.map(n=>`<details id="answer-${n.id}"><summary>${n.id}. ${E(n.title)}</summary><p>${nodeLink(n,'回到这处操作')}</p><ol>${n.fields.map(f=>`<li>${E(f.label)}：${E(f.answer)}</li>`).join('')}</ol><p>${E(n.result)}</p>${n.id===11?'<p>通过材料核对后，还需分别送出袁、陈的身体位置，等本人反馈，再前往最后一组。</p>':''}</details>`).join('')}<details><summary>三项生活调查</summary><p>押金退还200元，老胡仍欠20元；雨衣A、棉袄B、窗帘C；相册按拍摄日期A、B、C。</p></details><details><summary>最后的正式决定与结局操作（剧透）</summary><p>主结局选择取回身体，确认自己归还，再撤宋、林、母亲三份床首纸签，最后真正醒来，阅读清晨、回信与早餐。母亲寄留结束。另一选择让母亲代自己离开，自己留在B-0306，进入同住。结局页可回退选择，调查不用重做。</p></details>`;}
function author(){return `<header class="author-closing"><span>abc / 写在最后</span><h1>谢谢你陪知遥走到这里</h1></header><article class="article"><p>谢谢你陪知遥查完这些床、照片和没有写完的记录。她终于知道母亲来过，也知道有人为那次来访等了很久，这些事不能互相抵消；若你愿意，可以回去看看衣铺和街坊的生活留言，那里还有几件母亲没有做完的小事，不是为了留下她，只是让她被记得更完整一些。</p><p>abc · 原创故事与网页作品。照片是为虚构事件制作的图像，文字记录以可读排版生成，不来自真实患者或案件。</p></article><section class="author-readings"><h2>已经留下的阅读记录</h2><ul class="list">${C.achievements.map(([name,fn],i)=>{const yes=fn(state);return `<li>${yes?E(name):i===4||i===11?'未完成的生活调查':'尚未显示的记录'}<small>${yes?'已达成 · '+new Date(state.achievementDates[i]).toLocaleDateString('zh-CN'):'具体真相条件暂不显示'}</small></li>`;}).join('')}</ul></section><div class="actions">${link('p15','回街坊账目')}${link('p26','回衣铺照片')}${link('strategy','完整攻略')}<button type="button" data-rewind>返回正式决定之前</button></div><details><summary>参考与创作说明</summary><p>阅读组织参考《逾洲往事》，人物关系与迟来的理解参考鲁迅《故乡》《风筝》的事件组织，伪装的可见行动参考《画皮》。人物、机制、文案与素材另行原创。主线不需要阅读外部资料。</p><p><a href="https://miyeji.cn/games/yu-zhou-wang-shi" target="_blank" rel="noopener noreferrer">《逾洲往事》介绍</a></p></details>`;}
function settings(){return `<header class="settings-title"><span>当前浏览器 / 本作品</span><h1>阅读设置与存档</h1></header><section class="settings-preferences"><p>偏好只保存在当前浏览器。作品不读取真实身份、联系人或摄像头。</p>${[['static','静态效果模式'],['newtabs','跨站在新标签页打开']].map(([k,l])=>`<p><label><input type="checkbox" data-pref="${k}" ${state.prefs[k]?'checked':''}> ${l}</label></p>`).join('')}<p>系统减少动画偏好同样有效。作品的资料不会因效果模式改变，提示与辅助描述均不影响成就。</p></section><section class="settings-backup"><h2>进度备份</h2><div class="actions"><button type="button" id="export-save">导出存档JSON</button><label>导入本作品存档 <input type="file" id="import-save" accept=".json,application/json"></label></div><p id="save-feedback" role="status"></p></section><section class="settings-reset"><h2>清除进度</h2><p>清除会移去本次答案、已读出处、个人备注与结局记录，其他作品的存档不会受影响。请先导出备份。</p><form id="reset-form"><label>输入“清除进度”再确认 <input name="confirm" autocomplete="off" required></label><button type="submit">清除本作品进度</button></form><p id="reset-feedback" role="status"></p></section>`;}
function searchPage(){const query=new URLSearchParams(location.search).get('q')||'',results=C.search(D.pages,query,state.read,state.access,state);return `<header class="search-title"><span>已出现的出处 / 全文检索</span><h1>查找已出现的材料</h1></header><form class="searchbox" action="${ROOT}search.html"><label class="sr-only" for="search-input">人名、旧地名或物件号</label><input id="search-input" name="q" value="${E(query)}" placeholder="人名、旧地名、床台号"><button type="submit">搜索</button></form><p>支持袁老师、床箱、三一二等已出现称呼。范围为公开资料、已授权附件与已经经历的联系；尚未领取的私人全文不会进入搜索结果。</p>${query&&results.length?`<ul class="list">${results.map(x=>`<li>${link(x.id,sites[x.site][0]+' · '+x.title)}<small>${E(x.date)}</small></li>`).join('')}</ul>`:query?'<p>没有匹配。可查袁志强、陈慧、梁秀琴、张岚、河沿路、B-0312、床台。也可以先从各站公开目录进入。</p>':'<p>先输入已经看到的人名或编号，不需要猜作者的唯一词语。</p>'}${link('help','返回当前调查问题')}`;}
function readingTools(){
 return `<details class="reader-tools"><summary>阅读工具</summary><nav>${link('entry','开始')} ${link('notes','便笺')} ${link('search','查找')} ${link('help','帮助')} <button type="button" data-motion-toggle aria-pressed="${state.prefs.static}">${state.prefs.static?'已静止':'暂停动态'}</button> ${link('settings','设置')}</nav></details>`;
}
function siteMenu(site){
 const entries={hotel:[['p01','宾馆首页'],['p02','客房'],['p03','住客留言'],['p04','维修记录'],['p06','采购留档'],['p07','迁址说明']],forum:[['p09','全部主题'],['p10','住客求助'],['p12','家人补记'],['p14','睡眠自述'],['p15','小店往来']],paper:[['p16','历史版'],['p17','转移报道'],['p18','名单补充'],['p19','临时住宿'],['p20','搬迁报道']],store:[['p21','保管目录'],['p22','B-0312'],['p23','B-0306 / B-0211'],['p24','2012年附页'],['p39','后来的记事'],['p40','配对账'],['p41','2016年旁页']],album:[['p25','四卷底片'],['p26','衣铺'],['p27','旧街'],['p28','家信'],['p30','学校门口']],hospital:[['p31','资料服务'],['p32','领取函'],['p33','护理记录'],['p34','公开自述']],message:[['p29','张岚 / 来信'],['p35','今早的联系'],['p36','沈梁 / 房务照片'],['p42','袁与陈 / 家庭补件'],['p46','给张岚的回信']]};
 const contacts=site==='message'?[5,6,7,10].filter(q=>state.solved[q]||isCompose()&&p.q===q).map(q=>{const n=D.nodes[q-1],who={5:'玉枝',6:'张岚 / 学校门口',7:'张岚 / 三个晚上',10:'沈梁 / 搬床安排'}[q];return `<a href="${E(ROOT+byId[n.page].path+'?compose='+q)}" class="${isCompose()&&p.q===q?'current':''}">${E(who)} / 回信</a>`;}):[];
 return (entries[site]||[]).filter(([id])=>offered(byId[id])).map(([id,label])=>link(id,label,id===P?'current':'')).join('')+contacts.join('');
}
function legacyTop(site){
 const tools=readingTools();
 if(P==='entry')return `<header class="mail-app-head"><strong>知遥的来信</strong><span>收件箱</span><span>10月9日 / 回水</span></header>${tools}`;
 if(site==='scene')return tools;
 if(site==='hotel'){
  if(['p04','p05','p06','p07'].includes(P))return `<header class="inn-record-head"><strong>回水宾馆 / 房务留档</strong><span>原件编号、日期与补记分别保留</span>${link('p01','营业首页')}</header><nav class="inn-record-nav" aria-label="房务文件">${siteMenu(site)}${link('p05','拆检附件')}</nav>${tools}`;
  return `<header class="inn-head"><div class="inn-wordmark">${link('p01','回水宾馆')}<small>老客请认新址：新桥路28号</small></div><div class="inn-service"><b>干净铺盖 · 价格实在</b><br>单床128元起 / 三楼无电梯</div></header><nav class="inn-nav" aria-label="宾馆栏目">${siteMenu(site)}</nav><div class="inn-bulletin"><b>营业通知</b><span>312暂停接单，换房与维修请找前台；旧址河沿路17号。</span></div>${tools}`;
 }
 if(site==='forum')return `<div class="bbs-userbar">回水生活 / 旧帖留存　<span>当前阅读：许知遥</span></div><header class="bbs-head">${link('p09','回水生活')}<span>搬到新街，老帖还在。</span><small>街坊、店铺与住客</small></header><nav class="bbs-nav" aria-label="论坛版块">${siteMenu(site)}</nav>${tools}`;
 if(site==='paper')return `<div class="press-utility">地方新闻 / 历史原刊 / 更正留存</div><header class="press-head"><span>回水镇<br>地方版</span>${link('p16','回水周报')}<span>刊印日期<br>以原件为准</span></header><nav class="press-nav" aria-label="历史版面">${siteMenu(site)}</nav>${tools}`;
 if(site==='store')return `<header class="registry-head"><strong>${link('p21','镇西旧物保管点')}</strong><span>接收册　签领册　返库册</span><small>旧号沿用 / 原件留存</small></header>${tools}`;
 if(site==='album')return `<header class="album-head"><div>${link('p25','许家的相册')}<span>陈玉枝 / 分享给知遥</span></div><nav aria-label="相册卷目">${siteMenu(site)}</nav></header>${tools}`;
 if(site==='hospital')return `<div class="clinic-utility">回水市医院 / 历史资料服务</div><header class="clinic-head">${link('p31','回水市医院')}<span>本人授权 · 资料复制 · 护理留存</span></header><nav class="clinic-topnav" aria-label="医院资料服务">${siteMenu(site)}</nav>${tools}`;
 if(site==='message')return `<header class="inbox-head"><span>许知遥</span><strong>${isCompose()?'发件箱':'来信与联系'}</strong><small>私人往来 / 附件留存</small></header>${tools}`;
 return `<header class="book-head">${link('entry','梦演（魇）时分')}<span>abc / 阅读与回看</span></header>${tools}`;
}

function top(site){
 const tools=readingTools();if(site==='scene'||P==='entry')return legacyTop(site);
 if(!p){const home=link('entry','梦演（魇）时分');return ({
 notes:`<header class="source-mast notes-source"><b>许知遥</b><div>${home}<small>便笺 / 原件出处与自己的话</small></div></header>`,
 help:`<header class="source-mast manual-source"><div>${home}</div><span>阅读、返回、授权与存档</span></header>`,
 strategy:`<header class="source-mast guide-source"><b>攻略 / 含剧透</b>${home}<span>按问题展开</span></header>`,
 settings:`<header class="source-mast settings-source">${home}<span>本作品设置</span>${link('notes','回便笺')}</header>`,
 search:`<header class="source-mast search-source"><span>材料检索</span>${home}<small>已出现的全文与出处</small></header>`,
 author:`<header class="source-mast closing-source"><span>abc / 回信</span>${home}</header>`
 }[P]||legacyTop(site))+tools;}

 const brand=link(sites[site][2],sites[site][0]);
 const title=E(D.design[P].sourceLabel),date=E(p.record||p.date);
 const nav=`<nav class="source-navigation nav-${P}" aria-label="${E(sites[site][0])}目录">${siteMenu(site)}${P==='p04'||P==='p05'?link('p05','拆检附件'):''}</nav>`;
 const mark=`<span class="source-document-label">${title}</span>`;
 const line=`<span class="source-date">${date}</span>`;
 const all={
 p01:`${legacyTop(site)}`,
 p02:`<header class="source-mast room-source"><div>${brand}<small>客房照片与房务项目</small></div><b>三楼 / 无电梯</b>${mark}</header>${nav}${tools}`,
 p03:`<header class="source-mast guest-source">${brand}<div>${mark}<small>前台留存 / 按原留言日期查看</small></div></header>${tools}${nav}`,
 p04:`<header class="source-mast work-source"><strong>W-1008</strong><div>${brand}${mark}</div><span>接单人 / 周师傅</span></header>${nav}${tools}`,
 p05:`<header class="source-mast viewer-source">${brand}<strong>W-1008 / 影像附件</strong>${mark}</header>${tools}${nav}`,
 p06:`<header class="source-mast purchase-source"><div>${brand}${mark}</div><strong>采购票 / 移交票</strong><small>两份原件，分别留档</small></header>${nav}${tools}`,
 p07:`<header class="source-mast address-source">${mark}<div>${brand}<span>河沿路17号 → 新桥路28号</span></div></header>${tools}${nav}`,
 p08:`<header class="source-mast statement-source">${brand}<strong>前台公开回复</strong>${line}</header>${nav}${tools}`,
 p09:`${legacyTop(site)}`,
 p10:`<header class="source-mast yuan-source"><div>${brand}<small>街坊求助 / 原帖和回复</small></div>${mark}</header>${nav}${tools}`,
 p11:`<header class="source-mast yuan-photo-source">${brand}<div><b>周敏另附</b>${mark}</div></header>${tools}${nav}`,
 p12:`<header class="source-mast chen-source"><div>${brand}${mark}</div><b>2019 → 2026</b></header>${nav}${tools}`,
 p13:`<header class="source-mast chen-photo-source">${mark}<div>${brand}<span>陈恪 / 家庭原照</span></div></header>${nav}${tools}`,
 p14:`<header class="source-mast sleep-source">${brand}<span>睡眠与个人自述</span>${mark}</header>${tools}${nav}`,
 p15:`<header class="source-mast shop-source"><b>街坊账目</b><div>${brand}${mark}</div><span>陈玉枝整理</span></header>${nav}${tools}`,
 p16:`${legacyTop(site)}`,
 p17:`<header class="source-mast flood-source"><span>地方版 / 原刊</span>${brand}${line}</header>${nav}${tools}`,
 p18:`<header class="source-mast correction-source">${brand}<strong>补刊</strong><div>${mark}${line}</div></header>${tools}${nav}`,
 p19:`<header class="source-mast register-source"><div>${brand}${mark}</div><strong>临时住宿登记</strong>${line}</header>${nav}${tools}`,
 p20:`<header class="source-mast moving-source">${mark}<div>${brand}<span>旧街 / 搬迁报道</span></div></header>${nav}${tools}`,
 p21:`<header class="source-mast custody-source">${brand}<strong>接收目录</strong><small>2014—2019 / 原号沿用</small></header>${tools}`,
 p22:`<header class="source-mast transfer-source"><b>B-0312</b><div>${brand}${mark}</div><span>签领附件</span></header>${tools}`,
 p23:`<header class="source-mast batch-source">${brand}<div><b>B-0306 / B-0211</b>${mark}</div></header>${tools}`,
 p24:`<header class="source-mast journal-source">${brand}<span>签领册夹页</span>${mark}</header>${tools}`,
 p25:`<header class="source-mast film-source"><div>${brand}${mark}</div><span>陈玉枝 → 许知遥</span></header>${tools}${nav}`,
 p26:`<header class="source-mast tailoring-source">${brand}<b>衣铺 / 卷一</b><span>照片与修补记录</span></header>${nav}${tools}`,
 p27:`<header class="source-mast street-source"><div>${brand}<small>河沿路 / 2009</small></div>${mark}</header>${tools}${nav}`,
 p28:`<header class="source-mast family-letter-source">${mark}<div>${brand}<span>家信留存</span></div></header>${nav}${tools}`,
 p29:`<header class="source-mast incoming-source"><b>张岚 → 许知遥</b>${brand}${mark}</header>${tools}`,
 p30:`<header class="source-mast school-source"><div>${brand}${mark}</div><strong>2012 / 08 / 13</strong></header>${tools}${nav}`,
 p31:`${legacyTop(site)}`,
 p32:`<header class="source-mast authorization-source">${brand}<div><strong>资料复制 / 领取函</strong>${mark}</div></header>${tools}${nav}`,
 p33:`<header class="source-mast nursing-source"><span>历史资料复制</span>${brand}<b>护理记录 / 本人补述</b></header>${nav}${tools}`,
 p34:`<header class="source-mast comparison-source"><div>${brand}${mark}</div><strong>家属公开记录 / 附列</strong></header>${tools}${nav}`,
 p35:`<header class="source-mast morning-phone-source"><span>许知遥</span><b>今早的联系</b>${line}</header>${tools}`,
 p36:`<header class="source-mast phone-photo-source"><div><b>沈梁 → 许知遥</b>${mark}</div><span>06:06 / 补记06:10</span></header>${tools}`,
 p39:`<header class="source-mast confession-source">${brand}<span>沈万海 / 私人记事</span>${mark}</header>${tools}`,
 p40:`<header class="source-mast ledger-source"><strong>借用 / 归还</strong><div>${brand}${mark}</div></header>${tools}`,
 p41:`<header class="source-mast failure-source">${brand}<span>2016年旁页</span>${mark}</header>${tools}`,
 p42:`<header class="source-mast dispatch-source"><b>许知遥 / 发件材料</b><div>${mark}<span>袁家与陈家分别接收</span></div></header>${tools}`,
 p46:`<header class="source-mast outgoing-source"><div><b>许知遥 → 张岚</b>${mark}</div><span>07:02 / 已发送</span></header>${tools}`
 };
 if(isCompose())return `<header class="source-mast reply-source reply-source-${p.q}"><div><b>许知遥的回信</b><span>${{5:'陈玉枝 / 名单补刊',6:'张岚 / 学校门口',7:'张岚 / 护理附件',10:'沈梁 / 搬床安排'}[p.q]}</span></div>${link(P,'返回引用原件')}</header>${tools}`;
 return all[P]||legacyTop(site);
}

function footer(site){
 const text={hotel:'回水宾馆 · 新桥路28号',forum:'回水生活 · 原帖与回复分别留存',paper:'回水周报 · 历史版资料室',store:'镇西保管点 · 原件留存',album:'陈玉枝分享的家庭底片',hospital:'资料服务 · 本人授权范围',message:'许知遥的私人联系',scene:'梦演（魇）时分'}[site]||'abc · 梦演（魇）时分';
 return `<footer class="native-footer footer-${site}"><span>${E(text)}</span>${link('help','阅读帮助')}${saveWarning?'<p role="status">当前浏览器未能持久保存进度，请离开前导出备份。</p><button type="button" id="export-session">导出当前进度</button><p id="session-feedback" role="status"></p>':''}</footer>`;
}
function photoHtml(id){
 const a=D.images[id];if(!a)return '<p>原图记录缺失，请回来源页。</p>';
 return `<figure data-image="${id}"><button type="button" class="photo-open" data-zoom="${id}" aria-label="查看原图：${E(a.source)}"><img src="${ROOT}assets/${id}.${a.ext}?v=20261011v8" alt="${E(a.alt)}" width="${a.width}" height="${a.height}" ${a.critical?'fetchpriority="high"':'loading="lazy"'} decoding="async"></button><div class="image-error" hidden><p>图片未能加载，可重试或阅读相同范围的说明。</p><button type="button" data-retry="${id}">重试</button><p>${E(a.alt)}</p></div><figcaption>${E(a.caption)}<small>${E(a.source)} · ${E(a.date)}</small></figcaption><details class="visual-description"><summary>照片文字与说明</summary><p>${E(a.alt)}</p>${a.transcript&&a.transcript!==a.alt?`<p>${E(a.transcript)}</p>`:''}</details></figure>`;
}
function pics(page){
 if(!page.images.length)return '';
 if(page.id==='p05'){const ix=Math.min(state.pictures.p05||0,page.images.length-1);return `<div class="inspection" id="pictures"><nav class="attachment-turn" aria-label="拆检附件顺序"><span>W-1008 / ${ix+1} / ${page.images.length}</span>${ix>0?'<button type="button" data-pic-step="-1">上一张</button>':''}${ix<page.images.length-1?'<button type="button" data-pic-step="1">下一张附件</button>':''}</nav>${photoHtml(page.images[ix])}<p class="attachment-return">${link('p04','回周师傅的原记录')} · ${link('p06','查这件床台的来源')}</p></div>`;}
 return `<div class="originals originals-${page.images.length}">${page.images.map(photoHtml).join('')}</div>`;
}
function related(page){
 const ids=page.links.filter(id=>offered(byId[id]));if(!ids.length)return '';
 const label={hotel:'留档出处',forum:'帖内引用',paper:'原刊互见',store:'簿内索引',album:'玉枝另附',hospital:'原记录与附件',message:'引用的材料',scene:'仍可打开的联系'}[page.site];
 return `<nav class="source-citations citations-${page.site}" aria-label="${label}"><span>${label}：</span>${ids.map(id=>link(id,(byId[id].site!==page.site?sites[byId[id].site][0]+' / ':'')+byId[id].title)).join('<span class="citation-separator">；</span>')}</nav>`;
}
function memoryHtml(page){
 if(!page.memory?.length)return '';
 return `<aside class="reader-pencil pencil-${page.site}" aria-label="知遥读到这里时的备注"><span>知遥的备注</span>${page.memory.map(t=>`<p class="personal-line">${E(t)}</p>`).join('')}</aside>`;
}

function fieldHtml(n,field,i,mode){
 const key=`q${n.id}_${i}`,saved=state.drafts[key]||'',norm=s=>String(s).normalize('NFKC').replace(/\s+/g,''),draft=field.options.find(v=>norm(v)===norm(saved))||saved;
 const old=draft&&!field.options.includes(draft)?`<p class="old-draft">原草稿：${E(draft)}。请在下方选取对应材料；这段原话仍保留到你重新选择为止。</p>`:'';
 return `<fieldset class="record-field" data-field="${i}"><legend>${E(field.label)}</legend>${old}${field.options.map((v,j)=>`<label class="source-option" for="${key}_${j}"><input id="${key}_${j}" type="radio" name="f${i}" value="${E(v)}" data-draft="${key}" ${draft===v?'checked':''} ${j===0?'required':''}><span>${E(v)}</span></label>`).join('')}</fieldset>`;
}
function replyText(id){
 return {1:'我查的是木制床台，不是新换的床垫。采购票写的是床垫和铺盖；旧物票里的B-0312在2014年转来，现在仍放在312。两张票的编号和房号对应都附上了，请别再用换过铺盖回答这件事。',2:'周师傅，我查到的是当前312的B-0312。床脚缺角、长侧板卸下的位置和右边的柜子都能对上，2014年的尺寸和维修记录也一致。我把旧物票留着，原单请别改成紧螺丝结单。',3:'周敏，我把你记下的几句话同旧资料对过了。志强教书十多年，没有驾驶证；他说的货运经历和旧货站31号，都不属于他过去的生活。变化是在9月20日至22日住店以后出现的。我把原话和日期附在这里，先别把它们改成别人猜的说法。',4:'陈恪，两家日期我分开记了：袁老师是今年9月20日住店、22日回来；你母亲是2019年6月11日去、13日回家，15日说起陌生的护理用语。相隔这些年，不能只凭照片说是一回事，但货运和护理经历都有旧资料可以继续查。',5:'玉枝阿姨，补充名单里，我和你已经撤离、登车，宋大勇和林素秋后来确认遇难。母亲那一栏没有遗体核验，当时仍是失联。我不把这几个名字算成同一种结果；你留下的相册，我还想接着看。',6:'张岚，学校门口那张照片里的身体是你23岁时的身体，相机也是你的。8月13日是另一位家长代拍。背面的“遥遥”、蓝线袖口和柜子细节，同母亲的原信对应。我想问清那次来访，也想知道你后来怎么样了。',7:'张岚，我把时间记清了：12日开始借用，13日到学校，15日夜回位后归还。你的自述和沈万海另记的日期能够互相对照。身体重新对应以后，仍可能留在梦中；真正醒来还要确认手能不能按自己的意思动。我会把你等过的三个晚上一起留下。',10:'沈梁，先别搬原床位，也别拆床首的签。张岚2012年的归还、2013年撤签和2016年那张旁页，写的顺序不是你刚才说的那样。先让活着的人取回自己的身体，再解除死者的寄留联系；两件事不能颠倒。'}[id]||'';
}
function nodeHtml(id){
 const n=D.nodes.find(x=>x.id===id);if(!n)return '';const done=state.solved[id],mode=[1,2].includes(id)?'ticket':[3,4].includes(id)?'reply':id===9?'ledger':id===11?'dispatch':[8,12].includes(id)?'note':'letter';
 const headings={1:'给前台的补件',2:'在W-1008上补一条留言',3:'回复周敏',4:'回复陈恪',5:'给玉枝回信',6:'写给张岚',7:'回复张岚的三个晚上',8:'把这几件事记下来',9:'账边的补核栏',10:'回复搬床安排',11:'分别附给袁与陈',12:'最后再认一次自己的位置'};
 const receipt={1:'前台 / 补件留存',2:'周师傅 / 留言已送达',3:'许知遥 / 站内回复',4:'许知遥 / 站内回复',5:'许知遥 → 陈玉枝',6:'许知遥 → 张岚',7:'许知遥 → 张岚',8:'知遥留在手机上的话',9:'补核记录 / 不改原簿',10:'许知遥 → 沈梁',11:'发送前的两份材料',12:'知遥 / B-0306与306'};
 const doneBody=`${replyText(id)?`<p class="posted-reply">${E(replyText(id))}</p>`:''}<p class="completed">${E(n.result)}</p>${link(n.go,byId[n.go].title)}`;
 const fields=n.fields.map((f,i)=>fieldHtml(n,f,i,mode));
 const fieldBody=id===9?`<div class="ledger-inputs">${fields.map((field,i)=>`<div class="ledger-check-line"><span>${i<3?['B-0312','B-0211','B-0306'][i]:'依据 '+(i-2)}</span>${field}</div>`).join('')}</div>`:id===11?`<section class="dispatch-yuan"><h3>袁志强 / 镇西家中</h3>${fields.slice(0,2).join('')}</section><section class="dispatch-chen"><h3>陈慧 / 镇南家中</h3>${fields.slice(2,4).join('')}</section><div class="dispatch-owner">${fields[4]}</div>`:fields.join('');
 const form=`<form data-node-form="${id}" class="record-form form-${mode}">${fieldBody}${mode==='letter'||mode==='reply'?`<label class="personal-remark" for="reply-note-${id}">另外想说的话（自行保存，不参与核对）<textarea id="reply-note-${id}" data-note="reply${id}" rows="3" maxlength="5000">${E(state.notes['reply'+id]||'')}</textarea></label>`:''}<button class="send-record" type="submit">${E(n.submit||'确认')}</button></form>`;
 const hint=`<details class="hint"><summary>需要一点提示</summary><button type="button" data-hint="${id}" ${(state.hints[id]||0)>=3?'disabled':''}>${(state.hints[id]||0)>=3?'提示已全部展开':'下一层提示'}</button><div data-hint-content="${id}">${n.hints.slice(0,state.hints[id]||0).map((h,i)=>`<p>${i+1}. ${E(h)}</p>`).join('')}</div></details>`;
 const inside=`<h2 tabindex="-1">${E(headings[id])}</h2>${done?`<div class="sent-record"><span>${E(receipt[id])}</span>${doneBody}${state.notes['reply'+id]?`<p class="personal-remark-copy">${E(state.notes['reply'+id])}</p>`:''}</div>`:`<p class="record-intent">${E(n.context||'')}</p>${form}`}<p class="feedback" data-feedback="${id}" role="status" aria-live="polite"></p>${hint}`;
 if(mode==='reply')return `<div class="forum-floor reply-floor" data-node="${id}"><header><strong>许知遥</strong><small>${done?'刚刚回复':'站内回复'}</small></header><div class="floor-copy">${inside}</div></div>`;
 return `<div class="native-operation ${mode}-operation" data-node="${id}" data-operation="${mode}">${inside}</div>`;
}
function composeLink(page){
 if(!page.q)return '';const names={5:'给玉枝回信',6:'问张岚那天的来访',7:'回张岚：我看完了记录',10:'回复沈梁的搬床安排'};
 return `<p class="write-contact"><a href="${E(ROOT+page.path+'?compose='+page.q)}">${E(state.solved[page.q]?'查看已经发出的回信':names[page.q])} →</a></p>`;
}
function composePage(page){
 const who={5:'陈玉枝',6:'张岚',7:'张岚',10:'沈梁'}[page.q],subjects={5:'当年的名单',6:'学校门口那一天',7:'三个晚上与恢复',10:'现在先别搬床'};
 const cite={5:'名单上的几种结果分开写给玉枝。',6:'身体、拍摄者和来访文字分别对应原件。',7:'入睡、来访和归还各记原来的日期。',10:'先保留原床位，再确认活体与归还顺序。'};
 return `<div class="correspondence-sheet correspondence-${page.q}"><header class="letter-address"><p>许知遥 → ${who}</p><h1 tabindex="-1">${state.solved[page.q]?'已发送的回信':subjects[page.q]}</h1><a href="${E(ROOT+page.path)}">返回引用的原件：${E(page.title)}</a></header><p class="reply-cite">${cite[page.q]}</p>${nodeHtml(page.q)}</div>`;
}
function documentTitle(page){
 return `<header class="record-title"><p>${E(page.byline)} · ${E(page.record||page.date)}</p><h1 tabindex="-1">${E(page.title)}</h1>${page.record?`<time>${E(page.date)}</time>`:''}</header>`;
}
function renderArticle(page){
 const id=page.id,b=para(page.body),m=memoryHtml(page),refs=related(page),extras=optionalHtml(page),head=documentTitle(page),photos=pics(page),op=page.q?nodeHtml(page.q):'';
 if(page.site==='hotel'){
  if(id==='p01')return `<div class="inn-quick-directory"><strong>欢迎来回水住一晚</strong>${link('p02','房间 / 价格')}${link('p03','住客留言')}${link('p04','维修留档')}</div><div class="inn-front"><div class="inn-front-photo">${photoHtml('facade')}</div><div class="inn-booking"><p>回水镇 / 新桥路28号</p><h1 tabindex="-1">回水宾馆<br><small>新桥边，老地方搬来的店</small></h1><p class="inn-price">128<small>元 / 晚起</small></p><p>单床房 · 三楼无电梯<br>14时后入住 / 12时前退房</p>${link('p02','查看实际客房')}</div></div><div class="inn-arrival"><header><h2>到店说明</h2><span>从桥口往前走两个铺面</span></header>${b}</div><div class="inn-stairs">${photoHtml('stairs')}<div>${m}${refs}</div></div>`;
  if(id==='p02')return `<header class="room-number"><span>房务相册 / 三楼</span><h1 tabindex="-1">房间、窗向与旧家具</h1><b>306正在使用　/　312暂停预订</b></header><div class="room-tour">${photoHtml('room306')}<div>${para(page.body.slice(0,2))}${usefulTables(page)}</div></div><div class="room-walk"><div>${photoHtml('room312')}${para(page.body.slice(2))}</div><div>${photoHtml('cabinet')}${m}</div></div><div class="room-checkin">${photoHtml('window')}${photoHtml('zhiyao')}</div>${refs}`;
  if(id==='p03')return `<div class="guestbook-title">${head}<p>前台回复与客人补记按提交时间留存</p></div><div class="service-correspondence">${threadHtml({...page,images:[]})}</div><div class="guestbook-tail">${photoHtml('hall')}${m}${refs}</div>`;
  if(id==='p04')return `<div class="work-sheet">${head}<dl class="work-fields"><dt>房间</dt><dd>当前312</dd><dt>维修单</dt><dd>W-1008</dd><dt>接单人</dt><dd>周师傅</dd><dt>处理</dt><dd>内部情况待现场核实</dd><dt>影像附件</dt><dd>${link('p05','按拍摄顺序查看四张原照')}</dd></dl><div class="work-writing">${b}${op}</div></div>${refs}`;
  if(id==='p05')return `<div class="inspection-reading">${head}${b}${photos}</div>${refs}`;
  if(id==='p06')return `<div class="purchase-comparison">${head}<div class="purchase-pair"><div class="purchase-new"><h2>2023 / 床垫与铺盖</h2>${photoHtml('receipt')}${para(page.body.slice(0,1))}</div><div class="purchase-old"><h2>2014 / 木件移交</h2>${photoHtml('transfer')}${para(page.body.slice(1,2))}</div></div><div class="purchase-explanation">${para(page.body.slice(2))}</div>${op}</div>${refs}`;
  if(id==='p07')return `<div class="address-route-sheet">${head}<div class="address-line"><span>河沿路17号 / 旧址</span><span>2014年迁往</span><strong>新桥路28号</strong></div>${usefulTables(page)}<div class="address-notes">${b}${extras}</div>${refs}</div>`;
  return `<div class="public-notice">${head}${b}<p class="notice-signature">回水宾馆</p></div>${m}${refs}`;
 }
 if(page.site==='forum'){
  if(id==='p09')return `<header class="bbs-board-title"><h1 tabindex="-1">街坊与住客</h1><span>原帖日期 / 补记另列</span></header><div class="bbs-intro">${b}<div class="bbs-counts"><span>住客求助 / 家人补记</span><span>旧帖日期保留，补记另列</span></div></div><div class="topic-table"><div class="topic-table-label"><span>主题</span><span>留存日期</span></div><ul>${indexRows('forum')}</ul></div>${extras}${refs}`;
  if(id==='p13')return `<header class="chen-prints-heading"><p>${link('p12','回陈恪的旧帖')}</p><h1 tabindex="-1">${E(page.title)}</h1></header><div class="chen-photo-register">${page.images.map((img,i)=>`<section class="chen-print-${i}"><div class="chen-print-date"><b>${i?'回来以后':'离家以前'}</b><span>陈恪 / 原照补附</span></div><div>${photoHtml(img)}</div><p>${E(page.body[i])}</p></section>`).join('')}</div>${m}${refs}`;
  if(id==='p11')return `<header class="attachment-heading"><p>${link(id==='p11'?'p10':'p12','回家属原帖')}</p><h1 tabindex="-1">${E(page.title)}</h1></header><div class="family-before-after photo-thread-attachments">${page.images.map((img,i)=>`<div><span>${i?'回家以后':'离家以前'}</span>${photoHtml(img)}${para(page.body.slice(i,i+1))}</div>`).join('')}</div>${m}${refs}`;
  if(id==='p12')return `<header class="family-thread-heading"><span>陈恪的旧帖 / 2019—2026</span><h1 tabindex="-1">${E(page.title)}</h1></header><ol class="family-thread-line">${page.thread.map(post=>`<li><header><strong>${E(post.who)}</strong><small>${E(post.time)}</small></header><p>${E(post.text)}</p></li>`).join('')}</ol>${op}${extras}${m}${refs}`;
  if(id==='p14')return `<header class="night-thread-heading"><span>睡眠与个人自述 / 保留原话</span><h1 tabindex="-1">${E(page.title)}</h1></header><article class="night-testimony">${page.thread.map((post,i)=>`<section class="${i?'night-response':'night-original'}"><header><strong>${E(post.who)}</strong><time>${E(post.time)}</time></header><p>${E(post.text)}</p></section>`).join('')}</article>${extras}${m}${refs}`;
  if(id==='p15')return `<header class="shop-thread-heading"><span>街坊往来 / 陈玉枝整理</span><h1 tabindex="-1">${E(page.title)}</h1></header><div class="shop-ledger-post">${page.thread.map((post,i)=>`<section><header><b>${String(i+1).padStart(2,'0')}</b><strong>${E(post.who)}</strong><small>${E(post.time)}</small></header><p>${E(post.text)}</p></section>`).join('')}</div>${extras}${m}${refs}`;
  return `<header class="topic-title"><p>回水生活 / 原帖留存</p><h1 tabindex="-1">${E(page.title)}</h1></header>${threadHtml(page)}${op}${extras}${m}${refs}`;
 }
 if(page.site==='paper'){
  if(id==='p16')return `<div class="press-directory"><header><span>原刊目录 / 地方版</span><h1 tabindex="-1">旧街报道</h1><p>2009年7月 — 2014年6月</p></header><div class="press-index-copy">${b}</div><ol class="edition-list">${indexRows('paper')}</ol></div>${extras}${refs}`;
  if(id==='p17')return `${head}<article class="press-report"><div class="lead-report">${para(page.body.slice(0,2))}${photoHtml(page.images[0])}</div><div>${para(page.body.slice(2))}${photoHtml(page.images[1])}</div></article>${extras}${refs}`;
  if(id==='p18')return `<div class="correction-ribbon">名单补刊 / 保留原统计口径</div>${head}<div class="press-correction"><div>${b}${composeLink(page)}</div>${photos}</div>${extras}${refs}`;
  if(id==='p19')return `<div class="register-title-strip">避难点临时住宿登记 / 原刊附表</div>${head}${usefulTables(page)}<div class="register-footnotes">${b}</div>${refs}`;
  return `${head}<article class="moving-feature"><div>${photoHtml(page.images[0])}${para(page.body.slice(0,2))}</div><div>${para(page.body.slice(2))}${photoHtml(page.images[1])}</div></article>${extras}${refs}`;
 }
 if(page.site==='store'){
  if(id==='p21')return `<div class="registry-control"><span>接收册 / 公开目录</span><strong>2014—2019</strong></div>${head}<div class="registry-introduction">${b}</div>${usefulTables(page)}<h2 class="register-tab">编号与附件</h2><ul class="registry-catalogue">${indexRows('store')}</ul>${extras}${refs}`;
  if(id==='p22'||id==='p23')return `${head}<div class="object-number-band"><strong>${id==='p22'?'B-0312':'B-0306 / B-0211'}</strong><span>接收、签领、返库 / 原编号</span></div><div class="object-flow"><div class="object-original">${photos}</div><div class="object-history">${b}</div></div>${supplementHtml(page)}${extras}${refs}`;
  if(id==='p24')return `<div class="journal-reading"><span class="journal-date">2012 / 08　　2013 / 附记</span>${head}<article>${b}</article><p class="journal-sign">沈万海 / 签领册夹页</p>${refs}</div>`;
  if(id==='p39')return `<div class="signed-confession">${head}<article>${b}</article><p class="confession-signature">沈万海</p>${m}${refs}</div>`;
  if(id==='p40')return `${head}<div class="ledger-view">${photos}</div>${usefulTables(page)}<div class="ledger-written">${b}${m}${op}</div>${refs}`;
  return `${head}<div class="failure-reading">${photos}<div>${b}${m}${composeLink(page)}</div></div>${refs}`;
 }
 if(page.site==='album'){
  if(id==='p25')return `<div class="album-directory"><header><p>玉枝的冲印袋 / 只分享给知遥</p><h1 tabindex="-1">许家的几卷底片</h1><span>2008 · 2009 · 后来补洗</span></header><div class="album-envelope-copy">${b}</div><ol class="film-list">${indexRows('album')}</ol><div class="album-envelope-tail">${extras}</div></div>${refs}`;
  if(id==='p26')return `<header class="album-roll-title"><span>卷一 / 衣铺</span><h1 tabindex="-1">没有剪掉的线头</h1></header><div class="cloth-album"><div class="shop-life"><p class="roll-mark">01 / 母亲和衣铺</p>${photoHtml('family')}${para(page.body.slice(0,1))}${photoHtml('shop')}${para(page.body.slice(2))}</div><div class="cloth-detail"><p class="roll-mark">背面 / 衣服与修补</p>${photoHtml('raincoat')}${para(page.body.slice(1,2))}${photoHtml('patch')}${m}${extras}</div></div>${refs}`;
  if(id==='p27')return `<header class="album-roll-title"><h1 tabindex="-1">${E(page.title)}</h1></header><div class="old-street-print"><span class="roll-mark">2009 / 春天的河沿路</span>${photoHtml('street')}${para(page.body.slice(0,1))}</div><div class="cabinet-memory">${photoHtml('cabinet')}<div>${para(page.body.slice(1))}${extras}</div></div>${refs}`;
  if(id==='p28')return `<header class="album-roll-title"><h1 tabindex="-1">写给家里</h1><span>${E(page.date)}</span></header><div class="family-letter-reading"><div>${photos}</div><article class="family-letter-paper"><p>家里：</p>${b}<p class="letter-signature">秀琴</p>${m}${extras}</article></div>${refs}`;
  return `<header class="album-roll-title"><p>补洗卷 / 2012年8月13日</p><h1 tabindex="-1">学校门口</h1></header><div class="school-print">${photos}</div><div class="school-back-writing"><span class="roll-mark">相片背面与补洗日期</span>${b}${m}${composeLink(page)}</div>${refs}`;
 }
 if(page.site==='hospital'){
  if(id==='p31')return `<div class="clinic-service-heading"><span>患者服务 / 资料复制</span><h1 tabindex="-1">历史资料服务</h1><b>一层 · 资料服务窗口</b></div><div class="clinic-service-body"><div>${b}<dl class="clinic-directory"><dt>办理材料</dt><dd>${link('p32','本人签署的领取函')}</dd><dt>复制范围</dt><dd>护理观察、本人恢复自述</dd></dl></div>${photos}</div>${refs}`;
  if(id==='p32')return `<div class="authorization-letter"><p class="authorization-strip">历史资料复制 / 授权留存联</p><h1 tabindex="-1">领取函</h1><dl class="authorization-fields"><dt>授权人</dt><dd>张岚</dd><dt>收件人</dt><dd>许知遥</dd><dt>原记录日期</dt><dd>2012年8月16日</dd><dt>领取凭据</dt><dd><strong>ZL-0816</strong></dd></dl>${b}<p class="document-signature">本人补授权 / 2026年10月9日</p>${refs}</div>`;
  if(id==='p33')return `${head}<div class="nursing-original"><span class="clinical-file-label">2012年8月16日 / 护理原记录</span>${photos}</div><article class="patient-annex"><h2>护理观察与本人补记</h2>${b}${m}${composeLink(page)}</article>${refs}`;
  return `<div class="clinical-comparison-sheet">${head}<article class="clinical-annex"><div class="clinical-review-mark">本人自述 / 相近时间记录</div>${b}<dl class="case-dates"><dt>袁家</dt><dd>2026年9月20日至22日入住</dd><dt>陈家</dt><dd>2019年6月11日至13日入住，15日出现护理用语</dd></dl></article>${refs}</div>`;
 }
 if(page.site==='message'){
  if(id==='p35')return `<header class="conversation-heading"><h1 tabindex="-1">今早的联系</h1><p>${E(page.date)}</p></header><ol class="morning-log">${page.body.map((line,i)=>{const at=line.indexOf('：');return `<li class="${i===2?'own-message':''}"><span>${E(at<0?'':line.slice(0,at))}${at<0?'':'：'}</span><p>${E(at<0?line:line.slice(at+1))}</p></li>`;}).join('')}</ol><div class="unwritten-message">${m}${op}</div>${refs}`;
  if(id==='p36')return `<header class="conversation-heading"><p>沈梁 → 许知遥 / 06:06，补记06:10</p><h1 tabindex="-1">房务留档</h1></header><div class="phone-attachment"><div class="phone-photo-record">${photos}<span>06:06 / 房务发送</span></div><div class="phone-photo-caption">${b}${m}</div></div>${refs}`;
  if(id==='p42')return `<header class="conversation-heading"><p>06:12 / 家属补件</p><h1 tabindex="-1">袁与陈的联系</h1></header><div class="dispatch-docket"><span>家属提交 / 袁、陈分别核对</span><b>06:12</b></div><div class="recipient-materials">${page.images.map((img,i)=>`<div class="recipient-original"><h2>${i?'陈家 / 镇南':'袁家 / 镇西'}</h2>${photoHtml(img)}<p>${E(page.body[i])}</p></div>`).join('')}</div>${para(page.body.slice(2))}${op}${contactHtml()}${m}${refs}`;
  const out=id==='p46';return `<header class="letter-address"><p>${out?'许知遥 → 张岚 / 07:02，已发送':'张岚 → 许知遥 / 私人来信'}</p><h1 tabindex="-1">${E(page.title)}</h1></header><article class="message-letter">${para(out?page.body.slice(0,2):page.body)}</article>${out?`<div class="after-sending">${para(page.body.slice(2))}</div>`:`<div class="letter-enclosures">${photos}</div>${m}`}${refs}`;
 }
 if(page.site==='scene'){
  const title=`<header class="scene-time"><p>${E(page.date)}</p><h1 tabindex="-1">${E(page.title)}</h1></header>`;
  if(id==='p37')return `<div class="inside-wood">${title}<div class="wood-view">${photos}</div><article class="wood-speech">${b}</article></div>${refs}`;
  if(id==='p38')return `<div class="mother-at-bed">${title}<div class="bed-presence">${photos}</div><article class="bed-conversation">${b}</article></div>${refs}`;
  if(id==='p43')return `<div class="returned-contact-sheet">${title}<div class="returned-voices">${page.body.slice(0,2).map((text,i)=>`<p><span>${i?'陈慧':'袁志强'} / 06:18</span>${E(text)}</p>`).join('')}</div><div class="bed-after-return"><article>${para(page.body.slice(2))}${m}</article><div class="bed-return-photo">${photos}</div></div>${refs}</div>`;
  if(id==='p44')return `<div class="last-decision-sheet">${title}<div class="last-bed-talk"><article class="last-spoken-words">${b}</article><div class="last-bed-presence">${photos}</div></div><div class="last-confirmation">${op}${choiceHtml()}</div>${refs}</div>`;
  if(id==='p45')return `<div class="first-morning">${title}<div class="morning-window">${photos}</div><article>${b}</article><p class="morning-status">306 / 2026年10月10日</p></div>${refs}`;
  if(id==='p47')return `<div class="departure"><div class="departure-street">回水 / 新桥　　07:35</div><header><time>2026 / 10 / 10　07:35</time><h1 tabindex="-1">早餐与出门</h1></header><article>${b}</article><p class="ending-return">${link('author','作者的回信与阅读记录')} · <button type="button" data-rewind>回到最后的决定之前</button></p>${refs}</div>`;
  return `<div class="borrowed-morning">${title}<article>${para(page.body.slice(0,1))}</article>${photos}<article>${para(page.body.slice(1))}</article><p class="ending-return">${link('author','作者的回信与阅读记录')} · <button type="button" data-rewind>回到最后的决定之前</button></p>${refs}</div>`;
 }
 return head+b+photos+m+extras+refs;
}
function entry(){
 const last=events().filter(e=>e.type==='read'&&byId[e.data?.page]&&state.read[e.data.page]).sort((a,b)=>b.t-a.t)[0]?.data?.page;
 return `<div class="mail-route"><span>收件箱 / 玉枝</span><time>2026年10月9日　14:26</time><span>私人来信</span></div><header class="first-letter-title"><p>玉枝 &lt;站内联系人&gt;　→　许知遥</p><h1 tabindex="-1">柜门下面，你再仔细看一眼</h1><span>附件：柜门近照 · 房务留档入口</span></header><article class="first-letter"><p>知遥：</p><p>你发的那张照片我看过了，柜门下面那两道锉痕确实像你妈留下的。她那时候嫌门板总磕脚，蹲在地上磨了半天，磨完还叫你过去试，说这回不会再碰到小腿了。</p><p>不过我还没看见旧物票，不能只凭这两道痕迹就认下来。你到了宾馆，先问问前台柜子从哪里搬来的。沈梁说铺盖已经换新，我问的是柜子，他又拿房间照片给我看。</p><div class="letter-inline-enclosure"><div><p>这是房务拍的近照。你把原图打开，看看门板下沿；柜子要是还在，就别急着答应买下来，先把来处查清。</p><p>${link('p02','打开房务留档：三楼房间与旧家具')}<br>${link('p06','前台留存的采购票与旧物票')}</p></div>${photoHtml('cabinet')}</div><p>家里的四卷底片我也整理好了，背面一起拍给你。分享口令是<strong>蓝线袖口</strong>，不是你生日。学校门口那张是谁拍的，我后来找到了人；相馆盖的月份是补洗的时候，你别拿那个日子去问。</p><p class="letter-file-link">${link('p25','附件 / 玉枝分享的许家相册')}</p><p>雨衣带上。等你问完，我过来接你。</p><p class="letter-signature">玉枝</p></article><nav class="letter-next" aria-label="来信中的去向">${link(last||'p01',last?'回到上次阅读的位置 →':'打开回水宾馆的营业页面 →')}</nav><details class="usage"><summary>开始前的阅读说明</summary><p>《梦演（魇）时分》含遗体、受困身体与身份替代主题。照片由你主动查看，无声音、闪烁或倒计时。人物与机构均为虚构，不需要真实账号。刷新保留阅读进度。</p>${link('help','操作说明与提示')}</details>`;
}

function notes(){
 const read=D.pages.filter(x=>state.read[x.id]);return `<header class="notebook-title"><span>许知遥 / 随身便笺</span><h1>调查便笺</h1></header><div class="notebook-open"><section class="notebook-writing"><p>已读材料的出处留在旁边，自己的话可以另外写。原件仍按原来的日期保存。</p>${objective()}<label for="personal-note">自己的备注</label><textarea id="personal-note" data-note="personal" maxlength="5000">${E(state.notes.personal||'')}</textarea><p class="meta">输入时保存，最多5000字。</p></section><section class="notebook-reference"><h2>打开过的原件</h2><ol class="notebook-sources">${read.map(x=>`<li>${link(x.id,x.title)}<time>${E(x.date)}</time><details><summary>原件摘录</summary><p>“${E(x.quote)}”</p>${x.memory?.length?`<h3>当时记下的话</h3>${para(x.memory)}`:''}</details></li>`).join('')}</ol>${!read.length?'<p>还没有打开资料，先去宾馆看实际房间。</p>':''}</section></div>`;
}
function nativeShell(site,html){
 const back=p?breadcrumbs(p):'',layout=D.design?.[P]?.layout||P;
 if(P==='entry')return `<main id="main" class="start-inbox" data-layout="private-arrival"><aside class="start-mail-index"><strong>许知遥</strong><span>收件箱 / 1封来信</span><b>玉枝</b><small>柜门下面，你再仔细看一眼</small><nav aria-label="私人来信附件">${link('p02','房务照片')}${link('p25','许家相册')}${link('p01','宾馆营业页')}</nav><p>附件留在原来的出处。相册使用玉枝信里的口令。</p></aside><div class="start-letter-flow">${html}</div></main>`;
 if(site==='store'){
  const index=`<nav class="registry-index index-${P}" aria-label="原簿索引"><span>册内索引</span>${siteMenu('store')}<small>房号与床台号分栏登记</small></nav>`,leaf=`<div class="registry-leaf leaf-${P}">${back}${html}</div>`;
  return `<main id="main" class="registry-page registry-${P}" data-layout="${layout}">${['p22','p39','p41'].includes(P)?leaf+index:index+leaf}</main>`;
 }
 if(site==='message'){
  const index=`<nav class="inbox-index contacts-${P}" aria-label="往来联系"><span>联系人与附件</span>${siteMenu('message')}</nav>`,reading=`<div class="inbox-reading reading-${P}">${isCompose()?'<p class="compose-location">许知遥 / 引用原件回信</p>':back}${html}</div>`;
  return `<main id="main" class="inbox-page mailbox-${P}" data-layout="${isCompose()?'reply-'+p.q:layout}">${['p29','p42','p46'].includes(P)&&!isCompose()?reading+index:index+reading}</main>`;
 }
 if(site==='hospital')return `<main id="main" class="clinic-page clinic-${P}" data-layout="${layout}"><div class="clinic-location">${back}<span>资料服务 / 本人授权范围</span></div><div class="clinic-reading">${html}</div></main>`;
 return `<main id="main" class="${site+'-page'} ${p?'document-'+P:'support-'+P}" data-layout="${layout}">${back}${html}</main>`;
}
function isCompose(){return !!(p&&[5,6,7,10].includes(p.q)&&new URLSearchParams(location.search).get('compose')===String(p.q));}
function render(){
 refresh();const source=isCompose()?'message':p?.site||(P==='entry'?'message':'author');document.body.className=source+' page-'+P+(P==='entry'?' entry-page':'')+(['p45','p47'].includes(P)?' dawn':'')+(isCompose()?' composing':'');document.body.classList.toggle('static',state.prefs.static||matchMedia('(prefers-reduced-motion: reduce)').matches);document.body.classList.toggle('notifications-off',!state.prefs.notify);
 let html;if(p){const why=gating(p);html=why?blocked(p,why):isCompose()?composePage(p):renderArticle(p);if(!why&&!state.read[P])commit('read',{page:P});}else html=({entry,notes,help,strategy,author,settings,search:searchPage}[P]||entry)();document.title=(isCompose()?'回信':p?.title||'梦演（魇）时分')+' · 梦演（魇）时分';$('#app').innerHTML=top(source)+nativeShell(source,html)+footer(source);bindImages();bindForms();applyFocusRestore();
}

let noteTimer,pendingNote=null;
function flushNote(){if(pendingNote){const n=pendingNote;pendingNote=null;commit('note',n);}}
function bindImages(){$$('figure[data-image] img').forEach(img=>{const err=()=>{img.hidden=true;img.closest('figure[data-image]').querySelector('.image-error').hidden=false;};img.addEventListener('error',err);img.addEventListener('load',()=>{img.hidden=false;img.closest('figure[data-image]').querySelector('.image-error').hidden=true;});if(img.complete&&!img.naturalWidth)err();});const sign=$('#sign-photo');if(sign){sign.addEventListener('error',()=>{$('.sign-access').open=true;$('#sign-feedback').textContent='场景图未加载，使用下方按姓名定位的纸签，归还与撤签状态相同。';});}}
function bindForms(){$$('form[data-node-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();flushNote();refresh();const id=+form.dataset.nodeForm,n=D.nodes.find(x=>x.id===id),answers=n.fields.map((field,i)=>{const value=form.elements['f'+i].value,clean=s=>String(s).normalize('NFKC').replace(/\s+/g,'').trim();return field.options.find(v=>clean(v)===clean(value))||value;}),r=C.checkNode(state,n,answers);const fb=$(`[data-feedback="${id}"]`);form.querySelectorAll('[data-field]').forEach(x=>{x.classList.remove('wrong');x.querySelector('.wrong-note')?.remove();});if(!r.ok){fb.textContent=r.wrong?'这份记录还有未对上的地方，已标在下方。可以回原文再改。':r.missing?'这份记录还缺前面的联系，请先读清并写完下列回话。':r.returns?'袁与陈还没有分别回话，先把材料交给他们。':r.error;if(r.wrong)r.wrong.forEach(i=>{let el=form.querySelector(`[data-field="${i}"]`);el.classList.add('wrong');el.insertAdjacentHTML('beforeend','<p class="wrong-note">这条材料还没对上，可以回出处再比较。</p>');});if(r.missing)fb.insertAdjacentHTML('beforeend','<p>'+r.missing.map(q=>nodeLink(D.nodes.find(n=>n.id===q),D.nodes.find(n=>n.id===q).title)).join(' / ')+'</p>');if(r.returns)fb.insertAdjacentHTML('beforeend',link('p42','去送出身体位置'));fb.scrollIntoView({block:'center'});return;}commit('solve',{q:id});const y=window.scrollY;render();window.scrollTo(0,y);$(`[data-node="${id}"] h2`)?.focus();}));
$('#access-form')?.addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,key=f.dataset.access,v=f.elements.code.value.trim().replaceAll(' ','');if((key==='album'&&v==='蓝线袖口')||(key==='medical'&&v.toUpperCase()==='ZL-0816')){commit('access',{key});render();$('#main h1')?.focus();}else $('#access-feedback').textContent='凭据未对上，请回信或领取函复制原文。';});
$$('form[data-optional-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const k=f.dataset.optionalForm,op=D.optional[k],ok=op.fields.every((x,i)=>f.elements['o'+i].value===x.answer);if(ok){commit('optional',{key:k});const y=scrollY;render();scrollTo(0,y);}else $(`[data-optional-feedback="${k}"]`).textContent='这份记录还没对上，请比较委托人、收支或拍摄日，不影响主线。';}));
$('#choice-form')?.addEventListener('submit',e=>{e.preventDefault();refresh();if(!state.solved[12]||!state.returns.yuan||!state.returns.chen){$('#choice-feedback').textContent='需要先完成最后状态核对与两人的实际归还。';return;}const key=e.currentTarget.elements.choice.value;if(!['morning','stay'].includes(key))return;commit('choice',{key});if(key==='stay'){if(C.canEnd(state,key)){commit('ending',{key});location.href=href('p48');}}else{render();$('.sign-area')?.scrollIntoView({block:'start'});}});
$('#reset-form')?.addEventListener('submit',e=>{e.preventDefault();if(e.currentTarget.elements.confirm.value.trim()!=='清除进度'){$('#reset-feedback').textContent='输入文字不符，没有清除。';return;}commit('reset',{});render();$('#reset-feedback').textContent='本作品进度已清除，可回开始重新阅读。';});
$('#import-save')?.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const fb=$('#save-feedback');try{if(f.size>20e6)throw Error('存档超过20MB限制');const list=C.parseBackup(JSON.parse(await f.text())),base=nextTick(),token=base.toString(36)+'-'+nonce(),batch=[{v:1,id:token,t:base,type:'reset',data:{}},...list.map((ev,i)=>({...ev,id:token+'-'+i,t:base+i+1,at:ev.at||ev.t}))];persist(PREFIX+'batch-'+token,batch,batch);lastTick=base+list.length;refresh();fb.textContent=saveWarning?'存档在本次会话中已恢复，但浏览器未能持久保存；离开前请导出备份。':'已导入存档，原件与核对可以继续阅读。';}catch(err){fb.textContent='没有导入：'+err.message;}e.target.value='';});}
function bindDelegates(){document.addEventListener('click',e=>{const el=e.target.closest('a,button');if(!el)return;
if(el.dataset.cross&&state.prefs.newtabs&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&(e.button===undefined||e.button===0)&&location.protocol!=='file:'){e.preventDefault();const w=window.open(el.href,'mengyan-'+encodeURIComponent(new URL(ROOT,location.href).pathname)+'-'+el.dataset.cross);if(!w){location.href=el.href;}else try{w.focus();}catch{}return;}
if(el.dataset.fill){const field=$('#'+el.dataset.fill);if(field){field.value=el.dataset.value;commit('draft',{key:field.dataset.draft,value:el.dataset.value});$$('[data-fill]').filter(x=>x.dataset.fill===el.dataset.fill).forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.value===el.dataset.value)));field.focus({preventScroll:true});}return;}
if(el.dataset.hint){refresh();const id=+el.dataset.hint,level=Math.min(3,(state.hints[id]||0)+1);commit('hint',{q:id,level});el.textContent=level===3?'提示已全部展开':'下一层提示';el.disabled=level===3;const n=D.nodes.find(n=>n.id===id);$(`[data-hint-content="${id}"]`).innerHTML=n.hints.slice(0,state.hints[id]).map((x,i)=>`<p>${i+1}. ${E(x)}</p>`).join('');return;}
if(el.dataset.picStep){refresh();const ix=state.pictures.p05||0;commit('picture',{page:'p05',index:Math.max(0,Math.min(3,ix+Number(el.dataset.picStep)))});let y=scrollY;render();scrollTo(0,y);return;}
if(el.dataset.zoom){openZoom(el.dataset.zoom,el);return;}
if(el.dataset.retry){const fig=el.closest('figure'),img=fig.querySelector('img');fig.querySelector('.image-error').hidden=true;img.hidden=false;img.src=ROOT+'assets/'+el.dataset.retry+'.'+D.images[el.dataset.retry].ext+'?retry='+Date.now();return;}
if(el.hasAttribute('data-notify-off')){commit('pref',{key:'notify',value:false});document.body.classList.add('notifications-off');el.closest('.notify')?.remove();return;}
if(el.hasAttribute('data-motion-toggle')){commit('pref',{key:'static',value:!state.prefs.static});document.body.classList.toggle('static',state.prefs.static||matchMedia('(prefers-reduced-motion: reduce)').matches);el.setAttribute('aria-pressed',String(state.prefs.static));el.textContent=state.prefs.static?'已静止':'暂停动态';const check=$('[data-pref="static"]');if(check)check.checked=state.prefs.static;return;}
if(el.dataset.return){refresh();const k=el.dataset.return;if(C.canReturn(state,k)){commit('return',{key:k});let y=scrollY;render();scrollTo(0,y);if(k==='self')$('.paper-sign:not([disabled])')?.focus({preventScroll:true});}return;}
if(el.dataset.remove){refresh();if(!el.disabled&&C.canRemove(state,el.dataset.remove)){const inText=!!el.closest('.sign-access');commit('remove',{key:el.dataset.remove});let y=scrollY;render();scrollTo(0,y);if(inText)$('.sign-access').open=true;const next=$(`.paper-sign:not([disabled])`)||$('#finish-morning');next?.focus({preventScroll:true});}return;}
if(el.id==='finish-morning'){refresh();if(C.canEnd(state,'morning')){commit('ending',{key:'morning'});location.href=href('p45');}return;}
if(el.hasAttribute('data-rewind')){refresh();if(!state.solved[12]){location.href=href('help');return;}commit('choice',{key:null});location.href=href('p44');return;}
if(el.id==='export-save'||el.id==='export-session'){flushNote();const a=document.createElement('a');const blob=new Blob([JSON.stringify({game:'mengyan-shifen',version:1,revision:3,events:C.compactEvents(events())},null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download='梦演时分_存档.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);const fb=$('#save-feedback')||$('#session-feedback');if(fb)fb.textContent='存档已导出，包含当前备注和阅读位置。';}
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.draft)commit('draft',{key:el.dataset.draft,value:el.value});if(el.dataset.pref){commit('pref',{key:el.dataset.pref,value:el.checked});if(el.dataset.pref==='static')$$('.effect-playing').forEach(x=>x.classList.remove('effect-playing'));document.body.classList.toggle('static',state.prefs.static||matchMedia('(prefers-reduced-motion: reduce)').matches);document.body.classList.toggle('notifications-off',!state.prefs.notify);const motion=$('[data-motion-toggle]');if(motion){motion.setAttribute('aria-pressed',String(state.prefs.static));motion.textContent=state.prefs.static?'已静止':'暂停动态';}}});
document.addEventListener('input',e=>{if(e.target.dataset.draft&&e.target.getAttribute('type')!=='radio'){commit('draft',{key:e.target.dataset.draft,value:e.target.value.slice(0,400)});}if(e.target.dataset.note){clearTimeout(noteTimer);pendingNote={key:e.target.dataset.note,value:e.target.value.slice(0,5000)};noteTimer=setTimeout(flushNote,300);}});
let scrollTimer;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>commit('scroll',{page:P,y:Math.min(1e7,Math.max(0,scrollY))}),250);},{passive:true});window.addEventListener('pagehide',()=>{flushNote();commit('scroll',{page:P,y:Math.min(1e7,Math.max(0,scrollY))});});
window.addEventListener('storage',e=>{if(e.key!==null&&!e.key?.startsWith(PREFIX))return;const signature=s=>JSON.stringify([s.solved,s.access,s.returns,s.removed,s.choice,s.activeEnding,s.endings,s.optional,s.prefs,s.pictures,s.hints]),before=state,old=signature(state),active=document.activeElement;refresh();const reset=before.epoch!==state.epoch;if(reset){pendingNote=null;clearTimeout(noteTimer);}if(old!==signature(state)||reset){const y=scrollY,id=active?.id,draft=active?.dataset?.draft;render();scrollTo(0,y);const focus=id?$('#'+id):draft?$(`[data-draft="${draft}"]`):null;focus?.focus({preventScroll:true});}$$('[data-note]').forEach(note=>{note.value=pendingNote&&pendingNote.key===note.dataset.note?pendingNote.value:state.notes[note.dataset.note]||'';});$$('[data-draft]').forEach(field=>{const value=state.drafts[field.dataset.draft];if(value!==undefined){if(field.getAttribute('type')==='radio')field.checked=String(field.value).normalize('NFKC').replace(/\s+/g,'')===String(value).normalize('NFKC').replace(/\s+/g,'');else field.value=value;}});$$('[data-fill]').forEach(button=>button.setAttribute('aria-pressed',String(state.drafts[button.dataset.fill]===button.dataset.value)));});
}
function applyFocusRestore(){/* Normal navigation keeps browser history and native focus. */}
function openZoom(id,from){const a=D.images[id];zoomReturn=from;zoomAsset=id;zoomScale=1;zoomScroll=scrollY;const dialog=$('#zoom');dialog.innerHTML=`<header><button type="button" id="close-zoom">返回原图注</button><button type="button" id="zoom-out" aria-label="缩小图片">－</button><button type="button" id="zoom-in" aria-label="放大图片">＋</button><button type="button" id="zoom-reset">复位</button><button type="button" id="zoom-full">全屏查看</button><span id="zoom-status" role="status">100%</span></header><div class="zoom-stage" tabindex="0"><img src="${ROOT}masters/${id}.${a.masterExt||a.ext}?v=20261011v8" alt="${E(a.alt)}"></div><p class="zoom-help">放大后触屏滑动，键盘方向键平移，加减缩放，Escape关闭。</p>`;dialog.showModal();$('#close-zoom').onclick=()=>dialog.close();$('#zoom-in').onclick=()=>setZoom(zoomScale+.25);$('#zoom-out').onclick=()=>setZoom(zoomScale-.25);$('#zoom-reset').onclick=()=>setZoom(1);$('#zoom-full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(dialog.requestFullscreen)await dialog.requestFullscreen();else $('#zoom-status').textContent='浏览器不支持全屏，可继续缩放';}catch{$('#zoom-status').textContent='全屏未获允许，可继续缩放';}};const img=dialog.querySelector('img');img.onload=()=>setZoom(1);img.onerror=()=>{img.hidden=true;const stage=$('.zoom-stage');stage.insertAdjacentHTML('beforeend',`<div class="zoom-error"><p>原图未能加载。下方保留同范围观察说明，可以返回后重试。</p><p>${E(a.alt)}</p>${a.transcript&&a.transcript!==a.alt?`<p>${E(a.transcript)}</p>`:''}</div>`);};$('#close-zoom').focus();}
function setZoom(s){zoomScale=Math.max(.5,Math.min(4,s));const stage=$('.zoom-stage'),img=stage.querySelector('img');if(!img||img.hidden)return;const width=Math.min(stage.clientWidth,img.naturalWidth||stage.clientWidth)*zoomScale;img.style.width=width+'px';$('#zoom-status').textContent=Math.round(zoomScale*100)+'%';}
document.addEventListener('keydown',e=>{if(!$('#zoom').open)return;if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoomScale+.25);}if(e.key==='-'){e.preventDefault();setZoom(zoomScale-.25);}const arrows={ArrowLeft:[-80,0],ArrowRight:[80,0],ArrowUp:[0,-80],ArrowDown:[0,80]};if(arrows[e.key]){e.preventDefault();$('.zoom-stage').scrollBy(...arrows[e.key]);}});$('#zoom').addEventListener('close',()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});const target=zoomReturn?.isConnected?zoomReturn:$(`[data-zoom="${zoomAsset}"]`);target?.focus({preventScroll:true});window.scrollTo(0,zoomScroll);});
bindDelegates();render();const saved=state.scroll[P]||0;requestAnimationFrame(()=>{if(saved)window.scrollTo(0,saved);});
// Essential next image starts loading independently of visible UI; failure stays observable.
if(p?.id==='p04'){const im=new Image();im.src=ROOT+'assets/room312.webp?v=20261011v8';}if(p?.id==='p05'){const index=state.pictures.p05||0,next=p.images[index+1];if(next){const im=new Image();im.src=ROOT+'assets/'+next+'.webp?v=20261011v8';}}
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');motionQuery.addEventListener?.('change',()=>{document.body.classList.toggle('static',state.prefs.static||motionQuery.matches);if(motionQuery.matches)$$('.effect-playing').forEach(x=>x.classList.remove('effect-playing'));});
window.MYAppDebug={gating,state:()=>refresh(),prefix:PREFIX};
})();
