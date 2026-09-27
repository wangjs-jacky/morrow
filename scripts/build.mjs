import { build } from 'esbuild';

const target = process.argv[2] ?? 'all';
if (target !== 'demo' && target !== 'all') throw new Error(`Unknown build target: ${target}`);

await build({
  entryPoints: ['src/demo.ts'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome114'],
  outfile: 'demo/app.js',
  logLevel: 'info',
});

if (target === 'all') {
  await build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: ['chrome114'],
    external: ['obsidian', 'electron'],
    outfile: 'plugin/main.js',
    logLevel: 'info',
  });
}
