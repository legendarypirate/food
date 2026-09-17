module.exports = {
  apps: [
    {
      name: 'foody-api',
      cwd: './back',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'foody-admin',
      cwd: './admin',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        API_BACKEND: 'http://127.0.0.1:3001',
      },
    },
  ],
};
