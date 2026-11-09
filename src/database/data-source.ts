/**
 * DataSource for the TypeORM CLI (migration:generate / migration:run / migration:revert).
 * The app itself connects through DatabaseModule; both read the same PG_* variables.
 */
import "reflect-metadata";
import { existsSync } from "fs";
import { join } from "path";
import { DataSource } from "typeorm";

if (existsSync(".env")) process.loadEnvFile(".env");

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set in .env`);
  return value;
}

export default new DataSource({
  type: "postgres",
  host: required("PG_HOST"),
  port: Number(required("PG_PORT")),
  username: required("PG_USER"),
  password: required("PG_PASSWORD"),
  database: required("PG_DB"),
  entities: [join(__dirname, "..", "**", "*.entity.{ts,js}")],
  migrations: [join(__dirname, "migrations", "*.{ts,js}")],
  synchronize: false,
});
