/** One mathematical model shared by the blueprint, world geometry and validator. */
export function valueAt(model, x) {
  return model.a * x * x + model.b * x + model.c;
}
export function vertex(model) {
  if (!Number.isFinite(model.a) || model.a === 0) throw new Error('Not a quadratic');
  const x = -model.b / (2 * model.a);
  return { x, y: valueAt(model, x) };
}
export function roots(model) {
  if (!Number.isFinite(model.a) || model.a === 0) throw new Error('Not a quadratic');
  const d = model.b * model.b - 4 * model.a * model.c;
  if (d < 0) return [];
  return [(-model.b - Math.sqrt(d)) / (2 * model.a), (-model.b + Math.sqrt(d)) / (2 * model.a)].map(n => Object.is(n,-0) ? 0 : n).sort((a,b) => a-b);
}
export function designModel(span, k) {
  return { a: -k, b: k * span, c: 0, domain: [0, span] };
}
export function formatQuadratic(model) {
  const terms=[];
  for(const [i,power] of ['x²','x',''].entries()){
    const coefficient=[model.a,model.b,model.c][i];
    if(!coefficient)continue;
    const magnitude=power&&Math.abs(coefficient)===1?'':Math.abs(coefficient);
    const sign=terms.length?(coefficient<0?'− ':'+ '):(coefficient<0?'−':'');
    terms.push(`${sign}${magnitude}${power}`);
  }
  return terms.join(' ');
}
export function parseNumber(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const text = raw.trim();
  const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  if (decimal.test(text)) { const n = Number(text); return Number.isFinite(n) ? n : null; }
  const parts = text.split('/').map(p => p.trim());
  if (parts.length === 2 && parts.every(p => decimal.test(p))) {
    const denominator = Number(parts[1]), result = Number(parts[0]) / denominator;
    if (denominator !== 0 && Number.isFinite(result)) return result;
  }
  return null;
}
const near = (a,b) => Math.abs(a-b) <= 0.025;
export function validate(challenge, answer) {
  const fields = challenge.kind === 'design' ? ['span','k'] : challenge.kind === 'roots' ? ['first','second'] : ['x','y'];
  const values = fields.map(key => parseNumber(answer?.[key]));
  if (values.some(n => n === null)) return { correct: false, reason: 'invalid' };
  if (challenge.kind === 'roots') {
    const expected = roots(challenge.model), actual = values.sort((a,b) => a-b);
    return { correct: expected.length === 2 && actual.every((n,i) => near(n,expected[i])), reason: 'roots' };
  }
  if (challenge.kind === 'vertex') {
    const expected = vertex(challenge.model);
    return { correct: near(values[0], expected.x) && near(values[1], expected.y), reason: 'vertex' };
  }
  const [span,k] = values;
  if (span < 4 || span > 10 || k < .25 || k > 1.5) return { correct: false, reason: 'invalid' };
  const height = vertex(designModel(span,k)).y;
  return { correct: near(span, challenge.target.span) && near(height, challenge.target.height), reason: 'design' };
}
