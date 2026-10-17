import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.HULK_DOM_MODULE||'linkedom');
const base=path.resolve(process.env.HULK_SITE_ROOT||new URL('../public',import.meta.url).pathname);
globalThis.location={search:''};
const custom=await import(pathToFileURL(path.join(base,'assets/custom-exercises.mjs')));
const engine=await import(pathToFileURL(path.join(base,'assets/studio-program-engine.mjs')));
const ui=await import(pathToFileURL(path.join(base,'assets/plan-ui.mjs')));
const {createLibraryHandler}=await import(new URL('../supabase/functions/fitness-library/handler.mjs',import.meta.url));
const fixture=JSON.parse(fs.readFileSync(new URL('fixtures.json',import.meta.url)));
const clone=x=>structuredClone(x),id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function entry(){return {id:'custom_'+id(80),sets:3,reps:'8–12',rest_seconds:90,reps_in_reserve:2,custom:{...custom.newCustomDefinition(),en:'Owner cable fly',kn:'ಕೋಚ್ ಕೇಬಲ್ ಫ್ಲೈ',equipment:'gym',cues:{en:['Use a controlled movement.'],kn:['ನಿಯಂತ್ರಿತವಾಗಿ ಚಲಿಸಿ.']},muscles:{primary:['chest'],secondary:['front_delts'],stabilisers:['core']}}};}
function series(){return {id:id(20),code:'custom_demo',title:'Custom demo',title_kn:'ಡೆಮೋ',status:'published',sort_order:0,description:'',description_kn:'',cover_path:null,revision:1};}
let seq=0;
async function setup(){
 const lib=await import(pathToFileURL(path.join(base,'assets/studio-library.mjs')).href+'?custom-test='+(++seq));
 const {document}=parseHTML('<html><body><div id="root"></div></body></html>');globalThis.document=document;
 const el=document.getElementById('root'),rows={series:[series()],programs:[]},calls=[];
 const store={list:async()=>clone(rows),coverURL:()=>null,saveProgram:async p=>{engine.validateProgram(p,p.status==='published');calls.push(clone(p));const saved={...clone(p),id:p.id||id(30),revision:(p.revision||0)+1},at=rows.programs.findIndex(x=>x.id===saved.id);if(at<0)rows.programs.push(saved);else rows.programs[at]=saved;return saved;}};
 const controller=await lib.mountStudioLibrary(el,{esc,toast(){}},'en',store);
 return {lib,el,rows,calls,controller};
}
function input(el,sel,value,event='input'){const n=el.querySelector(sel);assert.ok(n,sel);if(n.tagName==='SELECT')Object.defineProperty(n,'value',{value:String(value),configurable:true});else n.value=String(value);n.dispatchEvent(new (el.ownerDocument.defaultView.Event)(event,{bubbles:true}));}
function submit(el){el.querySelector('form').dispatchEvent(new (el.ownerDocument.defaultView.Event)('submit',{bubbles:true,cancelable:true}));}
const flush=()=>new Promise(r=>setTimeout(r,0));
function program(e=entry()){
 const sessions=Array.from({length:7},(_,day)=>({day,kind:'rest',title:'',minutes:20,exercises:[]}));sessions[0]={day:0,kind:'strength',title:'Owner chest day',exercises:[e]};
 return {id:id(30),series_id:id(20),revision:1,title:'Coach-built plan',title_kn:'ಕೋಚ್ ಪ್ಲ್ಯಾನ್',description:'',description_kn:'',duration_days:77,goal:'any',experience:'any',equipment:'any',diet_pref:'any',status:'published',sort_order:0,content:{version:engine.LIBRARY_VERSION,workout:{mode:'custom',note:'',sessions},diet:{mode:'personalized',note:''}}};
}
const build=(p=program(),i=fixture.intake,n=fixture.nutrition,options={})=>engine.buildLibraryPlan(clone(i),clone(n),clone(p),series(),options);

