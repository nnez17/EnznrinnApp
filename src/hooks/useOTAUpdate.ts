import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  checkUpdate,
  downloadUpdate,
  reloadApp,
  getCurrentVersion,
  isUpdateSupported,
} from '@/services/updateService';
import { checkApkUpdate, downloadAndInstall, ApkRelease } from '@/services/apkUpdateService';

interface OTAUpdateState {
  checking: boolean;
  downloading: boolean;
  downloadProgress: number;
  updateAvailable: boolean;
  error: string | null;
  currentVersion: string;
  newVersion: string | null;
  nativeApk: boolean;
}

const POLL_INTERVAL = 30 * 60 * 1000;

export function useOTAUpdate() {
  const [state, setState] = useState<OTAUpdateState>({
    checking: false,
    downloading: false,
    downloadProgress: 0,
    updateAvailable: false,
    error: null,
    currentVersion: getCurrentVersion(),
    newVersion: null,
    nativeApk: false,
  });

  const apkRef = useRef<ApkRelease | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const performCheck = useCallback(async () => {
    // JS-only update via expo-updates when configured, otherwise GitHub release APK.
    if (isUpdateSupported()) {
      setState(prev => ({ ...prev, checking: true, error: null }));
      try {
        const result = await checkUpdate();
        if (!mountedRef.current) return;
        setState(prev => ({ ...prev, checking: false, updateAvailable: result.isAvailable, nativeApk: false }));
        return;
      } catch (e) {
        if (!mountedRef.current) return;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setState(prev => ({ ...prev, checking: false, error: msg }));
        console.error('OTA check failed:', msg);
      }
    }

    setState(prev => ({ ...prev, checking: true, error: null }));
    try {
      const rel = await checkApkUpdate();
      if (!mountedRef.current) return;
      apkRef.current = rel;
      setState(prev => ({
        ...prev,
        checking: false,
        updateAvailable: !!rel,
        newVersion: rel?.version ?? null,
        nativeApk: !!rel,
      }));
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setState(prev => ({ ...prev, checking: false, error: msg }));
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(performCheck, POLL_INTERVAL);
  }, [performCheck, stopPolling]);

  useEffect(() => {
    // Defer initial check: performCheck() setState-synchronously, which in an
    // effect body triggers cascading renders (react-hooks/set-state-in-effect).
    const t = setTimeout(() => {
      performCheck();
      startPolling();
    }, 0);

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        performCheck();
      }
      appStateRef.current = nextState;
    });

    return () => {
      clearTimeout(t);
      subscription.remove();
      stopPolling();
    };
  }, [performCheck, startPolling, stopPolling]);

  const downloadUpdateHandler = useCallback(async () => {
    if (!state.updateAvailable) return;
    setState(prev => ({ ...prev, downloading: true, downloadProgress: 0, error: null }));
    try {
      if (state.nativeApk && apkRef.current) {
        // APK: download + installer intent happen inside downloadAndInstall.
        await downloadAndInstall(apkRef.current.url);
        if (!mountedRef.current) return;
        setState(prev => ({ ...prev, downloading: false, downloadProgress: 1, updateAvailable: false }));
      } else {
        await downloadUpdate();
        if (!mountedRef.current) return;
        setState(prev => ({ ...prev, downloading: false, downloadProgress: 1 }));
      }
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : 'Download failed';
      setState(prev => ({ ...prev, downloading: false, error: msg }));
      console.error('Update download failed:', msg);
    }
  }, [state.updateAvailable, state.nativeApk]);

  const reloadHandler = useCallback(async () => {
    // APK path opens the system installer — no in-app reload.
    if (state.nativeApk) {
      await downloadUpdateHandler();
      return;
    }
    try {
      await reloadApp();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Reload failed';
      setState(prev => ({ ...prev, error: msg }));
      console.error('OTA reload failed:', msg);
    }
  }, [state.nativeApk, downloadUpdateHandler]);

  const dismissUpdate = useCallback(() => {
    setState(prev => ({ ...prev, updateAvailable: false }));
  }, []);

  return {
    ...state,
    checkUpdate: performCheck,
    downloadUpdate: downloadUpdateHandler,
    reloadApp: reloadHandler,
    dismissUpdate,
  };
}
