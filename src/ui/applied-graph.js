import { satisfies, motionDistance, budgetTotal } from '../math/challenges.js';
import { parseNumber } from '../math/quadratics.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v.toFixed(3));
const fraction=(n,d)=>{let a=n,b=d;while(b){[a,b]=[b,a%b];}return n===0?'0':`${n/a}/${d/a}`;};
const text=(x,y,value,extra='')=>`<text x="${x}" y="${y}" fill="#335846" font-size="13" ${extra}>${esc(value)}</text>`;
function plot(maxX,maxY,xLabel,yLabel){
  const yTick=maxY<=10?2:maxY<=30?5:maxY<=60?10:20;
  maxY=Math.ceil(maxY/yTick)*yTick;
  const g={minX:0,maxX,minY:0,maxY,left:48,right:25,top:32,bottom:40,W:540,H:360};
  const sx=x=>g.left+x/maxX*(g.W-g.left-g.right),sy=y=>g.H-g.bottom-y/maxY*(g.H-g.top-g.bottom);
  let markup='';
  for(let x=0;x<=maxX;x+=maxX<=9?1:2)markup+=`<path d="M${sx(x)} ${g.top}V${sy(0)}" stroke="#dce5d2" fill="none"/>`+text(sx(x),sy(0)+21,fmt(x),'text-anchor="middle"');
  for(let y=0;y<=maxY;y+=yTick)markup+=`<path d="M${sx(0)} ${sy(y)}H${sx(maxX)}" stroke="#dce5d2" fill="none"/>`+text(sx(0)-10,sy(y)+4,fmt(y),'text-anchor="end"');
  markup+=`<path d="M${sx(0)} ${g.top}V${sy(0)}H${sx(maxX)}" stroke="#719079" fill="none"/>`+text(515,354,xLabel,'text-anchor="end"')+text(48,20,yLabel);
  return {g,sx,sy,markup};
}
function clip(points,c){
  const out=[];
  for(let i=0;i<points.length;i++){
    const p=points[i],q=points[(i+1)%points.length],sign=['<','<='].includes(c.op)?1:-1;
    const dp=sign*(c.a*p.x+c.b*p.y-c.c),dq=sign*(c.a*q.x+c.b*q.y-c.c),pin=dp<=0,qin=dq<=0;
    if(pin)out.push(p);
    if(pin!==qin){const t=dp/(dp-dq);out.push({x:p.x+t*(q.x-p.x),y:p.y+t*(q.y-p.y)});}
  }
  return out;
}
function constraintLabel(c){return `${c.a?c.a===1?'x':`${c.a}x`:''}${c.a&&c.b?' + ':''}${c.b?c.b===1?'y':`${c.b}y`:''} ${({'<=':'≤','>=':'≥'})[c.op]||c.op} ${c.c}`;}
export function renderAppliedGraph(def,draft,language,previewTime=0){
  const local=(en,ms)=>language==='ms'?ms:en;
  let markup='',equation='',summary='',instructions='',geometry=null;
  if(def.kind==='inequality'){
    const p=plot(def.model.bound,def.model.bound,'x','y');geometry=p.g;markup=p.markup;
    const bound=def.model.bound;let polygon=[{x:0,y:0},{x:bound,y:0},{x:bound,y:bound},{x:0,y:bound}];
    for(const c of def.model.constraints)polygon=clip(polygon,c);
    markup+=`<polygon points="${polygon.map(v=>`${p.sx(v.x)},${p.sy(v.y)}`).join(' ')}" fill="#69b59a" fill-opacity=".28"/>`;
    for(const c of def.model.constraints){
      const border=[];
      for(const x of [0,def.model.bound])if(c.b){const y=(c.c-c.a*x)/c.b;if(y>=0&&y<=def.model.bound)border.push({x,y});}
      for(const y of [0,def.model.bound])if(c.a){const x=(c.c-c.b*y)/c.a;if(x>=0&&x<=def.model.bound)border.push({x,y});}
      const end=border.find(p=>Math.abs(p.x-border[0].x)+Math.abs(p.y-border[0].y)>1e-7);
      if(end)markup+=`<line x1="${p.sx(border[0].x)}" y1="${p.sy(border[0].y)}" x2="${p.sx(end.x)}" y2="${p.sy(end.y)}" stroke="#226954" stroke-width="2.5" ${['<','>'].includes(c.op)?'stroke-dasharray="7 5"':''}/>`;
    }
    const x=parseNumber(draft.x),y=parseNumber(draft.y);
    for(const [i,route] of (def.decisions?.routes||[]).entries())markup+=`<circle cx="${p.sx(route.x)}" cy="${p.sy(route.y)}" r="5" fill="#657ba6"/>`+text(p.sx(route.x)+9,p.sy(route.y)-9,String.fromCharCode(65+i));
    if(x!==null&&y!==null)markup+=`<circle cx="${p.sx(x)}" cy="${p.sy(y)}" r="7" fill="#d1a443" stroke="#fff" stroke-width="2"/>`;
    equation=def.model.constraints.map(constraintLabel).join(' · ');
    summary=x===null||y===null?local('Select a route marker.','Pilih penanda laluan.'):`(${x}, ${y})`;
    instructions=local('Click the grid or enter whole coordinates. Shading shows the feasible region; dashed boundaries are excluded.','Klik grid atau masukkan koordinat integer. Lorekan menunjukkan rantau tersaur; sempadan putus-putus tidak termasuk.');
  }else if(def.kind.startsWith('motion')){
    let points,maxX,maxY,cartDistance=0;
    const isDistance=def.model.graph==='distance';
    if(isDistance){points=def.model.points;maxX=points.at(-1)[0];maxY=Math.max(...points.map(p=>p[1]))*1.25;}
    else{
      const t1=parseNumber(draft.t1)??1,v1=parseNumber(draft.v1)??2;
      const segments=def.kind==='motion-plan'?[{duration:t1,speed:v1},{duration:def.model.duration-t1,speed:def.model.v2}]:def.model.segments;
      let elapsed=0;points=[];
      for(const s of segments){points.push([elapsed,s.speed],[elapsed+s.duration,s.speed]);const used=Math.max(0,Math.min(s.duration,previewTime-elapsed));cartDistance+=used*s.speed;elapsed+=s.duration;}
      maxX=elapsed;maxY=Math.max(def.kind==='motion-plan'?12:6,...segments.map(s=>s.speed))*1.1;
    }
    const p=plot(maxX,maxY,'t (s)',isDistance?local('Distance (m)','Jarak (m)'):local('Speed (m/s)','Laju (m/s)'));geometry=p.g;markup=p.markup;
    if(!isDistance)markup+=`<path d="M${p.sx(0)} ${p.sy(0)} ${points.map(v=>`L${p.sx(v[0])} ${p.sy(v[1])}`).join(' ')} L${p.sx(maxX)} ${p.sy(0)}Z" fill="#7ab49b" fill-opacity=".22"/>`;
    markup+=`<polyline points="${points.map(v=>`${p.sx(v[0])},${p.sy(v[1])}`).join(' ')}" fill="none" stroke="#286a4f" stroke-width="3"/>`;
    for(const v of points){const end=v[0]===maxX;markup+=`<circle cx="${p.sx(v[0])}" cy="${p.sy(v[1])}" r="4" fill="#d1a443"/>`+text(p.sx(v[0])+(end?-6:6),p.sy(v[1])-8,`(${v[0]}, ${v[1]})`,end?'text-anchor="end"':'');}
    if(def.kind==='motion-plan'){
      const d=motionDistance(def,draft),time=Math.min(previewTime,def.model.duration);
      markup+=`<line x1="${p.sx(time)}" x2="${p.sx(time)}" y1="${p.g.top}" y2="${p.sy(0)}" stroke="#b37b25" stroke-dasharray="4 3"/>`;
      equation=`s = v₁t₁ + ${def.model.v2}(${def.model.duration} − t₁)`;
      summary=`${local('Planned distance','Jarak dirancang')}: ${d===null?'—':fmt(d)} m / ${def.target.distance} m · t=${fmt(time)} s · s=${fmt(cartDistance)} m`;
      instructions=local('Adjust the two controls. Preview runs your plan without advancing the adventure clock.','Laras dua kawalan. Pratonton menjalankan pelan tanpa memajukan masa pengembaraan.');
    }else{equation=isDistance?'v = Δs / Δt':'s = area';summary=local('Horizontal distance graph = rest. Speed graph area = distance.','Graf jarak mendatar = pegun. Luas graf laju = jarak.');instructions=local('Use the labelled coordinates and segment durations.','Gunakan koordinat berlabel dan tempoh segmen.');}
  }else if(def.kind.startsWith('probability')){
    const plan=def.kind==='probability-plan',red=plan?(parseNumber(draft.red)??1):def.model.red,blue=plan?(parseNumber(draft.blue)??1):def.model.blue,total=red+blue,replacement=plan?false:def.model.replacement;
    const redAfter=red-(replacement?0:1),totalAfter=total-(replacement?0:1);
    const rLabel=local('Red','Merah'),bLabel=local('Blue','Biru');
    markup=`<path d="M70 175L255 95L455 50 M255 95L455 140 M70 175L255 270" fill="none" stroke="#759785" stroke-width="2"/>`;
    for(const [x,y,label,color] of [[70,175,local('Bag','Beg'),'#285e47'],[255,95,rLabel,'#b85e5c'],[255,270,bLabel,'#658dae'],[455,50,rLabel,'#b85e5c'],[455,140,bLabel,'#658dae']])markup+=`<circle cx="${x}" cy="${y}" r="12" fill="${color}"/>`+text(x,y+30,label,'text-anchor="middle"');
    markup+=text(145,111,`${red}/${total}`)+text(142,260,`${blue}/${total}`)+text(273,202,local(`After red: ${redAfter} R, ${blue} B / ${totalAfter}`,`Selepas merah: ${redAfter} M, ${blue} B / ${totalAfter}`),'font-size="12"');
    const selected=parseNumber(draft.conditional),redProbability=plan?redAfter/totalAfter:selected===null?null:def.model.event==='RB'?1-selected:selected;
    markup+=text(320,75,redProbability===null?'?':fmt(redProbability))+text(320,138,redProbability===null?'?':fmt(1-redProbability));
    if(plan)markup+=text(60,330,`P(${local('RR','MM')}) = ${fraction(red*(red-1),total*(total-1))}`);
    equation=replacement?local('With replacement','Dengan pengembalian'):local('Without replacement','Tanpa pengembalian');
    summary=plan?`${local('Total','Jumlah')}: ${total} / ${def.target.total} · P(${local('RR','MM')})=${fraction(red*(red-1),total*(total-1))} · ${local('Target','Sasaran')}: ${def.target.probabilityFraction}`:def.focus==='conditional'?local('Find only the next-draw probability.','Cari kebarangkalian cabutan seterusnya sahaja.'):local('Fill the second-branch and combined probabilities.','Isi kebarangkalian cabang kedua dan peristiwa bergabung.');
    instructions=local('The expanded branches follow a first red draw. Fractions such as 3/10 are accepted.','Cabang dikembangkan selepas cabutan pertama merah. Pecahan seperti 3/10 diterima.');
  }else if(def.kind.startsWith('budget')||def.kind.startsWith('finance')){
    const plan=def.kind==='budget-plan';const total=plan?def.model.budget:def.model.income;
    const expenses=plan?def.model.items.map(i=>({value:i.price*(parseNumber(draft[i.key])??0),name:i.name[language]})):def.model.expenses.map((v,i)=>({value:v,name:local(`Expense ${i+1}`,`Belanja ${i+1}`)}));
    const saving=plan?(parseNumber(draft.saving)??0):total-expenses.reduce((s,i)=>s+i.value,0);
    const lines=[...expenses,{value:saving,name:local('Savings','Simpanan')}];
    const scale=Math.max(total,...lines.map(l=>l.value),1),colors=['#377b5e','#719b71','#b79a4c','#5f87a2'];
    lines.forEach((l,i)=>{const y=42+i*64;markup+=text(30,y,l.name)+`<rect x="160" y="${y-17}" width="${Math.max(0,l.value/scale*280)}" height="24" rx="4" fill="${colors[i]}"/>`+text(455,y,`RM${fmt(l.value)}`);});
    if(plan){const used=budgetTotal(def,draft)+saving;equation=`RM${total}`;summary=`${local('Allocated','Diperuntukkan')}: RM${used} · ${local('Unallocated','Baki')}: RM${total-used}`;}
    else if(def.model.chart==='savings'){
      const months=parseNumber(draft.value)??0,amount=def.model.initial+Math.max(0,months)*saving;
      markup+=text(30,252,local('Savings goal','Matlamat simpanan'))+text(455,252,`RM${def.model.goal}`)+`<rect x="30" y="267" width="470" height="19" rx="5" fill="#dce5d2"/><rect x="30" y="267" width="${Math.min(1,amount/def.model.goal)*470}" height="19" rx="5" fill="#ba9a52"/>`+text(30,313,`${local('Your selected plan','Pelan dipilih')}: ${months} ${local('months','bulan')} → RM${fmt(amount)}`);
      equation=`RM${def.model.initial} + n × RM${saving}`;summary=`${local('Your plan','Pelan anda')}: RM${fmt(amount)} / RM${def.model.goal}`;
    }else{equation=local('Income − expenses','Pendapatan − belanja');summary=`${local('Income','Pendapatan')}: RM${total}`;}
    instructions=plan?local('Adjust quantities and savings; every essential minimum must be met. Unspent money is allowed.','Laras kuantiti dan simpanan; setiap keperluan minimum mesti dipenuhi. Baki wang dibenarkan.'):local('Read the budget and use the answer field. All amounts are fictional learning scenarios.','Baca belanjawan dan gunakan ruang jawapan. Semua amaun ialah situasi pembelajaran rekaan.');
  }
  return {markup:`<title>${esc(def.title[language])}</title>`+markup,equation,summary,instructions,geometry};
}
