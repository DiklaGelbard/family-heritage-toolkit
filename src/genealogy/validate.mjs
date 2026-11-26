export function validate(data) {
  if(![1,2].includes(data.schemaVersion) || !Array.isArray(data.people) || !Array.isArray(data.sources)) throw Error('Unsupported dataset');
  const ids=new Set(),sources=new Set(),factIds=new Set();
  for(const s of data.sources) {if(!s.id || sources.has(s.id)) throw Error('Duplicate/missing source ID'); sources.add(s.id);}
  for(const p of data.people) {
    if(typeof p.id!=='string' || !/^[\w.-]+$/.test(p.id) || ids.has(p.id) || typeof p.name!=='string' || !p.name.trim()) throw Error('Duplicate/missing person identity');
    ids.add(p.id);
    if(!Array.isArray(p.facts) || !Array.isArray(p.parents)) throw Error('Missing facts or parents');
    for(const f of p.facts) {
      if(typeof f.id!=='string' || factIds.has(f.id)) throw Error('Duplicate/missing fact ID');
      factIds.add(f.id);
      if(typeof f.type!=='string' || typeof f.value!=='string' || !f.citation || !sources.has(f.citation.sourceId) || typeof f.citation.locator!=='string') throw Error('Fact without valid source citation');
    }
  }
  if(data.schemaVersion===1 && data.families!==undefined) throw Error('Use schemaVersion 2 for family records');
  if(data.schemaVersion===2) {
    if(!Array.isArray(data.families)) throw Error('Missing families');
    const familyIds=new Set(),derived=new Map(data.people.map(p=>[p.id,new Set()]));
    for(const f of data.families) {
      if(typeof f.id!=='string'|| !/^[\w.-]+$/.test(f.id)||ids.has(f.id)||familyIds.has(f.id)) throw Error('Duplicate/invalid family ID');
      familyIds.add(f.id);
      if(!f.citation||!sources.has(f.citation.sourceId)||typeof f.citation.locator!=='string') throw Error('Family without valid citation');
      for(const key of ['partners','children']) {
        if(!Array.isArray(f[key])||new Set(f[key]).size!==f[key].length||f[key].some(id=>!ids.has(id))) throw Error(`Invalid family ${key}`);
      }
      if(f.children.some(id=>f.partners.includes(id))) throw Error('Person cannot be partner and child in same family');
      if(!Array.isArray(f.events)) throw Error('Missing family events');
      for(const e of f.events) {
        if(typeof e.id!=='string'||factIds.has(e.id)) throw Error('Duplicate/missing family event ID');factIds.add(e.id);
        if(!['marriage','divorce'].includes(e.type)||typeof e.value!=='string'||![e.date,e.place].every(x=>x===null||typeof x==='string')) throw Error('Invalid family event');
        if(!e.citation||!sources.has(e.citation.sourceId)||typeof e.citation.locator!=='string') throw Error('Family event without valid citation');
      }
      for(const child of f.children) for(const parent of f.partners) derived.get(child).add(parent);
    }
    for(const p of data.people) if(JSON.stringify([...new Set(p.parents)].sort())!==JSON.stringify([...derived.get(p.id)].sort())) throw Error('Parent links must match family membership');
  }
  for(const p of data.people) for(const id of p.parents) if(!ids.has(id) || id===p.id) throw Error('Invalid parent reference');
  const visited=new Set();
  function visit(id, trail=new Set()) {
    if(trail.has(id)) throw Error('Ancestry cycle');
    if(visited.has(id)) return;
    const next=new Set(trail).add(id);
    for(const parent of data.people.find(p=>p.id===id).parents) visit(parent,next);
    visited.add(id);
  }
  for(const p of data.people) visit(p.id);
  return data;
}
