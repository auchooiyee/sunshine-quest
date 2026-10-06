import {parseNumber} from '../math/quadratics.js';
import {satisfies,budgetTotal} from '../math/challenges.js';
export const skillTag = def => def.skill||({roots:'quadratic-roots',vertex:'quadratic-vertex',design:'quadratic-design',inequality:'feasible-coordinates','motion-plan':'motion-distance','probability-plan':'probability-without-replacement','budget-plan':'budget-constraints'}[def.kind]||def.kind);
// Only report a condition directly evidenced by the submitted values, never infer intent.
export function diagnostic(def,draft){
  const values=Object.fromEntries(Object.entries(draft).map(([k,v])=>[k,parseNumber(v)]));
  if(Object.values(values).some(v=>v===null))return null;
  if(def.kind==='inequality'&&Number.isFinite(values.x)&&Number.isFinite(values.y)){
    if(def.model.constraints.some(c=>['<','>'].includes(c.op)&&Math.abs(c.a*values.x+c.b*values.y-c.c)<1e-7))return 'excludedBoundary';
    if(def.model.constraints.some(c=>!satisfies(values,c)))return 'allConstraints';
  }
  if(def.kind==='probability-plan'&&Number.isFinite(values.red)&&Number.isFinite(values.blue)&&values.red+values.blue!==def.target.total)return 'bagTotal';
  if(def.kind==='budget-plan'&&Number.isFinite(values.saving)&&def.model.items.every(i=>Number.isFinite(values[i.key]))&&budgetTotal(def,values)+values.saving>def.model.budget)return 'overBudget';
  return null;
}
