const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function publishEvents(data,selection) {
  const chosen=new Set(selection.eventIds||[]),people=new Set(selection.personIds);
  if(!Array.isArray(selection.eventIds||[])||!Array.isArray(selection.eventMediaIds||[])) throw Error('Invalid event selection');
  const selected=(data.events||[]).filter(e=>chosen.has(e.id));
  if(selected.length!==chosen.size||selected.some(e=>e.status!=='confirmed'||e.personIds.some(id=>!people.has(id)))) throw Error('Events must be confirmed and all referenced people selected');
  const mediaKeys=new Set(selected.flatMap(e=>(e.media||[]).map(m=>`${e.id}:${m.id}`)));
  if((selection.eventMediaIds||[]).some(id=>!mediaKeys.has(id))) throw Error('Unknown event media selection');
  return selected.map(e=>({id:e.id,title:e.title,summary:e.summary,personIds:e.personIds,date:{kind:e.date.kind,text:e.date.text},place:e.place?{name:e.place.name}:null,parentId:chosen.has(e.parentId)?e.parentId:null,journeyIds:e.journeyIds||[],media:(e.media||[]).filter(m=>(selection.eventMediaIds||[]).includes(`${e.id}:${m.id}`)).map(m=>{
    let u;try{u=new URL(m.url);}catch{throw Error('Invalid event media URL');}
    if(u.protocol!=='https:'||u.username||u.password) throw Error('Event media requires HTTPS');
    return {id:m.id,url:u.href,caption:m.caption};
  })}));
}
export function renderJourney(events,language) {
  if(!events.length) return '';
  const he=language==='he',heading=he?'הסיפור המשפחתי':'Family journey';
  const precision=he?{by:'לא יאוחר מ־',before:'לפני',after:'אחרי',approximate:'בקירוב',range:'טווח',exact:'',unknown:'תאריך לא ידוע'}:{by:'By',before:'Before',after:'After',approximate:'Approximately',range:'Range',exact:'',unknown:'Date unknown'};
  const render=e=>`<details class="journey-event" id="event-${escape(e.id)}"><summary><strong>${escape(e.title)}</strong> <span>${escape(precision[e.date.kind])} ${escape(e.date.text)}</span>${e.place?` · ${escape(e.place.name)}`:''}</summary><p class="biography">${escape(e.summary)}</p>${e.media.map(m=>`<figure><img loading="lazy" referrerpolicy="no-referrer" src="${escape(m.url)}" alt="${escape(m.caption)}"><figcaption>${escape(m.caption)}</figcaption></figure>`).join('')}${events.filter(child=>child.parentId===e.id).map(render).join('')}</details>`;
  const lanes=[...new Set(events.flatMap(e=>e.journeyIds))];
  const routes=lanes.map((lane,i)=>`<nav aria-label="${he?'מסלול':'Journey'} ${i+1}"><span>${he?'מסלול':'Journey'} ${i+1}</span>${events.filter(e=>e.journeyIds.includes(lane)).map(e=>`<a href="#event-${escape(e.id)}">${escape(e.title)}</a>`).join('<span aria-hidden="true"> ··· </span>')}</nav>`).join('');
  return `<section class="journey"><h2>${heading}</h2><p>${he?'מסלול סיפורי סכמטי — לא מפה גאוגרפית':'Schematic story route — not a geographic map'}</p><div class="journey-routes">${routes}</div>${events.filter(e=>!e.parentId).map(render).join('')}</section>`;
}
