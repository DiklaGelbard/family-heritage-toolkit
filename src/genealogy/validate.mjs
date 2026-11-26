export function validate(data) {
  if(data.schemaVersion!==1 || !Array.isArray(data.people) || !Array.isArray(data.sources)) throw Error('Unsupported dataset');
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
