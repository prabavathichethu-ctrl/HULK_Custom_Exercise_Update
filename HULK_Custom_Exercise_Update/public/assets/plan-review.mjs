import {planHTML,ptext,days} from './plan-ui.mjs?v=coach-exercises-20261016';
import {PLAN_VERSION} from './plan-engine.mjs';
import {createLibraryStore} from './studio-library.mjs?v=coach-exercises-20261016';
const state={},mounts=new WeakMap();
const messages={
 custom_exercise_fields:['The program has an incomplete custom exercise. Edit its name, equipment and primary muscles before assigning.','ಪ್ರೋಗ್ರಾಂನಲ್ಲಿ ಅಪೂರ್ಣ ಸ್ವಂತ ವ್ಯಾಯಾಮ ಇದೆ. ನೀಡುವ ಮೊದಲು ಹೆಸರು, ಉಪಕರಣ ಮತ್ತು ಮುಖ್ಯ ಸ್ನಾಯು ಆಯ್ಕೆ ಪರಿಶೀಲಿಸಿ.'],
 library_changed:['The series, program or member targets changed. Generate and review a fresh preview.','ಸೀರೀಸ್, ಪ್ರೋಗ್ರಾಂ ಅಥವಾ ಸದಸ್ಯರ ಗುರಿ ಬದಲಾಗಿದೆ. ಹೊಸ ಪ್ರಿವ್ಯೂ ರಚಿಸಿ ಪರಿಶೀಲಿಸಿ.'],
 program_unpublished:['Publish the series and program before assigning.','ನೀಡುವ ಮೊದಲು ಸೀರೀಸ್ ಮತ್ತು ಪ್ರೋಗ್ರಾಂ ಪ್ರಕಟಿಸಿ.'],program_missing:['This program is unavailable. Choose another published program.','ಈ ಪ್ರೋಗ್ರಾಂ ಲಭ್ಯವಿಲ್ಲ. ಮತ್ತೊಂದು ಪ್ರಕಟಿತ ಪ್ರೋಗ್ರಾಂ ಆಯ್ಕೆ ಮಾಡಿ.'],
 program_mismatch:['This program does not match the member’s goal, level, equipment or diet. Choose a compatible program.','ಈ ಪ್ರೋಗ್ರಾಂ ಸದಸ್ಯರ ಗುರಿ, ಮಟ್ಟ, ಉಪಕರಣ ಅಥವಾ ಆಹಾರಕ್ಕೆ ಹೊಂದುವುದಿಲ್ಲ. ಹೊಂದುವ ಪ್ರೋಗ್ರಾಂ ಆಯ್ಕೆ ಮಾಡಿ.'],
 program_equipment:['The workout uses equipment not recorded as available for this member.','ವರ್ಕೌಟ್‌ಗೆ ಬೇಕಾದ ಉಪಕರಣ ಸದಸ್ಯರಿಗೆ ಲಭ್ಯವಿಲ್ಲ.'],program_days:['The program has more training days than this member selected.','ಸದಸ್ಯರು ಆಯ್ಕೆ ಮಾಡಿದ ದಿನಗಳಿಗಿಂತ ಪ್ರೋಗ್ರಾಂನಲ್ಲಿ ಹೆಚ್ಚು ತರಬೇತಿ ದಿನ ಇದೆ.'],
 program_meals:['The menu meal count does not match the member’s quiz.','ಮೆನು ಊಟದ ಸಂಖ್ಯೆ ಸದಸ್ಯರ ಕ್ವಿಜ್‌ಗೆ ಹೊಂದುವುದಿಲ್ಲ.'],program_diet:['A menu ingredient does not match this member’s diet.','ಮೆನು ಆಹಾರ ಸದಸ್ಯರ ಆಹಾರ ಆಯ್ಕೆಗೆ ಹೊಂದುವುದಿಲ್ಲ.'],program_allergy:['A menu contains a declared allergen. Choose or edit a compatible program.','ಮೆನುನಲ್ಲಿ ಸದಸ್ಯರಿಗೆ ಅಲರ್ಜಿ ಇರುವ ಆಹಾರ ಇದೆ. ಹೊಂದುವ ಪ್ರೋಗ್ರಾಂ ಆಯ್ಕೆ ಮಾಡಿ.'],
 library_unavailable:['Series programs could not load. Retry or use the existing personalised plan option.','ಸೀರೀಸ್ ಪ್ರೋಗ್ರಾಂ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ವೈಯಕ್ತಿಕ ಪ್ಲ್ಯಾನ್ ಆಯ್ಕೆ ಬಳಸಿ.']
};
const message=(k,lang)=>messages[k]?.[lang==='kn'?1:0]||ptext(k,lang);
async function invoke(HF,body,fn){const {data,error}=await HF.sb.functions.invoke(fn,{body});let code=data?.error;if(error?.context?.json){try{code=(await error.context.json()).error;}catch{}}if(error||code)throw new Error(code||'plan_unavailable');return data;}
export async function mountPlanReviews(view,rows,nutritions,lang,HF){
 const token=(mounts.get(view)||0)+1;mounts.set(view,token);let library={series:[],programs:[]},libraryError=false;
 try{library=await createLibraryStore(HF).list();}catch{libraryError=true;}
 if(view.isConnected===false||mounts.get(view)!==token)return;
 const published=library.programs.filter(p=>p.status==='published'&&library.series.some(s=>s.id===p.series_id&&s.status==='published'));
 const esc=HF.esc,t=k=>esc(ptext(k,lang)),lt=(en,kn)=>esc(lang==='kn'?kn:en),preferred=new URLSearchParams(location.search).get('program');
 for(const r of rows){const card=view.querySelector('[data-user="'+r.user_id+'"]');if(!card)continue;card.querySelectorAll('.plan-review').forEach(x=>x.remove());
  const block=document.createElement('section');block.className='plan-review stack plan-page';card.append(block);
  const n=nutritions[r.user_id],key=r.user_id+'-'+r.revision,s=state[key]||={home_mode:'',note:'',day:0,preview:null,busy:false,approved:false,program_id:preferred||''};
  if(s.program_id&&!published.some(p=>p.id===s.program_id)){s.preview=null;s.approved=false;}
  const eligible=n?.intake_revision===r.revision&&r.review_status==='approved';
  function render(){
   const unavailable=!!s.program_id&&!published.some(p=>p.id===s.program_id);
   block.innerHTML='<h3>'+t('studioTitle')+'</h3>'+(!eligible?'<p class="hint">'+t('waiting')+'</p>':
    '<label class="field">'+lt('Program to assign','ನೀಡುವ ಪ್ರೋಗ್ರಾಂ')+'<select class="input" data-program><option value="">'+lt('Personalised HULK FIT plan','ವೈಯಕ್ತಿಕ HULK FIT ಪ್ಲ್ಯಾನ್')+'</option>'+(unavailable?'<option value="'+esc(s.program_id)+'" selected disabled>'+lt('Selected program unavailable','ಆಯ್ಕೆ ಮಾಡಿದ ಪ್ರೋಗ್ರಾಂ ಲಭ್ಯವಿಲ್ಲ')+'</option>':'')+published.map(p=>{const series=library.series.find(x=>x.id===p.series_id);return '<option value="'+esc(p.id)+'" '+(s.program_id===p.id?'selected':'')+'>'+esc((lang==='kn'&&series.title_kn||series.title)+' · '+(lang==='kn'&&p.title_kn||p.title))+'</option>';}).join('')+'</select></label>'+ (unavailable?'<p class="hint">'+esc(message('program_missing',lang))+'</p>':'')+(libraryError?'<p class="hint">'+esc(message('library_unavailable',lang))+'</p>':'')+'<a class="small" href="/studio#library">'+lt('Create or manage series & programs','ಸೀರೀಸ್ ಮತ್ತು ಪ್ರೋಗ್ರಾಂ ರಚಿಸಿ / ನಿರ್ವಹಿಸಿ')+'</a>'+
    (r.answers.equipment==='basic'?'<div class="field"><label for="kit-'+esc(r.user_id)+'">'+t('kit')+'</label><select class="input" id="kit-'+esc(r.user_id)+'" data-kit><option value="">'+t('choose')+'</option>'+['dumbbell','band'].map(k=>'<option value="'+k+'" '+(s.home_mode===k?'selected':'')+'>'+t(k)+'</option>').join('')+'</select></div>':'')+
    '<button class="btn" data-generate '+(s.busy||unavailable?'disabled':'')+'>'+t(s.busy?'generating':'generate')+'</button><p data-plan-error class="form-error" role="alert" hidden></p><div class="plan-preview">'+(s.preview?'<p class="pill">'+t(s.approved?'approved':'draft')+'</p><select class="input" data-preview-day aria-label="'+t('training')+'">'+days.map((d,i)=>'<option value="'+i+'" '+(s.day===i?'selected':'')+'>'+t(d)+'</option>').join('')+'</select>'+planHTML(s.preview,s.day,lang,esc)+'<div class="field"><label for="plan-note-'+esc(r.user_id)+'">'+t('note')+'</label><textarea class="input" id="plan-note-'+esc(r.user_id)+'" data-note maxlength="1000">'+esc(s.note)+'</textarea></div><label class="check-line"><input type="checkbox" data-confirm><span>'+t('confirm')+'</span></label><button class="btn acc" data-plan-approve '+(s.busy||s.preview.kind!=='complete'?'disabled':'')+'>'+t('publish')+'</button>':'')+'</div>');
   if(!eligible)return;
   const error=code=>{const el=block.querySelector('[data-plan-error]');el.textContent=message(code,lang);el.hidden=false;};
   const reset=()=>{s.preview=null;s.approved=false;render();};
   block.querySelector('[data-program]').onchange=e=>{s.program_id=e.target.value;reset();};
   block.querySelector('[data-kit]')?.addEventListener('change',e=>{s.home_mode=e.target.value;reset();});
   block.querySelector('[data-note]')?.addEventListener('input',e=>s.note=e.target.value);
   block.querySelector('[data-preview-day]')?.addEventListener('change',e=>{s.day=Number(e.target.value);render();});
   block.querySelector('[data-generate]').onclick=async()=>{
    if(s.busy||unavailable)return;if(r.answers.equipment==='basic'&&!s.home_mode){error('choose_home_kit');return;}s.busy=true;render();
    try{const data=await invoke(HF,{action:'preview',user_id:r.user_id,...(s.program_id?{program_id:s.program_id}:{}),options:{home_mode:s.home_mode||null}},s.program_id?'fitness-library':'fitness-plan');s.preview=data.plan;s.approved=false;s.busy=false;if(block.isConnected)render();}catch(e){s.busy=false;if(block.isConnected){render();error(e.message);}}
   };
   block.querySelector('[data-plan-approve]')?.addEventListener('click',async()=>{
    if(s.busy)return;if(!block.querySelector('[data-confirm]').checked){error('plan_confirmation');return;}
    const p=s.preview;s.busy=true;render();
    try{await invoke(HF,{action:'approve',user_id:r.user_id,revision:p.intake_revision,nutrition_approved_at:p.nutrition_approved_at,policy_version:PLAN_VERSION,...(s.program_id?{program_id:s.program_id,program_revision:p.program.revision,series_revision:p.program.series_revision}:{}),options:{home_mode:s.home_mode||null},plan_confirmed:true,note:s.note},s.program_id?'fitness-library':'fitness-plan');s.busy=false;s.approved=true;if(block.isConnected)render();HF.toast(ptext('saved',lang));}catch(e){s.busy=false;if(block.isConnected){render();error(e.message);}}
   });
   if(s.busy)block.querySelectorAll('input,select,textarea,button').forEach(n=>n.disabled=true);
  }
  render();
 }
}
