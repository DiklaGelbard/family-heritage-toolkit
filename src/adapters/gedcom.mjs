// Deliberately limited GEDCOM subset. Callers preserve the original bytes.
export function parseGedcom(text, sourceId) {
  const people=[],families=[],warnings=[];
  let person=null,family=null,event=null;
  for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)) {
    if(!line.trim()) continue;
    const m=line.match(/^(\d+) (?:(@[^@]+@) )?(\S+)(?: (.*))?$/);
    if(!m) throw Error(`Malformed GEDCOM line: ${line}`);
    const [,level,xref,tag,raw='']=m, n=Number(level);
    if(n===0) {
      person=null;family=null;event=null;
      if(tag==='INDI') {person={id:xref?.slice(1,-1),name:'',parents:[],facts:[]};people.push(person);}
      else if(tag==='FAM') {family={id:xref?.slice(1,-1),partners:[],children:[],events:[],citation:{sourceId,locator:xref?.slice(1,-1)}};families.push(family);}
      else if(!['HEAD','TRLR'].includes(tag)) warnings.push(`Record ${tag} retained in original only`);
      continue;
    }
    if(person) {
      if(n===1) event=null;
      if(tag==='NAME' && n===1 && !person.name) person.name=raw.replaceAll('/','').trim();
      else if(n===1 && ['BIRT','DEAT'].includes(tag)) {
        event=tag;
        if(tag==='DEAT') person.facts.push({id:`${person.id}-DEAT-${person.facts.length}`,type:'death',value:raw||'Y',citation:{sourceId,locator:`${person.id}/DEAT`}});
      }
      else if(tag==='DATE' && event && n===2) {
        if(event==='DEAT') {const fact=person.facts.at(-1);fact.value=raw;fact.citation.locator=`${person.id}/DEAT/DATE`;}
        else person.facts.push({id:`${person.id}-${event}-${person.facts.length}`,type:'birth',value:raw,citation:{sourceId,locator:`${person.id}/${event}/DATE`}});
      }
      else warnings.push(`${person.id}: ${tag} retained in original only`);
    } else if(family) {
      if(n===1) event=null;
      if(n===1 && ['HUSB','WIFE'].includes(tag)) family.partners.push(raw.replaceAll('@',''));
      else if(n===1 && tag==='CHIL') family.children.push(raw.replaceAll('@',''));
      else if(n===1 && ['MARR','DIV'].includes(tag)) {
        event={id:`${family.id}-${tag}-${family.events.length}`,type:tag==='MARR'?'marriage':'divorce',value:raw,date:null,place:null,citation:{sourceId,locator:`${family.id}/${tag}`}};
        family.events.push(event);
      } else if(n===2 && event && ['DATE','PLAC'].includes(tag)) event[tag==='DATE'?'date':'place']=raw;
      else warnings.push(`${family.id}: ${tag} retained in original only`);
    }
  }
  if(!people.length) throw Error('No people found in GEDCOM');
  for(const f of families) for(const id of f.children) {
    const p=people.find(p=>p.id===id);if(!p) throw Error(`Missing child ${id}`);
    p.parents=[...new Set([...p.parents,...f.partners])];
  }
  warnings.push('Subset import: names, birth/death dates, FAM partners/children and MARR/DIV dates/places. Other fields remain in original. Parent links do not assert biological parentage; adoption/pedigree qualifiers require review. A family alone does not establish marriage.');
  return {schemaVersion:2,people,families,sources:[{id:sourceId,title:'Imported GEDCOM'}],warnings};
}
export const capabilities={read:true,write:false,formats:['GEDCOM subset','toolkit JSON']};
