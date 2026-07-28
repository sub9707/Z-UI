import type { Plugin } from 'vite';
import { createZuiServer, type LogLevel } from './server';
import { handleZuiMessage, TRASH_DIR_NAME } from './scaffold';

export const zuiPlugin = (options?: { port?: number; logLevel?: LogLevel }): Plugin => {
    return {
        name: "vite-plugin-zui",
        apply: "serve",
        config() {
            return {
                server: {
                    watch: {
                        ignored: [`**/${TRASH_DIR_NAME}/**`],
                    },
                },
            };
        },
        configureServer() {
            const server = createZuiServer(options);
            server.onMessage((message)=>{handleZuiMessage(server, message)});
        }
    }
}