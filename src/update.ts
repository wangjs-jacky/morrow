export interface UpdateOffer {
  version: string;
  command: string;
}

export interface UpdateActions {
  check(): Promise<UpdateOffer | null>;
  copy(command: string): Promise<void>;
}

const RELEASE_URL = 'https://api.github.com/repos/wangjs-jacky/morrow/releases/latest';

function versionParts(value: string, prefix = ''): number[] | null {
  const match = value.match(new RegExp(`^${prefix}(\\d+)\\.(\\d+)\\.(\\d+)$`));
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}

function isNewerVersion(latest: number[], current: number[]): boolean {
  for (let index = 0; index < 3; index++) {
    if (latest[index] !== current[index]) return latest[index] > current[index];
  }
  return false;
}

export async function checkLatestRelease(currentVersion: string, fetcher: typeof fetch = fetch): Promise<UpdateOffer | null> {
  const current = versionParts(currentVersion);
  if (!current) return null;

  const response = await fetcher(RELEASE_URL, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;

  const release: unknown = await response.json();
  if (!release || typeof release !== 'object') return null;
  const { tag_name: tag, assets } = release as { tag_name?: unknown; assets?: unknown };
  if (typeof tag !== 'string' || !Array.isArray(assets)) return null;
  const latest = versionParts(tag, 'v');
  if (!latest) return null;
  if (!isNewerVersion(latest, current)) return null;

  const hasAsset = (name: string) => assets.some(asset => asset && typeof asset === 'object' && (asset as { name?: unknown }).name === name);
  if (!hasAsset(`morrow-plugin-${tag}.zip`) || !hasAsset(`morrow-theme-${tag}.zip`)) return null;

  return {
    version: tag.slice(1),
    command: `curl -fsSL https://raw.githubusercontent.com/wangjs-jacky/morrow/${tag}/scripts/install.sh | bash`,
  };
}
