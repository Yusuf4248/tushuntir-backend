import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TimetableSlot } from "./entities/timetable-slot.entity";
import { TimetableSlotsController } from "./timetable-slots.controller";
import { TimetableSlotsService } from "./timetable-slots.service";

@Module({
  imports: [TypeOrmModule.forFeature([TimetableSlot])],
  controllers: [TimetableSlotsController],
  providers: [TimetableSlotsService],
  exports: [TimetableSlotsService],
})
export class TimetableSlotsModule {}
