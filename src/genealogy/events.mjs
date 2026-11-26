const id=x=>typeof x==='string'&&/^[\w.-]+$/.test(x);
export function validateEvents(data) {
  const events=data.events||[];if(!Array.isArray(events)) throw Error('Events must be an array');
  const people=new Set(data.people.map(p=>p.id)),sources=new Set(data.sources.map(s=>s.id));
  const ids=new Set();
  for(const e of events) {
    if(!id(e.id)||ids.has(e.id)) throw Error('Duplicate/invalid event ID');ids.add(e.id);
    if(typeof e.title!=='string'||!e.title.trim()||typeof e.summary!=='string'||!['proposed','confirmed','conflicted'].includes(e.status)) throw Error('Invalid event');
    if(!Array.isArray(e.personIds)||e.personIds.some(p=>!people.has(p))) throw Error('Unknown event person');
    if(!Array.isArray(e.citations)||!e.citations.length||e.citations.some(c=>!sources.has(c.sourceId)||typeof c.locator!=='string'||!c.locator.trim())) throw Error('Event requires source citations');
    if(!e.date||!['exact','by','before','after','approximate','range','unknown'].includes(e.date.kind)||typeof e.date.text!=='string') throw Error('Invalid event date precision');
    if(e.date.kind==='range'&&(!e.date.start||!e.date.end)) throw Error('Range event needs endpoints');
    if(e.place!==undefined&&(typeof e.place.name!=='string'||(['lat','lon'].some(k=>e.place[k]!==undefined&&!Number.isFinite(e.place[k])))||(e.place.lat!==undefined&&Math.abs(e.place.lat)>90)||(e.place.lon!==undefined&&Math.abs(e.place.lon)>180))) throw Error('Invalid event place');
    if(e.journeyIds!==undefined&&(!Array.isArray(e.journeyIds)||e.journeyIds.some(x=>!id(x)))) throw Error('Invalid journey IDs');
    const mediaIds=new Set();
    for(const m of e.media||[]) {if(!id(m.id)||mediaIds.has(m.id)||typeof m.caption!=='string'||typeof m.url!=='string') throw Error('Invalid event media');mediaIds.add(m.id);}
  }
  const byId=new Map(events.map(e=>[e.id,e]));
  for(const e of events) {
    const seen=new Set([e.id]);let parent=e.parentId;
    while(parent){if(!byId.has(parent)||seen.has(parent)) throw Error('Invalid/cyclic event chapter');seen.add(parent);parent=byId.get(parent).parentId;}
  }
  return events;
}
