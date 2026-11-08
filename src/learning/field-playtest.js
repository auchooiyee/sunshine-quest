import {parseCSV} from './class-reports.js';
import {csvCell} from './report.js';

export const FIELD_MISSIONS=Object.freeze({rescue:'rescueTitle',delivery:'deliveryTitle',signal:'signalTitle',market:'marketTitle',canyon:'canyonTitle',storm:'stormTitle'});
export const FIELD_PILOT_KEY='mathwithcye-field-playtest-v1';
const ids=Object.keys(FIELD_MISSIONS),maxMs=4*60*60*1000,limit=10000;
const versionPattern=/^\d+\.\d+\.\d+$/,idPattern=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const stages={rescue:['anchors','design'],delivery:['route'],signal:['bag','order'],market:['budget'],canyon:['point'],storm:['plan']};
const empty=()=>({visits:0,activeMs:0,firstCheckMs:null,checks:0,incorrect:0,hints:0,completed:false,lastCheck:''});
const bounded=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;

function validRows(rows){
  return rows&&ids.every(id=>{
    const row=rows[id];
    if(!row||!bounded(row.visits,limit)||!bounded(row.activeMs,maxMs)||
      !bounded(row.checks,limit)||!bounded(row.incorrect,row.checks)||!bounded(row.hints,limit)||
      typeof row.completed!=='boolean')return false;
    const validCheck=row.checks===0
      ? row.lastCheck===''&&row.firstCheckMs===null
      : stages[id].includes(row.lastCheck)&&bounded(row.firstCheckMs,row.activeMs);
    return validCheck&&(row.visits>0||row.activeMs===0&&row.checks===0&&row.hints===0&&!row.completed);
  });
}

/** Explicitly started, tab-local recording. Background time and other game modes are excluded. */
export function createFieldPlaytest({storage,enabled,version,now=()=>performance.now(),uuid=()=>crypto.randomUUID()}){
  let run=null,mission=null,since=null,visible=true,saved=false;
  if(enabled)try{
    const v=JSON.parse(storage.getItem(FIELD_PILOT_KEY));
    if(v&&typeof v.id==='string'&&idPattern.test(v.id)&&typeof v.version==='string'&&versionPattern.test(v.version)&&
      typeof v.active==='boolean'&&bounded(v.revision,Number.MAX_SAFE_INTEGER)&&validRows(v.rows)){
      run=v;
      saved=true;
    }
  }catch{}
  function flushTime(){
    if(!run?.active||!mission||since===null)return;
    const time=now(),row=run.rows[mission],elapsed=Math.max(0,Math.floor(time-since));
    row.activeMs=Math.min(maxMs,row.activeMs+elapsed);
    since=time;
  }
  function save(){
    if(!run)return;
    run.revision++;
    try{storage.setItem(FIELD_PILOT_KEY,JSON.stringify(run));saved=true;}
    catch{saved=false;}
  }
  return {
    get active(){return Boolean(run?.active);},
    get available(){return Boolean(run);},
    get saved(){return saved;},
    start(){
      if(!enabled||run)return false;
      run={id:uuid(),version,active:true,revision:0,rows:Object.fromEntries(ids.map(id=>[id,empty()]))};save();return true;
    },
    open(id){
      if(!run?.active||!ids.includes(id))return;
      flushTime();
      mission=id;
      since=visible?now():null;
      const row=run.rows[id];
      row.visits=Math.min(limit,row.visits+1);
      save();
    },
    close(id){if(mission!==id)return;flushTime();mission=null;since=null;save();},
    event(id,type,result){
      if(!run?.active||mission!==id)return;
      flushTime();const r=run.rows[id];
      if(type==='check'&&stages[id].includes(result?.step)&&typeof result.correct==='boolean'){
        if(r.checks<limit){
          r.checks++;
          if(!result.correct)r.incorrect++;
          r.firstCheckMs??=r.activeMs;
          r.lastCheck=result.step;
        }
      }else if(type==='hint')r.hints=Math.min(limit,r.hints+1);
      else if(type==='complete')r.completed=true;
      else return;
      if(type==='complete'){mission=null;since=null;}
      save();
    },
    visibility(isVisible){
      if(visible===isVisible)return;
      flushTime();visible=isVisible;since=run?.active&&mission&&visible?now():null;if(run?.active)save();
    },
    stop(){if(!run?.active)return;flushTime();run.active=false;mission=null;since=null;save();},
    checkpoint(){if(run?.active){flushTime();save();}},
    snapshot(){if(!run)return null;flushTime();return structuredClone(run);}
  };
}

