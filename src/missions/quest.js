import { validate, fieldKeys } from '../math/challenges.js';
import { resolveFinaleChallenge } from './finale.js';
import { restoreVariant, ORIGINAL_VARIANT } from '../math/variants.js';

/** Progress is a consecutive sequence. Rewards are derived, never incremented twice. */
export function createQuest(curriculum, saved) {
  curriculum=restoreVariant(curriculum,saved);
  if(saved && (saved.variantId || ORIGINAL_VARIANT)!==curriculum.variantId) saved=null;
  const definitions = curriculum.challenges;
  const completed = [];
  const sessions = {};
  const resolve=def=>curriculum.kind==='finale'?resolveFinaleChallenge(def,{completed,sessions}):def;
  for (const def of definitions) {
    const previous = saved?.sessions?.[def.id];
    const draft = {};
    for (const key of fieldKeys(def)) {
      const val = previous?.draft?.[key];
      if ((typeof val === 'string' && val.length <= 32) || (typeof val === 'number' && Number.isFinite(val))) draft[key] = val;
    }
    sessions[def.id] = {
      draft, hints: Number.isInteger(previous?.hints) ? Math.max(0,Math.min(3,previous.hints)) : 0,
      attempts: Number.isInteger(previous?.attempts) ? Math.max(0,Math.min(1000000,previous.attempts)) : 0,
      independent:false
    };
  }
  for(const def of definitions){
    if(Array.isArray(saved?.completed)&&saved.completed.includes(def.id)&&validate(resolve(def),sessions[def.id].draft).correct){
      completed.push(def.id);const previous=saved.sessions?.[def.id];sessions[def.id].independent=previous?.independent===true&&previous.hints===0&&previous.attempts===1;
    }else break;
  }
  const records = Array.isArray(saved?.records) ? saved.records.slice(-100).filter(r => r && definitions.some(d => d.id === r.id) && typeof r.correct === 'boolean' && Number.isInteger(r.hints) && r.hints >= 0 && r.hints <= 3).map(r => ({ id:r.id, correct:r.correct, hints:r.hints, first:r.first === true, at: Number.isFinite(r.at) ? r.at : 0 })) : [];
  let active = null;
  return {
    get variantId() { return curriculum.variantId; },
    get variantIndex() { return curriculum.variantIndex; },
    get next() { const def=definitions[completed.length];return def?resolve(def):null; },
    get active() { const def=definitions.find(d => d.id === active);return def?resolve(def):null; },
    get challenges() { return definitions.map(resolve); },
    get complete() { return completed.length === definitions.length; },
    get xp() { return definitions.filter(d => completed.includes(d.id)).reduce((n,d) => n+d.reward,0); },
    get completed() { return [...completed]; },
    get records() { return records.map(r => ({...r})); },
    get independent() { return completed.filter(id => sessions[id].independent).length; },
    get session() { return active ? sessions[active] : null; },
    start(id) {
      if (id !== this.next?.id) return false;
      active = id; return true;
    },
    close() { active = null; },
    edit(patch) {
      if (!active || completed.includes(active)) return;
      for (const [key,value] of Object.entries(patch)) {
        if (fieldKeys(this.active).includes(key) && ((typeof value === 'string' && value.length <= 32) || (typeof value === 'number' && Number.isFinite(value)))) sessions[active].draft[key] = value;
      }
    },
    hint() {
      if (!active) return 0;
      if (completed.includes(active)) return sessions[active].hints;
      sessions[active].hints = Math.min(3,sessions[active].hints+1); return sessions[active].hints;
    },
    submit() {
      const def = this.active;
      if (!def || this.next?.id !== def.id) return { correct:false, reason:'unavailable' };
      const result = validate(def, sessions[active].draft);
      if (result.reason === 'invalid') return result;
      const first = sessions[active].attempts === 0;
      sessions[active].attempts++;
      records.push({ id:active, correct:result.correct, hints:sessions[active].hints, first, at:Date.now() });
      if (records.length > 100) records.shift();
      if (result.correct) { completed.push(active); sessions[active].independent = first && sessions[active].hints === 0; }
      return {...result, reward:result.correct ? def.reward : 0};
    },
    save() { return JSON.parse(JSON.stringify({ variantId:curriculum.variantId, completed, sessions, records })); }
  };
}
