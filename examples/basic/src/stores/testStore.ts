import {create} from 'zustand';
import {zui} from "@z-ui/core";

type TestState = {
      testName: string;
  isTest: boolean;
};

export const useTestStore = create<TestState>()((set) => ({
  testName: '',
  isTest: false,
}));

zui('testStore', useTestStore, { color: 'purple' });
