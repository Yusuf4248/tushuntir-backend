import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { postgresConnection } from "./connection";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        ...postgresConnection((name) => config.get<string>(name)),
        autoLoadEntities: true,
        // Migrations run before the app starts (npm run start:prod), never from here.
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
