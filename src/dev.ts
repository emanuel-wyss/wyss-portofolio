// src/dev.ts
import { spawn } from 'bun';

console.log('🚀 Starting development server...\n');

// Start Hono server
const hono = spawn(['bun', 'run', 'server/index.ts'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: { ...process.env, NODE_ENV: 'development' },
});

// Start Astro dev server
const astro = spawn(['bun', 'run', 'astro', 'dev'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: { ...process.env, NODE_ENV: 'development' },
});

process.on('SIGINT', () => {
  console.log('\n\n📪 Shutting down servers...');
  hono.kill();
  astro.kill();
  process.exit(0);
});

// Prevent script from exiting
await new Promise(() => {});
