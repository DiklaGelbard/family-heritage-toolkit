import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {run} from '../../src/cli/index.mjs';
import {read,write} from '../../src/workspace/store.mjs';
import {reviewResearch} from '../support/research.mjs';
function setup(t,living=false){const root=fs.mkdtempSync(path.join(os.tmpdir(),'person-cards-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));run(['demo',root]);const d=read(root,'data/accepted.json');d.people[0].living=living;for(const [type,value] of [['portrait','https://example.org/portrait.jpg'],['biography','A fictional family story.'],['gravePhoto','https://example.org/grave.jpg'],['graveRecord','https://billiongraves.com/grave/example/123']])d.people[0].facts.push({id:type,type,value,citation:{sourceId:'s1',locator:'fictional example'}});write(root,'data/accepted.json',d);reviewResearch(root);return root;}
function render(root,facts){write(root,'choose.json',{personIds:['p1'],factIds:facts});run(['select',root,path.join(root,'choose.json')]);run(['build',root]);return fs.readFileSync(path.join(root,'build/index.html'),'utf8');}
test('collapsed card includes dates; expanded content contains selected biography, portrait and grave link',t=>{const root=setup(t);const html=render(root,['f1','portrait','biography','gravePhoto','graveRecord']);assert.match(html,/<details class="person"/);assert.match(html,/<summary>[\s\S]*1932[\s\S]*<\/summary>/);assert.match(html,/src="https:\/\/example.org\/portrait.jpg"/);assert.match(html,/A fictional family story/);assert.match(html,/src="https:\/\/example.org\/grave.jpg"/);assert.match(html,/href="https:\/\/billiongraves.com/);});
test('unselected media and biography are absent from HTML and public JSON',t=>{const root=setup(t);const html=render(root,['f1']);assert.doesNotMatch(html,/portrait.jpg|grave.jpg|A fictional family story/);assert.doesNotMatch(JSON.stringify(read(root,'build/publication.json')),/portrait.jpg|grave.jpg|A fictional family story/);});
test('living person grave content and unsafe media URLs are excluded',t=>{const root=setup(t,true);const d=read(root,'data/accepted.json');d.people[0].facts.find(f=>f.type==='portrait').value='javascript:alert(1)';write(root,'data/accepted.json',d);const html=render(root,['portrait','gravePhoto','graveRecord']);assert.doesNotMatch(html,/javascript:|grave.jpg|billiongraves.com/);assert.equal(read(root,'build/publication.json').people[0].facts.length,0);});
