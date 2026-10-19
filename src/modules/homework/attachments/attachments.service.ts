import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { UserRole } from "../../../common/enums";
import { NOT_FOUND, resolveSchoolId } from "../../../common/scope/school-scope";
import { Lesson } from "../../daily/lessons/entities/lesson.entity";
import { User } from "../../identity/users/entities/user.entity";
import { Topic } from "../../learning/topics/entities/topic.entity";
import { Homework } from "../homework/entities/homework.entity";
import { HomeworkSubmission } from "../homework-submissions/entities/homework-submission.entity";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { Attachment } from "./entities/attachment.entity";
import { MediaFile } from "../media-files/entities/media-file.entity";

/** attachments.entity_type -> the table that entity_id points to. */
const ATTACHABLE: Record<string, { entity: Function; label: string }> = {
  homework: { entity: Homework, label: "Homework" },
  submission: { entity: HomeworkSubmission, label: "Homework submission" },
  lesson: { entity: Lesson, label: "Lesson" },
  topic: { entity: Topic, label: "Topic" },
  user: { entity: User, label: "User" },
};

@Injectable()
export class AttachmentsService extends CrudService<Attachment> {
  protected readonly options: CrudOptions = {
    label: "Attachment",
    relations: ["mediaFile"],
    filters: {
      mediaFileId: "mediaFileId",
      entityType: "entityType",
      entityId: "entityId",
    },
    sortable: ["id"],
    references: {
      mediaFileId: { entity: () => MediaFile, label: "Media file" },
    },
  };

  constructor(
    @InjectRepository(Attachment) repository: Repository<Attachment>,
  ) {
    super(repository);
  }

  /**
   * entity_id must exist in the table named by entity_type, be visible to an admin,
   * and belong to the same school as the media file.
   */
  protected async validateReferences(
    values: Record<string, unknown>,
    user: AuthUser,
  ): Promise<void> {
    await super.validateReferences(values, user);
    const target = ATTACHABLE[values.entityType as string];
    const entityId = values.entityId as number;
    const targetSchool = await resolveSchoolId(
      this.manager,
      target.entity,
      entityId,
    );
    if (
      targetSchool === NOT_FOUND ||
      (user.role !== UserRole.SUPER_ADMIN &&
        targetSchool !== null &&
        targetSchool !== user.schoolId)
    ) {
      throw new NotFoundException(`${target.label} ${entityId} not found`);
    }
    const fileSchool = await resolveSchoolId(
      this.manager,
      MediaFile,
      values.mediaFileId as number,
    );
    if (
      targetSchool !== null &&
      fileSchool !== null &&
      fileSchool !== NOT_FOUND &&
      fileSchool !== targetSchool
    ) {
      throw new BadRequestException(
        `Media file ${values.mediaFileId} (school ${fileSchool}) and ${target.label.toLowerCase()} ${entityId} (school ${targetSchool}) belong to different schools`,
      );
    }
  }
}
