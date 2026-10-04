import {REGIONS} from '../../config/worlds.js';
import {createQuest} from '../missions/quest.js';
import {assignmentCurriculum,encodeAssignment} from '../missions/assignment.js';

export const REPORT_COLUMNS=['report_version','exported_at_utc','learner_code','mode','mission_code','form','subject','chapter','region_id','region_name_en','region_name_ms','question_set','task_id','task_title_en','task_title_ms','status','completed','attempts','hints_used','independent_first_answer','xp','answer_draft','last_attempt_at_utc'];
const timestamp=at=>Number.isFinite(at)&&at>0&&Math.abs(at)<=8.64e15?new Date(at).toISOString():'';

/** One row per task in visited routes, or only the active configured class mission. */
export function learningRows(save,curricula,exportedAt=new Date().toISOString()){
  const assignment=save.assignment,worlds=assignment?REGIONS.filter(w=>w.id===assignment.world):REGIONS.filter(w=>save.regions?.[w.id]);
  return worlds.flatMap(world=>{
    const saved=save.regions?.[world.id]?.quest,data=curricula.get(world.id);
    if(!saved||!data)return [];
    const quest=createQuest(assignmentCurriculum(data,assignment),saved),state=quest.save();
    return quest.challenges.map(def=>{
      const session=state.sessions[def.id],completed=quest.completed.includes(def.id),independent=completed&&session.independent;
      const started=session.attempts>0||session.hints>0||Object.keys(session.draft).length>0;
      const status=completed?(independent?'completed_independent':'completed_supported'):started?'in_progress':'not_started';
      const last=state.records.filter(r=>r.id===def.id).reduce((at,r)=>timestamp(r.at)&&r.at>at?r.at:at,0);
      return [1,exportedAt,save.reportLabel||'',assignment?'class_mission':'expedition',assignment?encodeAssignment(assignment):'',4,'Mathematics',world.chapter??'1;6;7;9;10',world.id,world.name.en,world.name.ms,quest.variantId,def.id,def.title.en,def.title.ms,status,completed,session.attempts,session.hints,independent,completed?def.reward:0,JSON.stringify(session.draft),timestamp(last)];
    });
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
