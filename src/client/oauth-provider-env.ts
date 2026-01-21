import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';

/**
 * Environment variable-based OAuth client provider for PageIndex MCP client
 * Designed for stateless hosting environments like Dedalus Labs
 * Reads OAuth tokens and client information from environment variables
 */
export class PageIndexOAuthProviderEnv implements OAuthClientProvider {
  private _tokens?: OAuthTokens;
  private _clientInfo?: OAuthClientInformationFull;

  constructor() {
    this.loadFromEnv();
  }

  get redirectUrl(): string | URL {
    // For hosted environments, redirect URL is not used
    return process.env.PAGEINDEX_REDIRECT_URL || 'http://localhost:8090/callback';
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: process.env.PAGEINDEX_CLIENT_NAME || __CLIENT_NAME__,
      redirect_uris: [
        process.env.PAGEINDEX_REDIRECT_URL || 'http://localhost:8090/callback',
      ],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'],
      response_types: ['code'],
      scope: 'mcp:access',
    };
  }

  async state(): Promise<string> {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    return this._clientInfo;
  }

  async saveClientInformation(
    clientInformation: OAuthClientInformationFull,
  ): Promise<void> {
    this._clientInfo = clientInformation;
    // In hosted environments, we don't persist to disk
    // Environment variables should be set during deployment
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    return this._tokens;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    this._tokens = tokens;
    // In hosted environments, we don't persist to disk
    // Tokens should be refreshed via environment variables
  }

  async redirectToAuthorization(_authorizationUrl: URL): Promise<void> {
    // In hosted environments, OAuth flow should be completed externally
    // and tokens provided via environment variables
    throw new Error(
      'OAuth authorization flow not supported in hosted environment. ' +
        'Please set PAGEINDEX_ACCESS_TOKEN and PAGEINDEX_REFRESH_TOKEN environment variables.',
    );
  }

  async saveCodeVerifier(_codeVerifier: string): Promise<void> {
    // Not used in hosted environments
  }

  async codeVerifier(): Promise<string> {
    // Not used in hosted environments
    return process.env.PAGEINDEX_CODE_VERIFIER || '';
  }

  async invalidateCredentials(
    scope: 'all' | 'client' | 'tokens' | 'verifier',
  ): Promise<void> {
    switch (scope) {
      case 'all':
        this._tokens = undefined;
        this._clientInfo = undefined;
        break;
      case 'client':
        this._clientInfo = undefined;
        break;
      case 'tokens':
        this._tokens = undefined;
        break;
      case 'verifier':
        // Not used in hosted environments
        break;
    }
  }

  /**
   * Load OAuth tokens and client information from environment variables
   */
  private loadFromEnv(): void {
    // Load tokens from environment variables
    const accessToken = process.env.PAGEINDEX_ACCESS_TOKEN;
    const refreshToken = process.env.PAGEINDEX_REFRESH_TOKEN;
    const tokenType = process.env.PAGEINDEX_TOKEN_TYPE || 'Bearer';
    const expiresIn = process.env.PAGEINDEX_EXPIRES_IN
      ? parseInt(process.env.PAGEINDEX_EXPIRES_IN, 10)
      : undefined;

    if (accessToken) {
      this._tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: tokenType,
        expires_in: expiresIn,
      };
    }

    // Load client information from environment variables
    const clientId = process.env.PAGEINDEX_CLIENT_ID;
    const clientSecret = process.env.PAGEINDEX_CLIENT_SECRET;

    if (clientId) {
      this._clientInfo = {
        client_id: clientId,
        client_secret: clientSecret,
        ...this.clientMetadata,
      };
    }
  }
}
