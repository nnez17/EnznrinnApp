import { Platform } from 'react-native';
import Constants from 'expo-constants';

let Updates: any = {
  isEnabled: false,
  checkForUpdateAsync: async () => ({ isAvailable: false }),
  fetchUpdateAsync: async () => {},
  reloadAsync: async () => {},
};

if (Platform.OS !== 'web') {
  try {
    const expoUpdates = require('expo-updates');
    Updates = expoUpdates;
  } catch (e) {
    console.log('expo-updates not available:', e);
  }
}

export interface UpdateInfo {
  isAvailable: boolean;
  manifest?: any;
}

export async function checkUpdate(): Promise<UpdateInfo> {
  if (!Updates.isEnabled) {
    return { isAvailable: false };
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    return {
      isAvailable: update.isAvailable,
      manifest: update.manifest ?? undefined,
    };
  } catch (e) {
    console.error('Check update failed:', e);
    throw e;
  }
}

export async function downloadUpdate(): Promise<void> {
  if (!Updates.isEnabled) {
    throw new Error('expo-updates is not enabled');
  }

  try {
    await Updates.fetchUpdateAsync();
  } catch (e) {
    console.error('Download update failed:', e);
    throw e;
  }
}

export async function reloadApp(): Promise<void> {
  try {
    await Updates.reloadAsync();
  } catch (e) {
    console.error('Reload failed:', e);
    throw e;
  }
}

export function getCurrentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

export function isUpdateSupported(): boolean {
  return Updates.isEnabled && !__DEV__;
}
