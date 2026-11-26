import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {run} from '../../src/cli/index.mjs';
import {read,write,hash} from '../../src/workspace/store.mjs';
import {validate} from '../../src/genealogy/validate.mjs';
const cli=path.resolve('src/cli/index.mjs');
function workspace(t) {const root=fs.mkdtempSync(path.join(os.tmpdir(),'heritage-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
test('complete fictional workflow and recover status in a fresh process',t=>{
  const root=workspace(t);const output=run(['demo',root]);
  const html=fs.readFileSync(output,'utf8');assert.match(html,/dir="rtl"/);assert.match(html,/מרים לדוגמה/);
  const status=JSON.parse(execFileSync(process.execPath,[cli,'status',root],{encoding:'utf8'}));
  assert.equal(status.phase,'preview');assert.match(status.next,/inspect preview/);
  assert.equal(read(root,'build/publication.json').people.length,2);
});
test('reimport is idempotent and original bytes are preserved',t=>{
  const root=workspace(t);run(['demo',root]);
  const count=read(root,'state.json').receipts.length;
  run(['import',root,'examples/family.json']);run(['import',root,'examples/family.json']);
  assert.equal(read(root,'state.json').receipts.length,count);
  assert.equal(fs.readdirSync(path.join(root,'sources')).length,1);
  const p=read(root,'proposals/import.json');assert.deepEqual(fs.readFileSync(path.join(root,p.sourceFile)),fs.readFileSync('examples/family.json'));
  assert.equal(p.data.people.length,2);
});
test('public output excludes unselected people, facts and private citations',t=>{
  const root=workspace(t);run(['demo',root]);
  const selection=path.join(root,'selection-input.json');write(root,'selection-input.json',{personIds:['p2'],factIds:[]});
  run(['select',root,selection]);run(['build',root]);
  const html=fs.readFileSync(path.join(root,'build/index.html'),'utf8');
  assert.doesNotMatch(html,/מרים|1932|Fictional interview|00:01:20/);
  assert.deepEqual(read(root,'build/publication.json').people[0].parents,[]);
});
test('changed data invalidates publication selection',t=>{
  const root=workspace(t);run(['demo',root]);
  const d=read(root,'data/accepted.json');d.people[0].name='Changed';write(root,'data/accepted.json',d);
  assert.throws(()=>run(['build',root]),/stale/);
});
test('unreviewed or modified proposal hash cannot be accepted',t=>{
  const root=workspace(t);run(['demo',root]);const p=read(root,'proposals/import.json');const before=hash(p);
  p.data.people[0].name='Edited after review';write(root,'proposals/import.json',p);
  assert.throws(()=>run(['accept',root,before]),/reviewed proposal hash/);
});
test('duplicate names remain separate, duplicate identities and cycles fail',()=>{
  const d=JSON.parse(fs.readFileSync('examples/family.json','utf8'));d.people[1].name=d.people[0].name;
  assert.equal(validate(d).people.length,2);
  d.people[0].parents=['p2'];assert.throws(()=>validate(d),/cycle/);
  d.people[0].parents=[];d.people[1].id='p1';assert.throws(()=>validate(d),/identity/);
});
test('GEDCOM subset imports Hebrew, reports omissions and preserves date text',t=>{
  const root=workspace(t);run(['init',root]);write(root,'project.json',JSON.parse(fs.readFileSync('examples/project.json')));
  const file=path.join(root,'input.ged');fs.writeFileSync(file,'0 HEAD\n1 GEDC\n2 VERS 5.5.1\n0 @I1@ INDI\n1 NAME שרה /דוגמה/\n1 BIRT\n2 DATE ABT 1930\n1 OCCU Teacher\n0 TRLR\n');
  run(['import',root,file]);const p=read(root,'proposals/import.json');
  assert.equal(p.data.people[0].name,'שרה דוגמה');assert.equal(p.data.people[0].facts[0].value,'ABT 1930');
  assert.ok(p.data.warnings.some(x=>x.includes('OCCU')));
});
test('HTML escapes source content and private fields never enter build',t=>{
  const root=workspace(t);run(['demo',root]);const d=read(root,'data/accepted.json');
  d.people[0].name='<script>alert(1)</script>';d.people[0].secret='never publish';write(root,'data/accepted.json',d);
  run(['select',root,'examples/selection.json']);run(['build',root]);
  const html=fs.readFileSync(path.join(root,'build/index.html'),'utf8');assert.doesNotMatch(html,/<script>|never publish/);assert.match(html,/&lt;script&gt;/);
});
test('unknown facts and concurrent writer are rejected',t=>{
  const root=workspace(t);run(['demo',root]);write(root,'bad-selection.json',{personIds:['p2'],factIds:['f1']});
  assert.throws(()=>run(['select',root,path.join(root,'bad-selection.json')]),/excluded person/);
  fs.writeFileSync(path.join(root,'.writer.lock'),'another writer');assert.throws(()=>run(['build',root]),/locked/);
});
test('uncertain source dates remain distinct and invalid UTF-8 fails without changing the proposal',t=>{
  const root=workspace(t);run(['demo',root]);
  const original=read(root,'proposals/import.json');
  const file=path.join(root,'broken.ged');fs.writeFileSync(file,Buffer.from([0xff,0xfe]));
  assert.throws(()=>run(['import',root,file]),/encoded data/);
  assert.deepEqual(read(root,'proposals/import.json'),original);
  const d=read(root,'data/accepted.json');d.people[0].facts.push({id:'alternative',type:'birth',value:'ABT 1934',citation:{sourceId:'s1',locator:'00:02:00'}});
  validate(d);assert.equal(d.people[0].facts.length,2);
});
