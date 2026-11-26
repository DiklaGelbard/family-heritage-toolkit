import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const hash = value => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export function read(root, file) { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
export function write(root, file, value) {
  const dest = path.join(root, file);
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  const temp = `${dest}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', {mode:0o600});
  fs.renameSync(temp, dest);
}
export function init(root) {
  fs.mkdirSync(root, {recursive:true});
  if (fs.existsSync(path.join(root, 'project.json'))) throw Error('Workspace already initialized');
  write(root, 'project.json', {schemaVersion:1, title:'', language:'he', audience:'private', purpose:'', scope:'', cover:null, sources:[]});
  write(root, 'state.json', {schemaVersion:1, phase:'discovery', receipts:[]});
  write(root, 'decisions.json', {schemaVersion:1, decisions:[]});
  write(root, 'research/questions.json', {schemaVersion:1, questions:[]});
  write(root, 'discovery.json', {schemaVersion:1, answers:{}, tasks:[], review:null});
  fs.copyFileSync(fileURLToPath(new URL('../../templates/brief.md',import.meta.url)),path.join(root,'brief.md'));
}
export function receipt(root, operation, inputHash, outputHash) {
  const state=read(root,'state.json');
  if (!state.receipts.some(x=>x.operation===operation && x.inputHash===inputHash && x.outputHash===outputHash)) {
    state.receipts.push({operation,inputHash,outputHash,at:new Date().toISOString()});
  }
  state.phase=operation; write(root,'state.json',state);
}
export function validateProject(p) {
  if(p.schemaVersion!==1 || !p.title?.trim() || !p.purpose?.trim() || !p.scope?.trim()) throw Error('Complete title, purpose and scope in project.json');
  if(!['he','en'].includes(p.language) || !['private','public'].includes(p.audience)) throw Error('Invalid language or audience');
}
export function locked(root, fn) {
  const lock=path.join(root,'.writer.lock');
  let fd;
  try {fd=fs.openSync(lock,'wx');} catch(e) {if(e.code==='EEXIST') throw Error('Workspace is locked. Verify no writer is running before removing .writer.lock.'); throw e;}
  try {fs.writeFileSync(fd, String(process.pid));return fn();} finally {fs.closeSync(fd);fs.unlinkSync(lock);}
}
