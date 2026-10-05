// Forest rendering adapted from july-lyan/yoyo-sunshine-forest.
import { parseNumber } from './math/quadratics.js';
import { fetchJSON, settleLoads } from './loading.js';
export const STATIONS = { roots:650, vertex:1470, design:2310, guardian:3700 };
export function createForestRenderer(canvas, stage, game, quest, t, region=()=> 'quadratics', meta=()=>null) {
const ctx = canvas.getContext('2d'), images = {};
let viewW=1200, camera=0, clock=0, animationData;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize() {
  const rect = stage.getBoundingClientRect();
  if(rect.width<=0 || rect.height<=0)return;
  const nextWidth=rect.width / rect.height * 620;
  if(!Number.isFinite(nextWidth))return;
  viewW = Math.max(260,Math.min(2400,nextWidth));
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width*dpr);canvas.height = Math.round(rect.height*dpr);
  ctx.setTransform(canvas.width/viewW,0,0,canvas.height/620,0,0);
}
new ResizeObserver(resize).observe(stage);

function sprite(name, x, foot, height, facing = 1, rotation = 0, alpha = 1) {
  const img = images[name]; if (!img) return;
  const w = height * img.width / img.height;
  ctx.save();ctx.translate(x,foot);ctx.scale(facing,1);ctx.rotate(rotation);ctx.globalAlpha = alpha;
  ctx.drawImage(img,-w/2,-height,w,height);ctx.restore();
}

function frameSprite(kind, sequence, frame, x, foot, facing=1, alpha=1) {
  const group=animationData[kind], data=['hero','armed'].includes(kind)?group[sequence][frame]:group.frames[frame];
  const image=kind==='armed'?images['armed-walk']:kind==='hero'?images['hero-animation']:images['mushroom-animation'];
  if(!data || !image)return;
  const [sx,sy,w,h]=data.rect, [px,py]=data.pivot, scale=group.scale;
  ctx.save();ctx.translate(x,foot);ctx.scale(facing,1);ctx.globalAlpha=alpha;
  let art=image;
  if(kind==='armed' && ((sequence==='sword'&&game.state.upgrades.stoneSword)||(sequence==='axe'&&!game.state.upgrades.stoneAxe)))art=images['armed-tier']||image;
  if(kind==='hero' && sequence==='axe' && game.state.player.actionWeapon?.name==='木斧')art=images['wood-axe-animation']||image;
  if(kind==='hero' && sequence==='sword' && game.state.player.actionWeapon?.name==='石剑')art=images['stone-sword-animation']||image;
  ctx.drawImage(art,sx,sy,w,h,-px*scale,-py*scale,w*scale,h*scale);ctx.restore();
}
function stone(x,y,size=25){
  ctx.save();ctx.translate(x,y);ctx.scale(size/30,size/30);ctx.lineWidth=2;ctx.strokeStyle='#4c5144';ctx.fillStyle='#929782';ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(-20,-12);ctx.lineTo(-9,-29);ctx.lineTo(7,-33);ctx.lineTo(21,-19);ctx.lineTo(18,-1);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#c0c0a5';ctx.beginPath();ctx.moveTo(-9,-29);ctx.lineTo(7,-33);ctx.lineTo(2,-15);ctx.lineTo(-20,-12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#747e69';ctx.beginPath();ctx.moveTo(2,-15);ctx.lineTo(21,-19);ctx.lineTo(18,-1);ctx.lineTo(-7,1);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#c6c7ac66';for(let i=0;i<9;i++)ctx.fillRect(-12+(i*13%28),-24+(i*7%22),2,2);ctx.restore();
}
function equipmentVariants(){
  const held=images['armed-walk'],variant=document.createElement('canvas');variant.width=held.width;variant.height=held.height;const vc=variant.getContext('2d');vc.drawImage(held,0,0);const heldPixels=vc.getImageData(0,0,held.width,held.height),px=heldPixels.data;
  for(let y=0;y<held.height;y++)for(let x=0;x<held.width;x++){const i=(y*held.width+x)*4,lx=x%512,ly=y%512;if(!px[i+3])continue;const light=(px[i]+px[i+1]+px[i+2])/3;if(y<512&&lx>350&&ly>160&&ly<305){px[i]=light;px[i+1]=light*1.03;px[i+2]=light;}if(y>=512&&lx>330&&ly>190&&ly<330&&Math.abs(px[i]-px[i+1])<35&&Math.abs(px[i+1]-px[i+2])<30){px[i]=Math.min(255,light*1.15+18);px[i+1]=light*.8+7;px[i+2]=light*.45;}}
  vc.putImageData(heldPixels,0,0);images['armed-tier']=variant;
  const base=images['hero-animation'];
  const wood=document.createElement('canvas');wood.width=base.width;wood.height=base.height;const w=wood.getContext('2d');w.drawImage(base,0,0);
  const pixels=w.getImageData(0,0,wood.width,wood.height),data=pixels.data;
  const boxes=[[18,700,131,790],[613,916,711,1052],[986,943,1080,1063],[1330,736,1448,889]];
  for(const [x0,y0,x1,y1] of boxes)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const n=(y*wood.width+x)*4,r=data[n],g=data[n+1],b=data[n+2];if(data[n+3]>0&&Math.abs(r-g)<34&&Math.abs(g-b)<30&&r>45){const light=(r+g+b)/3;data[n]=Math.min(255,light*1.12+22);data[n+1]=light*.8+8;data[n+2]=light*.47;}}
  w.putImageData(pixels,0,0);images['wood-axe-animation']=wood;
  const sword=document.createElement('canvas');sword.width=base.width;sword.height=base.height;const t=sword.getContext('2d');t.drawImage(base,0,0);
  const polygons=[[[29,382],[51,386],[107,479],[87,495]],[[594,565],[705,642],[699,669],[580,604]],[[1021,532],[1112,534],[1138,551],[1115,568],[1021,567]],[[1290,555],[1400,474],[1425,476],[1411,502],[1314,585]]];
  t.save();t.beginPath();for(const poly of polygons){t.moveTo(...poly[0]);for(const pt of poly.slice(1))t.lineTo(...pt);t.closePath();}t.clip();t.filter='grayscale(1) brightness(1.2)';t.drawImage(base,0,0);t.restore();images['stone-sword-animation']=sword;
  for(const [name,source,toWood] of [['wood-sword','stone-sword',true],['stone-axe','wood-axe',false]]){const art=images[source],c=document.createElement('canvas');c.width=art.width;c.height=art.height;const dc=c.getContext('2d');dc.drawImage(art,0,0);const pixels=dc.getImageData(0,0,c.width,c.height),d=pixels.data;for(let y=0;y<c.height*.64;y++)for(let x=0;x<c.width;x++){const n=(y*c.width+x)*4;if(!d[n+3])continue;const light=(d[n]+d[n+1]+d[n+2])/3;if(toWood){d[n]=Math.min(255,light*1.15+16);d[n+1]=light*.81+7;d[n+2]=light*.46;}else{d[n]=light*.94;d[n+1]=light;d[n+2]=light*.94;}}dc.putImageData(pixels,0,0);images[name]=c;}
}

