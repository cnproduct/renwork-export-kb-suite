import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
if (config.apiKeys.size === 0) {
  console.error('Startup refused: configure RENWORK_API_KEYS=long-secret-key:tenant-id:admin|sales');
  process.exit(1);
}

const server = createApp(config).listen(config.port, () => {
  console.log(JSON.stringify({ event: 'server_started', service: 'renwork-export-growth-api', version: '4.0.0', port: config.port }));
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
