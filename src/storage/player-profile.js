export const PLAYER_PROFILE_KEY='mathwithcye-player-name';
export function cleanPlayerName(value){
  return typeof value==='string'?Array.from(value.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'').replace(/\s+/gu,' ').trim()).slice(0,24).join(''):'';
}
export function loadPlayerName(storage){try{return cleanPlayerName(storage.getItem(PLAYER_PROFILE_KEY));}catch{return '';}}
export function savePlayerName(storage,name){try{storage.setItem(PLAYER_PROFILE_KEY,cleanPlayerName(name));return true;}catch{return false;}}
