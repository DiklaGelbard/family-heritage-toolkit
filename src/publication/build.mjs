import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from '../genealogy/validate.mjs';
import {read,write,hash,receipt,validateProject} from '../workspace/store.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateSelection(s,data) {
  if(!Array.isArray(s.personIds)||!Array.isArray(s.factIds)) throw Error('Selection needs personIds and factIds');
  const selected=new Set(s.personIds);
  if([...selected].some(id=>!data.people.some(p=>p.id===id))) throw Error('Unknown selected person');
  const allowed=new Set(data.people.filter(p=>selected.has(p.id)).flatMap(p=>p.facts.map(f=>f.id)));
  if(s.factIds.some(id=>!allowed.has(id))) throw Error('Selected fact is unknown or belongs to an excluded person');
}
export function build(root) {
  const project=read(root,'project.json');validateProject(project);
  const data=validate(read(root,'data/accepted.json')),approval=read(root,'publication/selection.json');
  const fingerprint=hash({project,data});
  if(approval.inputHash!==fingerprint) throw Error('Publication selection is stale; review it again');
  validateSelection(approval,data);
  const selected=new Set(approval.personIds);
  const visible=data.people.filter(p=>selected.has(p.id)).map(p=>({id:p.id,name:p.name,parents:p.parents.filter(id=>selected.has(id)),facts:p.facts.filter(f=>approval.factIds.includes(f.id)).map(({type,value})=>({type,value}))}));
  const labels=project.language==='he'?{birth:'לידה',death:'פטירה'}:{birth:'Birth',death:'Death'};
  const body=visible.map(p=>`<article id="${escape(p.id)}"><h2>${escape(p.name)}</h2>${p.facts.map(f=>`<p><strong>${escape(labels[f.type]||f.type)}</strong>: ${escape(f.value)}</p>`).join('')}${p.parents.length?`<p>${project.language==='he'?'הורים':'Parents'}: ${p.parents.map(id=>`<a href="#${escape(id)}">${escape(visible.find(x=>x.id===id).name)}</a>`).join(', ')}</p>`:''}</article>`).join('\n');
  const template=fs.readFileSync(fileURLToPath(new URL('../../website/index.html',import.meta.url)),'utf8');
  // Replace markers once through a callback so family text cannot become template syntax.
  const replacements={LANG:project.language,DIR:project.language==='he'?'rtl':'ltr',TITLE:escape(project.title),BODY:body};
  const html=template.replace(/\{\{(LANG|DIR|TITLE|BODY)\}\}/g,(_,key)=>replacements[key]);
  const out=path.join(root,'build');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'index.html'),html,{mode:0o600});
  write(root,'build/publication.json',{title:project.title,people:visible});
  receipt(root,'preview',fingerprint,hash(html));return path.join(out,'index.html');
}
