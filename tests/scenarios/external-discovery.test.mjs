import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {run} from '../../src/cli/index.mjs';
import {read,write} from '../../src/workspace/store.mjs';
import {researchGate} from '../../src/workspace/research.mjs';
import {externalOpportunities} from '../../src/workspace/external-discovery.mjs';
import {confirmation} from '../support/research.mjs';
import {parseGedcom} from '../../src/adapters/gedcom.mjs';
function workspace(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'external-discovery-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));run(['demo',root]);return root;}
function synthesize(root,c){write(root,'research/coverage.json',c);c.synthesis.inventoryFingerprint=researchGate(root).inventoryFingerprint;write(root,'research/coverage.json',c);}
test('undated GEDCOM death is preserved as a lead, while explicit living status prevents a grave suggestion',t=>{
  const root=workspace(t),d=parseGedcom('0 @I1@ INDI\n1 NAME Fictional /Person/\n1 DEAT Y\n0 TRLR','s');
  write(root,'data/accepted.json',d);assert.equal(externalOpportunities(root).candidates[0].missing.includes('death'),true);
  d.people[0].living=true;write(root,'data/accepted.json',d);assert.equal(externalOpportunities(root).candidates.length,0);
});
test('no automatic deceased inference from old birth dates; explicit deceased enables grave leads',t=>{
  const root=workspace(t);assert.equal(externalOpportunities(root).candidates.length,0);
  const d=read(root,'data/accepted.json');d.people[0].living=false;write(root,'data/accepted.json',d);
  const candidates=externalOpportunities(root).candidates;assert.equal(candidates.length,1);assert.ok(candidates[0].missing.includes('death'));assert.ok(candidates[0].missing.includes('burial'));assert.ok(candidates[0].missing.includes('gravePhoto'));
  assert.equal(researchGate(root).ready,false);assert.ok(researchGate(root).gaps.some(g=>g.id==='externalDiscovery'));
});
test('missing external decision asks proactively despite existing sources',t=>{
  const root=workspace(t),c=read(root,'research/coverage.json');delete c.externalDiscovery;write(root,'research/coverage.json',c);
  const a=JSON.parse(run(['assess',root]));assert.equal(a.action,'ask_user');assert.match(a.next,/BillionGraves/);
});
test('declined and deferred searches persist without repeated questions',t=>{
  const root=workspace(t),c=read(root,'research/coverage.json');
  for(const choice of ['declined','deferred']) {c.externalDiscovery={...confirmation,choice,scopeFingerprint:externalOpportunities(root).fingerprint};synthesize(root,c);assert.equal(researchGate(root).ready,true);}
});
test('requested research blocks planning until a report exists; documented no match completes',t=>{
  const root=workspace(t),c=read(root,'research/coverage.json');
  c.externalDiscovery={...confirmation,choice:'requested',scopeFingerprint:externalOpportunities(root).fingerprint,searches:[{id:'grave-search',provider:'BillionGraves',target:'Fictional relative explicitly supplied by user',status:'pending'}]};
  synthesize(root,c);assert.equal(researchGate(root).ready,false);assert.ok(researchGate(root).independentWork.some(x=>x.id==='external:grave-search'));
  const s=c.externalDiscovery.searches[0];s.status='completed';s.outcome='no_match';s.report='research/search-report.json';synthesize(root,c);assert.equal(researchGate(root).ready,false);
  write(root,s.report,{queries:['Fictional name'],searchedAt:'fictional test',outcome:'No verified match; no dates inferred'});synthesize(root,c);assert.equal(researchGate(root).ready,true);
});
test('found records must enter source inventory; agent-written approval does not authorize search',t=>{
  const root=workspace(t),c=read(root,'research/coverage.json');
  c.externalDiscovery={...confirmation,by:'agent',choice:'requested',scopeFingerprint:externalOpportunities(root).fingerprint,searches:[]};synthesize(root,c);assert.ok(researchGate(root).gaps.some(g=>g.id==='externalDiscovery'));
  c.externalDiscovery.by='user';c.externalDiscovery.searches=[{id:'match',target:'Fictional relative',provider:'BillionGraves',status:'completed',outcome:'matched',report:'research/match.json',sourceIds:['grave-record']}];
  write(root,'research/match.json',{recordUrl:'https://example.org/fictional-grave',identity:'fictional match'});synthesize(root,c);assert.ok(researchGate(root).gaps.some(g=>g.id==='external:match'));
  c.sources.push({id:'grave-record',status:'located',relevant:true});synthesize(root,c);assert.ok(researchGate(root).gaps.some(g=>g.id==='source:grave-record'));
});
