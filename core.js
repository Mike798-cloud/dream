/* Pure state reducer: per-operation storage keys prevent stale tabs overwriting progress. */
(function(root){'use strict';
 const VERSION=1;
 const blank=()=>({version:VERSION,read:{},solved:{},drafts:{},hints:{},access:{},returns:{},removed:{},effects:{},prefs:{static:false,newtabs:true,notify:true},notes:{},scroll:{},pictures:{},optional:{},endings:{},achievementDates:{},activeEnding:null,choice:null,epoch:0});
 const safeKey=k=>typeof k==='string'&&/^[a-z0-9_-]{1,80}$/i.test(k)&&!['__proto__','prototype','constructor'].includes(k);
 const ordered=events=>events.filter(e=>e&&e.v===VERSION&&Number.isFinite(e.t)&&safeKey(e.id)).sort((a,b)=>a.t-b.t||a.id.localeCompare(b.id));
 function activeEvents(events){let a=ordered(events),cut=-1;a.forEach((e,i)=>{if(e.type==='reset')cut=i;});return a.slice(cut+1);}
 function compactEvents(events){const a=activeEvents(events),latest=new Map();a.forEach((e,i)=>{if(['draft','note','scroll','picture','pref'].includes(e.type))latest.set(e.type+':'+(e.data.key||e.data.page),i);});return a.filter((e,i)=>!['draft','note','scroll','picture','pref'].includes(e.type)||latest.get(e.type+':'+(e.data.key||e.data.page))===i);}
 function reduce(events){let s=blank(); for(const e of ordered(events)){let d=e.data&&typeof e.data==='object'?e.data:{}; switch(e.type){
 case 'reset':s=blank();s.epoch=e.t;break;
 case 'read':if(/^p\d\d$/.test(d.page)&&+d.page.slice(1)>=1&&+d.page.slice(1)<=48)s.read[d.page]=true;break;
 case 'solve':if(Number.isInteger(d.q)&&d.q>=1&&d.q<=12)s.solved[d.q]=true;break;
 case 'draft':if(safeKey(d.key)&&typeof d.value==='string')s.drafts[d.key]=d.value.slice(0,400);break;
 case 'hint':if(d.q>=1&&d.q<=12)s.hints[d.q]=Math.max(s.hints[d.q]||0,Math.min(3,Number(d.level)||0));break;
 case 'access':if(['album','medical'].includes(d.key))s.access[d.key]=true;break;
 case 'return':if(['yuan','chen','self'].includes(d.key))s.returns[d.key]=true;break;
 case 'remove':if(['song','lin','mother'].includes(d.key))s.removed[d.key]=true;break;
 case 'pref':if(['static','newtabs','notify'].includes(d.key)&&typeof d.value==='boolean')s.prefs[d.key]=d.value;break;
 case 'note':if(safeKey(d.key)&&typeof d.value==='string')s.notes[d.key]=d.value.slice(0,5000);break;
 case 'scroll':if(safeKey(d.page)&&Number.isFinite(d.y))s.scroll[d.page]=Math.max(0,d.y);break;
 case 'picture':if(d.page==='p05'&&Number.isInteger(d.index))s.pictures[d.page]=Math.max(0,Math.min(3,d.index));break;
 case 'optional':if(['deposit','orders','album'].includes(d.key))s.optional[d.key]=true;break;
 case 'choice':if(['morning','stay',null].includes(d.key)){s.choice=d.key;s.activeEnding=null;if(d.key===null){s.returns.self=false;s.removed={};}}break;
 case 'ending':if(['morning','stay'].includes(d.key)){s.endings[d.key]=true;s.activeEnding=d.key;}break;
 case 'effect':if(['p14','p39'].includes(d.page))s.effects[d.page]=true;break;
 }achievements.forEach(([_,fn],i)=>{if(!s.achievementDates[i]&&fn(s))s.achievementDates[i]=e.at||e.t||1;});}return s;}
 function validEvent(e){if(e?.at!==undefined&&(!Number.isFinite(e.at)||e.at<0||e.at>8.64e15))return false;if(!e||e.v!==VERSION||!safeKey(e.id)||!Number.isFinite(e.t)||e.t<0||e.t>8.64e15||!e.data||typeof e.data!=='object'||Array.isArray(e.data))return false;const d=e.data;switch(e.type){
 case 'read':return /^p\d\d$/.test(d.page)&&+d.page.slice(1)>=1&&+d.page.slice(1)<=48;
 case 'solve':return Number.isInteger(d.q)&&d.q>=1&&d.q<=12;
 case 'draft':return safeKey(d.key)&&typeof d.value==='string'&&d.value.length<=400;
 case 'hint':return Number.isInteger(d.q)&&d.q>=1&&d.q<=12&&Number.isInteger(d.level)&&d.level>=0&&d.level<=3;
 case 'access':return ['album','medical'].includes(d.key);
 case 'return':return ['yuan','chen','self'].includes(d.key);
 case 'remove':return ['song','lin','mother'].includes(d.key);
 case 'pref':return ['static','newtabs','notify'].includes(d.key)&&typeof d.value==='boolean';
 case 'note':return safeKey(d.key)&&typeof d.value==='string'&&d.value.length<=5000;
 case 'scroll':return safeKey(d.page)&&Number.isFinite(d.y)&&d.y>=0&&d.y<=1e7;
 case 'picture':return d.page==='p05'&&Number.isInteger(d.index)&&d.index>=0&&d.index<=3;
 case 'optional':return ['deposit','orders','album'].includes(d.key);
 case 'choice':return ['morning','stay',null].includes(d.key);
 case 'ending':return ['morning','stay'].includes(d.key);
 case 'effect':return ['p14','p39'].includes(d.page);
 case 'reset':return true;
 default:return false;}}
 function parseBackup(obj){if(!obj||obj.version!==VERSION||obj.game&&obj.game!=='mengyan-shifen'||!Array.isArray(obj.events)||obj.events.length>50000)throw Error('不是本作品的版本1存档');if(!obj.events.every(validEvent))throw Error('存档字段异常，原进度未改变');return activeEvents(obj.events);}
 function checkNode(s,node,answers){if(!node)return {ok:false,error:'这份核对不存在。'};let missing=node.deps.filter(q=>!s.solved[q]);if(missing.length)return {ok:false,error:'先完成相关事实核对：'+missing.join('、'),missing};if(node.id===12&&(!s.returns.yuan||!s.returns.chen))return {ok:false,error:'袁与陈需要实际收到材料并确认归还，核对答案本身不等于归还。',returns:true};let wrong=node.fields.map((f,i)=>answers[i]!==f.answer?i:-1).filter(x=>x>=0);return wrong.length?{ok:false,error:'请重新看这些字段的出处，错误项已列出，答案可以改。',wrong}:{ok:true};}
 function canReturn(s,key){return !!(key==='self'?s.solved[12]&&s.returns.yuan&&s.returns.chen&&s.choice==='morning':s.solved[11]&&['yuan','chen'].includes(key));}
 function canRemove(s,key){return !!(s.returns.yuan&&s.returns.chen&&s.returns.self&&s.choice==='morning'&&['song','lin','mother'].includes(key));}
 function canEnd(s,key){return !!(key==='morning'?canRemove(s,'mother')&&['song','lin','mother'].every(k=>s.removed[k]):key==='stay'&&s.solved[12]&&s.returns.yuan&&s.returns.chen&&s.choice==='stay');}
 const achievements=[
 ['住店先看床',s=>s.solved[1]],['这单我不签',s=>s.read.p04&&s.solved[2]],['真不是螺丝',s=>s.solved[2]],['先把原话留下',s=>s.solved[3]&&s.solved[4]],['这账还得算',s=>s.optional.deposit],['搬的究竟是什么',s=>s.read.p20&&s.solved[2]&&s.read.p22],['她来过学校',s=>s.solved[6]],['三个晚上',s=>s.solved[7]],['醒着的是谁',s=>s.solved[8]],['我认得自己的手',s=>s.solved[12]],['别把人留错地方',s=>s.solved[9]],['线头还没剪',s=>s.optional.orders&&s.read.p26],['清晨',s=>s.endings.morning],['同住',s=>s.endings.stay]
 ];
 function normalize(x){let s=String(x||'').toLowerCase().replace(/[\s()（）-]/g,'');const aliases={'袁老师':'袁志强','三一二':'312','三一二房':'312房','三一二号':'312','床箱':'床台','旧床':'床台','回水宾馆三一二':'312房','袁太太':'周敏','玉枝阿姨':'陈玉枝','妈妈':'梁秀琴','秀琴':'梁秀琴','张小姐':'张岚','库房':'保管','医疗':'护理'};for(const [a,b]of Object.entries(aliases))s=s.replaceAll(a,b);return s;}
 function available(p,s){
  if(p.gate&&!s.access[p.gate]||p.revealAfter&&!s.solved[p.revealAfter]||p.event&&!s.read[p.id])return false;
  const n=+p.id.slice(1);
  if(n>=45&&n<=47)return s.activeEnding==='morning'&&canEnd(s,'morning');
  if(n===48)return s.activeEnding==='stay'&&canEnd(s,'stay');
  if(n===43||n===44)return !!(s.returns?.yuan&&s.returns?.chen);
  if(n===42)return !!s.solved[10];if(n===37||n===38)return !!s.solved[8];
  if(n===35||n===36)return !!(s.solved[7]&&[1,2,3,4,5].every(q=>s.solved[q]));
  return true;
 }
 function search(pages,query,read,access,state){let q=normalize(query);if(!q)return[];const s=state||{...blank(),read:read||{},access:access||{}};return pages.filter(p=>available(p,s)&&normalize(p.title+' '+p.body.join(' ')+' '+(p.laterAfter&&s.solved[p.laterAfter]?(p.laterBody||[]).join(' '):'')+' '+p.id).includes(q));}

function assessOperation(id,v,s){
 const token=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,''),has=(key,list)=>list.includes(v[key]),bad=reason=>({ok:false,reason}),deps={1:[],2:[],3:[],4:[],5:[],6:[5],7:[6],8:[1,2,3,4,5,7],9:[8],10:[9],11:[10],12:[11]};
 if(!deps[id]||deps[id].some(q=>!s.solved[q]))return bad('unavailable');
 let ok=false;
 switch(id){
 case 1:if(token(v.item)!=='c0306')return bad('item');ok=has('photo',['cabinet','patch','room306','r:p02','r:p03'])&&has('record',['r:p06','r:p07','r:p21','r:p23']);break;
 case 2:if(token(v.item)!=='b0312')return bad('item');if(v.disposition!=='hold')return bad('receipt');ok=has('photo',['cavity','closeup','r:p05'])&&has('record',['transfer','r:p06','r:p22']);break;
 case 3:ok=has('record',['r:p19','r:p27','street']);break;
 case 4:{const topic=String(v.topic||'').trim();if(!(topic==='p10'||/^(?:https?:\/\/[^/]+)?(?:\.\.\/|\.\/)?(?:[^?#]*\/)?forum\/p10\.html(?:[?#].*)?$/.test(topic)||topic==='p10.html'))return bad('topic');ok=has('record',['chenBefore','chenAfter','r:p12','r:p13','r:p34']);break;}

 case 5:if(v.action!=='keep')return bad('receipt');ok=has('record',['missing','r:p17','r:p18','r:p19']);break;
 case 6:ok=has('letter',['letter','r:p28'])&&has('photo',['zhanglan','r:p30']);break;
 case 7:ok=has('private',['r:p24'])&&has('record',['nursing','r:p33']);break;
 case 8:ok=['yuzhi','shen','zhang'].includes(v.contact)&&['speak','withdraw'].includes(v.action);break;
 case 9:{const rows=[{who:['袁志强','周敏'],docs:['b0312','r:p22','r:p19'],photos:['yuanBefore','yuanAfter','r:p11']},{who:['陈慧','陈恪'],docs:['b0211','r:p23','r:p19'],photos:['chenBefore','chenAfter','r:p13']},{who:['许知遥','知遥'],docs:['r:p23','r:p19','letter','r:p28'],photos:['zhiyao','satup','r:p36']}];ok=rows.every((r,i)=>r.who.some(n=>token(n)===token(v[i+'_living']))&&r.docs.includes(v[i+'_identity'])&&r.photos.includes(v[i+'_photo']));break;}
 case 10:if(v.action!=='hold')return bad('receipt');ok=has('record',['r:p24','r:p29','r:p33','r:p40','r:p41','nursing','zhangLetter']);break;
 case 11:ok=has('yuan_doc',['b0312','r:p22'])&&v.yuan_photo==='yuanCurrent'&&has('chen_doc',['b0211','r:p23'])&&v.chen_photo==='chenCurrent';break;
 case 12:ok=s.returns.yuan&&s.returns.chen&&has('outside',['satup','zhiyao','r:p36']);break;
 }
 return ok?{ok:true}:bad('materials');
}

 const API={assessOperation,VERSION,blank,reduce,checkNode,canReturn,canRemove,canEnd,achievements,normalize,available,search,safeKey,ordered,activeEvents,compactEvents,validEvent,parseBackup};
 if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.MYCore=API;
})(typeof window==='undefined'?globalThis:window);
