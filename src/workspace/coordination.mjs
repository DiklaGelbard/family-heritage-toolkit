import fs from 'node:fs';
import path from 'node:path';
import {read,write} from './store.mjs';
export function coordinate(root,op) {
  const state=fs.existsSync(path.join(root,'work.json'))?read(root,'work.json'):{schemaVersion:1,tasks:[],questions:[]};
  const tasks=state.tasks;
  if(op.action==='register') {
    if(typeof op.id!=='string'||!op.id||tasks.some(t=>t.id===op.id)||!op.description||!Array.isArray(op.resources)||op.resources.some(r=>typeof r!=='string'||!r)||!Array.isArray(op.dependsOn)||op.dependsOn.some(id=>!tasks.some(t=>t.id===id))) throw Error('Invalid task registration');
    if(op.phase!==undefined&&!['research','planning'].includes(op.phase)) throw Error('Invalid task phase');
    tasks.push({id:op.id,description:op.description,resources:op.resources,dependsOn:op.dependsOn,phase:op.phase||'research',status:'pending',owner:null});
  } else if(['claim','complete','release'].includes(op.action)) {
    const task=tasks.find(t=>t.id===op.id);if(!task||!op.owner) throw Error('Unknown task/owner');
    if(op.action==='claim') {
      if(task.status!=='pending'||task.dependsOn.some(id=>tasks.find(t=>t.id===id).status!=='done')) throw Error('Task not ready');
      if(tasks.some(t=>t.status==='running'&&t.resources.some(r=>task.resources.includes(r)))) throw Error('Resource already claimed');
      task.owner=op.owner;task.status='running';
    } else {
      if(task.status!=='running'||task.owner!==op.owner) throw Error('Only current owner may finish/release task');
      if(op.action==='complete') {
        const file=typeof op.artifact==='string'?path.resolve(root,op.artifact):'';
        if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||!fs.realpathSync(file).startsWith(fs.realpathSync(root)+path.sep)) throw Error('Task completion requires workspace artifact');
        task.status='done';task.artifact=op.artifact;
      } else task.status='pending';
      task.owner=null;
    }
  } else if(op.action==='ask') {
    if(state.questions.some(q=>q.status==='pending')) throw Error('A user question is already pending');
    if(!op.id||state.questions.some(q=>q.id===op.id)||!op.text) throw Error('Invalid question');
    if(op.phase!==undefined&&!['research','planning'].includes(op.phase)) throw Error('Invalid question phase');
    state.questions.push({id:op.id,text:op.text,status:'pending',phase:op.phase||'research'});
  } else if(op.action==='answer') {
    const q=state.questions.find(q=>q.id===op.id&&q.status==='pending');
    if(!q||op.by!=='user'||!op.answer||!op.evidence) throw Error('Actual user answer and evidence required');
    Object.assign(q,{status:'answered',answer:op.answer,evidence:op.evidence});
  } else throw Error('Unknown coordination action');
  write(root,'work.json',state);return state;
}
