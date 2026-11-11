/**
 * DataSource for the TypeORM CLI (migration:generate / migration:run / migration:revert) and the
 * scripts. The app itself connects through DatabaseModule; both read DATABASE_URL or PG_*.
 */
import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { join } from "path";
import { DataSource } from "typeorm";
import { postgresConnection } from "./connection";

// Same parser as @nestjs/config, so scripts read .env exactly like the app (inline # comments included).
loadEnv();

// Compiled (dist/*.js) or ts-node (src/*.ts): load only that kind, never the .d.ts files.
const extension = __filename.endsWith(".js") ? "js" : "ts";

export default new DataSource({
  type: "postgres",
  ...postgresConnection((name) => process.env[name]),
  entities: [join(__dirname, "..", "**", `*.entity.${extension}`)],
  migrations: [join(__dirname, "migrations", `*.${extension}`)],
  synchronize: false,
});
