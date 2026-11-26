import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {parseGedcom} from '../../src/adapters/gedcom.mjs';
import {validate} from '../../src/genealogy/validate.mjs';
import {run} from '../../src/cli/index.mjs';
import {write,read,hash} from '../../src/workspace/store.mjs';
const fixture='tests/fixtures/families.ged';
const dataset=()=>validate(parseGedcom(fs.readFileSync(fixture,'utf8'),'source'));
function workspace(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'family-links-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));run(['init',root]);write(root,'project.json',JSON.parse(fs.readFileSync('examples/project.json')));run(['import',root,fixture]);run(['accept',root,hash(read(root,'proposals/import.json'))]);return root;}
test('remarriage keeps each child with the correct family and preserves events',()=>{
  const d=dataset();assert.equal(d.schemaVersion,2);assert.equal(d.families.length,4);
  assert.deepEqual(d.people.find(p=>p.id==='I4').parents,['I1','I2']);
  assert.deepEqual(d.people.find(p=>p.id==='I5').parents,['I1','I3']);
  assert.equal(d.families[0].events[0].date,'ABT 1980');assert.equal(d.families[0].events[1].type,'divorce');
  assert.equal(d.families[0].events[0].place,'Example City');assert.equal(d.families[1].events[0].date,null);
});
test('unknown partner and childless partners do not create invented people or marriage events',()=>{
  const d=dataset();assert.equal(d.people.length,7);assert.deepEqual(d.families[2].partners,['I2']);
  assert.deepEqual(d.families[3].children,[]);assert.deepEqual(d.families[3].events,[]);
});
test('duplicate, dangling and inconsistent family relationships are rejected',()=>{
  let d=dataset();d.families.push(structuredClone(d.families[0]));assert.throws(()=>validate(d),/family ID/);
  d=dataset();d.families[0].partners.push('missing');assert.throws(()=>validate(d),/partners/);
  d=dataset();d.families[0].children.push('I1');assert.throws(()=>validate(d),/partner and child/);
  d=dataset();d.people.find(p=>p.id==='I4').parents=['I3'];assert.throws(()=>validate(d),/match family/);
});
test('preview renders selected marriages and divorces with children grouped by family',t=>{
  const root=workspace(t),d=read(root,'data/accepted.json');
  write(root,'choose.json',{personIds:d.people.map(p=>p.id),familyIds:['F1','F2'],factIds:d.families.flatMap(f=>f.events.map(e=>e.id))});
  run(['select',root,path.join(root,'choose.json')]);run(['build',root]);
  const output=read(root,'build/publication.json');assert.equal(output.families.length,2);
  assert.deepEqual(output.families[0].children,['I4']);assert.deepEqual(output.families[1].children,['I5']);
  const html=fs.readFileSync(path.join(root,'build/index.html'),'utf8');assert.match(html,/נישואים/);assert.match(html,/גירושים/);assert.match(html,/family-F1/);assert.match(html,/Example City/);
});
test('family selection defaults to none and partial selection does not leak hidden members/events',t=>{
  const root=workspace(t);
  write(root,'choose.json',{personIds:['I1','I4'],factIds:[]});run(['select',root,path.join(root,'choose.json')]);run(['build',root]);
  assert.deepEqual(read(root,'build/publication.json').families,[]);
  assert.deepEqual(read(root,'build/publication.json').people.find(p=>p.id==='I4').parents,[]);
  write(root,'choose.json',{personIds:['I1','I4'],familyIds:['F1'],factIds:[]});run(['select',root,path.join(root,'choose.json')]);run(['build',root]);
  const output=JSON.stringify(read(root,'build/publication.json'));assert.doesNotMatch(output,/I2|Robin|1980|1990/);
  write(root,'choose.json',{personIds:['I1','I4'],familyIds:['F1'],factIds:['F1-MARR-0']});assert.throws(()=>run(['select',root,path.join(root,'choose.json')]),/excluded/);
});
test('same-sex partner references preserve IDs without inferring gender or current marital status',()=>{
  const text=fs.readFileSync(fixture,'utf8').replace('1 WIFE @I2@','1 HUSB @I2@');const d=validate(parseGedcom(text,'source'));
  assert.deepEqual(d.families[0].partners,['I1','I2']);assert.equal(d.people[0].sex,undefined);
});
