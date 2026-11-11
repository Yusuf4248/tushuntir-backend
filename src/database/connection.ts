/**
 * Postgres connection settings shared by the app, the TypeORM CLI and the scripts.
 * DATABASE_URL (e.g. Neon's connection string, with ?sslmode=require) wins over the PG_*
 * variables. PG_SSL=true turns on TLS for a PG_* connection.
 */
export interface PostgresConnection {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

export function postgresConnection(
  get: (name: string) => string | undefined,
): PostgresConnection {
  const value = (name: string) => get(name)?.trim() || undefined;
  const ssl = value("PG_SSL") === "true" ? true : undefined;
  const url = value("DATABASE_URL");
  if (url) return { url, ssl };
  const required = (name: string) => {
    const v = value(name);
    if (!v) throw new Error(`${name} is not set (or set DATABASE_URL)`);
    return v;
  };
  return {
    host: required("PG_HOST"),
    port: Number(required("PG_PORT")),
    username: required("PG_USER"),
    password: required("PG_PASSWORD"),
    database: required("PG_DB"),
    ssl,
  };
}
