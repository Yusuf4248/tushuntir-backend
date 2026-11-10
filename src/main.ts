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
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from "./shared/file/file.service";

async function start() {
  try {
    const PORT = process.env.PORT || 3030;
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: WinstonModule.createLogger(winstonConfig),
    });
    // Uploaded files keep the Content-Type that matches their extension.
    app.useStaticAssets(UPLOAD_DIR, {
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
    app.enableCors({
      origin: true,
      credentials: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    });

    app.use(
      ["/api/docs", "/api/docs-json"],
      basicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_USER || "admin"]:
            process.env.SWAGGER_PASSWORD || "secret",
        },
      }),
    );

    const document = buildSwaggerDocument(app);
    SwaggerModule.setup("api/docs", app, document, {
      customCss: `
    .swagger-ui .topbar { display: none !important; }
  `,
      customSiteTitle: "School Platform API Docs",
      swaggerOptions: {
        docExpansion: "list",
        operationsSorter: "alpha",
      },
    });
    await app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.log(error);
  }
}
start();
