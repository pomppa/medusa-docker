const REDIS_URL = process.env.REDIS_URL || "redis://cache";

/**
 * for admin configurations
 *  @see https://docs.medusajs.com/admin/configuration#build-command-options
 */
const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `@medusajs/file-local`,
    options: {
      upload_dir: "uploads",
    },
  },
  {
    resolve: "@medusajs/admin",
    /** @type {import('@medusajs/admin').PluginOptions} */
    options: {
      autoRebuild: true,
      develop: {
        open: process.env.OPEN_BROWSER !== "false",
      },
    },
  },
];

const featureFlags = {
  medusa_v2: true,
};

const modules = {
  eventBus: {
    resolve: "@medusajs/event-bus-redis",
    options: {
      redisUrl: REDIS_URL,
    },
  },
  cacheService: {
    resolve: "@medusajs/cache-redis",
    options: {
      redisUrl: REDIS_URL,
    },
  },
  pricingService: {
    resolve: "@medusajs/pricing",
  },
  productService: {
    resolve: "@medusajs/product",
  },
};

/** @type {import('@medusajs/medusa').ConfigModule["projectConfig"]} */
const projectConfig = {
  jwtSecret: process.env.JWT_SECRET,
  cookieSecret: process.env.COOKIE_SECRET,
  store_cors: process.env.STORE_CORS || "http://localhost:8000",
  admin_cors:
    process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001",
  redis_url: REDIS_URL,
  database_database: "medusa-docker",
  database_type: "postgres",
  database_extra:
    process.env.NODE_ENV !== "development"
      ? { ssl: { rejectUnauthorized: false } }
      : { ssl: false }, // important for docker, postgres is not considered local
  database_url: process.env.POSTGRES_URL || process.env.DATABASE_URL,
};

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  projectConfig,
  plugins,
  modules,
  featureFlags,
};
