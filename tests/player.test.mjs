import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanPlayerName,loadPlayerName,savePlayerName} from '../src/storage/player-profile.js';
import {decodeSave} from '../src/storage/save-store.js';
test('names support Unicode, stay bounded, remove controls and tolerate unavailable storage',()=>{
  assert.equal(cleanPlayerName('  小明   Ali  '),'小明 Ali');
  assert.equal(cleanPlayerName('\u200b\u202e\n'), '');
  assert.equal(Array.from(cleanPlayerName('🌳'.repeat(30))).length,24);
  assert.equal(cleanPlayerName({}), '');
  const unavailable={getItem(){throw Error();},setItem(){throw Error();}};
  assert.equal(loadPlayerName(unavailable),'');assert.equal(savePlayerName(unavailable,'Ali'),false);
  const memory={getItem(){return this.name;},setItem(k,v){this.name=v;}};
  assert.equal(savePlayerName(memory,'  星星  '),true);assert.equal(loadPlayerName(memory),'星星');
});
test('name roundtrips with progress and old saves keep evidence without inventing a name',()=>{
  const old={schemaVersion:1,contentVersion:1,quest:{completed:[],sessions:{roots:{draft:{first:0},hints:1,attempts:2}}}};
  const migrated=decodeSave(old);assert.equal(migrated.playerName,'');assert.deepEqual(migrated.regions.quadratics.quest,old.quest);
  assert.equal(decodeSave({...migrated,playerName:'  陈同学  '}).playerName,'陈同学');
});
