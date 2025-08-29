module.exports = {
  apps: [
    {
      name: 'jaboti-backend',
      script: 'jaboti_backend/dist/src/main.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3523,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3523,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
    },
    {
      name: 'jaboti-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: './jaboti_frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4173,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4173,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
    },
  ],
};
