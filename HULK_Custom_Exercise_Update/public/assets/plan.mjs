import {planHTML,ptext,days} from './plan-ui.mjs?v=coach-exercises-20261016';
const HF=window.HF,view=document.getElementById('view'),esc=HF.esc;
let lang=HF.getLang(),assignment=null,status='pending',day=Math.max(0,days.indexOf(new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'Asia/Kolkata'}).format(new Date()))),timer=null,remaining=0;
const completed=new Set();
function syncLang(){document.documentElement.lang=lang;document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));}
function render(){
 const t=k=>esc(ptext(k,lang));
 view.innerHTML='<div class="stack-lg"><span class="label">'+esc(assignment?.plan?.program?(lang==='kn'&&assignment.plan.program.series_title_kn||assignment.plan.program.series_title):'HULK FIT Transformation')+'</span><h1 class="display h-lg">'+t('title')+'</h1>'+(!assignment||status!=='current'?'<section class="card stack"><p>'+t(status==='review'?'previous':'pending')+'</p><a class="btn" href="/quiz">'+t('details')+'</a></section>':
  '<p class="pill">'+t('approved')+'</p>'+(assignment.owner_note?'<p class="card">'+esc(assignment.owner_note)+'</p>':'')+'<select class="input" id="planDay" aria-label="'+t('training')+'">'+days.map((d,i)=>'<option value="'+i+'" '+(i===day?'selected':'')+'>'+t(d)+'</option>').join('')+'</select>'+planHTML(assignment.plan,day,lang,esc,true))+
  '<div class="row wrap"><a class="btn" href="/quiz#edit">'+t('details')+'</a><a class="btn" href="/member?skipQuiz=1&legacyWorkout=1#workout">'+t('legacy')+'</a><a href="/member?skipQuiz=1#home">'+t('home')+'</a></div></div>';
 document.getElementById('planDay')?.addEventListener('change',e=>{day=Number(e.target.value);clearInterval(timer);remaining=0;render();});
 view.querySelectorAll('[data-set]').forEach(b=>{b.setAttribute('aria-pressed',String(completed.has(b.dataset.set)));b.onclick=()=>{if(completed.has(b.dataset.set))completed.delete(b.dataset.set);else completed.add(b.dataset.set);b.setAttribute('aria-pressed',String(completed.has(b.dataset.set)));};});
 const tick=()=>{const out=document.getElementById('restTimer');if(out)out.textContent=remaining?ptext('remaining',lang)+': '+remaining+' '+ptext('seconds',lang):'';};tick();
 view.querySelectorAll('[data-rest]').forEach(b=>b.onclick=()=>{clearInterval(timer);remaining=Number(b.dataset.rest);tick();timer=setInterval(()=>{remaining=Math.max(0,remaining-1);tick();if(!remaining)clearInterval(timer);},1000);});
}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;HF.setLang(lang);syncLang();render();}));
HF.sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){clearInterval(timer);location.replace('/login');}});
syncLang();
try{
 const session=await HF.getSession();if(!session)location.replace('/login');else{
  const role=await HF.myRole();
  if(role==='owner') location.replace('/admin#coaching');
  else if(role==='trainer') location.replace('/admin');
  else {
  const {data,error}=await HF.sb.functions.invoke('fitness-plan',{body:{action:'me'}});let code=data?.error;
  if(error?.context?.json){try{code=(await error.context.json()).error;}catch{}}
  if(error||code)throw new Error(code||'plan_unavailable');assignment=data.assignment;status=data.status;render();
  }
 }
}catch(e){view.innerHTML='<section class="card stack"><p>'+esc(ptext(e.message,lang))+'</p><button class="btn" id="retry">Retry / ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ</button><a href="/member?skipQuiz=1">'+esc(ptext('home',lang))+'</a></section>';document.getElementById('retry').onclick=()=>location.reload();}
