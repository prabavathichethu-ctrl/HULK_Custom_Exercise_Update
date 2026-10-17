import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'CHANGE_MANIFEST.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
function main(){
 if(!process.argv[2])throw Error('Usage: node tools/apply-update.mjs "C:\\path\\to\\existing-hulk-project"');
 const project=path.resolve(process.argv[2]),writes=[];
 const safe=name=>{if(typeof name!=='string'||name.includes('..')||path.isAbsolute(name)||!name.startsWith('public/assets/')&&!name.startsWith('supabase/functions/'))throw Error('Invalid manifest path');return path.join(project,name);};
 for(const check of manifest.protected_dependencies){const file=safe(check.path);if(!fs.existsSync(file)||hash(fs.readFileSync(file))!==check.sha256)throw Error('Protected dependency differs: '+check.path+'. No files changed. Review newer source and merge carefully.');}
 for(const entry of manifest.files){
  const file=safe(entry.path),source=path.join(root,entry.path),bytes=fs.readFileSync(source);
  if(hash(bytes)!==entry.after_sha256)throw Error('Package integrity check failed: '+entry.path);
  const original=fs.existsSync(file)?fs.readFileSync(file):null,current=original?hash(original):null;
  if(current===entry.after_sha256)continue;
  if(current!==entry.before_sha256)throw Error('Newer/different local file: '+entry.path+'. No files changed. Use changes.diff for a focused merge; preserve newer work.');
  writes.push({file,bytes,original,entry});
 }
 if(!writes.length){console.log('Custom exercise update is already installed. No files changed.');return;}
 const backup=path.join(project,'backups','custom-exercises-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(3).toString('hex'));
 fs.mkdirSync(backup,{recursive:true});
 for(const w of writes)if(w.original){const f=path.join(backup,w.entry.path);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,w.original,{flag:'wx'});}
 fs.writeFileSync(path.join(backup,'CREATED_FILES.json'),JSON.stringify(writes.filter(w=>!w.original).map(w=>w.entry.path),null,2));
 console.log('Backup: '+backup);
 for(const w of writes){fs.mkdirSync(path.dirname(w.file),{recursive:true});const temp=w.file+'.custom-exercises-'+randomBytes(3).toString('hex');fs.writeFileSync(temp,w.bytes,{flag:'wx',...(w.original?{mode:fs.statSync(w.file).mode}:{})});fs.renameSync(temp,w.file);if(hash(fs.readFileSync(w.file))!==w.entry.after_sha256)throw Error('Write verification failed: '+w.entry.path);}
 console.log('Installed and verified '+writes.length+' files. No database writes or deployments. Backend support is already active; read BACKEND_STATUS.json.');
}
try{main();}catch(e){console.error(e.message);process.exitCode=1;}
