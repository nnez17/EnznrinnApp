import { useCallback, useState, useEffect } from 'react';
import { Target } from '@/types';
import { storage } from '@/utils/storage';
import { generateId, toISOString, getDaysUntil } from '@/utils/dateUtils';

export const useTarget = () => {
  const [target, setTargetState] = useState<Target | null>(null);

  useEffect(() => {
    const load = async () => {
      const saved = await storage.getTarget();
      setTargetState(saved);
    };
    load();
  }, []);

  const setTarget = useCallback(async (targetAmount: number, deadline: string, currentBalance: number = 0): Promise<Target> => {
    const newTarget: Target = {
      id: generateId(),
      targetAmount,
      currentAmount: currentBalance,
      deadline,
      createdAt: toISOString(),
    };
    await storage.setTarget(newTarget);
    setTargetState(newTarget);
    return newTarget;
  }, []);

  const updateProgress = useCallback(async (currentAmount: number): Promise<Target | null> => {
    if (!target) return null;
    const updated = { ...target, currentAmount };
    await storage.setTarget(updated);
    setTargetState(updated);
    return updated;
  }, [target]);

  const clearTarget = useCallback(async () => {
    await storage.clearTarget();
    setTargetState(null);
  }, []);

  const getDaysLeft = useCallback((): number => {
    if (!target) return 0;
    return getDaysUntil(target.deadline);
  }, [target]);

  const getDailyNeeded = useCallback((currentBalance: number): number => {
    if (!target) return 0;
    const daysLeft = getDaysLeft();
    if (daysLeft <= 0) return 0;
    return Math.ceil(Math.max(target.targetAmount - currentBalance, 0) / daysLeft);
  }, [target, getDaysLeft]);

  const getProgressPercent = useCallback((currentBalance: number): number => {
    if (!target || target.targetAmount === 0) return 0;
    return Math.min(currentBalance / target.targetAmount, 1);
  }, [target]);

  const isCompleted = useCallback((currentBalance: number): boolean => {
    if (!target) return false;
    return currentBalance >= target.targetAmount;
  }, [target]);

  const isOverdue = useCallback((): boolean => {
    if (!target) return false;
    return getDaysLeft() < 0 && !isCompleted(0);
  }, [target, getDaysLeft, isCompleted]);

  return {
    target,
    setTarget,
    updateProgress,
    clearTarget,
    getDaysLeft,
    getDailyNeeded,
    getProgressPercent,
    isCompleted,
    isOverdue,
  };
};