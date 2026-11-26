import fs from 'node:fs';
import path from 'node:path';
import {read,hash} from './store.mjs';

export const confirmed=x=>x?.status==='confirmed' && x.by==='user' && typeof x.answer==='string' && x.answer.trim() && typeof x.evidence==='string' && x.evidence.trim();
function artifact(root,relative) {
  if(typeof relative!=='string'||!relative.trim()||path.isAbsolute(relative)) return null;
  const base=fs.realpathSync(root),target=path.resolve(base,relative);
  if(!target.startsWith(base+path.sep)||!fs.existsSync(target)) return null;
  const real=fs.realpathSync(target);
  if(!real.startsWith(base+path.sep)||!fs.statSync(real).isFile()) return null;
  return hash(fs.readFileSync(real));
}
export function researchGate(root) {
  const project=read(root,'project.json');
  const file=path.join(root,'research/coverage.json');
  const coverage=fs.existsSync(file)?read(root,'research/coverage.json'):{schemaVersion:1,scope:null,discovery:null,sources:[],synthesis:null,proceedWithGaps:null};
  if(coverage.schemaVersion!==1 || !Array.isArray(coverage.sources)) throw Error('Invalid research coverage');
  const gaps=[],work=[],ids=new Set(),artifacts={};
  if(!confirmed(coverage.scope)) gaps.push({id:'researchScope',question:'Which family branches, people and places should the research cover? We will choose the website story after reviewing the sources.'});
  if(!confirmed(coverage.discovery)) gaps.push({id:'sourceDiscovery',question:'Beyond the sources already identified, what other albums, recordings, documents, relevant emails or family-tree websites are available? Nothing else for now is a valid answer.'});
  for(const s of coverage.sources) {
    if(typeof s.id!=='string'||!s.id||ids.has(s.id)||!['located','pending_access','reviewed','unavailable','deferred'].includes(s.status)) throw Error('Invalid/duplicate research source');
    ids.add(s.id);
    if(s.relevant===false && confirmed(s.exclusion)) continue;
    if(s.relevant!==true) gaps.push({id:`relevance:${s.id}`,question:`Confirm whether source ${s.id} is relevant to this research, or document an explicit exclusion.`});
    const digest=artifact(root,s.review?.artifact);artifacts[s.id]=digest;
    if(s.status!=='reviewed'||!digest||!s.review?.summary?.trim()) {
      gaps.push({id:`source:${s.id}`,question:`Source ${s.id} has not been reviewed with recorded findings. Provide access, review it, or explicitly approve proceeding with this gap.`});
      if(s.status==='located') work.push({id:s.id,description:`Inspect source ${s.id} and save findings with citations; a filename or link is not a content review.`});
    }
  }
  for(const s of project.sources||[]) {
    if(!s.id||!ids.has(s.id)) gaps.push({id:`untracked:${s.id||'source'}`,question:`Add known project source ${s.id||'(missing ID)'} to the research inventory and assess it.`});
  }
  if(!coverage.sources.length) gaps.push({id:'emptyInventory',question:'No research sources are inventoried. Identify available material or explicitly approve a source-free draft.'});
  const synthesisHash=artifact(root,coverage.synthesis?.artifact);
  // Synthesis must describe this inventory, not an earlier source set.
  const inventoryFingerprint=hash({scope:coverage.scope,discovery:coverage.discovery,sources:coverage.sources,projectScope:project.scope,projectSources:project.sources||[],artifacts});
  if(!synthesisHash||coverage.synthesis?.inventoryFingerprint!==inventoryFingerprint) gaps.push({id:'synthesis',question:'Prepare a current research synthesis: supported stories, citations, contradictions, unread material and gaps. Do not plan the website yet.'});
  const fingerprint=hash({inventoryFingerprint,synthesis:coverage.synthesis,synthesisHash});
  const override=confirmed(coverage.proceedWithGaps)&&coverage.proceedWithGaps.fingerprint===fingerprint;
  const ready=!gaps.length||Boolean(override);
  const first=gaps[0];
  const foundational=gaps.find(g=>['researchScope','sourceDiscovery'].includes(g.id));
  const action=ready?'planning_ready':foundational?'ask_user':work.length?'continue':gaps.every(g=>g.id==='synthesis')?'continue':'ask_user';
  const next=ready?'Research reviewed, or current gaps explicitly approved. Website planning may begin.':foundational?.question||work[0]?.description||first?.question;
  return {ready,action,next,gaps,independentWork:work,inventoryFingerprint,fingerprint,approvedWithGaps:Boolean(override),limits:'Readiness reflects recorded reviews, not a guarantee that every possible external source has been found.'};
}
export function requireResearch(root) {
  const gate=researchGate(root);
  if(!gate.ready) throw Error(`Research gate closed: ${gate.next} Run assess for all gaps.`);
  return gate;
}
