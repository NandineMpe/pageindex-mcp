// Vercel serverless function handler for PageIndex MCP
// Supports SSE for MCP protocol communication and HTTP POST for tool calls

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

// Import the built HTTP server for tool execution
let httpServerModule = null;
async function getHttpServer() {
  if (!httpServerModule) {
    try {
      httpServerModule = await import('../build/index-http.js');
    } catch (e) {
      console.error('Failed to import HTTP server module:', e);
    }
  }
  return httpServerModule;
}

// Simple health check, SSE, and MCP POST handler for Vercel
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
        mcp: '/mcp',
      },
    });
    return;
  }

  // MCP POST endpoint for tool calls
  if ((url === '/mcp' || url === '/api/mcp') && req.method === 'POST') {
    try {
      const requestData = req.body;

      if (!requestData || !requestData.method) {
        res.status(400).json({
          jsonrpc: '2.0',
          id: requestData?.id || null,
          error: { code: -32600, message: 'Invalid request: missing method' }
        });
        return;
      }

      // For now, return a placeholder response
      // The full implementation requires connecting to the PageIndex backend
      if (requestData.method === 'tools/list') {
        res.status(200).json({
          jsonrpc: '2.0',
          id: requestData.id,
          result: {
            tools: [
              {
                name: 'process_document',
                description: 'Upload and process PDF documents. Returns a doc_id for subsequent operations.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', description: 'URL to a PDF document or local file path' }
                  },
                  required: ['url']
                }
              },
              {
                name: 'search',
                description: 'Search documents with a query',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    doc_ids: { type: 'array', items: { type: 'string' }, description: 'Document IDs to search' },
                    top_k: { type: 'number', description: 'Number of results', default: 5 }
                  },
                  required: ['query']
                }
              },
              {
                name: 'chat',
                description: 'Chat with documents',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Chat query' },
                    doc_ids: { type: 'array', items: { type: 'string' }, description: 'Document IDs' },
                    conversation_id: { type: 'string', description: 'Conversation ID for context' }
                  },
                  required: ['query']
                }
              }
            ]
          }
        });
        return;
      }

      if (requestData.method === 'tools/call') {
        const { name, arguments: args } = requestData.params || {};
        
        // Return error - full implementation requires PageIndex OAuth tokens
        res.status(200).json({
          jsonrpc: '2.0',
          id: requestData.id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'PageIndex MCP server requires OAuth authentication.',
                message: 'Please set PAGEINDEX_ACCESS_TOKEN and PAGEINDEX_REFRESH_TOKEN environment variables.',
                tool: name,
                timestamp: new Date().toISOString()
              })
            }],
            isError: true
          }
        });
        return;
      }

      res.status(400).json({
        jsonrpc: '2.0',
        id: requestData.id,
        error: { code: -32601, message: `Method not found: ${requestData.method}` }
      });
      return;

    } catch (error) {
      console.error('MCP POST error:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error'
        }
      });
    }
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
  res.status(404).json({ error: 'Not found', availableEndpoints: ['/health', '/sse', '/mcp'] });
}
