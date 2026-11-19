import { createPostgresStore } from './postgresStore.js';
import { createSqliteStore } from './sqliteStore.js';

export function createStore(config) {
  const options = { seedDemoOrders: config.seedDemoOrders !== false };
  if (config.dbDriver === 'postgres') {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is required when DB_DRIVER=postgres');
    }
    return createPostgresStore(config.databaseUrl, options);
  }
  return createSqliteStore(config.sqlitePath, options);
}
