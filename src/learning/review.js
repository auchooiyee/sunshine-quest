import {selectVariant,variantOptions} from '../math/variants.js';
import {createQuest} from '../missions/quest.js';

/** A separate fresh-number check. Never replaces the original run's evidence or rewards. */
export function reviewCurriculum(data,source,id){
  if(!data.variants?.length)return null;
  const original=createQuest(data,source);
  if(!original.completed.includes(id)||original.save().sessions[id].independent)return null;
  const next=selectVariant(data,(original.variantIndex+1)%variantOptions(data).length);
  const def=next.challenges.find(d=>d.id===id);
  return def?{...next,challenges:[def]}:null;
}
export function reviewQueue(data,source,reviews={}){
  const original=createQuest(data,source);
  return original.challenges.flatMap(def=>{
    const curriculum=reviewCurriculum(data,source,def.id);
    if(!curriculum)return [];
    const practice=createQuest(curriculum,reviews[def.id]);
    return [{id:def.id,title:def.title,variantId:practice.variantId,complete:practice.complete,independent:practice.independent===1,curriculum,practice}];
  });
}