test('manual definition supports arbitrary owner names, selected equipment and valid muscle groups',()=>{
 assert.equal(custom.validateExerciseDefinition(entry()).en,'Owner cable fly');assert.doesNotThrow(()=>engine.validateProgram(program()));
 const d=entry();d.custom.en='My exercise not in the fixed catalogue';assert.equal(custom.validateExerciseDefinition(d).en,d.custom.en);
});
test('malformed names, equipment, IDs, muscle lists and oversized notes are rejected',()=>{
 const changes=[e=>e.id='not_a_catalogue_id',e=>e.id='squat',e=>e.custom.en='',e=>e.custom.en='x'.repeat(121),e=>e.custom.equipment='flying',e=>e.custom.muscles.primary=[],e=>e.custom.muscles.primary=['unknown'],e=>e.custom.muscles.secondary=['chest'],e=>e.custom.muscles.primary='chest',e=>e.custom.cues.en=Array(7).fill('Note'),e=>e.custom.cues.en=['x'.repeat(301)],e=>e.custom.html='<script>',e=>e.custom.version='wrong'];
 for(const change of changes){const e=entry();change(e);assert.throws(()=>custom.validateExerciseDefinition(e),/custom_exercise_fields/);}
});
test('incomplete manual exercise can be saved in a draft, but cannot be published or assigned',()=>{
 const e=entry();e.custom=custom.newCustomDefinition();const p=program(e);p.status='draft';assert.doesNotThrow(()=>engine.validateProgram(p,false));assert.throws(()=>engine.validateProgram(p,true),/custom_exercise_fields/);assert.throws(()=>build(p),/custom_exercise_fields/);
});
test('assigned custom exercise stores a deep snapshot and strips unsupported prescription properties',()=>{
 const p=program();p.content.workout.sessions[0].exercises[0].actor='forged';const plan=engine.buildLibraryPlan(clone(fixture.intake),clone(fixture.nutrition),p,series());const saved=plan.workout.sessions[0].exercises[0];
 assert.equal(saved.custom.en,'Owner cable fly');assert.equal(saved.actor,undefined);p.content.workout.sessions[0].exercises[0].custom.en='Changed later';p.content.workout.sessions[0].exercises[0].custom.muscles.primary.push('biceps');assert.equal(saved.custom.en,'Owner cable fly');assert.deepEqual(saved.custom.muscles.primary,['chest']);assert.deepEqual(JSON.parse(JSON.stringify(saved)).custom,saved.custom);
});
test('manual exercise equipment, time and member-readiness checks are still enforced',()=>{
 const i=clone(fixture.intake);i.answers.equipment='bodyweight';assert.throws(()=>build(program(),i),/program_equipment/);
 const medical=clone(fixture.intake);medical.answers.health_review=true;assert.throws(()=>build(program(),medical),/specialist_review/);
 const p=program();p.content.workout.sessions[0].exercises=Array.from({length:12},()=>({...entry(),sets:6,rest_seconds:300}));assert.throws(()=>build(p),/session_review/);
});
test('member rendering uses saved names, notes, muscle pictures, set buttons and rest timers',()=>{
 const plan=build();const {document}=parseHTML('<div id="root"></div>');const el=document.getElementById('root');el.innerHTML=ui.planHTML(plan,0,'en',esc,true);
 assert.ok(el.textContent.includes('Owner cable fly'));assert.ok(el.textContent.includes('Use a controlled movement.'));assert.equal(el.querySelectorAll('[data-set]').length,3);assert.equal(el.querySelector('[data-rest]').getAttribute('data-rest'),'90');assert.ok(el.querySelector('[data-muscle-map^="custom_"] svg'));
 el.innerHTML=ui.planHTML(plan,0,'kn',esc,true);assert.ok(el.textContent.includes('ಕೋಚ್ ಕೇಬಲ್ ಫ್ಲೈ'));assert.ok(el.textContent.includes('ನಿಯಂತ್ರಿತವಾಗಿ ಚಲಿಸಿ.'));
});
test('manual names and coaching notes are escaped; unmapped historical exercises render a review fallback',()=>{
 const p=program();const e=p.content.workout.sessions[0].exercises[0];e.custom.en='<img src=x onerror=1>';e.custom.cues.en=['<script>alert(1)</script>'];const plan=build(p),{document}=parseHTML('<div id="root"></div>'),el=document.getElementById('root');el.innerHTML=ui.planHTML(plan,0,'en',esc,true);assert.ok(!el.querySelector('img,script'));assert.ok(el.textContent.includes('<img'));plan.workout.sessions[0].exercises[0]={...entry(),id:'missing_historical_id',custom:undefined};assert.doesNotThrow(()=>{el.innerHTML=ui.planHTML(plan,0,'en',esc,true);});assert.ok(el.textContent.includes('coach review needed'));
});
test('owner can type a new exercise, select primary/secondary muscles, save and reopen the same program',async()=>{
 const {el,rows,calls}=await setup();el.querySelector('[data-program-new-series]').click();input(el,'[data-field=title]','My manual workout');el.querySelector('[data-ex-create]').click();
 input(el,'[data-custom-key=en]','My landmine press');input(el,'[data-custom-key=kn]','ನನ್ನ ಲ್ಯಾಂಡ್‌ಮೈನ್ ಪ್ರೆಸ್');input(el,'[data-custom-key=equipment]','gym','change');input(el,'[data-custom-key=cues_en]','Keep the torso steady.\nUse a controlled range.');
 input(el,'[data-muscle-add][data-muscle-role=primary]','front_delts','change');input(el,'[data-muscle-add][data-muscle-role=secondary]','triceps','change');input(el,'[data-ex-key=sets]',4);assert.ok(el.querySelector('[data-muscle-map^="custom_"] svg'));assert.equal(calls.length,0);
 submit(el);await flush();assert.equal(calls.length,1);assert.equal(rows.programs[0].content.workout.sessions[0].exercises[0].custom.en,'My landmine press');el.querySelector('[data-program-edit]').click();assert.equal(el.querySelector('[data-custom-key=en]').value,'My landmine press');assert.equal(el.querySelector('[data-ex-key=sets]').value,'4');assert.ok(el.textContent.includes('Front shoulders'));
});
test('switching an existing row to a manual exercise preserves sets and choosing a preset removes custom data',async()=>{
 const {el}=await setup();el.querySelector('[data-program-new-series]').click();el.querySelector('[data-ex-add]').click();input(el,'[data-ex-key=sets]',5);input(el,'[data-ex-key=id]','__custom__','change');assert.ok(el.querySelector('[data-custom-key=en]'));assert.equal(el.querySelector('[data-ex-key=sets]').value,'5');input(el,'[data-custom-key=en]','Owner variation');input(el,'[data-ex-key=id]','db_row','change');assert.ok(!el.querySelector('[data-custom-key=en]'));assert.equal(el.querySelector('[data-ex-key=sets]').value,'5');
});
test('manual draft inputs survive day/language changes and primary/secondary groups stay disjoint',async()=>{
 const {el,controller}=await setup();el.querySelector('[data-program-new-series]').click();el.querySelector('[data-ex-create]').click();input(el,'[data-custom-key=en]','Manual row');input(el,'[data-muscle-add][data-muscle-role=primary]','lats','change');input(el,'[data-muscle-add][data-muscle-role=secondary]','lats','change');assert.ok(!el.querySelector('[data-muscle-remove][data-muscle-role=primary]'));assert.ok(el.querySelector('[data-muscle-remove][data-muscle-role=secondary]'));
 el.querySelector('[data-workout-day="1"]').click();el.querySelector('[data-workout-day="0"]').click();controller.setLang('kn');assert.equal(el.querySelector('[data-custom-key=en]').value,'Manual row');assert.ok(el.querySelector('[data-ex-create]').textContent.includes('ಸ್ವಂತ'));el.querySelector('[data-muscle-remove]').click();assert.ok(!el.querySelector('[data-muscle-remove]'));
});

