import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {run} from '../../src/cli/index.mjs';
import {read,write} from '../../src/workspace/store.mjs';
import {assess,reviewFingerprint} from '../../src/workspace/assess.mjs';
const confirmation=answer=>({status:'confirmed',by:'user',answer,evidence:'Fictional interview answer 1'});
function workspace(t) {const root=fs.mkdtempSync(path.join(os.tmpdir(),'heritage-assess-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));run(['demo',root]);return root;}
function resolved(root) {
  const state={schemaVersion:1,answers:Object.fromEntries(['storyFocus','audience','additionalSources','storyPlan','cover','releaseScope'].map(k=>[k,confirmation('Agreed fictional choice')])),tasks:[],review:null};
  state.answers.releaseScope.deliverable='preview';write(root,'discovery.json',state);return state;
}
test('built preview and a populated scope do not confirm narrative focus',t=>{
  const root=workspace(t),a=assess(root);assert.equal(a.action,'ask_user');assert.equal(a.questions[0].key,'storyFocus');assert.equal(a.reviewCurrent,false);
  assert.equal(JSON.parse(run(['status',root])).assessment.action,'ask_user');
});
test('agent assumption is not a user-confirmed story choice',t=>{
  const root=workspace(t),s=resolved(root);s.answers.storyFocus.by='agent';write(root,'discovery.json',s);
  assert.equal(assess(root).questions[0].key,'storyFocus');
});
test('known sources do not eliminate additional-source question; independent work stays available',t=>{
  const root=workspace(t),s=resolved(root);delete s.answers.additionalSources;s.tasks=[{id:'read',description:'Read authorized interview',status:'ready'}];write(root,'discovery.json',s);
  const a=assess(root);assert.equal(a.action,'ask_user');assert.equal(a.questions[0].key,'additionalSources');assert.equal(a.independentWork.length,1);
});
test('no more sources and no cover are valid answers; unfinished tasks still continue',t=>{
  const root=workspace(t),s=resolved(root);s.answers.additionalSources=confirmation('Nothing else for now');s.answers.cover=confirmation('No cover for first release');s.tasks=[{id:'read',description:'Read authorized interview',status:'ready'}];write(root,'discovery.json',s);
  assert.equal(assess(root).action,'continue');assert.equal(assess(root).unresolved.length,0);
});
test('completion requires current review and verified task outcomes',t=>{
  const root=workspace(t),s=resolved(root);assert.equal(assess(root).action,'ask_user');
  s.review={...confirmation('Preview matches agreed brief'),fingerprint:reviewFingerprint(root)};
  s.tasks=[{id:'read',description:'Read interview',status:'done'}];write(root,'discovery.json',s);assert.equal(assess(root).action,'blocked');
  s.tasks[0].evidence='research/interview-review.json';write(root,'discovery.json',s);assert.equal(assess(root).action,'complete');
  fs.appendFileSync(path.join(root,'build/index.html'),'<!-- changed -->');assert.equal(assess(root).action,'ask_user');assert.equal(assess(root).reviewCurrent,false);
});
test('deferrals need user decision; published scope cannot complete from a local build',t=>{
  const root=workspace(t),s=resolved(root);s.review={...confirmation('Reviewed'),fingerprint:reviewFingerprint(root)};
  s.tasks=[{id:'photo',description:'Find a cover',status:'deferred'}];write(root,'discovery.json',s);assert.equal(assess(root).action,'blocked');
  s.tasks[0].deferral=confirmation('No cover this release');write(root,'discovery.json',s);assert.equal(assess(root).action,'complete');
  s.answers.releaseScope.deliverable='published';write(root,'discovery.json',s);assert.equal(assess(root).action,'blocked');
});
test('legacy workspace without discovery state asks rather than treating build as completion',t=>{
  const root=workspace(t);fs.unlinkSync(path.join(root,'discovery.json'));assert.equal(assess(root).action,'ask_user');
});
