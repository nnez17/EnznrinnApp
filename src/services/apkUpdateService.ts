import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';

// Native (APK) update channel — GitHub Actions publishes a preview release whose
// assets we read here, no Expo/EAS portal needed on the user's phone.
const REPO = 'nnez17/SavingsApp';

export interface ApkRelease {
  version: string;
  url: string;
  notes: string;
}

// Latest published release (list endpoint also includes prereleases —
// /releases/latest skips them and this action's releases are --prerelease).
export async function checkApkUpdate(): Promise<ApkRelease | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=1`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const [rel] = await res.json();
    if (!rel) return null;
    const asset = (rel.assets ?? []).find((a: any) => a.name?.endsWith('.apk'));
    if (!asset?.browser_download_url) return null;

    const latest: string = String(rel.tag_name ?? '').replace(/^v/, '');
    const current = Application.nativeApplicationVersion ?? '0.0.0';
    if (!latest || !isNewer(latest, current)) return null;

    return { version: latest, url: asset.browser_download_url, notes: rel.body ?? '' };
  } catch {
    return null;
  }
}

// Downloads the APK to cache dir and fires the system installer intent.
export async function downloadAndInstall(url: string): Promise<void> {
  const dest = new File(Paths.cache, 'update.apk');
  if (dest.exists) dest.delete();
  await File.downloadFileAsync(url, dest);
  // ACTION_VIEW + a content://-capable URI; Android prompts "install unknown app".
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: dest.uri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
  });
}

// version compare: 2.1.0 > 2.0.9; handles unequal lengths and prerelease-free tags.
export function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}
