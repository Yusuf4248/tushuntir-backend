/**
 * pm2 process file for the server (see docs/DEPLOY.md):
 *   pm2 start ecosystem.config.cjs     first start
 *   pm2 reload ecosystem.config.cjs    after a deploy (deploy/deploy.sh does this)
 * The app runs "npm run start:prod": database migrations first, then node dist/main.
 * Settings such as PORT, HOST and the database come from .env (read by the app itself).
 */
module.exports = {
  apps: [
    {
      name: "tushuntir-api",
      cwd: __dirname,
      script: "npm",
      args: "run start:prod",
      // One process: the rate limits, the voice cache and the daily demo job are per process.
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      // A crash loop backs off (0.2 s doubling up to 15 s) instead of hammering the database.
      exp_backoff_restart_delay: 200,
      // Up only this long counts as a successful start.
      min_uptime: "30s",
      // 8 GB server shared with PostgreSQL: restart above 1.5 GB; the heap limit below makes
      // Node collect garbage well before that.
      max_memory_restart: "1500M",
      // Give in-flight requests (AI calls take up to about 15 s) time to finish on reload.
      kill_timeout: 20000,
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=1024",
      },
    },
  ],
};
