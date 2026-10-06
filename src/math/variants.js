export const ORIGINAL_VARIANT = 'original-v1';
export function selectDifficulty(data,level='standard'){
  if(level==='standard')return data;
  const pack=data.levels?.[level];
  if(!pack)throw new Error('Unavailable task group');
  const {levels,variants,variantId,variantIndex,...base}=data;
  return {...base,...pack,difficulty:level};
}

export function variantOptions(data) {
  return [{id:data.variantBaseId||ORIGINAL_VARIANT,index:0}, ...(data.variants || []).map((pack,i)=>({id:pack.id,index:i+1}))];
}

/** Selected curricula keep their identity when a class mission is shortened. */
export function selectVariant(data, index = 0) {
  if (data.variantId) return data;
  if (!Number.isInteger(index) || index < 0 || index > (data.variants?.length || 0)) throw new Error('Unknown question set');
  const {variants, ...base} = data;
  return {...base, variantId:index ? variants[index-1].id : data.variantBaseId||ORIGINAL_VARIANT, variantIndex:index,
    challenges:index ? variants[index-1].challenges : data.challenges};
}

export function restoreVariant(data, saved) {
  if (data.variantId) return data;
  const option=variantOptions(data).find(pack=>pack.id===(saved?.variantId || ORIGINAL_VARIANT));
  return selectVariant(data,option?.index || 0);
}
