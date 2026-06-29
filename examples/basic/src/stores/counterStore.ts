import { create } from "zustand";
import { zui } from "@z-ui/core";

type CounterState = {
  count: number;
  step: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setStep: (step: number) => void;
};

export const useCounterStore = create<CounterState>(
  zui({ name: "counterStore" })((set, get) => ({
    count: 0,
    step: 1,
    increment: () => set((s) => ({ count: s.count + s.step })),
    decrement: () => set((s) => ({ count: s.count - s.step })),
    reset: () => set({ count: 0 }),
    setStep: (step) => set({ step }),
  }))
);
