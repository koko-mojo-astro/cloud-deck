import { create } from 'zustand';
import { FIBONACCI_SEQUENCE, DEFAULT_TIMER_DURATION } from '@/types/room';

interface PresetsState {
  customDeck: number[];
  timerPresets: number[];
  setCustomDeck: (deck: number[]) => void;
  setTimerPresets: (presets: number[]) => void;
  addTimerPreset: (duration: number) => void;
  removeTimerPreset: (duration: number) => void;
}

const DEFAULT_TIMER_PRESETS = [DEFAULT_TIMER_DURATION, 30, 60];

export const usePresetsStore = create<PresetsState>((set) => ({
  customDeck: FIBONACCI_SEQUENCE,
  timerPresets: DEFAULT_TIMER_PRESETS,
  setCustomDeck: (deck) => set({ customDeck: deck }),
  setTimerPresets: (presets) => set({ timerPresets: presets }),
  addTimerPreset: (duration) =>
    set((state) => ({
      timerPresets: state.timerPresets.includes(duration)
        ? state.timerPresets
        : [...state.timerPresets, duration].sort((a, b) => a - b),
    })),
  removeTimerPreset: (duration) =>
    set((state) => ({
      timerPresets: state.timerPresets.filter((t) => t !== duration),
    })),
}));
