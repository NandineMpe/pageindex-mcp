module.exports = {
  apps: [
    {
      name: 'pageindex-mcp',
      script: 'bun',
      args: 'build/index-http.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        CLIENT_TYPE: 'dedalus',
        // Set these via environment variables, not here!
        // PAGEINDEX_ACCESS_TOKEN: '',
        // PAGEINDEX_REFRESH_TOKEN: '',
        // PAGEINDEX_TOKEN_TYPE: 'Bearer',
        // PAGEINDEX_EXPIRES_IN: '2592000',
        PAGEINDEX_API_URL: 'https://chat.pageindex.ai',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
