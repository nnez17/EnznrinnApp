import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CycleData } from '@/types';
import { cycleApi } from '@/api/cycle';

interface CycleContextValue {
  cycleData: CycleData | null;
  loading: boolean;
  setCycleData: (data: CycleData) => Promise<void>;
  resetCycle: () => Promise<void>;
}

const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: ReactNode }) {
  const [cycleData, setCycleDataState] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cycleApi.get()
      .then(data => setCycleDataState(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setCycleData = useCallback(async (data: CycleData) => {
    setCycleDataState(data);
    await cycleApi.save(data);
  }, []);

  const resetCycle = useCallback(async () => {
    setCycleDataState(null);
  }, []);

  return (
    <CycleContext.Provider value={{ cycleData, loading, setCycleData, resetCycle }}>
      {children}
    </CycleContext.Provider>
  );
}

export function useCycle(): CycleContextValue {
  const ctx = useContext(CycleContext);
  if (!ctx) throw new Error('useCycle must be used within CycleProvider');
  return ctx;
}
