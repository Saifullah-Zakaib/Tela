import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serve } from 'srvx';
import { serveStatic } from 'srvx/static';
import server from './dist/server/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, 'dist/client');
const handler = server.default ?? server;

const port = Number(process.env.PORT) || 8080;

const instance = serve({
  port,
  hostname: '0.0.0.0',
  middleware: [serveStatic({ dir: clientDir })],
  fetch: (request, env, ctx) => handler.fetch(request, env, ctx),
});

await instance.ready();
console.log(`Tela frontend listening on port ${port}`);
