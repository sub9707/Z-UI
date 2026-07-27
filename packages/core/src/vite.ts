import type {Plugin} from 'vite';
import { createZuiServer, type LogLevel } from './server';

export const zuiPlugin = (options?:{port?:number; logLevel?:LogLevel}):Plugin =>{
    return{
        name:"vite-plugin-zui",
        apply:"serve",
        configureServer(){
            createZuiServer(options);
        }
    }
}