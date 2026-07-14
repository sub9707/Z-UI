import { create } from "zustand";
import { logger } from "./logger";

type CounterState = {
  count: number;
  step: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setStep: (step: number) => void;
};

export const useCounterStore = create<CounterState>()(
  logger((set:any) => ({
    count: 0,
    step: 1,
    increment: () => set((s:any) => ({ count: s.count + s.step })),
    decrement: () => set((s:any) => ({ count: s.count - s.step })),
    reset: () => set({ count: 0 }),
    setStep: (step:any) => set({ step }),
  }))
);
