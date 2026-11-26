#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {init,read,write,hash,receipt,validateProject,locked} from '../workspace/store.mjs';
import {validate} from '../genealogy/validate.mjs';
import {parseGedcom} from '../adapters/gedcom.mjs';
import {build,validateSelection} from '../publication/build.mjs';
const repo=fileURLToPath(new URL('../../',import.meta.url));
export function run(args) {
  const [cmd,dir,input]=args,root=path.resolve(dir||'.workspaces/demo');
  if(cmd==='init') {init(root);return root;}
  if(cmd==='questions') return fs.readFileSync(path.join(repo,'templates/interview.json'),'utf8');
  if(cmd==='status') {
    const state=read(root,'state.json');
    let next='Complete discovery and import sources',proposalHash=null;
    if(fs.existsSync(path.join(root,'proposals/import.json'))) {
      const proposal=read(root,'proposals/import.json');
      proposalHash=hash(proposal);
      const accepted=fs.existsSync(path.join(root,'data/accepted.json'))?read(root,'data/accepted.json'):null;
      if(!accepted || hash(accepted)!==hash(proposal.data)) next='Review proposal and accept its digest';
      else if(!fs.existsSync(path.join(root,'publication/selection.json'))) next='Select publication people and facts';
      else if(read(root,'publication/selection.json').inputHash!==hash({project:read(root,'project.json'),data:accepted})) next='Publication selection is stale; review again';
      else next='Build or inspect preview; no external deployment has been performed';
    }
    return JSON.stringify({...state,proposalHash,next},null,2);
  }
  if(cmd==='demo') {
    init(root);write(root,'project.json',read(repo,'examples/project.json'));
    run(['import',root,path.join(repo,'examples/family.json')]);
    run(['accept',root,hash(read(root,'proposals/import.json'))]);
    run(['select',root,path.join(repo,'examples/selection.json')]);
    return run(['build',root]);
  }
  if(!['import','accept','select','build'].includes(cmd)) throw Error('Commands: init DIR | questions | status DIR | import DIR FILE | accept DIR DIGEST | select DIR FILE | build DIR | demo [DIR]');
  return locked(root,()=>{
    if(cmd==='import') {
      validateProject(read(root,'project.json'));
      const bytes=fs.readFileSync(input),digest=hash(bytes);
      const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      const ged=input.toLowerCase().endsWith('.ged');
      const data=validate(ged?parseGedcom(text,`source-${digest.slice(0,12)}`):JSON.parse(text));
      const sourceFile=`sources/${digest}${ged?'.ged':'.json'}`,dest=path.join(root,sourceFile);
      fs.mkdirSync(path.dirname(dest),{recursive:true});
      if(fs.existsSync(dest)) {if(hash(fs.readFileSync(dest))!==digest) throw Error('Source integrity check failed');}
      else fs.writeFileSync(dest,bytes,{flag:'wx',mode:0o600});
      const proposal={digest,sourceFile,data};
      const old=fs.existsSync(path.join(root,'proposals/import.json'))?read(root,'proposals/import.json'):null;
      if(old) write(root,`proposals/history/${hash(old)}.json`,old);
      write(root,'proposals/import.json',proposal);receipt(root,'import',digest,hash(data));
      return `Proposal prepared: ${data.people.length} people. Review proposals/import.json before accepting.`;
    }
    if(cmd==='accept') {
      const p=read(root,'proposals/import.json');
      // Digest is of the reviewed proposal, not merely of the original file.
      if(input!==hash(p)) throw Error(`Supply the reviewed proposal hash: ${hash(p)}`);
      validate(p.data);
      if(fs.existsSync(path.join(root,'data/accepted.json'))) {
        const old=read(root,'data/accepted.json');write(root,`data/history/${hash(old)}.json`,old);
      }
      write(root,'data/accepted.json',p.data);receipt(root,'accepted',hash(p),hash(p.data));return 'Accepted reviewed snapshot';
    }
    if(cmd==='select') {
      const p=read(root,'project.json'),d=validate(read(root,'data/accepted.json'));validateProject(p);
      const s=JSON.parse(fs.readFileSync(input,'utf8'));validateSelection(s,d);
      write(root,'publication/selection.json',{personIds:s.personIds,factIds:s.factIds,inputHash:hash({project:p,data:d})});
      return 'Publication selection recorded; no deployment performed';
    }
    return build(root);
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  try {console.log(run(process.argv.slice(2)));} catch(e) {console.error(e.message);process.exitCode=1;}
}
