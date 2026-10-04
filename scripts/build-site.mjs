import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') {
  throw new Error('Build output must be the game/dist directory');
}
const publicEntries = [
  'index.html', 'app.js', 'engine.js', 'balance.js', 'style.css', 'quest.css',
  '_headers', 'assets', 'config', 'data', 'locales', 'src',
];
// Publish only runtime files; development scripts, reports and credentials stay out.
for (const entry of publicEntries) await stat(path.join(root, entry));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of publicEntries) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
async function countFiles(directory) {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    count += entry.isDirectory() ? await countFiles(path.join(directory, entry.name)) : 1;
  }
  return count;
}
console.log(`Built ${await countFiles(output)} public files in dist/`);
