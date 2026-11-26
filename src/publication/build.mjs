import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from '../genealogy/validate.mjs';
import {read,write,hash,receipt,validateProject} from '../workspace/store.mjs';
import {requireResearch} from '../workspace/research.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateSelection(s,data) {
  if(!Array.isArray(s.personIds)||!Array.isArray(s.factIds)) throw Error('Selection needs personIds and factIds');
  const selected=new Set(s.personIds);
  if([...selected].some(id=>!data.people.some(p=>p.id===id))) throw Error('Unknown selected person');
  if(s.familyIds!==undefined&&!Array.isArray(s.familyIds)) throw Error('familyIds must be an array');
  const families=(s.familyIds||[]).map(id=>{
    const f=(data.families||[]).find(f=>f.id===id);
    if(!f) throw Error('Unknown selected family');
    if(!f.partners.some(id=>selected.has(id))&&!f.children.some(id=>selected.has(id))) throw Error('Selected family has no visible members');
    return f;
  });
  const allowed=new Set(data.people.filter(p=>selected.has(p.id)).flatMap(p=>p.facts.map(f=>f.id)));
  for(const f of families) {
    // A marriage/divorce can reveal an excluded partner. Require all partners.
    if(f.partners.length && f.partners.every(id=>selected.has(id))) for(const e of f.events) allowed.add(e.id);
  }
  if(s.factIds.some(id=>!allowed.has(id))) throw Error('Selected fact is unknown or belongs to an excluded person');
}
export function build(root) {
  const research=requireResearch(root);
  const project=read(root,'project.json');validateProject(project);
  const data=validate(read(root,'data/accepted.json')),approval=read(root,'publication/selection.json');
  const fingerprint=hash({project,data});
  if(approval.inputHash!==fingerprint) throw Error('Publication selection is stale; review it again');
  if(approval.researchFingerprint!==research.fingerprint) throw Error('Research changed; review publication selection again');
  validateSelection(approval,data);
  const selected=new Set(approval.personIds);
  const families=(data.families||[]).filter(f=>(approval.familyIds||[]).includes(f.id)).map(f=>({id:f.id,partners:f.partners.filter(id=>selected.has(id)),children:f.children.filter(id=>selected.has(id)),events:f.events.filter(e=>approval.factIds.includes(e.id)).map(({type,value,date,place})=>({type,value,date,place}))}));
  const visible=data.people.filter(p=>selected.has(p.id)).map(p=>({id:p.id,name:p.name,parents:data.schemaVersion===2?[...new Set(families.filter(f=>f.children.includes(p.id)).flatMap(f=>f.partners))]:p.parents.filter(id=>selected.has(id)),facts:p.facts.filter(f=>approval.factIds.includes(f.id)).map(({type,value})=>({type,value}))}));
  const labels=project.language==='he'?{birth:'לידה',death:'פטירה',marriage:'נישואים',divorce:'גירושים',parents:'הורים',family:'משפחה',partners:'בני זוג',children:'ילדים'}:{birth:'Birth',death:'Death',marriage:'Marriage',divorce:'Divorce',parents:'Parents',family:'Family',partners:'Partners',children:'Children'};
  const links=ids=>ids.map(id=>`<a href="#${escape(id)}">${escape(visible.find(x=>x.id===id).name)}</a>`).join(', ');
  const familyTitle=f=>f.partners.length?f.partners.map(id=>visible.find(p=>p.id===id).name).join(' · '):labels.family;
  const peopleHtml=visible.map(p=>`<article id="${escape(p.id)}"><h2>${escape(p.name)}</h2>${p.facts.map(f=>`<p><strong>${escape(labels[f.type]||f.type)}</strong>: ${escape(f.value)}</p>`).join('')}${p.parents.length?`<p>${labels.parents}: ${links(p.parents)}</p>`:''}${families.filter(f=>f.partners.includes(p.id)||f.children.includes(p.id)).map(f=>`<p><a href="#family-${escape(f.id)}">${labels.family}: ${escape(familyTitle(f))}</a></p>`).join('')}</article>`).join('\n');
  const familyHtml=families.map(f=>`<section class="family" id="family-${escape(f.id)}"><h2>${labels.family}: ${escape(familyTitle(f))}</h2>${f.partners.length?`<p>${labels.partners}: ${links(f.partners)}</p>`:''}${f.children.length?`<p>${labels.children}: ${links(f.children)}</p>`:''}${f.events.map(e=>`<p><strong>${labels[e.type]}</strong>${[e.date,e.place,e.value && e.value!=='Y'?e.value:null].filter(Boolean).map(x=>`: ${escape(x)}`).join('')}</p>`).join('')}</section>`).join('\n');
  const body=peopleHtml+familyHtml;
  const template=fs.readFileSync(fileURLToPath(new URL('../../website/index.html',import.meta.url)),'utf8');
  // Replace markers once through a callback so family text cannot become template syntax.
  const replacements={LANG:project.language,DIR:project.language==='he'?'rtl':'ltr',TITLE:escape(project.title),BODY:body};
  const html=template.replace(/\{\{(LANG|DIR|TITLE|BODY)\}\}/g,(_,key)=>replacements[key]);
  const out=path.join(root,'build');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'index.html'),html,{mode:0o600});
  write(root,'build/publication.json',{title:project.title,people:visible,families});
  receipt(root,'preview',fingerprint,hash(html));return path.join(out,'index.html');
}
