import {satisfies} from '../math/challenges.js';

const constraints=Object.freeze([
  Object.freeze({a:1,b:0,op:'>=',c:3,label:'x ≥ 3'}),
  Object.freeze({a:0,b:1,op:'>=',c:1,label:'y ≥ 1'}),
  Object.freeze({a:1,b:1,op:'<',c:7,label:'x + y < 7'}),
  Object.freeze({a:2,b:1,op:'<=',c:10,label:'2x + y ≤ 10'})
]);
export const CANYON=Object.freeze({bound:6,constraints,duration:2.6});
export const CANYON_KEY='mathwithcye-canyon-landing-v1';

const coordinate=n=>Number.isInteger(n)&&n>=0&&n<=CANYON.bound;
export function checkLanding(point){
  if(!point||!coordinate(point.x)||!coordinate(point.y))return null;
  return constraints.map(rule=>{
    const value=rule.a*point.x+rule.b*point.y;
    const accepted=satisfies(point,rule);
    return {rule,value,accepted,excluded:!accepted&&value===rule.c&&(rule.op==='<'||rule.op==='>')};
  });
}

export function createCanyonLanding(){
  let phase='plan',point={x:null,y:null},review=null,elapsed=0;
  return {
    get phase(){return phase;},get point(){return {...point};},get review(){return review;},get progress(){return elapsed/CANYON.duration;},
    select(x,y){
      if(!['plan','ready'].includes(phase)||![x,y].every(n=>n===null||coordinate(n)))return false;
      point={x,y};phase='plan';review=null;return true;
    },
    check(){
      if(phase!=='plan')return false;
      review=checkLanding(point)||[];
      if(review.length&&review.every(result=>result.accepted)){phase='ready';return true;}
      return false;
    },
    launch(){if(phase!=='ready')return false;phase='flying';return true;},
    advance(dt){
      if(phase!=='flying'||!Number.isFinite(dt)||dt<=0)return false;
      elapsed=Math.min(CANYON.duration,elapsed+dt);
      if(elapsed===CANYON.duration){phase='complete';return true;}
      return false;
    }
  };
}
