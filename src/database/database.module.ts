import {
  Injectable,
  Logger,
  Module,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

/** Prepares the database for the AI phase (textbook_chunks.embedding). Never blocks startup. */
@Injectable()
export class VectorExtensionInitializer implements OnApplicationBootstrap {
  private readonly logger = new Logger(VectorExtensionInitializer.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.dataSource.query("CREATE EXTENSION IF NOT EXISTS vector");
      this.logger.log("pgvector extension is ready");
    } catch (error) {
      this.logger.warn(
        `Could not enable pgvector (${error instanceof Error ? error.message : error}). ` +
          "The app keeps running; textbook_chunks.embedding will need it in the AI phase.",
      );
    }
  }
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.getOrThrow<string>("PG_HOST"),
        port: Number(config.getOrThrow<string>("PG_PORT")),
        username: config.getOrThrow<string>("PG_USER"),
        password: config.getOrThrow<string>("PG_PASSWORD"),
        database: config.getOrThrow<string>("PG_DB"),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
  providers: [VectorExtensionInitializer],
})
export class DatabaseModule {}
