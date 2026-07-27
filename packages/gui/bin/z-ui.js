#!/usr/bin/env node

import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv;

const parsePort = (flag, envVar, defaultValue) => {
    const idx = args.findIndex(v => v.startsWith(flag));
    const cliValue = idx !== -1 ? args[idx].split('=')[1] || args[idx + 1] : null;
    return parseInt(cliValue || process.env[envVar] || defaultValue, 10);
};

const port = parsePort('--port', 'Z_UI_PORT', 4275);
const wsPort = parsePort('--ws-port', 'Z_UI_WS_PORT', 3274);

const server = await createServer({
    root: path.resolve(__dirname, '../dist'),
    server: { port, open: true }
});

await server.listen();
console.log(`[Z-UI] GUI → http://localhost:${port} (target WS port: ${wsPort})`);