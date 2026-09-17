import { createGame } from './engine.js';
import { BALANCE } from './balance.js';

const $ = id => document.getElementById(id);
const STORAGE = 'yoyo-sunshine-forest-v1';
let stored = null, storageOK = true;
try { stored = JSON.parse(localStorage.getItem(STORAGE)); } catch { storageOK = false; }
const game = createGame(stored);
const canvas = $('world'), ctx = canvas.getContext('2d'), stage = $('stage');
const input = {}, images = {};
let viewW = 1200, camera = 0, clock = 0, last = 0, autosave = 0, toastUntil = 0, lastUI = '', loaded = false;
let animationData, workshopPaused=false;
let audioContext, soundOn = false, journalPaused = false, fullscreenFallback = false, lastMode = 'ready';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const paths = {
 sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 book:'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1v15',
 sound:'m3 9 5 0 5-4v14l-5-4H3zm14-2c3 3 3 7 0 10m3-13c5 5 5 11 0 16',
 pause:'M8 5v14M16 5v14', expand:'M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6',
 home:'m2 11 10-9 10 9M5 9v12h14V9m-10 12v-8h6v8',
 mushroom:'M2 12C3 0 21 0 22 12Zm7 0-2 9h10l-2-9M7 8h.1M13 5h.1M17 9h.1',
 wood:'m3 9 5-5 14 3v11l-5 4L3 19Zm0 0 14 3 5-5M17 12v10M7 12v5l6 1',
 sword:'m5 21 5-6m-3-3 6 6M10 13 19 3l2 1-1 5-8 7',
 tree:'m12 2-7 7h3l-5 6h4l-4 5h18l-4-5h4l-5-6h3Zm0 18v3',
 axe:'M7 22 17 3m-5 2-6-2-4 7 7 3 4-5 5 3 4-7-5-2',
 stone:'m3 16 3-10 10-3 6 10-5 8-10-1Zm3-10 6 5 4-8m-4 8 5 10m-5-10-9 5',
 shield:'M12 2 3 6v7c0 5 9 9 9 9s9-4 9-9V6Zm0 0v20',
 flag:'M5 22V3c6-4 9 4 15 0v10c-6 4-9-4-15 0'
};
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[el.dataset.icon] || paths.tree}"/></svg>`; });

