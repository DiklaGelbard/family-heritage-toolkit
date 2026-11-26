import fs from 'node:fs';
import path from 'node:path';
import {read,hash} from './store.mjs';

// Only explicit deceased evidence is sufficient; missing dates or old age alone are not.
export function externalOpportunities(root) {
  const data=fs.existsSync(path.join(root,'data/accepted.json'))?read(root,'data/accepted.json'):null;
  const people=data?.people||[];
  const candidates=people.filter(p=>p.living!==true && (p.living===false || p.facts.some(f=>f.type==='death' && f.value.trim() && !['N','UNKNOWN','?'].includes(f.value.trim().toUpperCase())))).map(p=>{
    const has=type=>p.facts.some(f=>f.type===type && f.value.trim() && !['Y','N','UNKNOWN','?'].includes(f.value.trim().toUpperCase()));
    return {personId:p.id,name:p.name,missing:['birth','death','burial','gravePhoto'].filter(type=>!has(type))};
  }).filter(p=>p.missing.length);
  return {candidates,unknownLifeStatus:people.filter(p=>p.living!==false&&!p.facts.some(f=>f.type==='death')).map(p=>p.id),
    fingerprint:hash({scope:read(root,'project.json').scope,candidates})};
}

export function assessExternal(root,coverage,confirmed,artifact) {
  const opportunities=externalOpportunities(root),decision=coverage.externalDiscovery;
  const gaps=[],work=[],artifacts={};
  const valid=confirmed(decision)&&['requested','declined','deferred'].includes(decision.choice)&&decision.scopeFingerprint===opportunities.fingerprint;
  if(!valid) gaps.push({id:'externalDiscovery',question:opportunities.candidates.length?
    `Found ${opportunities.candidates.length} explicitly deceased relative(s) with missing dates, burial details or grave-photo references. Should we research BillionGraves or other cemetery/family-history sources? Any known cemeteries, name variants or grave links? You may request, decline or defer this research.`:
    'Would you like us to seek additional external sources, such as BillionGraves, cemetery records or other family trees? No eligible grave-research candidates are currently identified; clarify deceased status or provide specific leads rather than assuming it.'});
  if(valid&&decision.choice==='requested') {
    const searches=decision.searches;
    if(!Array.isArray(searches)||!searches.length) gaps.push({id:'externalPlan',question:'Record the requested search targets, providers and limits before starting external research.'});
    const ids=new Set();
    for(const s of searches||[]) {
      if(!s.id||ids.has(s.id)||!s.target||!s.provider||!['pending','blocked','completed'].includes(s.status)) throw Error('Invalid external search plan');
      ids.add(s.id);
      const digest=artifact(root,s.report);artifacts[s.id]=digest;
      const outcomeValid=['matched','possible_matches','no_match'].includes(s.outcome);
      const sourcesValid=s.outcome==='no_match'||(Array.isArray(s.sourceIds)&&s.sourceIds.length>0&&s.sourceIds.every(id=>coverage.sources.some(source=>source.id===id)));
      if(s.status!=='completed'||!digest||!outcomeValid||!sourcesValid) {
        gaps.push({id:`external:${s.id}`,question:`External research ${s.id} (${s.provider}, ${s.target}) is incomplete. Complete it, resolve access, or approve proceeding with this gap.`});
        if(s.status==='pending') work.push({id:`external:${s.id}`,description:`Research ${s.target} using ${s.provider} within the approved scope; record queries, identity evidence and source/grave-photo links. No match is a valid documented result.`});
      }
    }
  }
  return {opportunities,gaps,work,artifacts};
}
