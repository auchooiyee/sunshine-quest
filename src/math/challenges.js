import { parseNumber, validate as quadraticValidate } from './quadratics.js';

export function fieldKeys(def) {
  if (def.fields) return def.fields.map(f => f.key);
  return def.kind === 'design' ? ['span','k'] : def.kind === 'roots' ? ['first','second'] : ['x','y'];
}
const near = (a,b) => Math.abs(a-b) < 1e-6;
export function satisfies(point, constraint) {
  const lhs=constraint.a*point.x+constraint.b*point.y;
  if (constraint.op === '<') return lhs < constraint.c-1e-7;
  if (constraint.op === '>') return lhs > constraint.c+1e-7;
  if (constraint.op === '>=') return lhs >= constraint.c-1e-7;
  return lhs <= constraint.c+1e-7;
}
export function motionDistance(def, draft) {
  const t=parseNumber(draft.t1),v=parseNumber(draft.v1);
  return t === null || v === null ? null : t*v+(def.model.duration-t)*def.model.v2;
}
export function budgetTotal(def, draft) {
  return def.model.items.reduce((sum,item)=>sum+item.price*(parseNumber(draft[item.key])??0),0);
}
export function validate(def, draft={}) {
  if(def.controlSteps){
    for(const [key,rule] of Object.entries(def.controlSteps)){
      const n=parseNumber(draft?.[key]);if(n===null)return {correct:false,reason:'invalid'};
      if(n<rule.min||n>rule.max||Math.abs((n-rule.min)/rule.step-Math.round((n-rule.min)/rule.step))>1e-6)return {correct:false,reason:'application'};
    }
  }
  if (['roots','vertex','design'].includes(def.kind)) return quadraticValidate(def,draft);
  const values={};
  for(const key of fieldKeys(def)) {
    const n=parseNumber(draft?.[key]);
    if(n===null) return {correct:false,reason:'invalid'};
    values[key]=n;
  }
  let correct=false;
  if(def.kind==='inequality') {
    correct=Number.isInteger(values.x)&&Number.isInteger(values.y)&&values.x>=0&&values.y>=0&&values.x<=def.model.bound&&values.y<=def.model.bound&&def.model.constraints.every(c=>satisfies(values,c));
  } else if(def.kind==='motion-plan') {
    correct=values.t1>=1&&values.t1<def.model.duration&&Number.isInteger(values.t1)&&values.v1>=0&&values.v1<=def.model.maxSpeed&&near(motionDistance(def,values),def.target.distance);
  } else if(def.kind==='probability-plan') {
    const red=values.red,blue=values.blue,total=red+blue;
    correct=Number.isInteger(red)&&Number.isInteger(blue)&&red>=1&&blue>=1&&total===def.target.total&&near(red/total*(red-1)/(total-1),def.target.probability);
  } else if(def.kind==='budget-plan') {
    correct=def.model.items.every(i=>Number.isInteger(values[i.key])&&values[i.key]>=i.minimum&&values[i.key]<=i.maximum)&&values.saving>=def.target.saving&&Number.isInteger(values.saving)&&budgetTotal(def,values)+values.saving<=def.model.budget;
  } else {
    correct=fieldKeys(def).every(key=>near(values[key],def.answer[key]));
  }
  return {correct,reason:correct?'success':'application'};
}
