import {satisfies} from '../math/challenges.js';
import {branchFractions} from '../missions/constructions.js';
const text=(ctx,value,x,y,size=13,color='#fff7df')=>{ctx.font=`600 ${size}px system-ui`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#243c3b';ctx.strokeText(value,x,y);ctx.fillStyle=color;ctx.fillText(value,x,y);};
const line=(ctx,points,color,width=2)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
const dot=(ctx,x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};

export function regionBackdrop(ctx,route,width,camera,clock,reduced){
  if(!route||route.id==='quadratics')return;
  const [sky,hill,ink,gold]=route.colors;
  const gradient=ctx.createLinearGradient(0,0,0,500);gradient.addColorStop(0,sky);gradient.addColorStop(1,hill);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,width,500);
  dot(ctx,width*.76-camera*.02,95,42,'#fff8d890');
  for(let i=-1;i<Math.ceil(width/380)+2;i++){
    const x=i*380-camera*.18%380;
    ctx.fillStyle=ink+'38';ctx.beginPath();ctx.moveTo(x-60,470);ctx.lineTo(x+40,210);ctx.lineTo(x+110,180);ctx.lineTo(x+165,280);ctx.lineTo(x+220,245);ctx.lineTo(x+380,470);ctx.fill();
  }
  if(route.id==='inequalities'){
    for(let i=-1;i<Math.ceil(width/300)+2;i++){const x=i*300-camera*.35%300;ctx.fillStyle=i%2?'#9a6f55':'#ba8b6a';ctx.beginPath();ctx.moveTo(x,500);ctx.lineTo(x+30,300);ctx.lineTo(x+110,280);ctx.lineTo(x+150,365);ctx.lineTo(x+200,345);ctx.lineTo(x+265,500);ctx.fill();line(ctx,[[x+34,330],[x+120,323],[x+160,389],[x+215,384]],'#e6bd91',4);}
  }else if(route.id==='motion'){
    ctx.fillStyle='#c5d1ca';ctx.fillRect(0,410,width,90);
    for(let i=-1;i<Math.ceil(width/260)+2;i++){const x=i*260-camera*.45%260;ctx.fillStyle=ink+'85';ctx.fillRect(x,310,105,100);ctx.fillStyle=sky;for(let j=0;j<3;j++)ctx.fillRect(x+13+j*29,327,18,31);line(ctx,[[x+140,412],[x+140,257],[x+203,257]],ink,6);ctx.fillStyle=gold;ctx.fillRect(x+181,255,31,10);}
  }else if(route.id==='probability'){
    ctx.fillStyle='#578ba1';ctx.fillRect(0,325,width,175);
    for(let i=0;i<13;i++){const y=338+i*12,x=(i*127-camera*.3+(reduced?0:Math.sin(clock*.35+i)*12))%(width+120);line(ctx,[[x,y],[x+85,y]],'#d1e9e45c',2);}
    for(let i=0;i<6;i++){const x=i*240-camera*.25%240;line(ctx,[[x,470],[x+8,403]],'#385d54',5);line(ctx,[[x+8,435],[x-12,416]],'#456c55',4);}
  }else{
    for(let i=-1;i<Math.ceil(width/340)+2;i++){const x=i*340-camera*.3%340;ctx.fillStyle=i%2?'#809080':'#c1a477';ctx.beginPath();ctx.moveTo(x,460);ctx.lineTo(x+78,322);ctx.lineTo(x+165,460);ctx.fill();ctx.fillStyle=ink+'70';ctx.beginPath();ctx.moveTo(x+62,460);ctx.lineTo(x+80,395);ctx.lineTo(x+105,460);ctx.fill();line(ctx,[[x-25,470],[x+80,322],[x+185,470]],'#eee4c8',2);}
  }
}

export function regionGround(ctx,route,width){
  if(!route||route.id==='quadratics')return;
  ctx.fillStyle=route.colors[2];ctx.fillRect(0,500,width,120);ctx.fillStyle=route.colors[1];ctx.fillRect(0,500,width,12);
  ctx.fillStyle=route.colors[3]+'35';for(let x=0;x<width;x+=44)ctx.fillRect(x,522,23,3);
}

