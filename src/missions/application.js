import { validate } from '../math/challenges.js';
import { parseNumber } from '../math/quadratics.js';
export function applicationFor(def,draft){
  if(!def||!validate(def,draft).correct)return null;
  const n=key=>parseNumber(draft[key]);
  const origin=def.outputOrigin===undefined?{}:{origin:def.outputOrigin};
  if(def.kind==='inequality')return {kind:'waypoint',point:{x:n('x'),y:n('y')},x:(def.outputOrigin??2520)+n('x')*22,y:500-n('y')*12};
  if(def.kind==='motion-plan')return {kind:'cart',t1:n('t1'),v1:n('v1'),v2:def.model.v2,duration:def.model.duration,distance:def.target.distance,...origin};
  if(def.kind==='probability-plan')return {kind:'crystals',red:n('red'),blue:n('blue'),...origin};
  if(def.kind==='probability-reading'&&def.issueCrystals)return {kind:'crystals',red:def.model.red,blue:def.model.blue,...origin};
  if(def.kind==='budget-plan')return {kind:'camp',food:n('food'),medical:n('medical'),lamp:n('lamp'),saving:n('saving'),...origin};
  return null;
}
