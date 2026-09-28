import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version;
const dist = join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const artifact of [
  { source: 'theme', directory: 'Morrow', files: ['manifest.json', 'theme.css'], name: `morrow-theme-v${version}.zip` },
  { source: 'plugin', directory: 'morrow-controls', files: ['manifest.json', 'main.js', 'styles.css'], name: `morrow-plugin-v${version}.zip` },
]) {
  const stage = join(dist, artifact.directory);
  await mkdir(stage);
  for (const file of artifact.files) await copyFile(join(root, artifact.source, file), join(stage, file));
  execFileSync('zip', ['-q', '-r', artifact.name, artifact.directory], { cwd: dist });
  await rm(stage, { recursive: true, force: true });
  console.log(join(dist, artifact.name));
}
