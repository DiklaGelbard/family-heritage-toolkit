import {read,write} from '../../src/workspace/store.mjs';
import {researchGate} from '../../src/workspace/research.mjs';
export const confirmation={status:'confirmed',by:'user',answer:'Fictional source set reviewed',evidence:'Fictional test interview'};
export function reviewResearch(root) {
  const c=read(root,'research/coverage.json');c.scope=confirmation;c.discovery=confirmation;
  write(root,'research/fixture-review.json',{summary:'Read all fictional fixture records; no unresolved source questions.'});
  c.sources=c.sources.map(s=>({...s,relevant:true,status:'reviewed',review:{artifact:'research/fixture-review.json',summary:'Fixture content reviewed'}}));
  write(root,'research/coverage.json',c);
  write(root,'research/synthesis.json',{summary:'Fictional family structure and available evidence.'});
  c.synthesis={artifact:'research/synthesis.json',inventoryFingerprint:researchGate(root).inventoryFingerprint};
  write(root,'research/coverage.json',c);
}
