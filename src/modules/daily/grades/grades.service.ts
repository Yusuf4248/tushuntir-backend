import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { Grade } from "./entities/grade.entity";
import { Lesson } from "../lessons/entities/lesson.entity";
import { TeacherAssignment } from "../../school/teacher-assignments/entities/teacher-assignment.entity";
import { User } from "../../identity/users/entities/user.entity";
import { assertEnrolledForAssignment } from "../../school/class-students/enrolment";

@Injectable()
export class GradesService extends CrudService<Grade> {
  protected readonly options: CrudOptions = {
    label: "Grade",
    relations: ["student", "teacherAssignment", "lesson"],
    filters: {
      studentId: "studentId",
      teacherAssignmentId: "teacherAssignmentId",
      lessonId: "lessonId",
      kind: "kind",
    },
    sortable: ["id", "value", "createdAt"],
    references: {
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
      teacherAssignmentId: {
        entity: () => TeacherAssignment,
        label: "Teacher assignment",
      },
      lessonId: { entity: () => Lesson, label: "Lesson" },
    },
  };

  constructor(@InjectRepository(Grade) repository: Repository<Grade>) {
    super(repository);
  }

  /**
   * The student must be enrolled in the assignment's class, and an optional lesson
   * must belong to the same teacher assignment.
   */
  protected async validateReferences(
    values: Record<string, unknown>,
    user: AuthUser,
  ): Promise<void> {
    await super.validateReferences(values, user);
    const teacherAssignmentId = values.teacherAssignmentId as number;
    await assertEnrolledForAssignment(this.manager, teacherAssignmentId, [
      values.studentId as number,
    ]);
    if (values.lessonId != null) {
      const lesson = await this.manager.findOne(Lesson, {
        where: { id: values.lessonId as number },
        select: { id: true, teacherAssignmentId: true },
      });
      if (lesson && lesson.teacherAssignmentId !== teacherAssignmentId) {
        throw new BadRequestException(
          `Lesson ${lesson.id} belongs to teacher assignment ${lesson.teacherAssignmentId}, not ${teacherAssignmentId}`,
        );
      }
    }
  }
}
