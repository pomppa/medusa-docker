import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: {
      ssl: false,
      sslmode: 'disable',
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    vite: () => ({
      server: {
        host: '0.0.0.0',
        allowedHosts: ['localhost', '.localhost', '127.0.0.1'],
        hmr: {
          port: 5173,
          clientPort: 5173,
        },
      },
    }),
  },
})
