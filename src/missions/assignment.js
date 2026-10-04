import { REGIONS } from '../../config/worlds.js';
import { selectVariant } from '../math/variants.js';
export const ASSIGNMENT_VERSION=1;
export function checkAssignment(value){
  if(!value||value.v!==ASSIGNMENT_VERSION||!REGIONS.some(w=>w.id===value.world)||(value.world==='finale'?value.tasks!==5:![3,6].includes(value.tasks))||typeof value.assist!=='boolean'||typeof value.guided!=='boolean'||!['en','ms'].includes(value.language))return null;
  const variant=value.variant??0;
  if(!Number.isInteger(variant)||variant<0||variant>2||(value.world==='finale'&&variant!==0))return null;
  return {v:ASSIGNMENT_VERSION,world:value.world,tasks:value.tasks,assist:value.assist,guided:value.guided,language:value.language,...(variant?{variant}:{})};
}
export function encodeAssignment(config){
  const value=checkAssignment(config);if(!value)throw new Error('Invalid assignment');
  return btoa(JSON.stringify(value)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}
export function decodeAssignment(code){
  try{if(typeof code!=='string'||code.length>512||!/^[A-Za-z0-9_-]+$/.test(code))return null;return checkAssignment(JSON.parse(atob(code.replaceAll('-','+').replaceAll('_','/'))));}catch{return null;}
}
export function assignmentKey(config){return 'mathwithcye-class-'+encodeAssignment(config);}
export function assignmentCurriculum(data,config){
  if(!config)return data;
  const selected=selectVariant(data,config.variant||0);
  return {...selected,challenges:selected.challenges.slice(0,config.tasks)};
}
