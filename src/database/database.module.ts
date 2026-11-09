import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

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
})
export class DatabaseModule {}
