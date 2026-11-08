import {motionDistance,validate} from '../math/challenges.js';

const model=Object.freeze({duration:8,v2:2,maxSpeed:8});
const target=Object.freeze({distance:28});
const seconds=Object.freeze([2,3,4,5,6]);
const speeds=Object.freeze([3,4,5,6,7,8]);
export const DELIVERY=Object.freeze({kind:'motion-plan',fields:[{key:'t1'},{key:'v1'}],model,target,seconds,speeds});
export const DELIVERY_KEY='mathwithcye-supply-delivery-v1';

export function createSupplyDelivery(){
  let phase='plan',t1=4,v1=4,elapsed=0,feedback=null;
  const plannedDistance=()=>motionDistance(DELIVERY,{t1,v1});
  const distanceAt=time=>Math.min(time,t1)*v1+Math.max(0,time-t1)*model.v2;
  return {
    get phase(){return phase;}, get t1(){return t1;}, get v1(){return v1;},
    get elapsed(){return elapsed;}, get feedback(){return feedback;},
    get plannedDistance(){return plannedDistance();}, get distance(){return distanceAt(elapsed);},
    get speed(){return phase==='riding'?(elapsed<t1?v1:model.v2):0;},
    tune(time,speed){
      if(!['plan','ready'].includes(phase)||!seconds.includes(time)||!speeds.includes(speed))return false;
      t1=time;v1=speed;phase='plan';feedback=null;return true;
    },
    check(){
      if(phase!=='plan')return false;
      if(!validate(DELIVERY,{t1,v1}).correct){feedback=plannedDistance()<target.distance?'short':'past';return false;}
      phase='ready';feedback=null;return true;
    },
    board(){if(phase!=='ready')return false;phase='riding';return true;},
    advance(dt){
      if(phase!=='riding'||!Number.isFinite(dt)||dt<=0)return false;
      elapsed=Math.min(model.duration,elapsed+dt);
      if(elapsed===model.duration){phase='arrived';return true;}
      return false;
    },
    unload(){if(phase!=='arrived')return false;phase='complete';return true;}
  };
}
