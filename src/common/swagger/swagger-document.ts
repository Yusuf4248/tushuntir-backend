import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";

/** The OpenAPI document served at /api/docs and exported to docs/openapi.json. */
export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle("School Platform API")
    .setDescription(
      "School platform for grades 5-11: admin CRUD, the student app (/api/me) and AI question generation.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "Bearer",
        bearerFormat: "JWT",
        description: "Access token from POST /api/auth/login",
      },
      "JWT-auth",
    )
    .build();
  return SwaggerModule.createDocument(app, config);
}
