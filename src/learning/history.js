export const HISTORY_LIMIT = 20;
export const newRun = (migrated = false) => ({id:crypto.randomUUID(),startedAt:new Date().toISOString(),migrated});
export const validRun = run => Boolean(run && typeof run.id==='string' && /^[\w-]{1,80}$/.test(run.id) && typeof run.startedAt==='string' && Number.isFinite(Date.parse(run.startedAt)) && typeof run.migrated==='boolean');
export function hasEvidence(quest){return Object.values(quest?.sessions||{}).some(s=>s.attempts||s.hints||Object.keys(s.draft||{}).length);}
export function archiveRun(history,regionId,region,learnerCode){
  if(!hasEvidence(region.quest)&&!Object.keys(region.reviews||{}).length)return [...history];
  if(history.length>=HISTORY_LIMIT)throw new Error('historyFull');
  return [...history,JSON.parse(JSON.stringify({regionId,run:region.run,quest:region.quest,reviews:region.reviews||{},learnerCode,archivedAt:new Date().toISOString()}))];
}
