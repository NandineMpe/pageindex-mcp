// Vercel serverless function handler for PageIndex MCP
// Supports HTTP POST for tool calls using OAuth tokens from environment

const PAGEINDEX_API_URL = process.env.PAGEINDEX_API_URL || 'https://chat.pageindex.ai';
const PAGEINDEX_ACCESS_TOKEN = process.env.PAGEINDEX_ACCESS_TOKEN;
const PAGEINDEX_REFRESH_TOKEN = process.env.PAGEINDEX_REFRESH_TOKEN;

// Token refresh handling
let cachedAccessToken = null;
let tokenExpiresAt = null;

async function getAccessToken() {
  // Use cached token if still valid
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  // Try to refresh if we have a refresh token
  if (PAGEINDEX_REFRESH_TOKEN) {
    try {
      const response = await fetch(`${PAGEINDEX_API_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: PAGEINDEX_REFRESH_TOKEN,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        cachedAccessToken = data.access_token;
        tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
        return cachedAccessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }

  // Fall back to stored access token
  return PAGEINDEX_ACCESS_TOKEN;
}

// Make authenticated call to PageIndex MCP
async function callPageIndexMcp(method, args) {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('No PageIndex access token available. Set PAGEINDEX_ACCESS_TOKEN or PAGEINDEX_REFRESH_TOKEN.');
  }

  const response = await fetch(`${PAGEINDEX_API_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: method,
        arguments: args || {},
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PageIndex API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error.message || 'PageIndex tool call failed');
  }

  return result.result;
}

// Get list of available tools from PageIndex
async function getToolsList() {
  const token = await getAccessToken();
  
  if (!token) {
    // Return basic tool list without connecting
    return {
      tools: [
        {
          name: 'process_document',
          description: 'Upload and process PDF documents. Returns a doc_id.',
          inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }
        },
        {
          name: 'get_signed_upload_url',
          description: 'Get a signed URL for uploading a document',
          inputSchema: { type: 'object', properties: { fileName: { type: 'string' }, fileType: { type: 'string' } }, required: ['fileName'] }
        },
        {
          name: 'submit_document',
          description: 'Submit an uploaded document for processing',
          inputSchema: { type: 'object', properties: { file_name: { type: 'string' } }, required: ['file_name'] }
        },
        {
          name: 'search',
          description: 'Search documents with a query',
          inputSchema: { type: 'object', properties: { query: { type: 'string' }, doc_ids: { type: 'array' } }, required: ['query'] }
        },
        {
          name: 'chat',
          description: 'Chat with documents',
          inputSchema: { type: 'object', properties: { query: { type: 'string' }, doc_ids: { type: 'array' } }, required: ['query'] }
        }
      ]
    };
  }

  try {
    const response = await fetch(`${PAGEINDEX_API_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {},
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.result;
    }
  } catch (error) {
    console.error('Failed to get tools list from PageIndex:', error);
  }

  // Fallback
  return { tools: [] };
}

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
      configured: !!PAGEINDEX_ACCESS_TOKEN || !!PAGEINDEX_REFRESH_TOKEN,
      endpoints: {
        health: '/health',
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

      // Handle tools/list
      if (requestData.method === 'tools/list') {
        const result = await getToolsList();
        res.status(200).json({
          jsonrpc: '2.0',
          id: requestData.id,
          result
        });
        return;
      }

      // Handle tools/call
      if (requestData.method === 'tools/call') {
        const { name, arguments: args } = requestData.params || {};
        
        if (!name) {
          res.status(400).json({
            jsonrpc: '2.0',
            id: requestData.id,
            error: { code: -32602, message: 'Missing tool name' }
          });
          return;
        }

        try {
          const result = await callPageIndexMcp(name, args);
          res.status(200).json({
            jsonrpc: '2.0',
            id: requestData.id,
            result
          });
        } catch (error) {
          console.error(`Tool call ${name} failed:`, error);
          res.status(200).json({
            jsonrpc: '2.0',
            id: requestData.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  error: error.message,
                  tool: name,
                  timestamp: new Date().toISOString()
                })
              }],
              isError: true
            }
          });
        }
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

  // Default 404
  res.status(404).json({ error: 'Not found', availableEndpoints: ['/health', '/mcp'] });
}
