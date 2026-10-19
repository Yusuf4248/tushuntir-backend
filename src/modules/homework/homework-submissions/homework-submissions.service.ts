import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SubmissionStatus, UserRole } from "../../../common/enums";
import { HomeworkSubmission } from "./entities/homework-submission.entity";
import { Homework } from "../homework/entities/homework.entity";
import { User } from "../../identity/users/entities/user.entity";
import { assertEnrolledForLesson } from "../../school/class-students/enrolment";

@Injectable()
export class HomeworkSubmissionsService extends CrudService<HomeworkSubmission> {
  protected readonly options: CrudOptions = {
    label: "Homework submission",
    relations: ["homework", "student", "checker"],
    filters: {
      homeworkId: "homeworkId",
      studentId: "studentId",
      checkedBy: "checkedBy",
      status: "status",
    },
    sortable: ["id", "score", "submittedAt"],
    references: {
      homeworkId: { entity: () => Homework, label: "Homework" },
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
    },
  };

  constructor(
    @InjectRepository(HomeworkSubmission)
    repository: Repository<HomeworkSubmission>,
  ) {
    super(repository);
  }

  /** Checking or returning a submission records who did it and when. */
  protected async beforeUpdate(
    data: Record<string, unknown>,
    existing: HomeworkSubmission,
    user: AuthUser,
  ): Promise<Record<string, unknown>> {
    const reviewed = [SubmissionStatus.CHECKED, SubmissionStatus.RETURNED];
    if (
      data.status !== undefined &&
      data.status !== existing.status &&
      reviewed.includes(data.status as SubmissionStatus)
    ) {
      data.checkedBy = user.id;
      data.checkedAt = new Date();
    }
    return super.beforeUpdate(data, existing, user);
  }

  /** The student must be enrolled in the class of the homework's lesson. */
  protected async validateReferences(
    values: Record<string, unknown>,
    user: AuthUser,
  ): Promise<void> {
    await super.validateReferences(values, user);
    const homework = await this.manager.findOne(Homework, {
      where: { id: values.homeworkId as number },
      select: { id: true, lessonId: true },
    });
    if (homework) {
      await assertEnrolledForLesson(this.manager, homework.lessonId, [
        values.studentId as number,
      ]);
    }
  }
}
