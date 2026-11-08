import {motionDistance} from '../math/challenges.js';
import {DELIVERY} from './supply-delivery.js';

const routes=Object.freeze({ridge:Object.freeze({distance:28,permit:10}),valley:Object.freeze({distance:32,permit:4})});
export const STORM=Object.freeze({routes,budget:90,supplies:36,reserve:20,model:DELIVERY.model,seconds:DELIVERY.seconds,speeds:DELIVERY.speeds});
export const STORM_KEY='mathwithcye-storm-relay-v1';

export function relayPlan(route,t1,v1){
  if(!Object.hasOwn(routes,route)||!STORM.seconds.includes(t1)||!STORM.speeds.includes(v1))return null;
  const {distance,permit}=routes[route];
  const planned=motionDistance(STORM,{t1,v1}),cart=3*v1+2*t1;
  const spent=STORM.supplies+permit+cart,remaining=STORM.budget-spent;
  return {route,t1,v1,distance,permit,planned,cart,spent,remaining,correctDistance:planned===distance,correctReserve:remaining>=STORM.reserve};
}

export function createStormRelay(){
  let plan=relayPlan('ridge',4,4),phase='plan',checked=false,elapsed=0;
  return {
    get phase(){return phase;},get plan(){return {...plan};},get checked(){return checked;},get elapsed(){return elapsed;},
    get travelled(){return Math.min(elapsed,plan.t1)*plan.v1+Math.max(0,elapsed-plan.t1)*STORM.model.v2;},
    tune(route,t1,v1){
      if(!['plan','ready'].includes(phase))return false;
      const next=relayPlan(route,t1,v1);if(!next)return false;
      plan=next;phase='plan';checked=false;return true;
    },
    check(){
      if(phase!=='plan')return false;checked=true;
      if(!plan.correctDistance||!plan.correctReserve)return false;
      phase='ready';return true;
    },
    launch(){if(phase!=='ready')return false;phase='riding';return true;},
    advance(dt){
      if(phase!=='riding'||!Number.isFinite(dt)||dt<=0)return false;
      elapsed=Math.min(STORM.model.duration,elapsed+dt);
      if(elapsed===STORM.model.duration){phase='arrived';return true;}
      return false;
    },
    unload(){if(phase!=='arrived')return false;phase='complete';return true;}
  };
}
