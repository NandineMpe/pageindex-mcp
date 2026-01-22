// Vercel serverless function handler for PageIndex MCP
// Supports SSE for MCP protocol communication

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

// Simple health check and SSE handler for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = req.url || '/';

  // Health check
  if (url === '/health' || url === '/' || url === '/api' || url === '/api/health') {
    res.status(200).json({
      status: 'ok',
      name: 'pageindex-mcp',
      version: '1.6.3',
      transport: 'http',
      endpoints: {
        health: '/health',
        sse: '/sse',
      },
    });
    return;
  }

  // SSE endpoint for MCP
  if ((url === '/sse' || url === '/api/sse') && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const server = new Server(
        { name: 'pageindex-mcp', version: '1.6.3' },
        { capabilities: { tools: {}, resources: {} } }
      );

      const transport = new SSEServerTransport('/sse', res);
      await server.connect(transport);

      req.on('close', () => {
        transport.close();
      });
    } catch (error) {
      console.error('SSE error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'SSE connection failed' });
      }
    }
    return;
  }

  // Default 404
  res.status(404).json({ error: 'Not found', availableEndpoints: ['/health', '/sse'] });
}