export const PLAYTEST_COLUMNS=['field_playtest_version','session_id','game_version','revision','mission','visits','active_seconds','first_check_seconds','checks','incorrect_checks','hint_opens','completed','last_check'];
const csv=rows=>'\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
export function fieldPlaytestCSV(run){
  const rows=ids.map(id=>{
    const row=run.rows[id];
    return [
      1,run.id,run.version,run.revision,id,row.visits,(row.activeMs/1000).toFixed(1),
      row.firstCheckMs===null?'':(row.firstCheckMs/1000).toFixed(1),
      row.checks,row.incorrect,row.hints,row.completed,row.lastCheck
    ];
  });
  return csv([PLAYTEST_COLUMNS,...rows]);
}
export function readFieldPlaytest(text){
  const [header,...data]=parseCSV(text);
  if(JSON.stringify(header)!==JSON.stringify(PLAYTEST_COLUMNS)||data.length!==ids.length)throw new Error('reportInvalid');
  const integer=s=>/^\d+$/.test(s)?Number(s):NaN;
  const seconds=s=>/^\d{1,5}\.\d$/.test(s)?Math.round(Number(s)*1000):NaN;
  const rows={};let identity;
  for(const row of data){
    if(row.length!==PLAYTEST_COLUMNS.length)throw new Error('reportInvalid');
    const [format,id,version,revision,mission,visits,active,first,checks,incorrect,hints,completed,lastCheck]=row;
    if(format!=='1'||!idPattern.test(id)||!versionPattern.test(version)||
      !bounded(integer(revision),Number.MAX_SAFE_INTEGER)||!ids.includes(mission)||
      rows[mission]||!['true','false'].includes(completed))throw new Error('reportInvalid');
    const next={id,version,revision:integer(revision)};
    if(identity&&(id!==identity.id||version!==identity.version||next.revision!==identity.revision))throw new Error('reportInvalid');
    identity=next;
    rows[mission]={
      visits:integer(visits),activeMs:seconds(active),firstCheckMs:first===''?null:seconds(first),
      checks:integer(checks),incorrect:integer(incorrect),hints:integer(hints),completed:completed==='true',lastCheck
    };
  }
  if(!validRows(rows))throw new Error('reportInvalid');
  return {...identity,rows};
}
export function mergeFieldPlaytests(previous,incoming){
  const sessions=new Map(previous.map(run=>[run.id,run]));
  for(const run of incoming){if(!sessions.has(run.id)||sessions.get(run.id).revision<=run.revision)sessions.set(run.id,run);}
  if(sessions.size>300)throw new Error('reportSize');
  return [...sessions.values()];
}
const median=values=>{if(!values.length)return null;const a=[...values].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
export function summarizeFieldPlaytests(sessions){
  return ids.map(id=>{
    const rows=sessions.map(run=>run.rows[id]),completed=rows.filter(row=>row.completed),started=rows.filter(row=>row.visits>0);
    return {mission:id,started:started.length,completed:completed.length,incorrect:rows.reduce((n,r)=>n+r.incorrect,0),hints:rows.reduce((n,r)=>n+r.hints,0),medianCompletedSeconds:median(completed.map(r=>r.activeMs/1000)),medianFirstCheckSeconds:median(rows.filter(r=>r.firstCheckMs!==null).map(r=>r.firstCheckMs/1000))};
  });
}
export function fieldSummaryCSV(sessions){
  return csv([['mission','sessions_started','sessions_completed','incorrect_checks','hint_opens','median_completed_seconds','median_first_check_seconds'],...summarizeFieldPlaytests(sessions).map(row=>Object.values(row).map(value=>typeof value==='number'&&!Number.isInteger(value)?Number(value.toFixed(1)):value??''))]);
}
