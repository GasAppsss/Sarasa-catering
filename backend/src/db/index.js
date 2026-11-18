import { createPostgresStore } from './postgresStore.js';
import { createSqliteStore } from './sqliteStore.js';

export function createStore(config) {
  if (config.dbDriver === 'postgres') {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is required when DB_DRIVER=postgres');
    }
    return createPostgresStore(config.databaseUrl);
  }
  return createSqliteStore(config.sqlitePath);
}
