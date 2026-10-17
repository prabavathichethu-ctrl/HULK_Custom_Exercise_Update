import {buildLibraryPlan,UUID} from '../_shared/studio-program-engine.mjs';
const ORIGINS=['https://hulkfitnessarena.in','https://www.hulkfitnessarena.in','https://hulk-fitness-1bab2.web.app','https://hulk-fitness-1bab2.firebaseapp.com','http://localhost:5000','http://127.0.0.1:5000'];
export function createLibraryHandler({url,key,fetcher=fetch,now=()=>new Date()}){
 return async req=>{
  const origin=req.headers.get('Origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
  if(ORIGINS.includes(origin))headers['Access-Control-Allow-Origin']=origin;
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!ORIGINS.includes(origin))return reply(403,{error:'origin_blocked'});if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply(405,{error:'method_blocked'});
  if(!url||!key)return reply(503,{error:'library_unavailable'});const token=req.headers.get('Authorization')||'';if(!/^Bearer\s+\S+$/i.test(token))return reply(401,{error:'login_required'});
  try{
   const auth=await fetcher(url+'/auth/v1/user',{headers:{apikey:key,Authorization:token}});if(!auth.ok)return reply(401,{error:'login_required'});const actor=await auth.json();if(!UUID.test(actor.id||'')||actor.is_anonymous)return reply(401,{error:'login_required'});
   const raw=await req.text();if(raw.length>6000)return reply(413,{error:'request_large'});let b;try{b=JSON.parse(raw);}catch{return reply(400,{error:'invalid_request'});}
   if(!b||Array.isArray(b)||!['preview','approve'].includes(b.action)||!UUID.test(b.user_id||'')||!UUID.test(b.program_id||''))return reply(400,{error:'invalid_request'});
   const rest=async(path,method='GET',body)=>{const r=await fetcher(url+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});let data;try{data=await r.json();}catch{data=null;}if(!r.ok){const e=new Error('database');e.code=data?.code;throw e;}return data;};
   const owner=await rest('staff?select=id&user_id=eq.'+actor.id+'&role=eq.owner&is_active=eq.true&limit=1');if(!owner?.length)return reply(403,{error:'owner_required'});
   const member=(await rest('members?select=id,is_active,expiry_date&user_id=eq.'+b.user_id+'&limit=1'))?.[0],today=new Date(now().getTime()+330*60000).toISOString().slice(0,10);
   if(!member?.is_active||!member.expiry_date||member.expiry_date<today)return reply(403,{error:'membership_required'});
   const [ps,is,ns]=await Promise.all([rest('training_programs?select=*&id=eq.'+b.program_id+'&limit=1'),rest('fitness_intakes?select=*&user_id=eq.'+b.user_id+'&limit=1'),rest('nutrition_assignments?select=*&user_id=eq.'+b.user_id+'&limit=1')]);
   const p=ps?.[0],i=is?.[0],n=ns?.[0];if(!p)return reply(404,{error:'program_missing'});if(!i)return reply(422,{error:'quiz_required'});
   const series=(await rest('training_series?select=*&id=eq.'+p.series_id+'&limit=1'))?.[0];if(!series)return reply(404,{error:'series_missing'});
   const options=b.options||{};if(typeof options!=='object'||Array.isArray(options)||options.home_mode&&!['dumbbell','band'].includes(options.home_mode))return reply(400,{error:'choose_home_kit'});
   const plan=buildLibraryPlan(i,n,p,series,options);if(plan.program.cover_path)plan.program.cover_url=url+'/storage/v1/object/public/hulk-series/'+plan.program.cover_path;
   if(b.action==='preview')return reply(200,{plan});
   if(b.plan_confirmed!==true)return reply(400,{error:'plan_confirmation'});
   if(b.program_revision!==p.revision||b.series_revision!==series.revision||b.revision!==i.revision||!Number.isFinite(Date.parse(b.nutrition_approved_at))||Date.parse(b.nutrition_approved_at)!==Date.parse(n?.approved_at))return reply(409,{error:'library_changed'});
   if(plan.kind!=='complete')return reply(422,{error:plan.meals.reason});const note=typeof b.note==='string'?b.note.trim():'';if(note.length>1000)return reply(400,{error:'note_long'});
   // Recompute from saved library + current intake/targets. Submitted plans/actors are ignored.
   const saved=await rest('rpc/approve_library_plan','POST',{p_owner_id:actor.id,p_user_id:b.user_id,p_revision:i.revision,p_nutrition_approved_at:n.approved_at,p_program_id:p.id,p_program_revision:p.revision,p_series_revision:series.revision,p_plan:plan,p_note:note});return reply(200,{assignment:saved});
  }catch(e){if(e.code==='PT409')return reply(409,{error:'library_changed'});if(e.code==='42501')return reply(403,{error:'owner_required'});if(e.code==='PT422')return reply(422,{error:'individual_review'});if(e.code&&e.code!=='database')return reply(422,{error:e.code});return reply(503,{error:'library_unavailable'});}
 };
}
