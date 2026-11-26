import fs from 'node:fs';
import path from 'node:path';
import {hash,read} from './store.mjs';
import {researchGate} from './research.mjs';

const topics=[
  ['storyFocus','Who should the website center on: one person, a couple, a family or a community—and what connects their story?'],
  ['audience','Who should see this site, and what may they see about living relatives?'],
  ['additionalSources','Beyond the sources already identified, do you have other albums, interviews, documents, relevant emails or family-tree links?'],
  ['storyPlan','Which story should lead the site, and would a map, timeline, photographs or another format help tell it?'],
  ['cover','Which recognized photograph should open the site, or would you prefer a first version without a cover photo?'],
  ['releaseScope','What must this first version contain, and is the requested outcome a local preview or a published website?']
];
const exists=(root,file)=>fs.existsSync(path.join(root,file));
const optional=(root,file,fallback)=>exists(root,file)?read(root,file):fallback;
export function reviewFingerprint(root) {
  const file='build/index.html';
  return hash({research:researchGate(root).fingerprint,project:read(root,'project.json'),data:optional(root,'data/accepted.json',null),selection:optional(root,'publication/selection.json',null),html:exists(root,file)?hash(fs.readFileSync(path.join(root,file))):null});
}
export function assess(root) {
  const research=researchGate(root);
  if(!research.ready) return {stage:'research',action:research.action,next:research.next,questions:research.action==='ask_user'?[{key:research.gaps[0]?.id,question:research.next}]:[],independentWork:research.independentWork,unresolved:research.gaps,research,reviewCurrent:false};
  const progress=optional(root,'discovery.json',{schemaVersion:1,answers:{},tasks:[],review:null});
  if(progress.schemaVersion!==1 || typeof progress.answers!=='object' || !progress.answers || !Array.isArray(progress.tasks)) throw Error('Invalid discovery state');
  const answered=a=>a?.status==='confirmed' && a.by==='user' && typeof a.answer==='string' && a.answer.trim() && typeof a.evidence==='string' && a.evidence.trim();
  const gaps=topics.filter(([key])=>!answered(progress.answers[key])).map(([key,question])=>({key,question}));
  const tasks=progress.tasks;
  for(const t of tasks) if(!t.id||!t.description||!['ready','awaiting_user','blocked','done','deferred'].includes(t.status)) throw Error('Invalid discovery task');
  const pending=tasks.filter(t=>!(t.status==='done'&&typeof t.evidence==='string'&&t.evidence.trim()) && !(t.status==='deferred'&&answered(t.deferral)));
  // Ask consequential framing questions early; do not spend the entire turn building around guesses.
  const urgent=gaps.find(g=>['storyFocus','audience'].includes(g.key));
  const questions=[...(urgent?[urgent]:gaps.slice(0,1)),...pending.filter(t=>t.status==='awaiting_user'&&t.question).map(t=>({key:t.id,question:t.question}))].slice(0,2);
  const work=pending.filter(t=>t.status==='ready');
  const fingerprint=reviewFingerprint(root);
  const review=progress.review;
  const reviewComplete=answered(review)&&review.fingerprint===fingerprint;
  let action,next;
  if(urgent) {action='ask_user';next=urgent.question;}
  else if(gaps.length || questions.length) {action='ask_user';next=questions[0]?.question||gaps[0].question;}
  else if(work.length) {action='continue';next=work[0].description;}
  else if(pending.length) {action='blocked';next=`Resolve or explicitly defer: ${pending.map(t=>t.description).join('; ')}`;}
  else if(!exists(root,'build/index.html')) {action='continue';next='Prepare and validate the agreed local preview; do not mark the website complete.';}
  else if(!reviewComplete) {action='ask_user';next='Please review the current preview: does it center on the right people and place, tell the intended story, and include the agreed first-version content?';questions.push({key:'review',question:next});}
  else if(progress.answers.releaseScope.deliverable==='published') {action='blocked';next='Publication is outside the implemented workflow. Complete an authorized hosting workflow and verify the URL; a local preview is not a published website.';}
  else if(progress.answers.releaseScope.deliverable!=='preview') {action='ask_user';next='Should this release finish as a local preview or a published website?';questions.push({key:'releaseScope',question:next});}
  else {action='complete';next='The agreed local-preview scope is reviewed and no recorded work remains.';}
  return {stage:'planning',action,next,questions,independentWork:work.map(t=>({id:t.id,description:t.description})),unresolved:gaps,pendingTasks:pending,reviewFingerprint:fingerprint,reviewCurrent:Boolean(reviewComplete),research,limits:'Assessment uses recorded state, not proof that all possible research is exhausted. It cannot keep an agent session running or send questions itself.'};
}