export function regionLandmarks(ctx,route,state,language,clock,reduced){
  if(!route)return;
  const [sky,,ink,gold]=route.colors;
  // The entrance guide and sign use the same named briefing as the journal.
  ctx.fillStyle=ink;ctx.fillRect(350,428,28,72);dot(ctx,364,414,14,'#e2ba87');ctx.fillStyle=gold;ctx.fillRect(347,399,34,8);
  text(ctx,route.npc[language].split(' · ')[0],364,383,15);text(ctx,route.glyph,404,449,29,gold);
  if(route.id==='quadratics'){
    ctx.fillStyle='#528f9955';ctx.fillRect(2500,511,340,109);for(let i=0;i<5;i++)line(ctx,[[2515+i*20,537+i*16],[2780+i*5,537+i*16]],'#d4eee080',2);
  }
  if(route.id==='motion'){
    line(ctx,[[450,492],[4070,492]],'#e1d6b7',5);
    for(let x=450;x<4070;x+=60)line(ctx,[[x,489],[x,504]],ink,3);
  }
  if(route.id==='probability')for(const x of Object.values(route.stations)){
    ctx.fillStyle='#7a6249';ctx.fillRect(x-40,485,280,15);for(let i=0;i<4;i++)ctx.fillRect(x-30+i*70,499,8,56);
  }
  const restored=(state.constructions||[]).filter(i=>i.guardian).length===3;
  if(restored){for(let i=0;i<5;i++){ctx.fillStyle=gold;ctx.fillRect(180+i*24,480-i*8,18,20+i*8);}text(ctx,route.relic[language],235,422,13,gold);}
  // Guardian stations share the lesson model but have distinct machines and silhouettes.
  const x=route.stations.guardian,y=restored?418:418+(reduced?0:Math.sin(clock)*3);
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=gold;ctx.fillStyle=ink;ctx.lineWidth=5;
  if(route.id==='quadratics'){ctx.beginPath();ctx.moveTo(-65,80);ctx.quadraticCurveTo(0,-125,65,80);ctx.stroke();ctx.fillRect(-72,40,18,40);ctx.fillRect(54,40,18,40);}
  else if(route.id==='inequalities'){ctx.beginPath();ctx.moveTo(0,-70);ctx.lineTo(70,75);ctx.lineTo(-70,75);ctx.closePath();ctx.fill();ctx.stroke();line(ctx,[[-45,40],[45,40]],gold,2);}
  else if(route.id==='motion'){dot(ctx,0,0,58,ink);ctx.beginPath();ctx.arc(0,0,58,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4+(reduced?0:clock*.15);line(ctx,[[Math.cos(a)*28,Math.sin(a)*28],[Math.cos(a)*51,Math.sin(a)*51]],gold,3);}ctx.fillRect(-15,58,30,24);}
  else if(route.id==='probability'){ctx.beginPath();ctx.moveTo(0,-80);ctx.lineTo(55,0);ctx.lineTo(0,75);ctx.lineTo(-55,0);ctx.closePath();ctx.fill();ctx.stroke();line(ctx,[[0,-70],[0,66]],gold,2);}
  else{ctx.fillRect(-62,-40,124,110);ctx.strokeRect(-62,-40,124,110);ctx.fillStyle=gold;ctx.fillRect(-62,-50,124,14);line(ctx,[[-45,5],[45,5]],gold,2);line(ctx,[[-45,30],[45,30]],gold,2);}
  dot(ctx,0,0,23,restored?gold:sky);text(ctx,route.glyph,0,8,24,ink);
  const phases=(state.constructions||[]).filter(i=>i.guardian).length;
  for(let i=0;i<3;i++){dot(ctx,-28+i*28,-104,9,i<phases?gold:'#dfe7df');if(i<phases)text(ctx,'✓',-28+i*28,-100,10,ink);}
  text(ctx,route.guardian[language],0,-127,16,gold);ctx.restore();
}

