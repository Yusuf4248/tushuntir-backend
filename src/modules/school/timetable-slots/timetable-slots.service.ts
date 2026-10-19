import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { TimetableSlot } from "./entities/timetable-slot.entity";
import { Room } from "../rooms/entities/room.entity";
import { TeacherAssignment } from "../teacher-assignments/entities/teacher-assignment.entity";
import { Term } from "../terms/entities/term.entity";

@Injectable()
export class TimetableSlotsService extends CrudService<TimetableSlot> {
  protected readonly options: CrudOptions = {
    label: "Timetable slot",
    relations: ["teacherAssignment", "room", "term"],
    filters: {
      teacherAssignmentId: "teacherAssignmentId",
      roomId: "roomId",
      termId: "termId",
      weekday: "weekday",
    },
    sortable: ["id", "weekday", "period", "startsAt"],
    references: {
      teacherAssignmentId: {
        entity: () => TeacherAssignment,
        label: "Teacher assignment",
      },
      roomId: { entity: () => Room, label: "Room" },
      termId: { entity: () => Term, label: "Term" },
    },
  };

  constructor(
    @InjectRepository(TimetableSlot) repository: Repository<TimetableSlot>,
  ) {
    super(repository);
  }
}
