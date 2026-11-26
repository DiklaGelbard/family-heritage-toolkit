import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {run} from '../../src/cli/index.mjs';
import {read,write} from '../../src/workspace/store.mjs';
import {sourceCoverage} from '../../src/workspace/coverage.mjs';
import {researchGate} from '../../src/workspace/research.mjs';
import {validate} from '../../src/genealogy/validate.mjs';
import {publishEvents,renderJourney} from '../../src/publication/journey.mjs';
function workspace(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'pipeline-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));run(['demo',root]);return root;}
function command(root,cmd,op){write(root,'operation.json',op);return JSON.parse(run([cmd,root,path.join(root,'operation.json')]));}
test('complete audio coverage cannot be claimed from excerpts, overlaps or missing transcripts',()=>{
  const s={kind:'audio',extent:{unit:'seconds',total:100},review:{ranges:[{start:0,end:30,artifact:'chunk'}],transcript:{raw:'raw',corrected:'corrected'}}};
  assert.equal(sourceCoverage(s,()=> 'hash').complete,false);
  s.review.ranges.push({start:20,end:100,artifact:'rest'});assert.equal(sourceCoverage(s,()=> 'hash').complete,true);
  s.review.transcript.corrected='raw';assert.equal(sourceCoverage(s,()=> 'hash').complete,false);
  s.review.transcript.corrected='corrected';assert.equal(sourceCoverage(s,f=>f==='rest'?null:'hash').complete,false);
});
test('transcript command preserves raw segments and partial review cannot satisfy coverage',t=>{
  const root=workspace(t);command(root,'intake',{provider:'fixture',collection:'audio',items:[{id:'a',revision:'1',kind:'audio',location:'fictional://audio'}]});
  const source=read(root,'research/coverage.json').sources.at(-1);
  const raw={recordingId:source.id,durationSeconds:20,language:'he',segments:[{id:'s1',start:0,end:10,text:'fictional first'},{id:'s2',start:10,end:20,text:'fictional second'}]};
  const corrected=structuredClone(raw);corrected.segments[0].reviewStatus='reviewed';
  const op={sourceId:source.id,raw,corrected};command(root,'transcript',op);
  assert.ok(researchGate(root).gaps.some(g=>g.id===`source:${source.id}`));
  corrected.segments[1].reviewStatus='unintelligible';command(root,'transcript',op);
  assert.ok(!researchGate(root).gaps.some(g=>g.id===`source:${source.id}`));
  const changed=structuredClone(op);changed.raw.segments[0].text='overwrite';assert.throws(()=>command(root,'transcript',changed),/immutable/);
  changed.raw=raw;changed.corrected.segments[0].start=1;assert.throws(()=>command(root,'transcript',changed),/timestamps/);
});
test('document review requires every page and rejects fractional page ranges',()=>{
  const s={kind:'document',extent:{unit:'pages',total:3},review:{ranges:[{start:0,end:1,artifact:'a'},{start:2,end:3,artifact:'b'}]}};
  assert.equal(sourceCoverage(s,()=> 'hash').complete,false);s.review.ranges.push({start:1,end:2,artifact:'c'});assert.equal(sourceCoverage(s,()=> 'hash').complete,true);
  s.review.ranges[0].end=1.5;assert.equal(sourceCoverage(s,()=> 'hash').complete,false);
});
test('typed partial review blocks the actual research gate',t=>{
  const root=workspace(t),c=read(root,'research/coverage.json');Object.assign(c.sources[0],{kind:'document',extent:{unit:'pages',total:4}});c.sources[0].review.ranges=[{start:0,end:1,artifact:c.sources[0].review.artifact}];write(root,'research/coverage.json',c);assert.equal(researchGate(root).ready,false);assert.match(researchGate(root).independentWork[0].description,/Unreviewed pages/);
});
test('incremental manifest intake is idempotent and changed revisions reopen source review',t=>{
  const root=workspace(t),manifest={provider:'fictional-drive',collection:'album',items:[{id:'one',revision:'1',kind:'document',location:'fictional://one',extent:{unit:'pages',total:2}}]};
  let result=command(root,'intake',manifest);assert.equal(result.changes[0].change,'new');assert.equal(command(root,'intake',manifest).changes.length,0);
  const c=read(root,'research/coverage.json'),s=c.sources.at(-1);s.review={summary:'Old review'};s.status='reviewed';write(root,'research/coverage.json',c);
  manifest.items[0].revision='2';result=command(root,'intake',manifest);assert.equal(result.changes[0].change,'changed');assert.equal(read(root,'research/coverage.json').sources.at(-1).review,undefined);assert.equal(read(root,'research/coverage.json').sources.at(-1).history.length,1);
  command(root,'intake',{...manifest,items:[]});assert.equal(read(root,'research/coverage.json').sources.at(-1).status,'located');
  command(root,'intake',{...manifest,items:[],complete:true});assert.equal(read(root,'research/coverage.json').sources.at(-1).status,'unavailable');
});
test('task resource leases prevent simultaneous browser control and dependencies enforce merge order',t=>{
  const root=workspace(t);for(const id of ['a','b'])command(root,'task',{action:'register',id,description:id,dependsOn:[],resources:['browser:personal']});
  command(root,'task',{action:'claim',id:'a',owner:'worker-a'});
  command(root,'task',{action:'register',id:'merge',description:'Merge findings',dependsOn:['a'],resources:[]});
  assert.throws(()=>command(root,'task',{action:'claim',id:'merge',owner:'reviewer'}),/not ready/);
  assert.throws(()=>command(root,'task',{action:'claim',id:'b',owner:'worker-b'}),/claimed/);
  assert.throws(()=>command(root,'task',{action:'complete',id:'a',owner:'worker-b',artifact:'project.json'}),/current owner/);
  assert.equal(researchGate(root).ready,false);
  command(root,'task',{action:'complete',id:'a',owner:'worker-a',artifact:'project.json'});command(root,'task',{action:'claim',id:'b',owner:'worker-b'});
  command(root,'task',{action:'claim',id:'merge',owner:'reviewer'});
});
test('question queue accepts only one unresolved question and requires actual user evidence',t=>{
  const root=workspace(t);command(root,'task',{action:'ask',id:'q1',text:'Identify the speaker'});
  assert.throws(()=>command(root,'task',{action:'ask',id:'q2',text:'Another question'}),/already pending/);
  assert.throws(()=>command(root,'task',{action:'answer',id:'q1',by:'agent',answer:'guess',evidence:'none'}),/user answer/);
  command(root,'task',{action:'answer',id:'q1',by:'user',answer:'Fictional speaker',evidence:'Recorded response'});
  command(root,'task',{action:'ask',id:'q2',text:'Another question'});
});
test('posture correction preserves identity, region, history and resumable cursor',t=>{
  const root=workspace(t),base={mediaId:'photo-1',labelId:'label-1',source:'fictional caption',by:'user',evidence:'Fictional answer',status:'confirmed'};
  command(root,'annotate',{...base,name:'Example Person',personId:'p1',region:{x:0,y:0,width:.3,height:.5},posture:'standing'});
  const result=command(root,'annotate',{...base,posture:'seated'});assert.equal(result.items[0].name,'Example Person');assert.equal(result.items[0].history[0].posture,'standing');assert.equal(result.items[0].region.width,.3);assert.equal(result.cursor.labelId,'label-1');
});
test('sourced events retain boundaries, nested chapters and shared journeys without exposing citations',t=>{
  const root=workspace(t),d=read(root,'data/accepted.json');d.events=[{id:'arrival',title:'Arrival',summary:'Already present by this month',status:'confirmed',personIds:['p1'],date:{kind:'by',text:'February 1950'},place:{name:'Example Town'},citations:[{sourceId:'s1',locator:'01:02:03'}],journeyIds:['a','b'],media:[]},{id:'earlier',parentId:'arrival',title:'Earlier life',summary:'Earlier chapter',status:'confirmed',personIds:['p1'],date:{kind:'approximate',text:'1940'},citations:[{sourceId:'s1',locator:'00:20:00'}]}];
  validate(d);const events=publishEvents(d,{personIds:['p1'],eventIds:['arrival','earlier']});assert.equal(events[0].date.kind,'by');assert.equal(events[1].parentId,'arrival');assert.equal(events[0].citations,undefined);const html=renderJourney(events,'en');assert.match(html,/By February 1950/);assert.match(html,/Schematic/);assert.match(html,/event-earlier/);
  assert.throws(()=>publishEvents(d,{personIds:[],eventIds:['arrival']}),/referenced people/);
  d.events[0].parentId='earlier';assert.throws(()=>validate(d),/cyclic/);
});
