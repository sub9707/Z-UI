import type { StateCreator, StoreMutatorIdentifier } from "zustand";

export type ZuiOptions = {
  name: string;
};

// pass-through stub — 실제 미들웨어 구현 전까지 타입만 맞춤
export const zui =
  (_options: ZuiOptions) =>
  <
    T,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  >(
    f: StateCreator<T, Mps, Mcs>
  ): StateCreator<T, Mps, Mcs> =>
    f;
