import { parseNumber } from '../math/quadratics.js';
export const SCENARIO=Object.freeze({budget:360,bridgeRate:10,routeXRate:10,routeYRate:5,metresPerMarker:8,duration:10,secondSpeed:2,maxSpeed:16,speedFee:5,timeFee:2});
const bi=(en,ms)=>({en,ms});
const has=(history,id)=>history?.completed?.includes(id);
const value=(history,id,key,fallback)=>has(history,id)?parseNumber(history.sessions?.[id]?.draft?.[key])??fallback:fallback;
const cost=v=>Number(v.toFixed(6));

/** Only already validated, consecutive progress is passed here by createQuest. */
export function supplyManifest(history){
  const span=value(history,'bridge','span',8),x=value(history,'route','x',3),y=value(history,'route','y',3);
  const t1=value(history,'delivery','t1',4),v1=value(history,'delivery','v1',9);
  const bridgeCost=has(history,'bridge')?span*SCENARIO.bridgeRate:0;
  const routeCost=has(history,'route')?x*SCENARIO.routeXRate+y*SCENARIO.routeYRate:0;
  const deliveryCost=has(history,'delivery')?v1*SCENARIO.speedFee+t1*SCENARIO.timeFee:0;
  const available=cost(SCENARIO.budget-bridgeCost-routeCost-deliveryCost);
  const camp=history?.sessions?.budget?.draft;
  const supplies=has(history,'budget')?20*parseNumber(camp.food)+30*parseNumber(camp.medical)+15*parseNumber(camp.lamp):0;
  const savings=has(history,'budget')?parseNumber(camp.saving):0;
  return {initialBudget:SCENARIO.budget,span,x,y,t1,v1,bridgeCost:cost(bridgeCost),routeCost:cost(routeCost),deliveryCost:cost(deliveryCost),distance:SCENARIO.metresPerMarker*(x+y),available,supplies,savings,unallocated:cost(available-supplies-savings),stages:{bridge:has(history,'bridge')||false,route:has(history,'route')||false,delivery:has(history,'delivery')||false,risk:has(history,'risk')||false,budget:has(history,'budget')||false}};
}
export function resolveFinaleChallenge(def,history){
  const m=supplyManifest(history),resolved=JSON.parse(JSON.stringify(def));
  if(def.id==='route'){
    resolved.model.constraints[2].c=m.span;
    resolved.prompt=bi(`Your bridge spans ${m.span} m. Choose whole coordinates x ≥ 2, y ≥ 2, x + y ≤ ${m.span} and 2x + y ≤ 12. Route cost is RM(10x + 5y); delivery distance is 8(x + y) m. These coordinates also issue x red and y blue signal tokens.`,`Jambatan anda merentang ${m.span} m. Pilih koordinat integer x ≥ 2, y ≥ 2, x + y ≤ ${m.span} dan 2x + y ≤ 12. Kos laluan RM(10x + 5y); jarak penghantaran 8(x + y) m. Koordinat ini juga memberikan x token merah dan y token biru.`);
  }else if(def.id==='delivery'){
    resolved.target.distance=m.distance;
    const v1=m.distance/4-3;resolved.answer={t1:4,v1};
    resolved.prompt=bi(`Your route (${m.x}, ${m.y}) needs ${m.distance} m of travel. Reach exactly ${m.distance} m in 10 s; the second stage is at 2 m/s. Set first time t₁ and speed v₁. Delivery fee = RM(5v₁ + 2t₁). Use the whole-number slider settings.`,`Laluan (${m.x}, ${m.y}) memerlukan perjalanan ${m.distance} m. Capai tepat ${m.distance} m dalam 10 s; peringkat kedua pada 2 m/s. Tetapkan masa pertama t₁ dan laju v₁. Caj penghantaran = RM(5v₁ + 2t₁). Gunakan tetapan peluncur integer.`);
    resolved.hints={en:['Distance is the total area under the speed–time graph.',`Use v₁t₁ + 2(10 − t₁) = ${m.distance}.`,`One plan is t₁ = 4 and v₁ = ${v1}. Different exact plans can have different fees.`],ms:['Jarak ialah jumlah luas di bawah graf laju–masa.',`Gunakan v₁t₁ + 2(10 − t₁) = ${m.distance}.`,`Satu pelan ialah t₁ = 4 dan v₁ = ${v1}. Pelan tepat berbeza boleh mempunyai caj berbeza.`]};
  }else if(def.id==='risk'){
    const total=m.x+m.y;resolved.model.red=m.x;resolved.model.blue=m.y;
    resolved.answer={conditional:m.y/(total-1),combined:m.x/total*m.y/(total-1)};
    resolved.prompt=bi(`Your route issued ${m.x} red and ${m.y} blue tokens. Draw two without replacement. After the first is red, find P(second blue) and P(red then blue). A correct calculation calibrates the camp signal; no random draw decides success.`,`Laluan anda memberikan ${m.x} token merah dan ${m.y} biru. Cabut dua tanpa pengembalian. Selepas yang pertama merah, cari P(kedua biru) dan P(merah kemudian biru). Pengiraan betul menentukur isyarat kem; kejayaan tidak ditentukan oleh cabutan rawak.`);
    resolved.hints={en:['The first red token is removed before the second draw.',`After red, ${m.y} blue remain among ${total-1} tokens.`,`Second blue: ${m.y}/${total-1}. Multiply by ${m.x}/${total} for red then blue.`],ms:['Token merah pertama dikeluarkan sebelum cabutan kedua.',`Selepas merah, ${m.y} token biru kekal daripada ${total-1} token.`,`Kedua biru: ${m.y}/${total-1}. Darab dengan ${m.x}/${total} untuk merah kemudian biru.`]};
    resolved.explanation=bi(`P(second blue | first red) = ${m.y}/${total-1}; P(red then blue) = ${m.x}/${total} × ${m.y}/${total-1}. The signal is calibrated.`,`P(kedua biru | pertama merah) = ${m.y}/${total-1}; P(merah kemudian biru) = ${m.x}/${total} × ${m.y}/${total-1}. Isyarat ditentukur.`);
  }else if(def.id==='budget'){
    resolved.model.budget=m.available;resolved.fields.find(f=>f.key==='saving').max=Math.floor(m.available/5)*5;
    resolved.answer={food:2,medical:1,lamp:1,saving:Math.floor((m.available-85)/5)*5};
    resolved.prompt=bi(`RM360 start − RM${m.bridgeCost} bridge − RM${m.routeCost} route − RM${m.deliveryCost} delivery = RM${m.available} available. Buy at least 2 food packs (RM20 each), 1 medical kit (RM30) and 1 lamp (RM15), and save at least RM30. Supplies + savings must fit this remaining budget.`,`RM360 awal − RM${m.bridgeCost} jambatan − RM${m.routeCost} laluan − RM${m.deliveryCost} penghantaran = baki RM${m.available}. Beli sekurang-kurangnya 2 pek makanan (RM20 setiap satu), 1 kit perubatan (RM30) dan 1 lampu (RM15), serta simpan sekurang-kurangnya RM30. Bekalan + simpanan mesti dalam baki belanjawan ini.`);
    resolved.hints={en:['Use the remaining budget, after the three expedition charges.',`Essential supplies cost RM85. Reserve at least RM30 for savings; total must not exceed RM${m.available}.`,`One feasible plan is 2 food packs, 1 medical kit, 1 lamp and RM${resolved.answer.saving} savings.`],ms:['Gunakan baki belanjawan selepas tiga caj ekspedisi.',`Bekalan asas berharga RM85. Simpan sekurang-kurangnya RM30; jumlah tidak boleh melebihi RM${m.available}.`,`Satu pelan sah ialah 2 pek makanan, 1 kit perubatan, 1 lampu dan simpanan RM${resolved.answer.saving}.`]};
  }
  return resolved;
}
/** A single connected example is used for teacher preview, never the player's answer. */
export function finaleExample(curriculum){
  const history={completed:[],sessions:{}};
  return curriculum.challenges.map(def=>{const resolved=resolveFinaleChallenge(def,history);history.sessions[def.id]={draft:resolved.answer};history.completed.push(def.id);return resolved;});
}
export const isFinaleUnlocked=quests=>quests.length===5&&quests.every(q=>q.complete===true);
