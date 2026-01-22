import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PageIndexMcpClient } from './client/mcp-client.js';
import { PageIndexOAuthProviderEnv } from './client/oauth-provider-env.js';
import {
  listResources,
  listResourceTemplates,
  readResource,
  updateResourcesWithRemote,
} from './resources/index.js';
import {
  executeTool,
  getTools,
  RemoteToolsProxy,
  updateToolsWithRemote,
} from './tools/index.js';

/**
 * HTTP MCP Server that wraps the remote PageIndex MCP server
 * Compatible with Dedalus Labs hosting platform
 */
class PageIndexHttpServer {
  private server: Server;
  private mcpClient: PageIndexMcpClient | null = null;
  private connectPromise: Promise<void> | null = null;
  private httpServer: ReturnType<typeof createServer> | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'pageindex-mcp',
        version: __VERSION__,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Initialize remote connection on first list tools request
      if (!this.mcpClient) {
        await this.connectToRemoteServer();
      }

      // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
      const remoteToolsProxy = new RemoteToolsProxy(this.mcpClient!);
      const remoteTools = await remoteToolsProxy.fetchRemoteTools();
      updateToolsWithRemote(remoteTools);

      const tools = getTools();
      const toolsResponse = {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: zodToJsonSchema(tool.inputSchema, {
            strictUnions: true,
          }),
        })),
      };

      return toolsResponse;
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!this.mcpClient) {
          await this.connectToRemoteServer();
        }
        // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
        const result = await executeTool(name, args, this.mcpClient!);
        return result;
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                  tool: name,
                  timestamp: new Date().toISOString(),
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    });

    // Resource handlers
    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      async (request) => {
        // Initialize remote connection on first list resources request
        if (!this.mcpClient) {
          await this.connectToRemoteServer();
        }

        // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
        updateResourcesWithRemote(this.mcpClient!);

        try {
          return await listResources(request.params);
        } catch (error) {
          throw {
            code: -32603,
            message:
              error instanceof Error
                ? error.message
                : 'Failed to list resources',
            data: { cursor: request.params?.cursor },
          };
        }
      },
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        // Ensure connection is established
        if (!this.mcpClient) {
          await this.connectToRemoteServer();
        }

        // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
        updateResourcesWithRemote(this.mcpClient!);

        try {
          return await readResource(request.params);
        } catch (error) {
          // Re-throw MCP-formatted errors directly
          if (typeof error === 'object' && error !== null && 'code' in error) {
            throw error;
          }

          throw {
            code: -32603,
            message:
              error instanceof Error
                ? error.message
                : 'Failed to read resource',
            data: { uri: request.params.uri },
          };
        }
      },
    );

    this.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async () => {
        // Ensure connection is established
        if (!this.mcpClient) {
          await this.connectToRemoteServer();
        }

        // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
        updateResourcesWithRemote(this.mcpClient!);

        try {
          return await listResourceTemplates();
        } catch (error) {
          throw {
            code: -32603,
            message:
              error instanceof Error
                ? error.message
                : 'Failed to list resource templates',
          };
        }
      },
    );

    this.server.onerror = (error) => {
      console.error(`MCP Server error: ${error}\n`);
    };
  }

  /**
   * Handle tools/list request for HTTP endpoint
   */
  private async handleToolsList() {
    if (!this.mcpClient) {
      await this.connectToRemoteServer();
    }

    // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
    const remoteToolsProxy = new RemoteToolsProxy(this.mcpClient!);
    const remoteTools = await remoteToolsProxy.fetchRemoteTools();
    updateToolsWithRemote(remoteTools);

    const tools = getTools();
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: zodToJsonSchema(tool.inputSchema, {
          strictUnions: true,
        }),
      })),
    };
  }

  /**
   * Handle tools/call request for HTTP endpoint
   */
  private async handleToolCall(name: string, args: any) {
    if (!this.mcpClient) {
      await this.connectToRemoteServer();
    }

    try {
      // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
      const result = await executeTool(name, args, this.mcpClient!);
      return result;
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : 'Unknown error',
                tool: name,
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Connect to remote PageIndex MCP server
   */
  private async connectToRemoteServer() {
    // If the client is already connected, return immediately.
    if (this.mcpClient) {
      return;
    }

    // If a connection is already in progress, wait for it to complete.
    if (this.connectPromise) {
      return await this.connectPromise;
    }

    // If no connection is in progress, start a new one and "lock" it.
    this.connectPromise = (async () => {
      try {
        // Use environment variable-based OAuth provider for Dedalus
        const oauthProvider = new PageIndexOAuthProviderEnv();
        const mcpClient = new PageIndexMcpClient(oauthProvider);
        await mcpClient.connect();
        this.mcpClient = mcpClient;
      } catch (error) {
        // If the connection fails, clear the "lock" to allow for a retry on the next call.
        this.connectPromise = null;
        console.error(`Failed to initialize remote connection: ${error}\n`);
        // Re-throw the error so the caller knows the connection failed.
        throw error;
      }
    })();

    return await this.connectPromise;
  }

  /**
   * Start the HTTP server with SSE transport
   */
  async start(port: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer = createServer(async (req, res) => {
          // Set CORS headers for Dedalus compatibility
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          // Handle SSE endpoint for MCP
          if (req.url === '/sse' && req.method === 'GET') {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            try {
              // Create SSE transport - SSEServerTransport takes the response object
              const transport = new SSEServerTransport('/sse', res);
              await this.server.connect(transport);
              // Keep connection alive
              res.on('close', () => {
                transport.close();
              });
            } catch (error) {
              console.error(`Error setting up SSE transport: ${error}\n`);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
              }
              res.end(JSON.stringify({ error: 'Failed to setup SSE transport' }));
            }
            return;
          }

          // Handle POST requests for MCP (HTTP alternative to SSE)
          if (req.url === '/mcp' && req.method === 'POST') {
            try {
              // Read request body
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const body = Buffer.concat(chunks).toString('utf-8');
              const requestData = JSON.parse(body);

              // Ensure remote connection is established
              await this.connectToRemoteServer();

              // Handle JSON-RPC request
              if (requestData.method === 'tools/list') {
                const result = await this.handleToolsList();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', id: requestData.id, result }));
              } else if (requestData.method === 'tools/call') {
                const { name, arguments: args } = requestData.params;
                const result = await this.handleToolCall(name, args);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', id: requestData.id, result }));
              } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  id: requestData.id,
                  error: { code: -32601, message: `Method not found: ${requestData.method}` }
                }));
              }
            } catch (error) {
              console.error(`Error handling POST request: ${error}\n`);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  jsonrpc: '2.0',
                  id: null,
                  error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal server error',
                  }
                }),
              );
            }
            return;
          }

          // Health check endpoint
          if (req.url === '/health' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                status: 'ok',
                name: 'pageindex-mcp',
                version: __VERSION__,
                transport: 'http',
                endpoints: {
                  health: '/health',
                  sse: '/sse',
                  mcp: '/mcp',
                },
              }),
            );
            return;
          }

          // Default: 404
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        });

        // Listen on all interfaces (0.0.0.0) for production deployment
        const host = process.env.HOST || '0.0.0.0';
        this.httpServer.listen(port, host, () => {
          const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
          const domain = process.env.DOMAIN || `localhost:${port}`;
          console.log(
            `PageIndex MCP HTTP Server listening on ${host}:${port}\n` +
              `SSE endpoint: ${protocol}://${domain}/sse\n` +
              `Health check: ${protocol}://${domain}/health\n`,
          );
          resolve();
        });

        this.httpServer.on('error', (error) => {
          console.error(`HTTP Server error: ${error}\n`);
          reject(error);
        });
      } catch (error) {
        console.error(`Failed to start HTTP server: ${error}\n`);
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log('HTTP Server stopped\n');
          resolve();
        });
      }

      if (this.mcpClient) {
        this.mcpClient.close().catch((error) => {
          console.error(`Error closing MCP client: ${error}\n`);
        });
      }

      resolve();
    });
  }
}

/**
 * Create and start the HTTP server
 */
export async function startHttpServer(port?: number): Promise<void> {
  const server = new PageIndexHttpServer();

  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });

  const serverPort = port || parseInt(process.env.PORT || '3000', 10);
  await server.start(serverPort);
}
