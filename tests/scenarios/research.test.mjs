import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {run} from '../../src/cli/index.mjs';
import {read,write} from '../../src/workspace/store.mjs';
import {researchGate} from '../../src/workspace/research.mjs';
import {confirmation,reviewResearch} from '../support/research.mjs';
function workspace(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'heritage-research-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));run(['demo',root]);return root;}
test('legacy workspace cannot plan or build without research coverage',t=>{
  const root=workspace(t);fs.unlinkSync(path.join(root,'research/coverage.json'));
  const a=JSON.parse(run(['assess',root]));assert.equal(a.stage,'research');assert.equal(a.questions[0].key,'researchScope');
  assert.throws(()=>run(['select',root,'examples/selection.json']),/Research gate closed/);
  assert.throws(()=>run(['build',root]),/Research gate closed/);
});
test('filename-only source is unfinished; reviewed status without actual artifact is insufficient',t=>{
  const root=workspace(t),c=read(root,'research/coverage.json');c.sources.push({id:'interview',relevant:true,status:'located',location:'folder/interview'});write(root,'research/coverage.json',c);
  let a=JSON.parse(run(['assess',root]));assert.equal(a.stage,'research');assert.equal(a.action,'continue');assert.equal(a.independentWork[0].id,'interview');
  c.sources[1].status='reviewed';c.sources[1].review={summary:'Read it',artifact:'research/missing.json'};write(root,'research/coverage.json',c);
  assert.equal(researchGate(root).ready,false);assert.ok(researchGate(root).gaps.some(g=>g.id==='source:interview'));
});
test('reviewed relevant sources and current synthesis open planning',t=>{
  const root=workspace(t);reviewResearch(root);assert.equal(researchGate(root).ready,true);
  assert.equal(JSON.parse(run(['assess',root])).stage,'planning');
});
test('agent cannot approve gaps; user approval is bound to current research fingerprint',t=>{
  const root=workspace(t),c=read(root,'research/coverage.json');c.sources.push({id:'letter',relevant:true,status:'unavailable'});write(root,'research/coverage.json',c);
  const fingerprint=researchGate(root).fingerprint;
  c.proceedWithGaps={...confirmation,by:'agent',fingerprint};write(root,'research/coverage.json',c);assert.equal(researchGate(root).ready,false);
  c.proceedWithGaps={...confirmation,answer:'Proceed without the unavailable letter and current synthesis',fingerprint};write(root,'research/coverage.json',c);assert.equal(researchGate(root).ready,true);
  run(['select',root,'examples/selection.json']);run(['build',root]);
  c.sources.push({id:'new-album',relevant:true,status:'located'});write(root,'research/coverage.json',c);assert.equal(researchGate(root).ready,false);assert.throws(()=>run(['build',root]),/Research gate closed/);
});
test('updated findings require a new synthesis; stale selection cannot bypass research changes',t=>{
  const root=workspace(t),c=read(root,'research/coverage.json');
  write(root,c.sources[0].review.artifact,{summary:'New evidence changed an interpretation'});
  assert.equal(researchGate(root).ready,false);
  c.synthesis.inventoryFingerprint=researchGate(root).inventoryFingerprint;write(root,'research/coverage.json',c);
  assert.equal(researchGate(root).ready,true);assert.throws(()=>run(['build',root]),/Research changed/);
});
test('known project sources must be inventoried; relevant deferred material still needs explicit gap approval',t=>{
  const root=workspace(t),p=read(root,'project.json');p.sources=[{id:'known-email',location:'private thread'}];write(root,'project.json',p);
  assert.ok(researchGate(root).gaps.some(g=>g.id==='untracked:known-email'));
  const c=read(root,'research/coverage.json');c.sources.push({id:'known-email',relevant:true,status:'deferred'});write(root,'research/coverage.json',c);
  assert.ok(researchGate(root).gaps.some(g=>g.id==='source:known-email'));
});
test('new import reopens research, identical reimport preserves approval',t=>{
  const root=workspace(t);assert.equal(researchGate(root).ready,true);run(['import',root,'examples/family.json']);assert.equal(researchGate(root).ready,true);
  run(['import',root,'tests/fixtures/families.ged']);assert.equal(researchGate(root).ready,false);
});
