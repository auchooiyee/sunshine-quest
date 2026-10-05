import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchJSON, settleLoads } from '../src/loading.js';

test('a stalled JSON fetch aborts at its deadline and releases the retry path', async t => {
  let signal;
  t.mock.method(globalThis, 'fetch', (_url, options) => new Promise((_resolve, reject) => {
    signal = options.signal;
    signal.addEventListener('abort', () => reject(new Error('timed out')), { once: true });
  }));
  await assert.rejects(fetchJSON('/lesson.json', 10), /timed out/);
  assert.equal(signal.aborted, true);
});

test('retry is not offered until sibling requests settle after one request fails', async () => {
  let finish, settled = false;
  const sibling = new Promise(resolve => { finish = resolve; });
  const attempt = settleLoads([Promise.reject(new Error('failed image')), sibling]);
  const outcome = attempt.catch(error => { settled = true; return error; });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(settled, false);
  finish('ready');
  assert.match((await outcome).message, /failed image/);
});