function backend(p=program(),denied=false){
 const calls=[];
 const fetcher=async(url,init={})=>{calls.push({url,init});let data;if(url.endsWith('/auth/v1/user'))data={id:id(99),is_anonymous:false};else if(url.includes('/staff?'))data=denied?[]:[{id:99}];else if(url.includes('/members?'))data=[{id:1,is_active:true,expiry_date:'2027-12-31'}];else if(url.includes('/training_programs?'))data=[p];else if(url.includes('/training_series?'))data=[series()];else if(url.includes('/fitness_intakes?'))data=[fixture.intake];else if(url.includes('/nutrition_assignments?'))data=[fixture.nutrition];else if(url.includes('/rpc/approve_library_plan'))data=JSON.parse(init.body);else throw Error('Unexpected URL');return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});};
 const handle=createLibraryHandler({url:'https://backend.invalid',key:'synthetic-secret',fetcher,now:()=>new Date('2026-10-16T06:00:00Z')});
 const request=body=>handle(new Request('https://function.invalid',{method:'POST',headers:{Origin:'https://hulkfitnessarena.in',Authorization:'Bearer synthetic-token'},body:JSON.stringify(body)}));return {calls,request};
}
test('backend recomputes manual exercise definitions from the stored program and ignores submitted replacements',async()=>{
 const b=backend();const body={action:'preview',user_id:fixture.intake.user_id,program_id:id(30),plan:{workout:{custom:'forged'}},custom:{en:'Forged exercise'}};const r=await b.request(body);assert.equal(r.status,200);assert.equal((await r.json()).plan.workout.sessions[0].exercises[0].custom.en,'Owner cable fly');
 const approve=await b.request({...body,action:'approve',plan_confirmed:true,program_revision:1,series_revision:1,revision:fixture.intake.revision,nutrition_approved_at:fixture.nutrition.approved_at});assert.equal(approve.status,200);const rpc=JSON.parse(b.calls.find(c=>c.url.includes('/rpc/')).init.body);assert.equal(rpc.p_plan.workout.sessions[0].exercises[0].custom.en,'Owner cable fly');assert.ok(!JSON.stringify(rpc).includes('Forged exercise'));
});
test('backend rejects invalid manual definitions and non-owner access without assignment writes',async()=>{
 const bad=program();bad.content.workout.sessions[0].exercises[0].custom.muscles.primary=['imaginary'];let b=backend(bad);const body={action:'preview',user_id:fixture.intake.user_id,program_id:id(30)};const r=await b.request(body);assert.equal(r.status,422);assert.equal((await r.json()).error,'custom_exercise_fields');assert.ok(!b.calls.some(c=>c.url.includes('/rpc/')));b=backend(program(),true);assert.equal((await b.request(body)).status,403);assert.ok(!b.calls.some(c=>c.url.includes('/training_programs?')));
});
