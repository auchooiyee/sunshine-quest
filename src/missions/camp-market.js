import {budgetTotal} from '../math/challenges.js';

const items=Object.freeze([
  Object.freeze({key:'food',price:12,minimum:2,maximum:4}),
  Object.freeze({key:'medical',price:20,minimum:1,maximum:3}),
  Object.freeze({key:'lamp',price:15,minimum:1,maximum:3})
]);
const model=Object.freeze({budget:100,items});
const target=Object.freeze({saving:20});
export const MARKET=Object.freeze({model,target});
export const MARKET_KEY='mathwithcye-camp-market-v1';

export function createCampMarket(){
  let phase='plan',feedback=null;
  const basket={food:0,medical:0,lamp:0};
  const spend=()=>budgetTotal(MARKET,basket);
  const missing=()=>items.filter(item=>basket[item.key]<item.minimum).map(item=>({key:item.key,count:item.minimum-basket[item.key]}));
  return {
    get phase(){return phase;},get feedback(){return feedback;},get basket(){return {...basket};},
    get spent(){return spend();},get remaining(){return model.budget-spend();},get missing(){return missing();},
    choose(key,quantity){
      if(!['plan','ready'].includes(phase))return false;
      const item=items.find(item=>item.key===key);
      if(!item||!Number.isInteger(quantity)||quantity<0||quantity>item.maximum)return false;
      basket[key]=quantity;phase='plan';feedback=null;return true;
    },
    check(){
      if(phase!=='plan')return false;
      const balance=model.budget-spend();
      feedback=missing().length?'missing':balance<0?'over':balance<target.saving?'reserve':null;
      if(feedback)return false;
      phase='ready';return true;
    },
    unpack(){if(phase!=='ready')return false;phase='stocked';return true;},
    light(){if(phase!=='stocked')return false;phase='complete';return true;}
  };
}
