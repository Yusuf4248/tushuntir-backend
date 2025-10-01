import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { OtpModule } from "../otp/otp.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Otp } from "../otp/entities/otp.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Otp]), OtpModule],
  providers: [BotService, BotUpdate],
})
export class BotModule {}
