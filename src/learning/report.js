import {REGIONS} from '../../config/worlds.js';
import {createQuest} from '../missions/quest.js';
import {assignmentCurriculum,encodeAssignment} from '../missions/assignment.js';
import {reviewQueue} from './review.js';
import {skillTag} from './feedback.js';
import {selectDifficulty} from '../math/variants.js';

export const LEGACY_REPORT_COLUMNS=['report_version','exported_at_utc','learner_code','mode','mission_code','form','subject','chapter','region_id','region_name_en','region_name_ms','question_set','task_id','task_title_en','task_title_ms','status','completed','attempts','hints_used','independent_first_answer','xp','answer_draft','last_attempt_at_utc'];
export const REPORT_COLUMNS=[...LEGACY_REPORT_COLUMNS,'run_id','run_kind','assignment_instance','due_label','skill_tag','source_run_id','migrated_run'];
const timestamp=at=>Number.isFinite(at)&&at>0&&Math.abs(at)<=8.64e15?new Date(at).toISOString():'';

/** One row per task in visited routes, or only the active configured class mission. */
export function learningRows(save,curricula,exportedAt=new Date().toISOString()){
  const assignment=save.assignment,worlds=assignment?REGIONS.filter(w=>w.id===assignment.world):REGIONS.filter(w=>save.regions?.[w.id]);
  const runs=[...worlds.map(world=>({...save.regions[world.id],regionId:world.id,learnerCode:save.reportLabel||'',kind:'current'})),...(save.history||[]).map(r=>({...r,kind:'archived'}))];
  return runs.flatMap(run=>{
    const world=REGIONS.find(w=>w.id===run.regionId),saved=run.quest,data=curricula.get(run.regionId);
    if(!saved||!data)return [];
    const original=createQuest(assignmentCurriculum(data,assignment),saved);
    const groups=[{quest:original,kind:run.kind,id:run.run?.id||`legacy-${world.id}`},...reviewQueue(selectDifficulty(data,assignment?.level),saved,run.reviews).filter(r=>run.reviews?.[r.id]).map(r=>({quest:r.practice,kind:'review',id:`${run.run?.id||`legacy-${world.id}`}:review:${r.id}`}))];
    return groups.flatMap(({quest,kind,id})=>{const state=quest.save();return quest.challenges.map(def=>{
      const session=state.sessions[def.id],completed=quest.completed.includes(def.id),independent=completed&&session.independent;
      const started=session.attempts>0||session.hints>0||Object.keys(session.draft).length>0;
      const status=completed?(independent?'completed_independent':'completed_supported'):started?'in_progress':'not_started';
      const last=state.records.filter(r=>r.id===def.id).reduce((at,r)=>timestamp(r.at)&&r.at>at?r.at:at,0);
      return [2,exportedAt,run.learnerCode,assignment?'class_mission':'expedition',assignment?encodeAssignment(assignment):'',4,'Mathematics',world.chapter??'1;6;7;9;10',world.id,world.name.en,world.name.ms,quest.variantId,def.id,def.title.en,def.title.ms,status,completed,session.attempts,session.hints,independent,completed&&kind!=='review'?def.reward:0,JSON.stringify(session.draft),timestamp(last),id,kind,assignment?.instanceId||'',assignment?.dueLabel||'',skillTag(def),kind==='review'?run.run?.id||'':'',run.run?.migrated??true];
    });});
  });
}

// Quoting preserves commas, quotes and line breaks; prefix prevents spreadsheet formulas in text cells.
export function csvCell(value){
  let text=String(value??'');
  if(typeof value==='string'&&/^\s*[=+\-@]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function learningCSV(save,curricula,exportedAt){
  return '\ufeff'+[REPORT_COLUMNS,...learningRows(save,curricula,exportedAt)].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
