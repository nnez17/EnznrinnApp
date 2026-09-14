import React, { createContext, useContext, ReactNode } from 'react';
import { useOTAUpdate } from '@/hooks/useOTAUpdate';
import UpdateDialog from './UpdateDialog';
import UpdateProgress from './UpdateProgress';

interface OTAContextValue {
  checking: boolean;
  downloading: boolean;
  downloadProgress: number;
  updateAvailable: boolean;
  error: string | null;
  currentVersion: string;
  newVersion: string | null;
  nativeApk: boolean;
  checkUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  reloadApp: () => Promise<void>;
  dismissUpdate: () => void;
}

const OTAContext = createContext<OTAContextValue | null>(null);

export function useOTA(): OTAContextValue {
  const ctx = useContext(OTAContext);
  if (!ctx) throw new Error('useOTA must be used within OTAProvider');
  return ctx;
}

export default function OTAProvider({ children }: { children: ReactNode }) {
  const ota = useOTAUpdate();

  return (
    <OTAContext.Provider value={ota}>
      {children}
      <UpdateProgress visible={ota.downloading} progress={ota.downloadProgress} />
      <UpdateDialog
        visible={ota.updateAvailable && !ota.downloading}
        newVersion={ota.newVersion}
        nativeApk={ota.nativeApk}
        onRestart={ota.reloadApp}
        onLater={ota.dismissUpdate}
      />
    </OTAContext.Provider>
  );
}
