// Review ranges are half-open: [start,end), including pages/items indexed from zero.
export function sourceCoverage(source,artifact) {
  const typed=['audio','video','document','album'].includes(source.kind);
  if(!typed && !source.extent) return {complete:true,hashes:{},missing:[]};
  const extent=source.extent,review=source.review||{},hashes={};
  const unit={audio:'seconds',video:'seconds',document:'pages',album:'items'}[source.kind];
  if(!extent||!Number.isFinite(extent.total)||extent.total<=0||!['seconds','pages','items'].includes(extent.unit)||(unit&&unit!==extent.unit)) return {complete:false,hashes,missing:['Known positive source extent required']};
  const ranges=review.ranges||[];
  let end=0;const missing=[];
  for(const r of [...ranges].sort((a,b)=>a.start-b.start)) {
    if(!Number.isFinite(r.start)||!Number.isFinite(r.end)||r.start<0||r.end<=r.start||r.end>extent.total||(extent.unit!=='seconds'&&(!Number.isInteger(r.start)||!Number.isInteger(r.end)))) {missing.push('Invalid coverage range');continue;}
    const digest=artifact(r.artifact);hashes[r.artifact]=digest;
    if(!digest) {missing.push('Missing range review artifact');continue;}
    if(r.start>end) missing.push(`Unreviewed ${extent.unit}: ${end}–${r.start}`);
    end=Math.max(end,r.end);
  }
  if(end<extent.total) missing.push(`Unreviewed ${extent.unit}: ${end}–${extent.total}`);
  if(['audio','video'].includes(source.kind)) {
    for(const key of ['raw','corrected']) {const file=review.transcript?.[key];const digest=artifact(file);hashes[`transcript:${key}`]=digest;if(!digest) missing.push(`Missing ${key} transcript`);}
    if(review.transcript?.raw===review.transcript?.corrected) missing.push('Raw and corrected transcripts must be separate');
  }
  return {complete:!missing.length,hashes,missing};
}
