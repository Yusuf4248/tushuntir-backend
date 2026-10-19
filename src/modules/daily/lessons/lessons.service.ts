import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder } from "../../../common/enums";
import { Lesson } from "./entities/lesson.entity";
import { TeacherAssignment } from "../../school/teacher-assignments/entities/teacher-assignment.entity";
import { TimetableSlot } from "../../school/timetable-slots/entities/timetable-slot.entity";
import { Topic } from "../../learning/topics/entities/topic.entity";

@Injectable()
export class LessonsService extends CrudService<Lesson> {
  protected readonly options: CrudOptions = {
    label: "Lesson",
    relations: ["teacherAssignment", "timetableSlot", "topic"],
    filters: {
      teacherAssignmentId: "teacherAssignmentId",
      timetableSlotId: "timetableSlotId",
      topicId: "topicId",
      date: "date",
    },
    sortable: ["id", "date"],
    defaultSort: { property: "date", order: SortOrder.DESC },
    references: {
      teacherAssignmentId: {
        entity: () => TeacherAssignment,
        label: "Teacher assignment",
      },
      timetableSlotId: { entity: () => TimetableSlot, label: "Timetable slot" },
      topicId: { entity: () => Topic, label: "Topic" },
    },
  };

  constructor(@InjectRepository(Lesson) repository: Repository<Lesson>) {
    super(repository);
  }
}
