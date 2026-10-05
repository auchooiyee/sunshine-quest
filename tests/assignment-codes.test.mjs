import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeAssignment,decodeAssignment,assignmentKey} from '../src/missions/assignment.js';
const worlds=['quadratics','inequalities','motion','probability','finance','finale'];
function configs(){
  const values=[];
  for(const world of worlds)for(const variant of world==='finale'?[0]:[0,1,2])for(const tasks of world==='finale'?[5]:[3,6])for(const assist of [false,true])for(const guided of [false,true])for(const language of ['en','ms'])values.push({v:1,world,tasks,assist,guided,language,...(variant?{variant}:{})});
  return values;
}
const legacy=config=>btoa(JSON.stringify(config)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
test('all 248 teacher configurations have distinct six-digit codes and round-trip exactly',()=>{
  const codes=new Set();
  for(const config of configs()){
    const code=encodeAssignment(config);assert.match(code,/^[1-9]\d{5}$/);
    assert.deepEqual(decodeAssignment(code),config);assert.equal(codes.has(code),false);codes.add(code);
  }
  assert.equal(codes.size,248);
});
test('six-digit checksum rejects single digit mistakes, adjacent transpositions and unsupported values',()=>{
  for(const config of configs()){
    const code=encodeAssignment(config);
    for(let i=0;i<6;i++)for(let digit=0;digit<10;digit++)if(String(digit)!==code[i])assert.equal(decodeAssignment(code.slice(0,i)+digit+code.slice(i+1)),null);
    for(let i=0;i<5;i++)if(code[i]!==code[i+1])assert.equal(decodeAssignment(code.slice(0,i)+code[i+1]+code[i]+code.slice(i+2)),null);
  }
  for(const value of ['12345','1234567','000001','100001','124871','1000 69','+100069'])assert.equal(decodeAssignment(value),null);
});
test('legacy links and original classroom storage keys remain compatible with short codes',()=>{
  for(const config of configs()){
    const old=legacy(config),short=encodeAssignment(config);
    assert.deepEqual(decodeAssignment(old),config);
    assert.equal(assignmentKey(decodeAssignment(short)),'mathwithcye-class-'+old);
    assert.equal(assignmentKey(decodeAssignment(old)),assignmentKey(config));
  }
});
