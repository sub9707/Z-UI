import type {StoreApi} from "zustand";
import { registerStore } from "./registry";

export type InitZuiOptions = {
   port?: number; 
}

const zuiImpl = <T>(name:string, store:StoreApi<T>):void =>{
    registerStore({
        name,
        getState: store.getState,
        setState: (patch)=> store.setState(patch as Partial<T>, false),
        actions: Object.keys(store.getState() as object).filter(key => typeof (store.getState() as Record<string, unknown>)[key] === 'function')
    })

    store.subscribe((state) => {
        console.log('[Z-UI]', name, '->', state);
    });
}

const noop = <T>(name:string, store:StoreApi<T>):void => {};

export const zui = process.env.NODE_ENV !== 'production' ? zuiImpl : noop;