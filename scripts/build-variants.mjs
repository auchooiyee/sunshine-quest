// Two finite, inspectable practice sets per chapter. No runtime randomisation.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {landing,speed,distance,delivery,draw,bag,months,savings,budget} from './curriculum-templates.mjs';
import {formatQuadratic} from '../src/math/quadratics.js';
const bi=(en,ms)=>({en,ms});
const hint=rows=>({en:rows.map(row=>row[0]),ms:rows.map(row=>row[1])});
const fraction=(n,d)=>{let a=n,b=d;while(b)[a,b]=[b,a%b];return `${n/a}/${d/a}`;};

function quadratic(def,pack,i){
  const task=structuredClone(def);
  if(def.kind==='design'){
    const [span,k]=pack===1?(i===2?[6,1]:[8,1]):(i===2?[10,.5]:[6,1.5]);
    const height=k*span**2/4;
    task.target={span,height};task.answer={span,k};
    task.prompt=bi(`Use y = kx(L − x). Set the span to exactly ${span} m and maximum height to exactly ${height} m. Adjust both sliders.`,`Gunakan y = kx(L − x). Tetapkan rentang tepat ${span} m dan tinggi maksimum tepat ${height} m. Laraskan kedua-dua peluncur.`);
    task.hints=hint([['The roots are 0 and L, so L sets the span.','Puncanya ialah 0 dan L, jadi L menetapkan rentang.'],['Maximum height = kL²/4.','Tinggi maksimum = kL²/4.'],[`L = ${span}, k = ${k} give ${height} m.`,`L = ${span}, k = ${k} memberikan ${height} m.`]]);
    task.explanation=bi(`L = ${span} and k = ${k} give maximum (${span/2}, ${height}). The arch follows your design.`,`L = ${span} dan k = ${k} memberikan maksimum (${span/2}, ${height}). Lengkung mengikut reka bentuk anda.`);
  }else{
    const [first,second]=pack===1?(i<3?[0,8]:[1,7]):(i<3?[0,4]:[3,9]);
    const model={a:-1,b:first+second,c:-first*second,domain:[first,second]},eq=formatQuadratic(model);
    task.model=model;const x=(first+second)/2,y=(second-first)**2/4;
    if(def.kind==='roots'){
      task.answer={first,second};
      task.prompt=bi(`The arch is y = ${eq}. Find both ground-level anchors (y = 0). Enter their x-coordinates in metres or click the graph.`,`Lengkung ialah y = ${eq}. Cari kedua-dua titik sauh pada aras tanah (y = 0). Masukkan koordinat x dalam meter atau klik graf.`);
      task.hints=hint([['At ground level, set y = 0.','Pada aras tanah, tetapkan y = 0.'],[`Factorise as −(x − ${first})(x − ${second}).`,`Faktorkan sebagai −(x − ${first})(x − ${second}).`],[`The anchors are ${first} m and ${second} m.`,`Titik sauh ialah ${first} m dan ${second} m.`]]);
      task.explanation=bi(`The roots are ${first} and ${second}; the span is ${second-first} m.`,`Puncanya ialah ${first} dan ${second}; rentangnya ${second-first} m.`);
    }else{
      task.answer={x,y};
      task.prompt=bi(`Locate the maximum point of y = ${eq}. Enter both coordinates in metres or click the graph.`,`Cari titik maksimum bagi y = ${eq}. Masukkan kedua-dua koordinat dalam meter atau klik graf.`);
      task.hints=hint([['The maximum lies on the axis of symmetry.','Titik maksimum terletak pada paksi simetri.'],[`x = (${first} + ${second})/2 = ${x}.`,`x = (${first} + ${second})/2 = ${x}.`],[`Substitution gives y = ${y}; use (${x}, ${y}).`,`Penggantian memberikan y = ${y}; gunakan (${x}, ${y}).`]]);
      task.explanation=bi(`The maximum is (${x}, ${y}) on the axis x = ${x}.`,`Titik maksimum ialah (${x}, ${y}) pada paksi x = ${x}.`);
    }
  }
  return task;
}
function inequality(def,pack,i){
  const constraints=def.model.constraints.map(c=>({...c,c:c.c+(c.a+c.b)*pack}));
  const symbols={'<=':'≤','>=':'≥'};
  const labels=constraints.map(c=>`${c.a?(c.a===1?'x':c.a+'x'):''}${c.a&&c.b?' + ':''}${c.b?(c.b===1?'y':c.b+'y'):''} ${symbols[c.op]||c.op} ${c.c}`).join(', ');
  return landing(i,[def.title.en,def.title.ms],[`Choose whole-number coordinates between 0 and 10 satisfying ${labels}. Solid boundaries are included; dashed boundaries are excluded.`,`Pilih koordinat integer antara 0 hingga 10 yang memenuhi ${labels}. Sempadan penuh termasuk; sempadan putus-putus tidak termasuk.`],constraints,{x:def.answer.x+pack,y:def.answer.y+pack});
}
function motion(def,pack,i){
  if(def.kind==='motion-plan'){
    const t1=def.answer.t1,v1=def.answer.v1+pack,v2=def.model.v2+pack,duration=def.model.duration;
    return delivery(i,duration,v2,t1*v1+(duration-t1)*v2,t1,v1);
  }
  if(def.model.graph==='distance')return speed(i,def.model.points.map(([t,s])=>[t,s*(pack+1)]),def.answer.value*(pack+1));
  const segments=def.model.segments.map(s=>({...s,speed:s.speed? s.speed+pack:0}));
  return distance(i,segments,segments.reduce((sum,s)=>sum+s.duration*s.speed,0));
}
function probability(def,pack,i){
  if(def.kind==='probability-plan'){
    const total=def.target.total+pack,red=def.answer.red+pack;
    return bag(i,total,red*(red-1)/(total*(total-1)),red);
  }
  const red=def.model.red+pack,blue=def.model.blue+pack,total=red+blue;
  const second=def.model.event==='RR'?red-(def.model.replacement?0:1):blue,denominator=total-(def.model.replacement?0:1);
  const task=draw(i,red,blue,def.model.replacement,def.model.event,second/denominator,red/total*second/denominator);
  const branch=fraction(second,denominator),combined=fraction(red*second,total*denominator);
  task.hints.en[2]=`The second branch is ${branch}; the combined event is ${combined}. Fractions are accepted.`;
  task.hints.ms[2]=`Cabang kedua ialah ${branch}; peristiwa bergabung ialah ${combined}. Pecahan diterima.`;
  task.explanation=bi(`The second branch is ${branch}; multiplying by ${red}/${total} gives ${combined}.`,`Cabang kedua ialah ${branch}; darab dengan ${red}/${total} memberikan ${combined}.`);
  return task;
}
function finance(def,pack,i){
  if(def.kind==='budget-plan'){
    const amount=def.model.budget+40*pack,food=def.model.items[0].minimum+pack,medical=def.model.items[1].minimum,minimum=def.target.saving+10*pack;
    return budget(i,amount,food,medical,minimum,{food,medical,lamp:1,saving:Math.floor((amount-food*20-medical*30-15)/5)*5});
  }
  const income=def.model.income+100*pack;
  if(def.model.chart==='balance')return savings(i,income,def.model.expenses.map(n=>n+10*pack));
  const expense=def.model.expenses[0]+20*pack,initial=def.model.initial+10*pack,monthly=income-expense;
  return months(i,income,expense,initial,initial+monthly*(def.answer.value+pack-1)+Math.floor(monthly/2));
}
export async function buildVariants(){
  for(const [chapter,build] of [[1,quadratic],[6,inequality],[7,motion],[9,probability],[10,finance]]){
    const path=new URL(`../data/mathematics/f4/bab${String(chapter).padStart(2,'0')}.json`,import.meta.url),data=JSON.parse(await readFile(path,'utf8'));
    data.variants=[1,2].map(pack=>({id:pack===1?'practice-b-v1':'practice-c-v1',reviewStatus:'prototype-awaiting-teacher-review',challenges:data.challenges.map((def,i)=>build(def,pack,i))}));
    await writeFile(path,JSON.stringify(data,null,2)+'\n');
  }
  console.log('Wrote 60 additional bilingual task versions across five chapters.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildVariants();
