import fs from 'node:fs';
import path from 'node:path';
import {read,write,hash} from './store.mjs';
export function saveTranscript(root,input) {
  const coverage=read(root,'research/coverage.json'),source=coverage.sources.find(s=>s.id===input.sourceId);
  if(!source||!['audio','video'].includes(source.kind)) throw Error('Transcript requires inventoried audio/video source');
  const check=doc=>{
    if(!doc||doc.recordingId!==source.id||!Number.isFinite(doc.durationSeconds)||doc.durationSeconds<=0||!Array.isArray(doc.segments)||!doc.segments.length) throw Error('Invalid transcript metadata');
    const ids=new Set();
    for(const s of doc.segments) {
      if(!s.id||ids.has(s.id)||!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>doc.durationSeconds||typeof s.text!=='string') throw Error('Invalid transcript segment');ids.add(s.id);
    }
  };
  check(input.raw);check(input.corrected);
  if(input.raw.durationSeconds!==input.corrected.durationSeconds) throw Error('Transcript duration mismatch');
  const raw=new Map(input.raw.segments.map(s=>[s.id,s]));
  for(const s of input.corrected.segments) {const original=raw.get(s.id);if(!original||original.start!==s.start||original.end!==s.end) throw Error('Corrections must preserve recording segment identity and timestamps');}
  const prefix=`research/transcripts/${hash(source.id).slice(0,20)}`;
  const rawFile=`${prefix}-raw.json`,correctedFile=`${prefix}-corrected.json`;
  if(fs.existsSync(path.join(root,rawFile))&&hash(read(root,rawFile))!==hash(input.raw)) throw Error('Raw transcript is immutable; preserve a new source/version for a new ASR run');
  if(!fs.existsSync(path.join(root,rawFile))) write(root,rawFile,input.raw);
  if(fs.existsSync(path.join(root,correctedFile))) {const old=read(root,correctedFile);write(root,`${prefix}-history/${hash(old)}.json`,old);}
  write(root,correctedFile,input.corrected);
  source.extent={unit:'seconds',total:input.raw.durationSeconds};
  source.review={artifact:correctedFile,summary:input.summary||'Transcript reviewed to the extent recorded by segment status',transcript:{raw:rawFile,corrected:correctedFile},ranges:input.corrected.segments.filter(s=>['reviewed','unintelligible'].includes(s.reviewStatus)).map(s=>({start:s.start,end:s.end,artifact:correctedFile}))};
  // Coverage gate determines completeness, not this status flag alone.
  source.status='reviewed';write(root,'research/coverage.json',coverage);
  return {rawFile,correctedFile,reviewedRanges:source.review.ranges.length};
}
