// Authored base tasks and their additional practice sets share the same templates.
import {writeFile} from 'node:fs/promises';
import {baseBanks} from './curriculum-templates.mjs';
import {buildVariants} from './build-variants.mjs';
import {buildLevels} from './build-levels.mjs';
for(const [chapter,id,challenges] of baseBanks){
  const data={id:`f4-maths-${id}`,version:1,form:4,subject:'Mathematics',chapter,reviewStatus:'prototype-awaiting-teacher-review',alignmentSource:'KSSM Mathematics Form 4 and 5 DSKP (2018)',challenges};
  await writeFile(new URL(`../data/mathematics/f4/bab${String(chapter).padStart(2,'0')}.json`,import.meta.url),JSON.stringify(data,null,2)+'\n');
}
await buildVariants();
await buildLevels();
console.log('Wrote four base chapters and all five chapters’ additional practice sets.');
