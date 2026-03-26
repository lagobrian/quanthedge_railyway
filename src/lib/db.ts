import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const useManagedPostgres = Boolean(connectionString);
const useSsl =
  !!connectionString &&
  !/localhost|127\.0\.0\.1/i.test(connectionString) &&
  process.env.PGSSLMODE !== 'disable';

const pool = new Pool(
  useManagedPostgres
    ? {
        connectionString,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: 5,
        idleTimeoutMillis: 30000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'quanthedge',
        user: process.env.DB_USER || 'quanthedge',
        password: process.env.DB_PASSWORD || 'quanthedge_dev_2026',
        max: 5,
        idleTimeoutMillis: 30000,
      }
);

export default pool;