export function drawConstructions(ctx,state,language){
  const items=state.constructions||[],lastGuardian=items.filter(i=>i.guardian).at(-1);
  for(const item of items){
    if(item.guardian&&item!==lastGuardian)continue;
    const {origin:x,values:v,model:m}=item;
    const local=(en,ms)=>language==='ms'?ms:en,fmt=n=>Number(n.toFixed(3));
    if(item.kind==='roots'){
      line(ctx,[[x,495],[x+220,495]],'#ebd493',3);
      for(const n of [v.first,v.second]){ctx.fillStyle='#e8be67';ctx.fillRect(x+n*20,452,4,48);text(ctx,`${n} m`,x+n*20,435);}
    }else if(item.kind==='vertex'){
      const px=x+v.x*20,py=500-v.y*7;line(ctx,[[px,500],[px,py]],'#e9d999',3);dot(ctx,px,py,10,'#ffe0a2');text(ctx,`(${v.x}, ${v.y}) m`,px,py-22);
    }else if(item.kind==='design'){
      text(ctx,`${v.span} m · h=${fmt(v.k*v.span*v.span/4)} m`,x+v.span*16,490-v.k*v.span*v.span/4*7,13);
    }else if(item.kind==='inequality'){
      ctx.fillStyle='#e1d8bc25';ctx.fillRect(x,380,220,120);
      for(let gx=0;gx<=m.bound;gx++)for(let gy=0;gy<=m.bound;gy++)if(m.constraints.every(c=>satisfies({x:gx,y:gy},c)))dot(ctx,x+gx*22,500-gy*12,2,'#e8d294');
      text(ctx,`(${v.x}, ${v.y}) ✓`,x+110,361);
    }else if(item.kind==='motion-reading'){
      const points=m.graph==='distance'?m.points:(()=>{let t=0,p=[[0,0]];for(const s of m.segments){p.push([t,s.speed],[t+=s.duration,s.speed]);}return p;})();
      const maxX=Math.max(...points.map(p=>p[0])),maxY=Math.max(1,...points.map(p=>p[1]));
      line(ctx,[[x,365],[x,445],[x+220,445]],'#e4e9d9',2);line(ctx,points.map(([t,v])=>[x+t/maxX*220,440-v/maxY*70]),'#e5be69',3);
      text(ctx,`${v.value} ${m.graph==='distance'?'m/s':'m'}`,x+110,348);
      text(ctx,m.graph==='distance'?local('distance / time','jarak / masa'):local('speed / time','laju / masa'),x+110,465,11);
    }else if(item.kind==='motion-plan'){
      const a=(state.application?.effects||[]).find(a=>a.id===item.id),time=a?.elapsed??0;
      const distance=Math.min(time,v.t1)*v.v1+Math.max(0,time-v.t1)*m.v2;
      line(ctx,[[x,390],[x+(a?.trackWidth??360),390]],'#c0d8d5',2);
      dot(ctx,x+(a?.trackWidth??360)*distance/item.target.distance,390,6,'#e7c572');
      text(ctx,`${fmt(time)} / ${m.duration} s · ${fmt(distance)} / ${item.target.distance} m`,x+120,365);
    }else if(item.kind==='probability-reading'){
      const probabilities=branchFractions(m);
      line(ctx,[[x,445],[x+80,385],[x+205,350]],'#f3dfb3',3);line(ctx,[[x+80,385],[x+205,425]],'#f3dfb3',3);
      dot(ctx,x+80,385,11,'#c97575');text(ctx,'R',x+80,390,12);dot(ctx,x+205,350,11,m.event[1]==='R'?'#c97575':'#799dc9');text(ctx,m.event[1],x+205,355,12);
      text(ctx,`${m.red} R + ${m.blue} B`,x+30,469);text(ctx,`P(${m.event})=${probabilities.combined}`,x+135,327);text(ctx,probabilities.conditional,x+133,379,11);
      text(ctx,local(m.replacement?'replace':'no replacement',m.replacement?'kembali':'tanpa kembali'),x+126,297,11);
    }else if(item.kind==='probability-plan'){
      text(ctx,`P(RR)=${item.target.probabilityFraction||fmt(item.target.probability)}`,x+110,398);
    }else if(item.kind==='finance-reading'){
      const monthly=m.income-m.expenses.reduce((a,b)=>a+b,0),goal=m.chart==='savings';
      ctx.fillStyle='#d0bc87';ctx.fillRect(x,422,210,55);ctx.fillStyle='#526b48';ctx.fillRect(x+7,448,196*(goal?Math.min(1,(m.initial+v.value*monthly)/m.goal):monthly/m.income),20);
      text(ctx,goal?`${v.value} ${local('months','bulan')} → RM${m.initial+v.value*monthly}`:`RM${m.income} − RM${m.income-monthly} = RM${v.value}`,x+105,398);
    }else if(item.kind==='budget-plan'){
      text(ctx,`RM${item.spent} + RM${v.saving} + RM${item.remaining}`,x+130,374);text(ctx,local('supplies · savings · unspent','bekalan · simpanan · baki'),x+130,352,11);
    }
  }
}
