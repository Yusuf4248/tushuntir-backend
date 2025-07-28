import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { WinstonModule } from "nest-winston";
import { winstonConfig } from "./common/logger/winston.logger";
import { AllExceptionFilter } from "./common/errors/error.handling";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";

async function start() {
  try {
    const PORT = process.env.PORT || 3030;
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: WinstonModule.createLogger(winstonConfig),
    });
    app.useStaticAssets(join(__dirname, "..", "static"), {
      prefix: "/static/",
    });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
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
        "JWT-auth"
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
