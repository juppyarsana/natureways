module.exports = {
  apps: [
    {
      name: 'natureways-cms',
      cwd: '/var/www/natureways/cms',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'natureways-frontend',
      cwd: '/var/www/natureways/frontend',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production' },
    },
  ],
};
