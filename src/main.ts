import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as basicAuth from "express-basic-auth";
import { WinstonModule } from "nest-winston";
import { winstonConfig } from "./common/logger/winston.logger";
import { AllExceptionFilter } from "./common/errors/all-exception.filter";
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
    // app.enableCors({
    //   origin: (origin, callback) => {
    //     const allowedOrigin = [
    //       "http://localhost:6969",
    //       "http://localhost:5173",
    //       "http://185.191.141.200:6969",
    //       "http://185.191.141.200:3030",
    //       "https://erp-edu.uz",
    //     ];
    //     if (!origin || allowedOrigin.includes(origin)) {
    //       callback(null, true);
    //     } else {
    //       callback(new BadRequestException("Not allowed by CORS"));
    //     }
    //   },
    //   methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
    //   credentials: true,
    // });
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

    const config = new DocumentBuilder()
      .setTitle("ERP PROJECT")
      .setDescription("ERP-REST-API")
      .setVersion("6.9")
      .addTag("NESTJS", "Validation, SWAGGER, BOT, TOKENS, SENDMAIL")
      .addTag("Nest js", "GUARD, AUTH")
      .addBearerAuth(
        {
          type: "http",
          scheme: "Bearer",
          bearerFormat: "JWT",
          description: "Foydalanuvchi JWT tokenini kiriting",
        },
        "JWT-auth",
      )
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      extraModels: [],
    });
    SwaggerModule.setup("api/docs", app, document, {
      customCss: `
    .swagger-ui .topbar { display: none !important; }
  `,
      customSiteTitle: "ERP Project API Docs",
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
