import {designModel, roots, validate, valueAt, vertex} from '../math/quadratics.js';

const layout=Object.freeze({start:58,station:157,left:200,right:530,beacon:623,baseline:219,metre:55,heightScale:7});
const trace=Object.freeze({a:-1,b:10,c:-16});
const anchors=Object.freeze(roots(trace));
const target=Object.freeze({span:anchors[1]-anchors[0],height:vertex(trace).y});
const spanValues=Object.freeze([4,5,6,7,8]);
const curveValues=Object.freeze([.5,.75,1,1.25,1.5]);
export const RESCUE={layout,trace,anchors,target,spanValues,curveValues};
export const RESCUE_KEY='mathwithcye-bridge-rescue-v1';

export function createBridgeRescue(){
  let phase='approach',x=layout.start,selected=[],span=5,k=.75,feedback=null;
  const preview=()=>designModel(span,k);
  return {
    get phase(){return phase;}, get x(){return x;}, get selected(){return [...selected];},
    get span(){return span;}, get k(){return k;}, get feedback(){return feedback;},
    get height(){return vertex(preview()).y;},
    surface(worldX){
      const d=(worldX-layout.left)/layout.metre;
      return phase==='cross'&&d>=0&&d<=span ? layout.baseline-layout.heightScale*valueAt(preview(),d) : layout.baseline;
    },
    move(delta){
      if(!Number.isFinite(delta)||(phase!=='approach'&&phase!=='cross'))return false;
      const limit=phase==='approach'?layout.station:layout.beacon;
      x=Math.max(32,Math.min(limit,x+delta));
      if(x===limit){phase=phase==='approach'?'anchors':'beacon';return true;}
      return false;
    },
    pick(n){
      if(phase!=='anchors'||!Number.isInteger(n)||n<0||n>10)return;
      selected=selected.includes(n)?selected.filter(v=>v!==n):[...selected.slice(-1),n];feedback=null;
    },
    checkAnchors(){
      if(phase!=='anchors')return false;
      if(selected.length!==2){feedback='rescuePickTwo';return false;}
      if(!validate({kind:'roots',model:trace},{first:selected[0],second:selected[1]}).correct){feedback='rescueWrongAnchors';return false;}
      phase='design';feedback=null;return true;
    },
    tune(nextSpan,nextK){
      if(phase!=='design'||!spanValues.includes(nextSpan)||!curveValues.includes(nextK))return;
      span=nextSpan;k=nextK;feedback=null;
    },
    build(){
      if(phase!=='design')return false;
      if(!validate({kind:'design',target},{span,k}).correct){
        feedback=span!==target.span?(this.height!==target.height?'rescueWrongBoth':'rescueWrongSpan'):'rescueWrongHeight';return false;
      }
      phase='cross';feedback=null;return true;
    },
    light(){if(phase!=='beacon')return false;phase='complete';return true;}
  };
}
