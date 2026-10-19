import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { Attendance } from "./entities/attendance.entity";
import { Lesson } from "../lessons/entities/lesson.entity";
import { User } from "../../identity/users/entities/user.entity";
import { assertEnrolledForLesson } from "../../school/class-students/enrolment";
import { BulkAttendanceDto } from "./dto/bulk-attendance.dto";

@Injectable()
export class AttendanceService extends CrudService<Attendance> {
  protected readonly options: CrudOptions = {
    label: "Attendance record",
    relations: ["lesson", "student"],
    filters: {
      lessonId: "lessonId",
      studentId: "studentId",
      status: "status",
    },
    sortable: ["id"],
    references: {
      lessonId: { entity: () => Lesson, label: "Lesson" },
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
    },
  };

  constructor(
    @InjectRepository(Attendance) repository: Repository<Attendance>,
  ) {
    super(repository);
  }

  /** Sets the status of many students for one lesson (insert or update per student). */
  async bulkUpsert(
    dto: BulkAttendanceDto,
    user: AuthUser,
  ): Promise<Attendance[]> {
    const studentIds = dto.items.map((item) => item.studentId);
    const duplicate = studentIds.find(
      (id, index) => studentIds.indexOf(id) !== index,
    );
    if (duplicate) {
      throw new BadRequestException(
        `Student ${duplicate} appears more than once`,
      );
    }
    await super.validateReferences({ lessonId: dto.lessonId }, user);
    await assertEnrolledForLesson(this.manager, dto.lessonId, studentIds);
    await this.repository.upsert(
      dto.items.map((item) => ({
        lessonId: dto.lessonId,
        studentId: item.studentId,
        status: item.status,
        note: item.note ?? null,
      })),
      { conflictPaths: ["lessonId", "studentId"] },
    );
    return this.repository.find({
      where: { lessonId: dto.lessonId, studentId: In(studentIds) },
      relations: { student: true },
      order: { studentId: "ASC" },
    });
  }

  /** Also requires the student to be enrolled in the lesson's class. */
  protected async validateReferences(
    values: Record<string, unknown>,
    user: AuthUser,
  ): Promise<void> {
    await super.validateReferences(values, user);
    await assertEnrolledForLesson(this.manager, values.lessonId as number, [
      values.studentId as number,
    ]);
  }
}