function shadow(x,y,w) { ctx.fillStyle='#20392230';ctx.beginPath();ctx.ellipse(x,y-1,w,5,0,0,Math.PI*2);ctx.fill(); }
function label(text,x,y,color='#f6ebcc',size=15) {
  ctx.font=`bold ${size}px Georgia,serif`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#3d442cc9';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);
}
function sign(text,x,y,width=132) {
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#6f5435';ctx.fillRect(-4,-4,8,44);
  ctx.fillStyle='#d7b477';ctx.strokeStyle='#6d4c2b';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-width/2,-34);ctx.lineTo(width/2-7,-36);ctx.lineTo(width/2,-17);ctx.lineTo(width/2-4,0);ctx.lineTo(-width/2,2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#a47c4955';ctx.lineWidth=1;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-width/2+4,-27+j*10);ctx.lineTo(width/2-8,-28+j*10);ctx.stroke();}
  ctx.fillStyle='#735535';ctx.beginPath();ctx.arc(-width/2+9,-18,2,0,7);ctx.arc(width/2-12,-18,2,0,7);ctx.fill();
  ctx.textAlign='center';ctx.font='bold 16px Georgia,serif';ctx.fillStyle='#4d4229';ctx.fillText(text,0,-11);ctx.restore();
}
function background(img, offset, alpha=1) {
  if (!img || alpha <= 0) return;
  const width = 1180, height = 640;
  const start = -((offset%width+width)%width);
  ctx.save();ctx.globalAlpha=alpha;
  for(let x=start,i=Math.floor(offset/width);x<viewW;x+=width,i++) {
    ctx.save();ctx.translate(x,0);
    if(i%2){ctx.translate(width,0);ctx.scale(-1,1);}
    ctx.drawImage(img,0,0,width,height);ctx.restore();
  }
  ctx.restore();
}
function terrain(img, offset, alpha=1) {
  const width=1100, sourceY=img.height*.781;
  ctx.save();ctx.globalAlpha=alpha;
  for(let x=-(offset%width);x<viewW;x+=width) ctx.drawImage(img,0,sourceY,img.width,img.height-sourceY,x,500,width,140);
  ctx.restore();
}
function foreground() {
  // Each sprig is rooted in its own faster-moving foreground plane.
  for(let i=0;i<26;i++) {
    const x=i*218-camera*1.16;
    if(x < -100 || x>viewW+100) continue;
    const y=609+(i%3)*9, sway=reducedMotion?0:Math.sin(clock*.7+i)*.035;
    ctx.save();ctx.translate(x,y);ctx.rotate(sway);ctx.strokeStyle='#344c32';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,15);ctx.quadraticCurveTo(2,-30,17,-66);ctx.stroke();
    for(let j=0;j<5;j++) { const yy=-j*12;ctx.fillStyle=j%2?'#536b3c':'#3e5839';ctx.strokeStyle='#2f452f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(j*2,yy);ctx.quadraticCurveTo(-36,yy-29,-28,yy-35);ctx.quadraticCurveTo(-4,yy-32,j*2+3,yy-3);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(j*2,yy-7);ctx.quadraticCurveTo(25,yy-35,34,yy-32);ctx.quadraticCurveTo(38,yy-16,j*2,yy-7);ctx.fill();ctx.stroke();}
    ctx.restore();
  }
}
function render(dt) {
  const s=game.state,p=s.player;
  const target=Math.max(0,Math.min(s.worldWidth-viewW,p.x-viewW*.34));
  if(Math.abs(target-camera)>viewW*.9) camera=target;
  else camera += (target-camera)*(1-Math.exp(-dt*7));
  const blend=Math.max(0,Math.min(1,(camera+viewW*.45-1600)/1100));
  ctx.clearRect(0,0,viewW,620);
  background(images.forest,camera*.23);background(images['forest-east'],camera*.23,blend);
  // Ground, props, enemies and collision geometry all share world movement.
  terrain(images.forest,camera);terrain(images['forest-east'],camera,blend);
  const sun=ctx.createLinearGradient(0,0,viewW,510);sun.addColorStop(0,'#fff9b509');sun.addColorStop(.6,'#fff4af08');sun.addColorStop(1,'#ffe4a500');ctx.fillStyle=sun;ctx.fillRect(0,0,viewW,500);
  if(!reducedMotion) for(let i=0;i<20;i++) {
    const x=((i*113+Math.sin(clock*.16+i)*40-camera*.38)% (viewW+50)+viewW+50)%(viewW+50),y=140+((i*67+clock*9) %310);
    ctx.globalAlpha=.28+Math.sin(clock+i)*.15;ctx.fillStyle='#fff4aa';ctx.beginPath();ctx.ellipse(x,y,2.2,1.2,clock*.2+i,0,7);ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.save();ctx.translate(-camera,0);
  sprite('house',150,504,264);sign(t('trailHome'),340,461,160);
  if(!reducedMotion) for(let i=0;i<4;i++){const t=(clock*.18+i*.24)%1;ctx.globalAlpha=(1-t)*.25;ctx.fillStyle='#fff9e0';ctx.beginPath();ctx.ellipse(98+Math.sin(t*4)*12,264-t*75,7+t*12,10+t*12,-.3,0,7);ctx.fill();}ctx.globalAlpha=1;
  sprite('bench',1450,503,108);sign(region()==='finale'?t('route'):t('vertex'),1450,359,170);
  drawQuestWorld();
  for(const platform of s.platforms) {
    if(platform.questCart)continue;
    ctx.save();ctx.fillStyle='#745330';ctx.strokeStyle='#473d27';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(platform.x,platform.y,platform.w,23,8);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#a38c52';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(platform.x+8,platform.y+6+i*5);ctx.bezierCurveTo(platform.x+platform.w*.35,platform.y+2+i*6,platform.x+platform.w*.65,platform.y+13+i*4,platform.x+platform.w-7,platform.y+5+i*6);ctx.stroke();}
    ctx.fillStyle='#78964b';for(let x=platform.x+3;x<platform.x+platform.w;x+=8){ctx.beginPath();ctx.moveTo(x,platform.y+2);ctx.lineTo(x+4,platform.y-6);ctx.lineTo(x+9,platform.y+2);ctx.fill();}ctx.restore();
  }
  for(const tree of s.trees) {
    if(tree.felled) {sprite('wood',tree.x,503,24,1,0,.35);continue;}
    shadow(tree.x,502,41);sprite('logs',tree.x+(tree.hitTimer>0?Math.sin(clock*75)*3:0),504,72,1,tree.hitTimer>0?Math.sin(clock*65)*.03:0);
    if(Math.abs(tree.x-p.x)<130){label('J · '+t('wood'),tree.x,409);ctx.fillStyle='#343b2977';ctx.fillRect(tree.x-20,423,40,4);ctx.fillStyle='#f5d180';ctx.fillRect(tree.x-20,423,40*tree.hp/tree.maxHp,4);}
  }
  for(const rock of s.rocks){if(rock.depleted)continue;sprite('rocks',rock.x+(rock.hitTimer>0?Math.sin(clock*75)*3:0),503,72);if(Math.abs(rock.x-p.x)<125){label('J · '+t('stone'),rock.x,407);ctx.fillStyle='#394832';ctx.fillRect(rock.x-20,421,40,4);ctx.fillStyle='#c3c7a6';ctx.fillRect(rock.x-20,421,40*rock.hp/rock.maxHp,4);}}
  for(const reward of s.platformRewards){if(reward.collected)continue;const yy=reward.y+Math.sin(clock*3+reward.x)*2;if(reward.type==='stone'){sprite('stone',reward.x,yy,24);label(t('stone')+' ×3',reward.x,yy-37,'#ffeab4',12);}else label('♥',reward.x,yy,'#f3b482',26);}
  for(const e of s.enemies) {
    if(!e.alive)continue;
    const h=e.type==='boss'?151:e.type==='hopper'?80:e.type==='spore'?70:69;
    shadow(e.x,501,e.type==='boss'?59:27);
    if(e.type==='boss' && ['windup','air'].includes(e.skillPhase)){
      const center=e.skillOriginX;ctx.save();ctx.fillStyle='#d78b3a35';ctx.strokeStyle='#efc672';ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.beginPath();ctx.ellipse(center,499,100,13,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);label(e.skillPhase==='windup'?'小心重踏！准备跳起来':'落地会有冲击波！',center,285,'#ffe5a0',19);ctx.restore();
    }

    let pose=Math.abs(e.vx)>1?Math.floor(e.phase*9)%4:0;
    if(e.type==='hopper')pose=e.action==='land'?3:e.action==='crouch'?0:e.vy<-170?1:e.y<500?2:0;
    if(e.type==='spore' && Math.abs(e.vx)<1)pose=e.shotTimer<.25?2:e.shotTimer>2.15?3:0;
    frameSprite(e.type,'frames',pose,e.x,e.y,-e.facing,e.hitTimer>0?.72:1);
    if(e.hp<e.maxHp || (e.type==='boss' && Math.abs(e.x-p.x)<530)) {
      const w=e.type==='boss'?125:52;ctx.fillStyle='#323a29dd';ctx.fillRect(e.x-w/2,e.y-h-15,w,7);ctx.fillStyle=e.type==='boss'?'#bd593b':'#d58b51';ctx.fillRect(e.x-w/2+1,e.y-h-14,(w-2)*e.hp/e.maxHp,5);
      if(e.type==='boss')label(t('guardian'),e.x,e.y-h-25,'#ffe9af',16);
    }
  }
  for(const d of s.drops) {
    const yy=d.y+Math.sin(clock*4+d.x)*4;
    if(d.type==='wood')sprite('wood',d.x,yy+9,27);
    else if(d.type==='stone')sprite('stone',d.x,yy+9,24);
    else if(d.type==='heart'){label('♥',d.x,yy,'#e68e67',27);}
    else {ctx.save();ctx.translate(d.x,yy);ctx.rotate(clock*.3);ctx.fillStyle='#ffe28b';ctx.strokeStyle='#866332';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?11:22;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();label(t('badge'),d.x,yy-35);}
  }
  for(const wave of s.shockwaves || []){ctx.save();ctx.translate(wave.x,wave.y);ctx.strokeStyle='#ffe19a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(-10,-12);ctx.lineTo(-2,-4);ctx.lineTo(7,-23);ctx.lineTo(14,-5);ctx.lineTo(21,0);ctx.stroke();ctx.strokeStyle='#b76e38';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,28,7,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  for(const q of s.projectiles){ctx.fillStyle='#b9d3a5';ctx.strokeStyle='#637b56';ctx.lineWidth=2;ctx.beginPath();ctx.arc(q.x,q.y,9,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#ecf4c5';ctx.beginPath();ctx.arc(q.x-3,q.y-3,2,0,7);ctx.fill();}
  shadow(p.x,501,Math.max(14,30-(500-p.y)*.06));
  const moving=Math.abs(p.vx)>0 && p.onGround && s.mode==='playing';
  const activeSwing=['sword','axe'].includes(p.action);
  const pose=activeSwing?Math.min(3,Math.floor(p.actionElapsed/Math.max(.01,p.actionDuration)*4)):moving?Math.floor(clock*10)%4:!p.onGround?1:1;
  const hurtAlpha=p.invulnerable>0 && Math.sin(clock*30)>0?.48:1;
  if(activeSwing)frameSprite('hero',p.action,pose,p.x,p.y,p.actionFacing,hurtAlpha);else frameSprite('armed',s.equipment,moving?pose:!p.onGround?1:3,p.x,p.y,p.facing,hurtAlpha);

  if(s.upgrades.woodArmor || s.upgrades.stoneArmor)sprite(s.upgrades.stoneArmor?'stone-shield':'wood-shield',p.x-p.facing*14,p.y-28,26,p.facing);
  if(activeSwing && p.actionElapsed>p.actionDuration*.24 && p.actionElapsed<p.actionDuration*.65){
    ctx.save();ctx.translate(p.x+p.actionFacing*30,p.y-48);ctx.scale(p.actionFacing,1);ctx.strokeStyle=p.action==='axe'?'#ffe0a1b0':'#fff7c6b0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,56,-1.0,.7);ctx.stroke();ctx.restore();
  }
  for(const part of s.particles){ctx.globalAlpha=part.life/part.maxLife;ctx.fillStyle=part.color;ctx.fillRect(part.x,part.y,4,4);}ctx.globalAlpha=1;
  ctx.restore();foreground();
  if(s.trophy){ctx.fillStyle='#edaf5a12';ctx.fillRect(0,0,viewW,620);}
}

function drawQuestWorld() {
  const complete = quest().completed;
  const next = quest().next?.station;
  for (const [id,x] of Object.entries(meta()?.stations&&!Array.isArray(meta().stations)?meta().stations:STATIONS)) {
    if (id === 'guardian') continue;
    const done=complete.includes(id), active=next===id;
    ctx.save();ctx.translate(x,0);
    ctx.fillStyle='#536a48';ctx.fillRect(-5,407,10,94);
    ctx.beginPath();ctx.arc(0,386,24,0,Math.PI*2);ctx.fillStyle=done?'#456a42':active?'#e8cd82':'#8b9e7c';ctx.fill();
    ctx.strokeStyle='#faf0ce';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=done?'#fff4cc':'#264935';ctx.font='bold 24px Georgia';ctx.textAlign='center';ctx.fillText(done?'✓':({quadratics:'ƒ',inequalities:'≤',motion:'→',probability:'P',finance:'RM',finale:'✦'})[region()],0,394);
    if(active&&!reducedMotion){ctx.strokeStyle='#fff3b880';ctx.beginPath();ctx.arc(0,386,30+Math.sin(clock*2)*3,0,Math.PI*2);ctx.stroke();}
    label(t(id),0,344,'#fff6d7',14);ctx.restore();
  }
  for (const [id,x] of (meta()?.gates||[['roots',1100],['vertex',2090],['design',2960]])) {
    if(complete.includes(id))continue;
    ctx.save();ctx.fillStyle='#688a6140';ctx.fillRect(x-10,330,20,170);ctx.strokeStyle='#f9e3a1';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.strokeRect(x-10,330,20,170);ctx.setLineDash([]);label(t('locked'),x,312,'#fff5c9',13);ctx.restore();
  }
  const bridgeId=region()==='finale'?'bridge':'design';
  if (['quadratics','finale'].includes(region()) && complete.includes(bridgeId)) {
    const draft=quest().save().sessions[bridgeId].draft, span=parseNumber(draft.span),k=parseNumber(draft.k),origin=region()==='finale'?820:2520;
    ctx.save();ctx.beginPath();
    for(let i=0;i<=64;i++){const x=span*i/64,y=500-k*x*(span-x)*7; if(i===0)ctx.moveTo(origin,y);else ctx.lineTo(origin+i*4,y);}
    ctx.lineWidth=13;ctx.strokeStyle='#7f6542';ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#efd594';ctx.stroke();ctx.restore();
  }
  const effects=game.state.application?.kind==='expedition'?game.state.application.effects:game.state.application?[game.state.application]:[];
  for(const application of effects){
  ctx.save();
  if(application.kind==='waypoint'){
    ctx.strokeStyle='#e5d299';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(region()==='finale'?1450:2450,500);ctx.lineTo(application.x,application.y);ctx.lineTo(region()==='finale'?1900:2860,500);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#e5c16c';ctx.fillRect(application.x,application.y-60,3,60);ctx.beginPath();ctx.moveTo(application.x+3,application.y-60);ctx.lineTo(application.x+35,application.y-47);ctx.lineTo(application.x+3,application.y-35);ctx.fill();label(`(${application.point.x}, ${application.point.y})`,application.x,application.y-83,'#fff6d7',14);
  }else if(application.kind==='cart'){
    const x=game.state.platforms.find(p=>p.questCart)?.x??2520;
    ctx.fillStyle='#cbaa66';ctx.fillRect(x,450,80,27);ctx.fillStyle='#334837';for(const w of [12,65]){ctx.beginPath();ctx.arc(x+w,482,9,0,Math.PI*2);ctx.fill();}
    label(`${Math.min(application.elapsed,application.duration).toFixed(1)} s · ${application.distance} m`,x+40,420,'#fff6d7',13);
  }else if(application.kind==='crystals'){
    const origin=application.origin??2505;
    for(let i=0;i<application.red+application.blue;i++){const x=origin+i*26;ctx.fillStyle=i<application.red?'#c47773':'#769bbb';ctx.beginPath();ctx.moveTo(x,466);ctx.lineTo(x+8,450);ctx.lineTo(x+16,466);ctx.lineTo(x+8,482);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff0bd';ctx.stroke();}
    label(`${application.red} ${t('redCrystals')} · ${application.blue} ${t('blueCrystals')}`,origin+115,430,'#fff6d7',14);
  }else if(application.kind==='camp'){
    const origin=application.origin??2505;
    for(let i=0;i<application.food+application.medical;i++){const x=origin+i*29;ctx.fillStyle=i<application.food?'#a68a4d':'#739d81';ctx.fillRect(x,467,25,32);ctx.strokeStyle='#efdfab';ctx.strokeRect(x,467,25,32);label(i<application.food?'F':'+',x+12,491,'#fff6d7',13);}
    for(let i=0;i<application.lamp;i++){const x=origin+12+i*70;ctx.fillStyle='#ead28a';ctx.fillRect(x,428,8,22);ctx.beginPath();ctx.arc(x+4,436,15,0,Math.PI*2);ctx.fillStyle='#ffe5a455';ctx.fill();}
    label(`${t('savingsCamp')}: RM${application.saving}`,origin+115,403,'#fff6d7',14);
  }
  ctx.restore();
  }
}
async function load() {
  animationData ||= await fetchJSON('assets/animations.json');
  await settleLoads(['armed-walk','rocks','stone','wood-shield','stone-shield','wood-axe','stone-sword','hero-animation','mushroom-animation','forest','forest-east','hero','house','logs','red','hopper','spore','boss','wood','bench'].filter(name=>!images[name]).map(name=>new Promise((resolve,reject)=>{
    const img=new Image();
    const finish=ok=>{clearTimeout(timer);img.onload=img.onerror=null;if(ok){images[name]=img;resolve();}else{img.src='';reject(new Error('Asset unavailable: '+name));}};
    const timer=setTimeout(()=>finish(false),20000);
    img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src='assets/'+name+'.'+(name==='armed-walk'||name.startsWith('forest')||name.endsWith('animation')?'webp':'png');
  })));
  equipmentVariants();resize();
}
return {load,resize,render(dt){if(game.state.mode==='playing')clock+=dt;render(dt);},resetCamera(){camera=0;},get camera(){return camera;},get viewWidth(){return viewW;}};
}
