import { REGIONS } from '../../config/worlds.js';
import { selectVariant } from '../math/variants.js';
export const ASSIGNMENT_VERSION=1;
// This order is part of the code format; keep it stable when adding regions.
const CODE_WORLDS=['quadratics','inequalities','motion','probability','finance'];
function legacyCode(value){return btoa(JSON.stringify(value)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
export function checkAssignment(value){
  if(!value||value.v!==ASSIGNMENT_VERSION||!REGIONS.some(w=>w.id===value.world)||(value.world==='finale'?value.tasks!==5:![3,6].includes(value.tasks))||typeof value.assist!=='boolean'||typeof value.guided!=='boolean'||!['en','ms'].includes(value.language))return null;
  const variant=value.variant??0;
  if(!Number.isInteger(variant)||variant<0||variant>2||(value.world==='finale'&&variant!==0))return null;
  return {v:ASSIGNMENT_VERSION,world:value.world,tasks:value.tasks,assist:value.assist,guided:value.guided,language:value.language,...(variant?{variant}:{})};
}
export function encodeAssignment(config){
  const value=checkAssignment(config);if(!value)throw new Error('Invalid assignment');
  const flags=Number(value.assist)*4+Number(value.guided)*2+Number(value.language==='ms');
  const index=value.world==='finale'?240+flags:((CODE_WORLDS.indexOf(value.world)*3+(value.variant||0))*2+Number(value.tasks===6))*8+flags;
  if(index<0||index>247)throw new Error('Unsupported assignment code');
  const body=1000+index,check=98-(body*100)%97;
  return String(body)+String(check).padStart(2,'0');
}
export function decodeAssignment(code){
  try{
    if(typeof code!=='string'||code.length>512||!/^[A-Za-z0-9_-]+$/.test(code))return null;
    if(/^\d+$/.test(code)){
      if(!/^\d{6}$/.test(code)||Number(code)%97!==1)return null;
      const index=Number(code.slice(0,4))-1000;
      if(index<0||index>247)return null;
      const flags=index%8,slot=Math.floor(index/8);
      return checkAssignment({v:1,world:index>=240?'finale':CODE_WORLDS[Math.floor(slot/6)],tasks:index>=240?5:slot%2?6:3,assist:Boolean(flags&4),guided:Boolean(flags&2),language:flags&1?'ms':'en',...(index<240&&Math.floor(slot/2)%3?{variant:Math.floor(slot/2)%3}:{})});
    }
    return checkAssignment(JSON.parse(atob(code.replaceAll('-','+').replaceAll('_','/'))));
  }catch{return null;}
}
// Keep the original storage identity so short and legacy codes resume the same work.
export function assignmentKey(config){const value=checkAssignment(config);if(!value)throw new Error('Invalid assignment');return 'mathwithcye-class-'+legacyCode(value);}
export function assignmentCurriculum(data,config){
  if(!config)return data;
  const selected=selectVariant(data,config.variant||0);
  return {...selected,challenges:selected.challenges.slice(0,config.tasks)};
}
