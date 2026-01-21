#!/usr/bin/env node

import { startHttpServer } from './server-http.js';

async function main() {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
    await startHttpServer(port);
  } catch (error) {
    console.error(`Failed to start HTTP server: ${error}\n`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`Uncaught Exception: ${error}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  console.error(`Unhandled Rejection: ${reason}\n`);
  process.exit(1);
});

main();
