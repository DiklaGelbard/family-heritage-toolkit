import fs from 'node:fs';
import path from 'node:path';
import {read,write} from './store.mjs';
export function annotate(root,op) {
  const file='research/photo-annotations.json';
  const state=fs.existsSync(path.join(root,file))?read(root,file):{schemaVersion:1,items:[],cursor:null};
  if(!op.mediaId||!op.labelId||!op.source||!op.evidence||op.by!=='user'||!['confirmed','rejected','unsure','skipped'].includes(op.status)) throw Error('Annotation needs media/label IDs, source and user evidence');
  if(op.personId&&fs.existsSync(path.join(root,'data/accepted.json'))&&!read(root,'data/accepted.json').people.some(p=>p.id===op.personId)) throw Error('Unknown person ID; retain an unlinked label until reconciled');
  if(op.region&&(!['x','y','width','height'].every(k=>Number.isFinite(op.region[k])&&op.region[k]>=0&&op.region[k]<=1)||op.region.x+op.region.width>1||op.region.y+op.region.height>1)) throw Error('Region must use normalized image coordinates');
  const existing=state.items.find(a=>a.mediaId===op.mediaId&&a.labelId===op.labelId);
  const record=existing||{mediaId:op.mediaId,labelId:op.labelId,history:[]};
  if(existing) {const {history,...previous}=existing;record.history.push(previous);}
  // Patch only supplied fields: a seated/standing correction preserves name and region.
  for(const key of ['name','personId','position','posture','region','date','event','memory','status','source','evidence']) if(op[key]!==undefined) record[key]=op[key];
  record.updatedAt=new Date().toISOString();
  if(!existing) state.items.push(record);
  state.cursor={mediaId:op.mediaId,labelId:op.labelId};write(root,file,state);return state;
}
