#!/usr/bin/env node

import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import boxen from 'boxen';
import pc from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv;

const { version, repository } = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
const repoUrl = repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '');

const parsePort = (flag, envVar, defaultValue) => {
    const idx = args.findIndex(v => v.startsWith(flag));
    const cliValue = idx !== -1 ? args[idx].split('=')[1] || args[idx + 1] : null;
    return parseInt(cliValue || process.env[envVar] || defaultValue, 10);
};

const port = parsePort('--port', 'Z_UI_PORT', 4275);
const wsPort = parsePort('--ws-port', 'Z_UI_WS_PORT', 3274);

const server = await createServer({
    root: path.resolve(__dirname, '../dist'),
    server: { port, open: `/?wsPort=${wsPort}` }
});

await server.listen();

const LABEL_WIDTH = 10;
const row = (label, value) => `${pc.gray(label.padEnd(LABEL_WIDTH))} ${value}`;

const banner = [
    pc.bold(pc.green("Z-UI's server is up — ready to inspect your stores!")),
    "",
    row("GUI", `http://localhost:${port}`),
    row("Target WS", `ws://localhost:${wsPort}`),
    row("Version", `v${version}`),
    "",
    row("Github Repo", repoUrl),
].join("\n");

console.log(
    boxen(banner, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "#F59E0B",
        title: "Z-UI [GUI for Zustand]",
        titleAlignment: "center",
    }),
);