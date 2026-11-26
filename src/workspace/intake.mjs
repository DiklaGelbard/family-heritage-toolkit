import {read,write,hash} from './store.mjs';
export function intake(root,manifest) {
  if(!manifest.provider||!manifest.collection||!Array.isArray(manifest.items)) throw Error('Manifest needs provider, collection and items');
  const coverage=read(root,'research/coverage.json'),seen=new Set(),changes=[];
  const prefix=`scan-${hash([manifest.provider,manifest.collection]).slice(0,16)}-`;
  for(const item of manifest.items) {
    if(typeof item.id!=='string'||!item.id||seen.has(item.id)||typeof item.revision!=='string'||!item.revision||!['audio','video','document','album','image','dataset'].includes(item.kind)||typeof item.location!=='string') throw Error('Invalid or duplicate manifest item');
    seen.add(item.id);
  }
  for(const item of manifest.items) {
    const id=prefix+hash(item.id).slice(0,20),old=coverage.sources.find(s=>s.id===id);
    const fingerprint=hash(item);
    if(old?.intakeFingerprint===fingerprint&&old.status!=='unavailable') continue;
    if(old) {old.history=[...(old.history||[]),{revision:old.revision,review:old.review,status:old.status}];delete old.review;}
    const source=old||{id,relevant:true};
    Object.assign(source,{location:item.location,kind:item.kind,extent:item.extent||null,revision:item.revision,externalId:item.id,intakeFingerprint:fingerprint,status:'located'});
    if(!old) coverage.sources.push(source);
    changes.push({id,change:old?'changed':'new'});
  }
  if(manifest.complete===true) for(const s of coverage.sources.filter(s=>s.id.startsWith(prefix)&&!seen.has(s.externalId))) {
    if(s.status!=='unavailable'){s.status='unavailable';changes.push({id:s.id,change:'missing_from_complete_listing'});}
  }
  if(changes.length) write(root,'research/coverage.json',coverage);
  return {changes,total:coverage.sources.length};
}
