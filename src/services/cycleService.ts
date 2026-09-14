import {
  startOfDay, differenceInDays, addDays, format,
  getDaysInMonth, startOfMonth, getDay, parseISO,
} from 'date-fns';
import { CyclePhase, CycleData, CycleDay } from '@/types';
import { id } from 'date-fns/locale';

function daysFromLMP(date: Date, lastPeriodStart: string): number {
  const lmp = parseISO(lastPeriodStart);
  return differenceInDays(startOfDay(date), startOfDay(lmp));
}

export function getPhase(dayInCycle: number, periodDuration: number): CyclePhase {
  if (dayInCycle <= periodDuration) return 'menstruation';
  if (dayInCycle <= 12) return 'follicular';
  if (dayInCycle <= 14) return 'ovulation';
  return 'luteal';
}

export function getCycleStatus(data: CycleData): {
  daysUntil: number;
  nextPeriodDate: Date;
  isPeriodDay: boolean;
  phase: CyclePhase | null;
  dayInCycle: number;
  hasStarted: boolean;
} {
  const today = startOfDay(new Date());
  const lmp = parseISO(data.lastPeriodStart);
  const diff = daysFromLMP(today, data.lastPeriodStart);

  const hasStarted = diff >= 0;
  const dayInCycle = hasStarted ? (diff % data.cycleLength) + 1 : 0;
  const phase = hasStarted ? getPhase(dayInCycle, data.periodDuration) : null;
  const isPeriodDay = hasStarted && dayInCycle <= data.periodDuration;

  const cyclesSince = hasStarted ? Math.floor(diff / data.cycleLength) : 0;
  const nextPeriod = addDays(lmp, (cyclesSince + 1) * data.cycleLength);
  const daysUntil = differenceInDays(nextPeriod, today);

  return { daysUntil, nextPeriodDate: nextPeriod, isPeriodDay, phase, dayInCycle, hasStarted };
}

export function getCalendarDays(year: number, month: number, data: CycleData): CycleDay[][] {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDayOfMonth = getDay(startOfMonth(new Date(year, month)));
  const today = startOfDay(new Date());

  const days: CycleDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const diff = daysFromLMP(date, data.lastPeriodStart);

    let phase: CyclePhase | null = null;
    let dayInCycle = 0;

    if (diff >= 0) {
      dayInCycle = (diff % data.cycleLength) + 1;
      phase = getPhase(dayInCycle, data.periodDuration);
    }

    days.push({
      date: format(date, 'yyyy-MM-dd'),
      phase,
      dayInCycle,
      isFuture: startOfDay(date) > today,
      isToday: startOfDay(date).getTime() === today.getTime(),
      hasJournal: false,
    });
  }

  const weeks: CycleDay[][] = [];
  let week: CycleDay[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    week.push(null as any);
  }

  days.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });

  if (week.length > 0) {
    while (week.length < 7) week.push(null as any);
    weeks.push(week);
  }

  return weeks;
}

export function getPhaseInfo(phase: CyclePhase): { label: string; description: string; tips: string } {
  const info = {
    menstruation: {
      label: 'Menstruasi',
      description: 'Fase menstruasi adalah awal dari siklus, ditandai dengan keluarnya darah dari vagina. Rata-rata berlangsung 3–7 hari.',
      tips: 'Istirahat cukup, kompres hangat di perut, hindari makanan dingin, dan perbanyak minum air putih.',
    },
    follicular: {
      label: 'Folikular',
      description: 'Fase folikular dimulai setelah menstruasi. Tubuh mempersiapkan sel telur untuk ovulasi. Energi biasanya meningkat.',
      tips: 'Waktunya olahraga ringan, makan bergizi, dan produktif. Kulit biasanya lebih cerah di fase ini.',
    },
    ovulation: {
      label: 'Ovulasi (Masa Subur)',
      description: 'Ovulasi adalah puncak kesuburan. Sel telur dilepaskan dan siap dibuahi. Terjadi sekitar hari ke-13 hingga 14.',
      tips: 'Jika merencanakan kehamilan, ini waktu terbaik. Jika tidak, gunakan proteksi. Libido biasanya meningkat.',
    },
    luteal: {
      label: 'Luteal (PMS)',
      description: 'Fase luteal terjadi setelah ovulasi hingga haid berikutnya. Hormon progesteron naik, gejala PMS mungkin muncul.',
      tips: 'Kurangi garam dan gula, kelola stres, siapkan cokelat hitam. Mood swing itu normal di fase ini.',
    },
  };
  return info[phase];
}

export function formatIndonesianDate(dateStr: string): string {
  const d = parseISO(dateStr);
  return format(d, 'EEEE, dd MMMM yyyy', { locale: id });
}

export function getMonthYearKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
