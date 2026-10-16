const line=(c,points,color,width=2)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
const orb=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};

export const SCENE_NAMES={
  en:{quadratics:['Sunlit grove','Waterfall ruins','The old crossing'],inequalities:['Amber cliffs','Wind-carved ruins','Canyon watch'],motion:['Windmill fields','Skyline railway','Transit outpost'],probability:['Moonlit shore','Crystal shallows','Starlight sanctuary'],finance:['Golden meadow','Lantern market','Firelight camp']},
  ms:{quadratics:['Rimba cerah','Runtuhan air terjun','Lintasan lama'],inequalities:['Tebing ambar','Runtuhan berangin','Menara ngarai'],motion:['Ladang kincir','Landasan langit','Pos transit'],probability:['Tepian bulan','Tasik kristal','Tempat cahaya bintang'],finance:['Padang keemasan','Pasar tanglung','Kem unggun api']},
};
export function sceneName(id,x,language){return (SCENE_NAMES[language]||SCENE_NAMES.en)[id]?.[x<1250?0:x<2700?1:2]||'';}

/** Distant landmarks form a second parallax layer across each chapter. */
export function adventureAtmosphere(ctx,route,width,camera,time,reduced){
  if(!route)return;
  const t=reduced?0:time;
  ctx.save();
  if(route.id==='quadratics'){
    for(const anchor of [840,1960,3260]){
      const x=anchor-camera*.55;
      if(x < -220 || x>width+220)continue;
      ctx.fillStyle='#637b6b';ctx.beginPath();ctx.moveTo(x-150,485);ctx.lineTo(x-126,290);ctx.lineTo(x-50,253);ctx.lineTo(x+30,285);ctx.lineTo(x+100,478);ctx.fill();
      const g=ctx.createLinearGradient(x,265,x,495);g.addColorStop(0,'#dafff294');g.addColorStop(1,'#80bccc55');ctx.fillStyle=g;ctx.fillRect(x-45,282,40,214);
      for(let n=0;n<5;n++){const y=290+(n*43+t*42)%200;line(ctx,[[x-38,y],[x-36,y+27]],'#e6fffa88',2);}
      ctx.fillStyle='#adc1a1';ctx.fillRect(x-140,355,29,125);ctx.fillRect(x+50,348,29,132);ctx.fillRect(x-147,348,44,15);ctx.fillRect(x+44,341,42,15);
      line(ctx,[[x-137,376],[x-128,420],[x-134,452]],'#517458',4);
    }
  }else if(route.id==='inequalities'){
    for(let i=0;i<5;i++){
      const x=210+i*590-camera*.48;
      ctx.fillStyle='#754f4566';ctx.fillRect(x,224,31,259);ctx.fillRect(x+154,250,32,233);ctx.fillRect(x-8,213,48,18);ctx.fillRect(x+146,241,48,17);
      ctx.strokeStyle='#765b49';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+30,300);ctx.quadraticCurveTo(x+100,348,x+156,300);ctx.stroke();
      for(let n=0;n<8;n++){ctx.fillStyle=n%2?'#d09b63':'#ead1a1';ctx.beginPath();ctx.moveTo(x+35+n*16,311);ctx.lineTo(x+45+n*16,333);ctx.lineTo(x+48+n*16,313);ctx.fill();}
      for(let n=0;n<3;n++){const dust=(t*37+n*177+i*95)%(width+100);line(ctx,[[dust,160+n*61],[dust+32,156+n*61]],'#dabb8650',2);}
    }
  }else if(route.id==='motion'){
    for(let i=0;i<6;i++){
      const x=260+i*480-camera*.38;
      ctx.fillStyle='#7e9691';ctx.beginPath();ctx.moveTo(x-24,445);ctx.lineTo(x-11,248);ctx.lineTo(x+11,248);ctx.lineTo(x+27,445);ctx.fill();
      ctx.save();ctx.translate(x,252);ctx.rotate(t*.35+i);for(let n=0;n<4;n++){ctx.rotate(Math.PI/2);ctx.fillStyle='#f7edcc';ctx.beginPath();ctx.moveTo(7,-7);ctx.lineTo(90,-15);ctx.lineTo(80,6);ctx.lineTo(10,9);ctx.fill();}orb(ctx,0,0,12,'#cfaa66');ctx.restore();
    }
    line(ctx,[[0,302],[width,302]],'#68828370',2);
  }else if(route.id==='probability'){
    const g=ctx.createLinearGradient(0,0,0,500);g.addColorStop(0,'#202f53');g.addColorStop(.62,'#496d89');g.addColorStop(1,'#779ba5');ctx.fillStyle=g;ctx.fillRect(0,0,width,500);
    orb(ctx,width*.74-camera*.018,104,35,'#f0ebc7');orb(ctx,width*.74-camera*.018+12,93,32,'#293c60');
    for(let i=0;i<48;i++){ctx.globalAlpha=reduced?.65:.45+Math.sin(t*.7+i)*.25;orb(ctx,(i*137-camera*.06+width*4)%width,28+(i*37)%245,i%5?1:2,'#e5f5ff');}ctx.globalAlpha=1;
    ctx.fillStyle='#274a6880';ctx.fillRect(0,330,width,170);
    for(let i=0;i<18;i++){const x=(i*149-camera*.25+width*4)%width;line(ctx,[[x,343+i*8],[x+45+(i%3)*25,343+i*8]],'#b0dcdf42',2);}
    for(let i=0;i<9;i++){const x=i*370-camera*.45;ctx.fillStyle=i%2?'#8dc6cc':'#8496c5';ctx.beginPath();ctx.moveTo(x-23,483);ctx.lineTo(x-35,404);ctx.lineTo(x,367-i%3*15);ctx.lineTo(x+27,420);ctx.lineTo(x+19,483);ctx.fill();line(ctx,[[x,379-i%3*15],[x-2,471]],'#e0e9eb88',2);}
  }else if(route.id==='finance'){
    const g=ctx.createLinearGradient(0,0,0,290);g.addColorStop(0,'#df9c7044');g.addColorStop(1,'#f4d78a00');ctx.fillStyle=g;ctx.fillRect(0,0,width,290);
    for(let i=0;i<7;i++){
      const x=270+i*420-camera*.52;
      line(ctx,[[x,458],[x,279],[x+170,279],[x+170,458]],'#645d47',5);
      line(ctx,[[x,283],[x+85,302],[x+170,283]],'#716143',2);
      for(let j=0;j<4;j++){const px=x+19+j*43,py=297+Math.sin(j/3*Math.PI)*12;orb(ctx,px,py+12,23,'#ffdd7930');ctx.fillStyle=j%2?'#e1b568':'#c27e5c';ctx.fillRect(px-7,py,14,21);ctx.fillStyle='#ffedb1';ctx.fillRect(px-4,py+3,8,14);}
      ctx.fillStyle=i%2?'#ae7354':'#779381';ctx.fillRect(x+13,391,144,70);ctx.fillStyle='#e3cea0';ctx.fillRect(x+13,389,144,10);
    }
  }
  ctx.restore();
}
