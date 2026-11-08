const total=6;
const target=Object.freeze({num:8,den:15});
const orders=Object.freeze(['RB','BR']);
const redChoices=Object.freeze([1,2,3,4,5]);
export const SIGNAL=Object.freeze({total,target,orders,redChoices,duration:2.8});
export const SIGNAL_KEY='mathwithcye-crystal-signal-v1';

function gcd(a,b){while(b)[a,b]=[b,a%b];return a;}
export function fraction(num,den){const d=gcd(num,den);return `${num/d}/${den/d}`;}

export function signalModel(red,replacement){
  if(!redChoices.includes(red)||typeof replacement!=='boolean')throw new RangeError('Choose a valid crystal bag and draw rule.');
  const counts={R:red,B:total-red};
  const secondTotal=total-(replacement?0:1);
  const den=total*secondTotal;
  const branches={};
  for(const first of ['R','B'])for(const second of ['R','B']){
    const secondCount=counts[second]-(first===second&&!replacement?1:0);
    branches[first+second]={firstCount:counts[first],secondCount,secondTotal,num:counts[first]*secondCount,den};
  }
  const mixed={num:branches.RB.num+branches.BR.num,den};
  return {counts,secondTotal,branches,mixed};
}

export function createCrystalSignal(){
  let red=3,replacement=true,phase='plan',feedback=null,first=null,demonstrated=[],elapsed=0;
  const model=()=>signalModel(red,replacement);
  return {
    get phase(){return phase;},get red(){return red;},get replacement(){return replacement;},
    get feedback(){return feedback;},get first(){return first;},get demonstrated(){return [...demonstrated];},
    get model(){return model();},get progress(){return elapsed/SIGNAL.duration;},
    get remaining(){const counts={...model().counts};if(first&&!replacement)counts[first]--;return counts;},
    tune(nextRed,nextReplacement){
      if(phase!=='plan'||!redChoices.includes(nextRed)||typeof nextReplacement!=='boolean')return false;
      red=nextRed;replacement=nextReplacement;feedback=null;return true;
    },
    check(){
      if(phase!=='plan')return false;
      const {num,den}=model().mixed;
      if(num*target.den!==target.num*den){feedback=replacement?'replacement':num*target.den<target.num*den?'low':'high';return false;}
      phase='trace';feedback=null;return true;
    },
    pick(colour){
      if(phase!=='trace'||!['R','B'].includes(colour))return false;
      if(!first){first=colour;feedback=null;return true;}
      if(!replacement&&first===colour&&model().counts[colour]===1)return false;
      const order=first+colour;first=null;
      if(!orders.includes(order)){feedback='same';return true;}
      if(demonstrated.includes(order)){feedback='repeat';return true;}
      demonstrated.push(order);feedback='one';
      if(demonstrated.length===orders.length){phase='ready';feedback=null;}
      return true;
    },
    clearFirst(){if(phase==='trace'&&first){first=null;feedback=null;return true;}return false;},
    send(){if(phase!=='ready')return false;phase='sailing';return true;},
    advance(dt){
      if(phase!=='sailing'||!Number.isFinite(dt)||dt<=0)return false;
      elapsed=Math.min(SIGNAL.duration,elapsed+dt);
      if(elapsed===SIGNAL.duration){phase='complete';return true;}
      return false;
    }
  };
}
