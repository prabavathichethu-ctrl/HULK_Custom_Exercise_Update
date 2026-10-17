import {mountPlanReviews} from './plan-review.mjs?v=coach-exercises-20261016';
import {mountStudioLibrary} from './studio-library.mjs?v=coach-exercises-20261016';
import { tr, resultHTML } from './intake-ui.mjs';
import { canReviewTargets,validateReviewedTargets,reviewLabel } from './reviewed-targets.mjs';
const HF=window.HF,sb=HF.sb,esc=HF.esc,view=document.getElementById('view');
const params=new URLSearchParams(location.search),candidate=params.get('member')||'',focusedUser=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)?candidate:null;
const memberId=/^\d+$/.test(params.get('member_id')||'')?params.get('member_id'):null;
let lang=HF.getLang(),offset=0,filter=(focusedUser||/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.get('program')||''))?'all':'pending',ready=false,busy=false,rows=[],assignments={};
const focusedLabel=(en,kn)=>esc(lang==='kn'?kn:en);
const focusHTML=()=>focusedUser?'<div class="card stack ac-focus"><b>'+focusedLabel('Selected member · individual review','ಆಯ್ಕೆ ಮಾಡಿದ ಸದಸ್ಯರ ಪರಿಶೀಲನೆ')+'</b><div class="row wrap"><a href="/admin'+(memberId?'#m/'+memberId:'#coaching')+'">'+focusedLabel('Back to member details','ಸದಸ್ಯರ ವಿವರಕ್ಕೆ ಹಿಂತಿರುಗಿ')+'</a><a href="/studio">'+focusedLabel('All members in Studio','ಸ್ಟುಡಿಯೋದಲ್ಲಿ ಎಲ್ಲ ಸದಸ್ಯರು')+'</a></div></div>':'';
let libraryController=null,routeGeneration=0;
const studioTabs=()=>'<nav class="studio-tabs" aria-label="Studio sections"><a href="/studio'+(focusedUser?'?member='+encodeURIComponent(focusedUser)+(memberId?'&member_id='+memberId:''):'')+'" '+(location.hash!=='#library'?'aria-current="page"':'')+'>'+focusedLabel('Members & reviews','ಸದಸ್ಯರು ಮತ್ತು ಪರಿಶೀಲನೆ')+'</a><a href="#library" '+(location.hash==='#library'?'aria-current="page"':'')+'>'+focusedLabel('Series & Programs','ಸೀರೀಸ್ ಮತ್ತು ಪ್ರೋಗ್ರಾಂಗಳು')+'</a><a href="/admin#coaching">'+focusedLabel('Owner overview','ಮಾಲೀಕರ ವಿವರ')+'</a></nav>';
async function studioRoute(){const token=++routeGeneration;libraryController=null;if(location.hash==='#library'){view.innerHTML=studioTabs()+'<div id="studioLibrary"></div>';const ctrl=await mountStudioLibrary(document.getElementById('studioLibrary'),HF,lang);if(token===routeGeneration)libraryController=ctrl;}else await load();}
window.addEventListener('hashchange',()=>{if(ready)studioRoute().catch(()=>showError(t('unavailable')));});
const SIZE=10,t=k=>tr(k,lang);
const drafts={};
const rt=k=>esc(reviewLabel(k,lang));
const escT=k=>esc(t(k));
async function load() {
  let q=sb.from('fitness_intakes').select('*,members(full_name)').order('submitted_at',{ascending:false}).range(offset,offset+SIZE);
  if(focusedUser) q=q.eq('user_id',focusedUser);
  if(filter!=='all') q=q.eq('review_status',filter);
  const r=await q;
  if(r.error) throw r.error;
  rows=r.data || []; assignments={};
  if(rows.length) {
    const a=await sb.from('nutrition_assignments').select('*').in('user_id',rows.map(x=>x.user_id));
    if(a.error) throw a.error;
    for(const x of a.data || []) assignments[x.user_id]=x;
  }
  if(location.hash!=='#library')render();
}
function detail(r) {
  const a=r.answers;
  const pairs=[['goal',t(a.goal)],['age',a.age],['sex',t(a.sex)],['height_cm',a.height_cm],['weight_kg',a.weight_kg],['work',t(a.work)],['steps',t(a.steps)],['experience',t(a.experience)],['workout_days',a.workout_days],['session_minutes',a.session_minutes],['equipment',t(a.equipment)],['diet',t(a.diet)],['meals',a.meals],['allergies',a.allergies.map(k=>t(k==='egg'?'eggs':k)).join(', ') || t('no')],...['health_review','pregnant_or_lactating','eating_concern','exercise_red_flags'].map(k=>[k,t(a[k]?'yes':'no')])];
  return '<dl class="kv">'+pairs.map(([k,v])=>'<dt>'+escT(k)+'</dt><dd>'+esc(v)+'</dd>').join('')+'</dl>';
}
function reviewedForm(r){
  if(!canReviewTargets(r.answers))return '';
  const key=r.user_id+'-'+r.revision,d=drafts[key]||{};
  const num=(name,label,min,max,step=1)=>'<div class="field"><label for="'+name+'-'+esc(r.user_id)+'">'+rt(label)+'</label><input class="input" type="number" inputmode="decimal" id="'+name+'-'+esc(r.user_id)+'" name="'+name+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+esc(d[name]??'')+'" required '+(name==='basis_kg'&&d.protein_basis==='current'?'readonly':'')+'></div>';
  return '<details><summary>'+rt('title')+'</summary><form class="card quiz-fields" data-reviewed-form="'+esc(r.user_id)+'"><p class="hint">'+rt('intro')+'</p>'+
    num('calories_kcal','calories',1,10000)+num('protein_g','protein',0.1,500,0.1)+num('fat_g','fat',0.1,500,0.1)+
    '<p class="small">'+rt('carbs')+': <output data-carbs>—</output> g</p>'+
    '<div class="field"><label for="protein_basis-'+esc(r.user_id)+'">'+rt('basis')+'</label><select class="input" id="protein_basis-'+esc(r.user_id)+'" name="protein_basis" required><option value="">'+rt('choose')+'</option>'+['current','reference','lean_mass'].map(k=>'<option value="'+k+'" '+(d.protein_basis===k?'selected':'')+'>'+rt(k)+'</option>').join('')+'</select></div>'+
    num('basis_kg','basisKg',1,250,0.01)+'<div class="field"><label for="review-note-'+esc(r.user_id)+'">'+rt('note')+'</label><textarea class="input" id="review-note-'+esc(r.user_id)+'" name="note" minlength="20" maxlength="1000" rows="4" required>'+esc(d.note||'')+'</textarea></div>'+
    '<label class="check-line"><input type="checkbox" name="assessment_confirmed" required '+(d.assessment_confirmed?'checked':'')+'><span>'+rt('confirmed')+'</span></label><p class="form-error" data-review-error role="alert" hidden></p><button class="btn acc" type="submit">'+rt('save')+'</button></form></details>';
}
function wireReviewedForms(){
  view.querySelectorAll('[data-reviewed-form]').forEach(form=>{
    const r=rows.find(x=>x.user_id===form.dataset.reviewedForm),key=r.user_id+'-'+r.revision;
    const capture=()=>{
      const d=Object.fromEntries(new FormData(form));d.assessment_confirmed=form.elements.assessment_confirmed.checked;drafts[key]=d;
      const values=['calories_kcal','protein_g','fat_g'].map(k=>form.elements[k].value);
      const carbs=values.every(v=>v!=='')?(Number(values[0])-4*Number(values[1])-9*Number(values[2]))/4:null;
      form.querySelector('[data-carbs]').textContent=carbs!==null&&Number.isFinite(carbs)&&carbs>=0?String(Math.round(carbs*100)/100):'—';
      return d;
    };
    form.addEventListener('input',capture);
    form.elements.protein_basis.addEventListener('change',()=>{
      const isCurrent=form.elements.protein_basis.value==='current';
      form.elements.basis_kg.readOnly=isCurrent;
      form.elements.basis_kg.value=isCurrent?r.answers.weight_kg:'';
      capture();
    });
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(busy)return;
      const d=capture(),input={...d};
      for(const k of ['calories_kcal','protein_g','fat_g','basis_kg'])input[k]=Number(d[k]);
      const err=form.querySelector('[data-review-error]');err.hidden=true;
      try{validateReviewedTargets(input,r.answers);}catch(e){err.textContent=reviewLabel(e.message,lang);err.hidden=false;return;}
      busy=true;const btn=form.querySelector('[type="submit"]');btn.disabled=true;btn.textContent=reviewLabel('saving',lang);
      try{
        const {data,error}=await sb.functions.invoke('fitness-intake',{body:{action:'approve_reviewed',user_id:r.user_id,revision:r.revision,targets:input}});
        let message=data?.error;
        if(error?.context?.json){try{message=(await error.context.json()).error;}catch{}}
        if(error||message)throw new Error(message||t('unavailable'));
        delete drafts[key];HF.toast(t('updated'));await load();
      }catch(e){err.textContent=reviewLabel(e.message,lang);err.hidden=false;btn.disabled=false;btn.textContent=reviewLabel('save',lang);}
      finally{busy=false;}
    });
    capture();
  });
}
function render() {
  const hasMore=rows.length>SIZE;
  view.innerHTML=studioTabs()+'<div class="stack-lg"><span class="label">'+escT('studioSub')+'</span><h1 class="display h-lg">'+escT('studio')+'</h1>'+focusHTML()+'<div class="row wrap"><select class="input" id="filter" aria-label="'+escT('review')+'">'+['pending','approved','referred','all'].map(k=>'<option value="'+k+'" '+(k===filter?'selected':'')+'>'+escT(k)+'</option>').join('')+'</select><button class="btn sm" id="refresh">'+escT('refresh')+'</button></div><p id="studioError" class="form-error" role="alert" hidden></p>'+(!rows.length?'<div class="card stack"><p>'+(focusedUser&&filter==='all'?focusedLabel('This member has not submitted a fitness quiz yet. Ask them to log in and complete it.','ಈ ಸದಸ್ಯರು ಇನ್ನೂ ಫಿಟ್ನೆಸ್ ಕ್ವಿಜ್ ಸಲ್ಲಿಸಿಲ್ಲ. ಲಾಗಿನ್ ಮಾಡಿ ಪೂರ್ಣಗೊಳಿಸಲು ತಿಳಿಸಿ.'):escT('empty'))+'</p>'+(focusedUser?'<a href="/quiz">'+focusedLabel('Member quiz link','ಸದಸ್ಯರ ಕ್ವಿಜ್ ಲಿಂಕ್')+'</a>':'')+'</div>':'')+
    rows.slice(0,SIZE).map(r=>'<article class="card stack studio-intake" data-user="'+esc(r.user_id)+'"><div class="row between"><h2>'+esc(r.members?.full_name || 'Member')+'</h2><span class="pill">'+escT(r.review_status)+'</span></div><details><summary>'+escT('review')+'</summary>'+detail(r)+'</details>'+resultHTML(r,assignments[r.user_id],lang,esc)+'<label class="small" for="note-'+esc(r.user_id)+'">'+escT('note')+'</label><textarea class="input" id="note-'+esc(r.user_id)+'" maxlength="1000" rows="3"></textarea><div class="row wrap"><button class="btn acc" data-decision="approve" '+(r.estimates.kind!=='estimate'?'disabled':'')+'>'+escT('approve')+'</button><button class="btn" data-decision="refer">'+escT('refer')+'</button></div>'+reviewedForm(r)+'</article>').join('')+
    '<div class="row between">'+(offset?'<button class="btn" id="prev">'+escT('prev')+'</button>':'<span></span>')+(hasMore?'<button class="btn" id="more">'+escT('more')+'</button>':'')+'</div><a class="small muted" href="/admin#coaching">'+escT('admin')+'</a></div>';
  document.getElementById('filter').onchange=async e=>{filter=e.target.value;offset=0;await reload();};
  wireReviewedForms();
  mountPlanReviews(view,rows.slice(0,SIZE),assignments,lang,HF);
  document.getElementById('refresh').onclick=reload;
  document.getElementById('prev')?.addEventListener('click',async()=>{offset=Math.max(0,offset-SIZE);await reload();});
  document.getElementById('more')?.addEventListener('click',async()=>{offset+=SIZE;await reload();});
  view.querySelectorAll('[data-decision]').forEach(btn=>btn.addEventListener('click',async()=>{
    if(busy)return;busy=true;
    const card=btn.closest('[data-user]'),r=rows.find(x=>x.user_id===card.dataset.user);
    btn.disabled=true;
    try {
      const {data,error}=await sb.functions.invoke('fitness-intake',{body:{action:'review',user_id:r.user_id,revision:r.revision,decision:btn.dataset.decision,note:card.querySelector('textarea').value}});
      if(error || data?.error) {let message=data?.error;if(error?.context?.json) {try{message=(await error.context.json()).error;}catch{}}throw new Error(message || t('unavailable'));}
      HF.toast(t('updated'));await load();
    } catch(e) {showError(e.message || t('unavailable'));btn.disabled=false;}
    finally {busy=false;}
  }));
}
function showError(message) {const el=document.getElementById('studioError');if(el){el.hidden=false;el.textContent=message;el.scrollIntoView({block:'nearest'});}}
async function reload(){try{await load();}catch{showError(t('unavailable'));}}
function syncLang(){document.documentElement.lang=lang;document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;HF.setLang(lang);syncLang();if(ready){if(location.hash==='#library'){if(libraryController)libraryController.setLang(lang);}else render();}}));
sb.auth.onAuthStateChange(evt=>{if(evt==='SIGNED_OUT')location.replace('/login?role=admin');});
syncLang();
try {
  const session=await HF.getSession();
  if(!session)location.replace('/login?role=admin');
  else if(await HF.myRole()!=='owner')location.replace('/admin');
  else{ready=true;await studioRoute();}
}catch{view.innerHTML='<div class="card stack"><p>'+escT('unavailable')+'</p><a class="btn" href="/admin">'+escT('admin')+'</a><button class="btn" id="retry">'+escT('retry')+'</button></div>';document.getElementById('retry').onclick=()=>location.reload();}
