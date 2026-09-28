import test from 'node:test';
import assert from 'node:assert/strict';
import { checkLatestRelease } from '../src/update.ts';

const release = tag => ({
  tag_name: tag,
  assets: [
    { name: `morrow-theme-${tag}.zip` },
    { name: `morrow-plugin-${tag}.zip` },
  ],
});
const response = payload => async () => ({ ok: true, json: async () => payload });

test('only a newer complete paired release offers a version-pinned installer', async () => {
  const offer = await checkLatestRelease('0.3.3', response(release('v0.3.4')));
  assert.deepEqual(offer, {
    version: '0.3.4',
    command: 'curl -fsSL https://raw.githubusercontent.com/wangjs-jacky/morrow/v0.3.4/scripts/install.sh | bash',
  });
  assert.equal(await checkLatestRelease('0.3.4', response(release('v0.3.4'))), null);
  assert.equal(await checkLatestRelease('0.4.0', response(release('v0.3.4'))), null);
});

test('incomplete or malformed releases cannot supply a terminal command', async () => {
  assert.equal(await checkLatestRelease('0.3.3', response({ tag_name: 'v0.3.4; touch /tmp/no', assets: [] })), null);
  assert.equal(await checkLatestRelease('0.3.3', response({ tag_name: 'v0.3.4', assets: [{ name: 'morrow-plugin-v0.3.4.zip' }] })), null);
});
