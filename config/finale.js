const bi=(en,ms)=>({en,ms});
export const FINAL_WORLD={
  id:'finale',chapter:null,path:'data/mathematics/f4/finale.json',
  name:bi('Sunshine Supply Run','Misi Bekalan Sunshine'),
  lesson:bi('One expedition. Five chapters. Your choices carry forward.','Satu ekspedisi. Lima bab. Pilihan anda dibawa ke langkah seterusnya.'),
  intro:bi('Bring supplies to camp. Build the bridge, mark a safe route, program the cart, check the signal and balance the remaining budget.','Hantar bekalan ke kem. Bina jambatan, tandakan laluan selamat, atur troli, semak isyarat dan imbangkan baki belanjawan.'),
  badge:bi('Sunshine Strategist','Perancang Sunshine'),
  stations:{bridge:650,route:1470,delivery:2310,risk:3100,guardian:3700},
  gates:[['bridge',1100],['route',2090],['delivery',2960],['risk',3440]],
  strings:{
    course:bi('FORM 4 · FINAL EXPEDITION','TINGKATAN 4 · EKSPEDISI AKHIR'),chapter:bi('CHAPTERS 1 · 6 · 7 · 9 · 10','BAB 1 · 6 · 7 · 9 · 10'),
    bridge:bi('Build the bridge','Bina jambatan'),route:bi('Choose the route','Pilih laluan'),delivery:bi('Program the cart','Atur troli'),risk:bi('Check the signal','Semak isyarat'),guardian:bi('Deliver to camp','Hantar ke kem'),
    objectiveBridge:bi('Build the 8 m arch. Its cost enters your expedition budget.','Bina lengkung 8 m. Kosnya dimasukkan dalam belanjawan ekspedisi.'),
    objectiveRoute:bi('Choose a safe point. Your coordinates set the route cost, distance and signal tokens.','Pilih titik selamat. Koordinat anda menetapkan kos laluan, jarak dan token isyarat.'),
    objectiveDelivery:bi('Reach the distance set by your route in 10 seconds. Your speed plan determines the delivery fee.','Capai jarak yang ditetapkan oleh laluan dalam 10 saat. Pelan laju menentukan caj penghantaran.'),
    objectiveRisk:bi('Use the tokens issued by your route. Check the two-draw signal probability.','Gunakan token daripada laluan anda. Semak kebarangkalian isyarat dua cabutan.'),
    objectiveGuardian:bi('Use the remaining budget to meet camp needs and protect savings.','Gunakan baki belanjawan untuk memenuhi keperluan kem dan menjaga simpanan.'),
    objectiveDone:bi('The supplies arrived. Review your connected plan and learning evidence.','Bekalan telah tiba. Semak pelan berkaitan dan bukti pembelajaran anda.'),
    questLead:bi('Five connected decisions bring the expedition’s supplies to camp.','Lima keputusan berkaitan membawa bekalan ekspedisi ke kem.'),
    guardianLabel:bi('FINAL DELIVERY','PENGHANTARAN AKHIR'),
    finishedTitle:bi('The supplies made it.','Bekalan telah tiba.'),
    finishedText:bi('Your bridge, route, speed plan, signal and budget worked together. The camp is ready.','Jambatan, laluan, pelan laju, isyarat dan belanjawan anda berfungsi bersama. Kem sudah sedia.'),
    reset:bi('Restart this final mission','Mulakan semula misi akhir'),
    resetPrompt:bi('Restart the final mission? Your five chapter routes keep their progress.','Mulakan semula misi akhir? Lima laluan bab anda mengekalkan kemajuan.'),
    trailGuardian:bi('Supply camp','Kem bekalan')
  }
};