function toast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); toastUntil = performance.now() + 4300; }
function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify(game.save())); storageOK = true; }
  catch { storageOK = false; }
  $('save-status').textContent = storageOK ? '冒险进度自动保存' : '当前浏览器无法保存，离开前请留意';
}
function tone(name) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const tones = { jump:[260,520,.13], swing:[180,80,.1], chop:[120,55,.09], hit:[230,90,.1], pickup:[600,920,.12], hurt:[190,60,.2], craft:[480,960,.3], win:[520,1040,.5] };
    const [a,b,d] = tones[name] || tones.pickup, oscillator = audioContext.createOscillator(), gain = audioContext.createGain(), time = audioContext.currentTime;
    oscillator.type = ['chop','hit'].includes(name) ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(a,time); oscillator.frequency.exponentialRampToValueAtTime(b,time+d);
    gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.065,time+.012); gain.gain.exponentialRampToValueAtTime(.0001,time+d);
    oscillator.connect(gain);gain.connect(audioContext.destination); oscillator.start(time);oscillator.stop(time+d+.02);
  } catch { soundOn = false; $('sound-button').setAttribute('aria-pressed','false'); }
}
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
  ctx.font=`bold ${size}px "Kaiti SC","STKaiti",serif`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#3d442cc9';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);
}
function sign(text,x,y,width=132) {
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#6f5435';ctx.fillRect(-4,-4,8,44);
  ctx.fillStyle='#d7b477';ctx.strokeStyle='#6d4c2b';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-width/2,-34);ctx.lineTo(width/2-7,-36);ctx.lineTo(width/2,-17);ctx.lineTo(width/2-4,0);ctx.lineTo(-width/2,2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#a47c4955';ctx.lineWidth=1;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-width/2+4,-27+j*10);ctx.lineTo(width/2-8,-28+j*10);ctx.stroke();}
  ctx.fillStyle='#735535';ctx.beginPath();ctx.arc(-width/2+9,-18,2,0,7);ctx.arc(width/2-12,-18,2,0,7);ctx.fill();
  ctx.textAlign='center';ctx.font='bold 16px "Kaiti SC","STKaiti",serif';ctx.fillStyle='#4d4229';ctx.fillText(text,0,-11);ctx.restore();
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
  sprite('house',150,504,264);sign('又又的家',340,461,118);
  if(!reducedMotion) for(let i=0;i<4;i++){const t=(clock*.18+i*.24)%1;ctx.globalAlpha=(1-t)*.25;ctx.fillStyle='#fff9e0';ctx.beginPath();ctx.ellipse(98+Math.sin(t*4)*12,264-t*75,7+t*12,10+t*12,-.3,0,7);ctx.fill();}ctx.globalAlpha=1;
  sprite('bench',1450,503,108);sign('林间工作台',1450,359,146);
  sign('阳光林道 →',535,414,132);sign('蘑菇空地 →',2930,423,145);
  for(const platform of s.platforms) {
    ctx.save();ctx.fillStyle='#745330';ctx.strokeStyle='#473d27';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(platform.x,platform.y,platform.w,23,8);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#a38c52';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(platform.x+8,platform.y+6+i*5);ctx.bezierCurveTo(platform.x+60,platform.y+2+i*6,platform.x+95,platform.y+13+i*4,platform.x+platform.w-7,platform.y+5+i*6);ctx.stroke();}
    ctx.fillStyle='#78964b';for(let x=platform.x+3;x<platform.x+platform.w;x+=8){ctx.beginPath();ctx.moveTo(x,platform.y+2);ctx.lineTo(x+4,platform.y-6);ctx.lineTo(x+9,platform.y+2);ctx.fill();}ctx.restore();
  }
  for(const tree of s.trees) {
    if(tree.felled) {sprite('wood',tree.x,503,24,1,0,.35);continue;}
    shadow(tree.x,502,41);sprite('logs',tree.x+(tree.hitTimer>0?Math.sin(clock*75)*3:0),504,72,1,tree.hitTimer>0?Math.sin(clock*65)*.03:0);
    if(Math.abs(tree.x-p.x)<130){label(s.equipment==='axe'?'J · 斧头采集':'按 2 换斧头采集',tree.x,409);ctx.fillStyle='#343b2977';ctx.fillRect(tree.x-20,423,40,4);ctx.fillStyle='#f5d180';ctx.fillRect(tree.x-20,423,40*tree.hp/tree.maxHp,4);}
  }
  for(const rock of s.rocks){if(rock.depleted)continue;sprite('rocks',rock.x+(rock.hitTimer>0?Math.sin(clock*75)*3:0),503,72);if(Math.abs(rock.x-p.x)<125){label('J · 开采石头',rock.x,407);ctx.fillStyle='#394832';ctx.fillRect(rock.x-20,421,40,4);ctx.fillStyle='#c3c7a6';ctx.fillRect(rock.x-20,421,40*rock.hp/rock.maxHp,4);}}
  for(const reward of s.platformRewards){if(reward.collected)continue;const yy=reward.y+Math.sin(clock*3+reward.x)*2;if(reward.type==='stone'){sprite('stone',reward.x,yy,24);label('石头 ×3',reward.x,yy-37,'#ffeab4',12);}else label('♥',reward.x,yy,'#f3b482',26);}
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
      if(e.type==='boss')label('森林的守关者 · 大蘑菇',e.x,e.y-h-25,'#ffe9af',16);
    }
  }
  for(const d of s.drops) {
    const yy=d.y+Math.sin(clock*4+d.x)*4;
    if(d.type==='wood')sprite('wood',d.x,yy+9,27);
    else if(d.type==='stone')sprite('stone',d.x,yy+9,24);
    else if(d.type==='heart'){label('♥',d.x,yy,'#e68e67',27);}
    else {ctx.save();ctx.translate(d.x,yy);ctx.rotate(clock*.3);ctx.fillStyle='#ffe28b';ctx.strokeStyle='#866332';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?11:22;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();label('森林徽章',d.x,yy-35);}
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
function updateUI() {
  const s=game.state,p=s.player, prompt=game.getPrompt();
  const signature=[s.mode,p.hp,s.wood,s.stone,s.defeated,s.crafted,s.trophy,s.equipment,JSON.stringify(s.upgrades),Math.floor(p.x/100),prompt].join('|');
  if(signature===lastUI)return;lastUI=signature;
  $('hearts').innerHTML=Array.from({length:p.maxHp},(_,i)=>`<span style="background:linear-gradient(90deg,#b95038 ${Math.max(0,Math.min(1,p.hp-i))*100}%,#b6b49c ${Math.max(0,Math.min(1,p.hp-i))*100}%);background-clip:text;-webkit-background-clip:text;color:transparent">♥</span>`).join(' ');
  $('hearts').setAttribute('aria-label',`生命 ${Number(p.hp.toFixed(2))} / ${p.maxHp}`);
  $('wood-count').textContent=s.wood;$('stone-count').textContent=s.stone;document.querySelector('.attack-touch').textContent=s.equipment==='axe'?'挥斧':'挥剑';
  $('equip-sword').setAttribute('aria-pressed',String(s.equipment==='sword'));$('equip-axe').setAttribute('aria-pressed',String(s.equipment==='axe'));$('equip-sword').querySelector('span').textContent=s.upgrades.stoneSword?'石剑':'木剑';$('equip-axe').querySelector('span').textContent=s.upgrades.stoneAxe?'石斧':'木斧';$('armor-status').querySelector('small').textContent=s.upgrades.stoneArmor?'石甲 −35%':s.upgrades.woodArmor?'木甲 −15%':'无护甲';$('enemy-count').textContent=s.defeated;$('sword-badge').hidden=!s.crafted;
  $('intro').hidden=s.mode!=='ready';$('pause-overlay').hidden=s.mode!=='paused' || $('journal').open || $('workshop').open;$('complete-overlay').hidden=s.mode!=='complete';
  $('pause-button').setAttribute('aria-label',s.mode==='paused'?'继续游戏':'暂停游戏');
  $('pause-button').disabled=s.mode==='ready'||s.mode==='complete';
  const area=p.x<450?0:p.x<1250?1:p.x<1900?2:p.x<3250?3:4;
  const names=['温暖的家','阳光林道','林间工作台','蘑菇空地','森林的秘密'];
  $('area-label').innerHTML=`<span>0${area+1}</span> ${names[area]}`;
  document.querySelectorAll('[data-stop]').forEach(el=>el.classList.toggle('active',Number(el.dataset.stop)<=area));
  $('trail-fill').style.width=`${Math.max(0,Math.min(1,(p.x-180)/3700))*89}%`;
  $('quest-text').textContent=s.trophy?(s.wood>=12?'森林徽章找到了，带着收获回家吧！':`再收集 ${12-s.wood} 块木头，就可以回家啦。`):s.wood>=12?'木头收好啦，去找大蘑菇的森林徽章。':`收集木头 ${Math.min(s.wood,12)} / 12，寻找森林徽章。`;
  $('quest').hidden=s.mode==='complete';
  $('interaction').hidden=s.mode!=='playing'||!prompt||!prompt.startsWith('E');
  $('interaction').querySelector('span').textContent=prompt.replace(/^E · /,'');
  $('return-home').hidden=s.mode!=='playing'||!s.trophy||p.x<340;
  if(s.mode==='complete') {
    $('result-wood').textContent=s.wood;$('result-detail').textContent=`认识了 ${s.defeated} 只蘑菇怪 · 探索了 ${Math.max(1,Math.round(s.elapsed/60))} 分钟`;
    if(lastMode!=='complete') persist();
  }
  lastMode=s.mode;
}
function clearInput(){for(const k of Object.keys(input))input[k]=false;document.querySelectorAll('[data-control]').forEach(el=>el.classList.remove('pressed'));}
const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyJ:'attack',KeyE:'interact'};
window.addEventListener('keydown',e=>{
  if($('journal').open||$('workshop').open)return;
  if(e.code==='Digit1'||e.code==='Digit2'){e.preventDefault();game.equip(e.code==='Digit1'?'sword':'axe');updateUI();return;}
  if(e.code==='Escape' && !e.repeat){game.togglePause();clearInput();updateUI();return;}
  if(!loaded || !keys[e.code] || e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target instanceof HTMLButtonElement && e.code==='Space' && game.state.mode!=='playing')return;
  e.preventDefault();
  const action=keys[e.code];
  if(action==='jump'||action==='interact'){if(!e.repeat)game[action]();}
  else {input[action]=true;if(action==='attack'&&!e.repeat)game.attack();}
});
window.addEventListener('keyup',e=>{if(keys[e.code]){input[keys[e.code]]=false;e.preventDefault();}});
window.addEventListener('blur',()=>{clearInput();if(game.state.mode==='playing'){game.togglePause();updateUI();}persist();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(game.state.mode==='playing')game.togglePause();persist();}});
window.addEventListener('pagehide',persist);
for(const button of document.querySelectorAll('[data-control]')) {
  button.addEventListener('pointerdown',e=>{e.preventDefault();if(game.state.mode!=='playing')return;button.setPointerCapture(e.pointerId);const action=button.dataset.control;if(action==='jump'||action==='interact')game[action]();else{input[action]=true;if(action==='attack')game.attack();}button.classList.add('pressed');});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{input[button.dataset.control]=false;button.classList.remove('pressed');});
}
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0 || game.state.mode!=='playing')return;
  e.preventDefault();stage.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
  const rect=canvas.getBoundingClientRect(), worldX=(e.clientX-rect.left)/rect.width*viewW+camera;
  const p=game.state.player;if(!['sword','axe'].includes(p.action)&&Math.abs(worldX-p.x)>3)p.facing=worldX>p.x?1:-1;
  input.attack=true;game.attack();
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{input.attack=false;});
$('start-button').onclick=()=>{if(!loaded)return;game.start();stage.focus({preventScroll:true});updateUI();};
$('pause-button').onclick=$('resume-button').onclick=()=>{game.togglePause();clearInput();stage.focus({preventScroll:true});updateUI();};
$('interaction').onclick=()=>{game.interact();stage.focus({preventScroll:true});persist();updateUI();};
$('return-home').onclick=()=>{game.returnHome();stage.focus({preventScroll:true});persist();updateUI();};
$('sound-button').onclick=()=>{soundOn=!soundOn;$('sound-button').setAttribute('aria-label',soundOn?'关闭声音':'开启声音');$('sound-button').setAttribute('aria-pressed',String(soundOn));$('sound-button').querySelector('.muted-mark').hidden=soundOn;tone('pickup');if(game.state.mode==='playing')stage.focus({preventScroll:true});};
$('fullscreen-button').onclick=async()=>{
  const container=document.querySelector('.book');
  try {
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(container.requestFullscreen)await container.requestFullscreen();
    else{fullscreenFallback=!fullscreenFallback;container.classList.toggle('expanded',fullscreenFallback);}
  }catch{fullscreenFallback=!fullscreenFallback;container.classList.toggle('expanded',fullscreenFallback);}
  resize();
};
document.addEventListener('fullscreenchange',()=>{resize();$('fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'全屏游戏');});
function fillJournal(){const s=game.state;const bestiary=document.querySelector('.bestiary');bestiary.innerHTML=Object.entries(BALANCE.enemies).map(([id,e])=>`<div><img src="assets/${id}.png" alt="${e.name}"><b>${e.name}</b><p>生命 ${e.hp} · 碰撞 ${e.damage} 心<br>${e.skill}<br>${e.description}${id==='boss'?'<br>冲击波 1.2 心 · 预警 0.9 秒':''}</p></div>`).join('');$('task-wood').textContent=`${s.wood>=12?'✓':'○'} 带回 12 块木头（现在有 ${s.wood} 块）`;$('task-craft').textContent=`${s.crafted?'✓':'○'} 在工作台制作石器（可选）`;$('task-boss').textContent=`${s.trophy?'✓':'○'} 找到大蘑菇的森林徽章`;$('task-home').textContent=`${s.mode==='complete'?'✓':'○'} 回到家，收好今天的冒险`;
}
$('journal-button').onclick=()=>{clearInput();journalPaused=game.state.mode==='playing';if(journalPaused)game.togglePause();fillJournal();$('journal').showModal();lastUI='';updateUI();};
$('journal').querySelector('.close-dialog').onclick=()=>$('journal').close();
$('journal').addEventListener('close',()=>{if(journalPaused&&game.state.mode==='paused')game.togglePause();journalPaused=false;$('restart-confirm').hidden=true;$('restart-button').hidden=false;lastUI='';stage.focus({preventScroll:true});updateUI();});
$('restart-button').onclick=()=>{$('restart-confirm').hidden=false;$('restart-button').hidden=true;};
$('cancel-restart').onclick=()=>{$('restart-confirm').hidden=true;$('restart-button').hidden=false;};
function restart(){game.restart();clearInput();camera=0;lastUI='';$('start-button').innerHTML='出发，去冒险 <span>→</span>';$('save-hint').textContent='走慢一点也没关系，家一直在这里。';persist();updateUI();}
$('confirm-restart').onclick=()=>{journalPaused=false;restart();$('journal').close();};
$('replay-button').onclick=restart;

function fillWorkshop(){
  const s=game.state;$('workshop-resources').textContent=`背包：木头 ${s.wood}　石头 ${s.stone}`;
  $('recipe-list').replaceChildren();
  for(const recipe of game.getRecipes()){
    const row=document.createElement('div');row.className='recipe';
    row.innerHTML=`<span class="recipe-icon"><img src="assets/${recipe.id==='stoneSword'?'stone-sword':recipe.id==='stoneAxe'?'wood-axe':recipe.id==='woodArmor'?'wood-shield':'stone-shield'}.png" alt=""></span><div><h3>${recipe.name}</h3><p>${recipe.description}</p><small>木头 ${recipe.wood} · 石头 ${recipe.stone}</small></div><button class="primary" ${recipe.owned||!recipe.available?'disabled':''}>${recipe.owned?'已制作':recipe.available?'制作':'缺材料'}</button>`;
    row.querySelector('button').onclick=()=>{if(game.craft(recipe.id)){$('craft-message').textContent=`${recipe.name}做好了！`;persist();fillWorkshop();lastUI='';updateUI();}};
    $('recipe-list').append(row);
  }
}
function openWorkshop(){if($('workshop').open)return;clearInput();workshopPaused=game.state.mode==='playing';if(workshopPaused)game.togglePause();fillWorkshop();$('craft-message').textContent='';$('workshop').showModal();lastUI='';updateUI();}
$('workshop').querySelector('.close-dialog').onclick=()=>$('workshop').close();
$('workshop').addEventListener('close',()=>{if(workshopPaused&&game.state.mode==='paused')game.togglePause();workshopPaused=false;lastUI='';stage.focus({preventScroll:true});updateUI();});
$('equip-sword').onclick=()=>{game.equip('sword');stage.focus({preventScroll:true});updateUI();};
$('equip-axe').onclick=()=>{game.equip('axe');stage.focus({preventScroll:true});updateUI();};

async function init(){
  try {
    animationData=await (await fetch('assets/animations.json',{cache:'no-store'})).json();
    await Promise.all(['armed-walk','rocks','stone','wood-shield','stone-shield','wood-axe','stone-sword','hero-animation','mushroom-animation','forest','forest-east','hero','house','logs','red','hopper','spore','boss','wood','bench'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[name]=img;resolve();};img.onerror=()=>reject(new Error(`素材加载失败：${name}`));img.src=`assets/${name}.${name==='armed-walk'||name.startsWith('forest')||name.endsWith('animation')?'webp':'png'}`;})));
    equipmentVariants();loaded=true;$('loading').hidden=true;
    if(stored && (game.state.elapsed>0 || game.state.wood>0)){$('start-button').innerHTML='继续我的冒险 <span>→</span>';$('save-hint').textContent='上次的木头和探险足迹，都替你收好了。';}
    if(!storageOK)$('save-status').textContent='浏览器存档不可用，本次仍可游玩';
    resize();updateUI();requestAnimationFrame(frame);
  }catch(error){$('loading').textContent=`${error.message}，请刷新页面重试。`;console.error(error);}
}
function frame(now){
  const dt=Math.min((now-last)/1000||1/60,.05);last=now;
  if(game.state.mode!=='paused'){clock+=dt;}game.update(dt,input);
  for(const event of game.state.events.splice(0)){if(event.type==='toast')toast(event.text);if(event.type==='sound')tone(event.name);if(event.type==='workbench')openWorkshop();}
  if(now>toastUntil)$('toast').classList.remove('visible');
  render(dt);updateUI();autosave+=dt;
  if(autosave>2.5&&game.state.mode==='playing'){persist();autosave=0;}
  requestAnimationFrame(frame);
}
// A read-only snapshot lets browser QA inspect the same state the player sees.
window.forestGame={recipes:()=>game.getRecipes(),snapshot:()=>JSON.parse(JSON.stringify({...game.state,camera,viewW,loaded,backgroundBlend:Math.max(0,Math.min(1,(camera+viewW*.45-1600)/1100))})),save:()=>game.save()};
init();
