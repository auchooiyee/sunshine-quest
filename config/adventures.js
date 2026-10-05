const bi=(en,ms)=>({en,ms});
const route=(id,stations,gates,platforms,colors,glyph,npc,mission,brief,guardian,relic,restored)=>({
  id,stations,gates,platforms:platforms.map(([x,y,w])=>({x,y,w})),bench:stations.vertex,
  colors,glyph,npc,mission,brief,guardian,relic,restored,
});
/** Route positions are world pixels. Mathematical quantities retain their own units. */
export const ADVENTURES={
  quadratics:route('quadratics',{roots:650,vertex:1470,design:2310,guardian:3700},[['roots',1100],['vertex',2090],['design',2960]],[[1800,390,180],[2600,390,160]],
    ['#d8e8cb','#78977a','#244f40','#d8bb75'],'⌒',bi('Aina · bridge keeper','Aina · penjaga jambatan'),bi('Reconnect the river crossing','Sambungkan semula lintasan sungai'),
    bi('The supply route stops at the river. Mark the anchors, raise a clearance beacon and build an arch. The Archkeeper will ask for a new design before opening the last crossing.','Laluan bekalan terhenti di sungai. Tandakan tambatan, letakkan suar ketinggian dan bina lengkung. Penjaga Lengkung meminta reka bentuk baharu sebelum membuka lintasan terakhir.'),
    bi('Archkeeper','Penjaga Lengkung'),bi('River crest','Lencana sungai'),bi('Two crossings reconnect the supply trail. Your final arch keeps its own span and height.','Dua lintasan menyambungkan laluan bekalan. Lengkung akhir mengekalkan rentang dan ketinggiannya sendiri.')),
  inequalities:route('inequalities',{roots:560,vertex:1330,design:2200,guardian:3540},[['roots',940],['vertex',1790],['design',2820]],[[1030,440,160],[1530,388,170],[2450,425,150]],
    ['#eee0cb','#b89679','#694d46','#f1cd86'],'≤',bi('Ravi · trail surveyor','Ravi · juruukur laluan'),bi('Mark a safe canyon route','Tandakan laluan ngarai yang selamat'),
    bi('Every landing must respect every boundary. Your chosen coordinates place real stepping platforms. The Boundary Sentinel changes the restrictions at each checkpoint; inspect the new graph.','Setiap pendaratan mesti mematuhi semua sempadan. Koordinat pilihan anda meletakkan pelantar pijakan. Penjaga Sempadan mengubah syarat di setiap semakan; periksa graf baharu.'),
    bi('Boundary Sentinel','Penjaga Sempadan'),bi('Survey compass','Kompas ukur'),bi('Your validated coordinates now mark the canyon route, including the changed Guardian boundaries.','Koordinat yang disahkan menandakan laluan ngarai, termasuk sempadan Penjaga yang berubah.')),
  motion:route('motion',{roots:720,vertex:1600,design:2440,guardian:3620},[['roots',1160],['vertex',2070],['design',3070]],[[1220,450,240],[1980,410,180],[3180,450,200]],
    ['#dae8e7','#88a6a6','#304e5a','#e2bd67'],'→',bi('Mei · transport planner','Mei · perancang pengangkutan'),bi('Restart the delivery line','Mulakan semula laluan penghantaran'),
    bi('Read the journey before programming the cart. Your accepted speed plan drives a moving platform with a synchronized journey display. The Transit Keeper gives the final delivery a different distance and duration.','Baca perjalanan sebelum mengatur troli. Pelan laju yang diterima menggerakkan pelantar dengan paparan perjalanan segerak. Penjaga Transit memberikan jarak dan tempoh baharu untuk penghantaran akhir.'),
    bi('Transit Keeper','Penjaga Transit'),bi('Transit wheel','Roda transit'),bi('Both delivery plans are ready. Watch the carts follow their own time and speed settings.','Kedua-dua pelan penghantaran sedia. Lihat troli mengikut tetapan masa dan lajunya sendiri.')),
  probability:route('probability',{roots:540,vertex:1260,design:2110,guardian:3460},[['roots',920],['vertex',1740],['design',2750]],[[1020,445,170],[1550,405,160],[2910,440,190]],
    ['#dbe8ed','#81a9bc','#334e70','#dfc48d'],'P',bi('Farah · signal keeper','Farah · penjaga isyarat'),bi('Calibrate the lake signals','Tentukur isyarat tasik'),
    bi('Signal branches depend on what remains in the bag. Compare replacement rules, then build the crystal bag. The Signal Oracle changes the event and bag; calculations, rather than a random draw, power the beacons.','Cabang isyarat bergantung pada baki dalam beg. Bandingkan peraturan pengembalian, kemudian bina beg kristal. Penjaga Isyarat mengubah peristiwa dan beg; pengiraan menghidupkan suar tanpa cabutan rawak.'),
    bi('Signal Oracle','Penjaga Isyarat'),bi('Signal prism','Prisma isyarat'),bi('The lake beacons show your bag contents and verified branch probabilities.','Suar tasik menunjukkan kandungan beg dan kebarangkalian cabang yang disahkan.')),
  finance:route('finance',{roots:610,vertex:1400,design:2260,guardian:3580},[['roots',990],['vertex',1860],['design',2860]],[[1120,440,210],[1720,400,180],[3020,435,200]],
    ['#f0e6ca','#b6a776','#565539','#e8b861'],'RM',bi('Daniel · camp steward','Daniel · pengurus kem'),bi('Prepare the supply camp','Sediakan kem bekalan'),
    bi('Start with a savings goal, then balance income and expenses. Your purchases stock the camp and light its lamps. The Quartermaster changes the budget and minimum supplies for the final expedition.','Mulakan dengan sasaran simpanan, kemudian imbangkan pendapatan dan perbelanjaan. Pembelian anda mengisi bekalan dan menyalakan lampu kem. Pengurus Bekalan mengubah belanjawan dan keperluan minimum untuk ekspedisi akhir.'),
    bi('Quartermaster','Pengurus Bekalan'),bi('Camp lantern','Tanglung kem'),bi('The camp holds the supplies you selected, with savings and unspent money recorded separately.','Kem menyimpan bekalan pilihan anda, dengan simpanan dan wang belum dibelanjakan direkodkan berasingan.')),
};
export const adventureFor=id=>ADVENTURES[id]||null;
