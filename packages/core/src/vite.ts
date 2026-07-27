import type {Plugin} from 'vite';
import { createZuiServer } from './server';

export const zuiPlugin = (options?:{port?:number}):Plugin =>{
    return{
        name:"vite-plugin-zui",
        apply:"serve",
        configureServer(){
            createZuiServer(options);
        }
    }
}