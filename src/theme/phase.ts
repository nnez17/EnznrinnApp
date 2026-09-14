import Ionicons from '@expo/vector-icons/Ionicons';
import { CyclePhase } from '@/types';

// Satu sumber warna fase siklus. Hex kanonik di global.css @theme (--color-phase-*);
// duplikat di sini untuk prop runtime (Ionicons color). Class string literal utuh
// supaya ter-scan Tailwind. Kontras: angka hari pakai textPrimary, warna vivid
// khusus dot/bar/judul modal (teks besar).
export const PHASE_META: Record<
  CyclePhase,
  { label: string; bg: string; dot: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  menstruation: { label: 'Menstruasi', bg: 'bg-phase-menstruation-bg', dot: 'bg-phase-menstruation', color: '#d9535c', icon: 'water-outline' },
  follicular: { label: 'Folikular', bg: 'bg-phase-follicular-bg', dot: 'bg-phase-follicular', color: '#4e9a3f', icon: 'leaf-outline' },
  ovulation: { label: 'Ovulasi', bg: 'bg-phase-ovulation-bg', dot: 'bg-phase-ovulation', color: '#b8860b', icon: 'sparkles-outline' },
  luteal: { label: 'Luteal', bg: 'bg-phase-luteal-bg', dot: 'bg-phase-luteal', color: '#8a63b8', icon: 'moon-outline' },
};
