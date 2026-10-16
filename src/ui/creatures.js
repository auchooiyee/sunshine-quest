import { CREATURE_NAMES } from '../../config/encounters.js';
const ellipse=(ctx,x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};

/** Canvas creatures match the forest's soft shapes without external assets. */
export function drawCreature(ctx,e,clock,reduced){
  if(!['slime','beetle','wisp'].includes(e.type))return false;
  ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.facing,1);
  if(e.hitTimer>0)ctx.globalAlpha=.65;
  const pulse=reduced?0:Math.sin(clock*5+e.phase);
  if(e.type==='slime'){
    const squash=e.landTimer>0?1.25:e.y<495?.85:1+pulse*.045;
    ctx.scale(squash,1/squash);
    const gradient=ctx.createLinearGradient(0,-58,0,0);gradient.addColorStop(0,'#d4ef91');gradient.addColorStop(.45,'#86bd68');gradient.addColorStop(1,'#387966');
    ctx.fillStyle=gradient;ctx.strokeStyle='#315f4e';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(-34,-4);ctx.bezierCurveTo(-38,-27,-18,-57,2,-56);ctx.bezierCurveTo(27,-58,37,-21,34,-4);ctx.quadraticCurveTo(3,7,-34,-4);ctx.fill();ctx.stroke();
    ellipse(ctx,-13,-38,9,5,'#eeffc491');ellipse(ctx,-10,-19,4,6,'#223b35');ellipse(ctx,14,-19,4,6,'#223b35');
    ctx.strokeStyle='#35524a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(3,-14,5,0,Math.PI);ctx.stroke();
    ctx.fillStyle='#589653';ctx.beginPath();ctx.moveTo(1,-54);ctx.quadraticCurveTo(-14,-80,-22,-68);ctx.quadraticCurveTo(-10,-49,1,-54);ctx.fill();
  }else if(e.type==='beetle'){
    const charging=e.skillPhase==='charge',windup=e.skillPhase==='windup';
    ctx.strokeStyle='#513d36';ctx.lineWidth=5;ctx.lineCap='round';
    for(let i=0;i<3;i++){const x=-22+i*19,w=reduced?0:Math.sin(clock*(charging?25:9)+i)*4;ctx.beginPath();ctx.moveTo(x,-15);ctx.lineTo(x-9,-5+w);ctx.lineTo(x+5,0);ctx.stroke();}
    const gradient=ctx.createLinearGradient(0,-56,0,-6);gradient.addColorStop(0,windup?'#ffe5a2':'#eabd68');gradient.addColorStop(1,'#976540');
    ellipse(ctx,-4,-29,33,25,gradient);ctx.strokeStyle='#725039';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(-4,-29,33,25,0,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-25,-44);ctx.quadraticCurveTo(0,-29,-23,-10);ctx.stroke();
    ellipse(ctx,28,-25,16,17,'#574b44');ellipse(ctx,35,-30,4,5,windup?'#ffca76':'#fff2cd');ellipse(ctx,36,-30,2,3,'#253a39');
    ctx.strokeStyle='#e0bd83';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(38,-22);ctx.lineTo(51,-34);ctx.lineTo(48,-45);ctx.stroke();
  }else{
    const glow=ctx.createRadialGradient(0,-27,4,0,-27,57);glow.addColorStop(0,'#b6ffff55');glow.addColorStop(1,'#90daff00');ellipse(ctx,0,-27,57,57,glow);
    const gradient=ctx.createLinearGradient(0,-56,0,2);gradient.addColorStop(0,'#edf8ff');gradient.addColorStop(.55,'#addce3');gradient.addColorStop(1,'#81a6d477');ctx.fillStyle=gradient;ctx.strokeStyle='#6a94b3';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-25,-22);ctx.bezierCurveTo(-29,-70,31,-67,27,-20);ctx.lineTo(32,0);ctx.quadraticCurveTo(13,-10,5,2+pulse*3);ctx.quadraticCurveTo(-8,-11,-30,0);ctx.closePath();ctx.fill();ctx.stroke();
    ellipse(ctx,-8,-29,4,6,'#39516a');ellipse(ctx,12,-29,4,6,'#39516a');ellipse(ctx,3,-15,3,4,'#7a9caf');
    if(e.shotTimer<.65)ellipse(ctx,39,-24,5+(1-e.shotTimer/.65)*7,5+(1-e.shotTimer/.65)*7,'#ecfcff');
  }
  ctx.restore();return true;
}

export function drawEncounterCue(ctx,e,player,language){
  if(Math.abs(e.x-player.x)>330||e.type==='boss')return;
  const warning=e.type==='beetle'&&e.skillPhase==='windup';
  const casting=['wisp','spore'].includes(e.type)&&e.shotTimer<.65;
  ctx.save();ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.strokeStyle='#243a36';ctx.lineWidth=3;ctx.fillStyle=warning?'#ffe1a0':'#f5f3dc';
  const text=warning?(language==='ms'?'!  Bersedia menyerbu':'!  Charge incoming'):casting?(language==='ms'?'✦  Bersedia menembak':'✦  Casting'):(CREATURE_NAMES[language]||CREATURE_NAMES.en)[e.type];
  ctx.strokeText(text,e.x,e.y-87);ctx.fillText(text,e.x,e.y-87);
  if(warning){ctx.fillStyle='#efb45b45';ctx.fillRect(e.facing>0?e.x:e.x-188,488,188,12);ctx.strokeStyle='#ffda89';ctx.setLineDash([7,6]);ctx.strokeRect(e.facing>0?e.x:e.x-188,488,188,12);}
  ctx.restore();
}

export function drawSwordTrail(ctx,p,reduced){
  if(p.action!=='sword')return;
  const phase=p.actionElapsed/p.actionDuration;if(phase<.18||phase>.84)return;
  const thrust=p.combo===3,level=p.actionWeapon?.level||1;
  ctx.save();ctx.translate(p.x,p.y-39);ctx.scale(p.actionFacing,1);
  ctx.globalAlpha=reduced?.65:Math.sin((phase-.18)/.66*Math.PI);
  if(thrust){
    const reach=154,gradient=ctx.createLinearGradient(25,0,reach,0);gradient.addColorStop(0,'#c7eeeb00');gradient.addColorStop(.5,'#c7f6f1b0');gradient.addColorStop(1,'#fff7ce');
    ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(20,-14);ctx.lineTo(reach,0);ctx.lineTo(20,14);ctx.closePath();ctx.fill();
    ctx.strokeStyle=level===4?'#bdf9f3':'#ffffe5';ctx.lineWidth=level>=3?5:4;ctx.beginPath();ctx.moveTo(42,0);ctx.lineTo(146,0);ctx.stroke();
  }else{
    ctx.rotate(p.combo===2?.35:-.25);ctx.strokeStyle='#f8edbe66';ctx.lineWidth=15;ctx.beginPath();ctx.arc(18,0,73,-1.05,1.05);ctx.stroke();ctx.strokeStyle=level===4?'#bdf9f3':level===3?'#ffe1a0':'#fff9dd';ctx.lineWidth=level>=3?5:3;ctx.stroke();
  }
  ctx.restore();
}
