import { REGIONS } from '../../config/worlds.js';
import { checkAssignment } from '../missions/assignment.js';
import {newRun,validRun,HISTORY_LIMIT} from '../learning/history.js';
// Keep the original key so M1 saves migrate in place.
export const STORAGE_KEY='mathwithcye-sunshine-quest-v1';
export const CONTENT_VERSION=5;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function decodeSave(text){
  try{
    const value=typeof text==='string'?JSON.parse(text):text;
    if(!object(value))return null;
    let regions, currentRegion, assignment=null;
    if(value.schemaVersion===1&&value.contentVersion===1&&object(value.quest)){
      regions={quadratics:{world:object(value.world)?value.world:null,quest:value.quest}};currentRegion='quadratics';
    }else if(value.schemaVersion===2&&[2,3,4,CONTENT_VERSION].includes(value.contentVersion)&&object(value.regions)&&REGIONS.some(w=>w.id===value.currentRegion)){
      regions={};currentRegion=value.currentRegion;
      for(const w of REGIONS){const r=value.regions[w.id];if(object(r)&&object(r.quest))regions[w.id]={world:object(r.world)?r.world:null,quest:r.quest,...(r.run?{run:r.run}:{}),reviews:r.reviews||{}};}
      if(!regions[currentRegion])return null;
      if(value.assignment!==undefined&&value.assignment!==null){assignment=checkAssignment(value.assignment);if(!assignment||assignment.world!==currentRegion||Object.keys(regions).length!==1)return null;}
    }else return null;
    for(const r of Object.values(regions)){
      if(r.run&&!validRun(r.run))return null;
      r.run ||= newRun(true);r.reviews ||= {};
      if(!object(r.reviews))return null;
    }
    const history=value.history??[];
    if(!Array.isArray(history)||history.length>HISTORY_LIMIT||history.some(r=>!object(r)||!REGIONS.some(w=>w.id===r.regionId)||!validRun(r.run)||!object(r.quest)||!object(r.reviews)||typeof r.learnerCode!=='string'||r.learnerCode.length>40||!Number.isFinite(Date.parse(r.archivedAt))||(assignment&&r.regionId!==assignment.world)))return null;
    const ids=[...Object.values(regions).map(r=>r.run.id),...history.map(r=>r.run.id)];
    if(new Set(ids).size!==ids.length)return null;
    const reportLabel=typeof value.reportLabel==='string'?value.reportLabel.slice(0,40).replace(/[\u0000-\u001f\u007f]/g,'').trim():'';
    return {schemaVersion:2,contentVersion:CONTENT_VERSION,regions,history,currentRegion,assignment,reportLabel,language:value.language==='ms'?'ms':'en',assist:value.assist!==false};
  }catch{return null;}
}
export function loadSave(storage,key=STORAGE_KEY){
  try{const raw=storage.getItem(key),data=decodeSave(raw);return {data,available:true,damaged:raw!==null&&!data,...(raw!==null&&!data?{damagedRaw:raw}:{})};}
  catch{return {data:null,available:false,damaged:false};}
}
export function writeSave(storage,data,key=STORAGE_KEY){
  try{
    const canonical=data.regions?{...data,schemaVersion:2,contentVersion:CONTENT_VERSION}:decodeSave({...data,schemaVersion:1,contentVersion:1});
    if(!canonical)return false;storage.setItem(key,JSON.stringify(canonical));return true;
  }catch{return false;}
}
