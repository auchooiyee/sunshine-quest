import {parseNumber} from '../math/quadratics.js';
import {validate,budgetTotal} from '../math/challenges.js';
import {applicationFor} from './application.js';
import {adventureFor} from '../../config/adventures.js';
export function branchFractions(model){
  const {red,blue,replacement,event}=model,total=red+blue,remaining=total-(replacement?0:1),second=event[1]==='R'?red-(replacement?0:1):blue;
  const fraction=(n,d)=>{let a=n,b=d;while(b)[a,b]=[b,a%b];return d/a===1?String(n/a):`${n/a}/${d/a}`;};
  return {conditional:fraction(second,remaining),combined:fraction(red*second,total*remaining)};
}

/** Rebuild constructions from validated mathematics, never from mutable world save flags. */
export function constructionsFor(region,quest){
  const route=adventureFor(region);if(!route)return {items:[],bridges:[],effects:[]};
  const history=quest.save(),items=[],bridges=[],effects=[];
  for(const def of quest.challenges){
    if(!history.completed.includes(def.id))continue;
    const draft=history.sessions[def.id]?.draft;if(!validate(def,draft).correct)continue;
    const values=Object.fromEntries(Object.entries(draft).map(([key,v])=>[key,parseNumber(v)]));
    const guardian=def.station==='guardian',phase=Math.max(0,quest.challenges.filter(d=>d.station==='guardian').findIndex(d=>d.id===def.id));
    const origin=guardian?route.stations.guardian-260+phase*120:route.stations[def.station]+70;
    const item={id:def.id,kind:def.kind,title:def.title,guardian,origin,values,model:def.model,target:def.target};
    if(def.kind==='design'){
      item.origin=guardian?route.stations.guardian+100:2520;
      const bridge={id:def.id,span:values.span,k:values.k,origin:item.origin};bridges.push(bridge);
    }
    if(def.kind==='budget-plan'){item.spent=budgetTotal(def,draft);item.remaining=def.model.budget-item.spent-values.saving;}
    items.push(item);
    const effect=applicationFor({...def,outputOrigin:origin},draft);
    if(effect)effects.push({...effect,id:def.id,...(effect.kind==='cart'&&guardian?{trackWidth:220}:{})});
  }
  return {items,bridges,effects};
}
export function constructionSummary(item,language){
  const v=item.values,m=item.model,local=(en,ms)=>language==='ms'?ms:en,n=x=>Number(x.toFixed(3));
  if(item.kind==='roots')return local(`Anchors: ${v.first} m and ${v.second} m`,`Tambatan: ${v.first} m dan ${v.second} m`);
  if(item.kind==='vertex')return local(`Clearance beacon: (${v.x}, ${v.y}) m`,`Suar ketinggian: (${v.x}, ${v.y}) m`);
  if(item.kind==='design')return local(`Built arch: ${v.span} m span · ${n(v.k*v.span*v.span/4)} m high`,`Lengkung: rentang ${v.span} m · tinggi ${n(v.k*v.span*v.span/4)} m`);
  if(item.kind==='inequality')return local(`Platform at (${v.x}, ${v.y}); all ${m.constraints.length} restrictions satisfied`,`Pelantar di (${v.x}, ${v.y}); semua ${m.constraints.length} syarat dipatuhi`);
  if(item.kind==='motion-plan')return `${v.v1} m/s × ${v.t1} s + ${m.v2} m/s × ${m.duration-v.t1} s = ${item.target.distance} m`;
  if(item.kind==='motion-reading')return local(`Journey calibrated: ${v.value} ${m.graph==='distance'?'m/s':'m'}`,`Perjalanan ditentukur: ${v.value} ${m.graph==='distance'?'m/s':'m'}`);
  if(item.kind==='probability-reading'){const p=branchFractions(m);return `${m.red} R + ${m.blue} B · ${local(m.replacement?'with replacement':'without replacement',m.replacement?'dengan pengembalian':'tanpa pengembalian')} · P(${m.event[1]} | R) = ${p.conditional} · P(${m.event}) = ${p.combined}`;}
  if(item.kind==='probability-plan')return `${v.red} R + ${v.blue} B · P(RR) = ${item.target.probabilityFraction||n(item.target.probability)}`;
  if(item.kind==='finance-reading')return m.chart==='savings'?local(`Goal reached after ${v.value} full months`,`Sasaran dicapai selepas ${v.value} bulan penuh`):local(`Monthly savings: RM${v.value}`,`Simpanan bulanan: RM${v.value}`);
  return local(`Supplies RM${item.spent} + savings RM${v.saving} + unspent RM${item.remaining} = RM${m.budget}`,`Bekalan RM${item.spent} + simpanan RM${v.saving} + baki RM${item.remaining} = RM${m.budget}`);
}
