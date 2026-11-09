/**
 * npm run openapi:export — writes docs/openapi.json for the frontend.
 * Runs from the build (nest build), because the Swagger CLI plugin only adds the
 * DTO and entity schemas at compile time.
 */
import { NestFactory } from "@nestjs/core";
import { mkdirSync, writeFileSync } from "fs";
import { AppModule } from "./app.module";
import { buildSwaggerDocument } from "./common/swagger/swagger-document";

async function main() {
  const app = await NestFactory.create(AppModule, { logger: ["error"] });
  app.setGlobalPrefix("api");
  const document = buildSwaggerDocument(app);
  mkdirSync("docs", { recursive: true });
  writeFileSync("docs/openapi.json", `${JSON.stringify(document, null, 2)}\n`);
  const operations = Object.values(document.paths).reduce(
    (sum, path) => sum + Object.keys(path).length,
    0,
  );
  console.log(
    `docs/openapi.json: ${Object.keys(document.paths).length} paths, ${operations} operations`,
  );
  await app.close();
}

main().catch((error: Error) => {
  console.error(`openapi:export failed: ${error.message}`);
  process.exit(1);
});
