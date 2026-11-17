import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as basicAuth from "express-basic-auth";
import { WinstonModule } from "nest-winston";
import { winstonConfig } from "./common/logger/winston.logger";
import { AllExceptionFilter } from "./common/errors/all-exception.filter";
import { buildSwaggerDocument } from "./common/swagger/swagger-document";
import { NestExpressApplication } from "@nestjs/platform-express";
import { UPLOAD_URL_PREFIX, uploadsDir } from "./shared/file/file.service";
import { Logger } from "@nestjs/common";

/** CORS_ORIGINS: comma-separated origins, e.g. https://app.vercel.app. Unset: any origin (local only). */
function corsOrigins(): string[] | true {
  const origins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return origins.length ? origins : true;
}

async function start() {
  try {
    const PORT = process.env.PORT || 3030;
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: WinstonModule.createLogger(winstonConfig),
    });
    const logger = new Logger("Bootstrap");
    // On SIGINT / SIGTERM (pm2 reload or stop) close the server and let running requests finish.
    app.enableShutdownHooks();
    const production = process.env.NODE_ENV === "production";
    // Behind one reverse proxy (Caddy on the same server): req.ip is the client address from
    // X-Forwarded-For, so per-IP limits see the real client, not 127.0.0.1.
    app.set("trust proxy", 1);
    // Private files (homework submissions) are only served through /api/files, never here.
    app.use(
      `${UPLOAD_URL_PREFIX}/private`,
      (_req: unknown, res: { sendStatus(code: number): void }) =>
        res.sendStatus(404),
    );
    // Uploaded files keep the Content-Type that matches their extension.
    app.useStaticAssets(uploadsDir(), {
      prefix: UPLOAD_URL_PREFIX,
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionFilter());
    app.setGlobalPrefix("api");
    const origin = corsOrigins();
    if (origin === true) {
      logger.warn(
        "CORS_ORIGINS is not set: every origin is allowed (set it in production)",
      );
    }
    app.enableCors({
      origin,
      credentials: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    });

    const swaggerUser = process.env.SWAGGER_USER?.trim();
    const swaggerPassword = process.env.SWAGGER_PASSWORD?.trim();
    // In production the docs need real credentials; locally they fall back to admin / secret.
    if (production && !(swaggerUser && swaggerPassword)) {
      logger.warn(
        "Swagger UI is off: set SWAGGER_USER and SWAGGER_PASSWORD to enable /api/docs",
      );
    } else {
      app.use(
        ["/api/docs", "/api/docs-json"],
        basicAuth({
          challenge: true,
          users: { [swaggerUser || "admin"]: swaggerPassword || "secret" },
        }),
      );
      SwaggerModule.setup("api/docs", app, buildSwaggerDocument(app), {
        customCss: `
    .swagger-ui .topbar { display: none !important; }
  `,
        customSiteTitle: "School Platform API Docs",
        swaggerOptions: {
          docExpansion: "list",
          operationsSorter: "alpha",
        },
      });
    }
    // HOST=127.0.0.1 on the server: only the local reverse proxy can reach the app.
    const HOST = process.env.HOST?.trim() || "0.0.0.0";
    await app.listen(PORT, HOST, () => {
      console.log(`Server started at http://${HOST}:${PORT}/api`);
    });
  } catch (error) {
    // Exit non-zero so the host (e.g. Render) sees the failed start and restarts or alerts.
    console.error(error);
    process.exit(1);
  }
}
start();
