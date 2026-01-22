import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

const clientTypeMap: Record<string, string> = {
  dxt: 'Claude Desktop Extension',
  mcpb: 'Claude Desktop (MCPB)',
  npm: 'PageIndex MCP',
  stdio: 'PageIndex MCP (stdio)',
  dedalus: 'PageIndex MCP (Dedalus)',
  production: 'PageIndex MCP (Production)',
};

// Default to HTTP for hosting platforms (Dedalus, Railway, Render, etc.)
// Use CLIENT_TYPE=stdio for local stdio mode
const clientType = process.env.CLIENT_TYPE || 'production';

// Use stdio entry point only when explicitly requested
const useStdio = ['dxt', 'mcpb', 'npm', 'stdio'].includes(clientType);

export default defineConfig({
  entry: useStdio ? ['src/index.ts'] : ['src/index-http.ts'],
  format: ['esm'],
  target: 'es2022',
  outDir: 'build',
  clean: true,
  dts: true,
  sourcemap: true,
  noExternal: [/.*/], // Bundle all dependencies
  define: {
    __VERSION__: `"${packageJson.version}"`,
    __CLIENT_TYPE__: `"${clientType}"`,
    __CLIENT_NAME__: `"${clientTypeMap[clientType] || clientTypeMap.npm}"`,
  },
  platform: 'node',
  onSuccess: async () => {
    console.log('Build completed successfully!');
  },
});
