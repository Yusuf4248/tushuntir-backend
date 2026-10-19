import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { QuestionStatus, QuestionType } from "../../../common/enums";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { Question } from "./entities/question.entity";
import { TextbookChunk } from "../textbook-chunks/entities/textbook-chunk.entity";
import { Topic } from "../topics/entities/topic.entity";

@Injectable()
export class QuestionsService extends CrudService<Question> {
  protected readonly options: CrudOptions = {
    label: "Question",
    relations: ["topic", "sourceChunk", "approver"],
    filters: {
      topicId: "topicId",
      sourceChunkId: "sourceChunkId",
      approvedBy: "approvedBy",
      type: "type",
      difficulty: "difficulty",
      generatedByAi: "generatedByAi",
      status: "status",
    },
    sortable: ["id", "difficulty"],
    references: {
      topicId: { entity: () => Topic, label: "Topic" },
      sourceChunkId: { entity: () => TextbookChunk, label: "Source chunk" },
    },
  };

  constructor(@InjectRepository(Question) repository: Repository<Question>) {
    super(repository);
  }

  /** Approve or reject; records who reviewed it and when. */
  async review(
    id: number,
    status: QuestionStatus.APPROVED | QuestionStatus.REJECTED,
    user: AuthUser,
  ): Promise<Question> {
    this.assertCanWrite(user);
    await this.findOne(id, user);
    await this.repository.update(id, {
      status,
      approvedBy: user.id,
      approvedAt: new Date(),
    });
    return this.findOne(id, user);
  }

  protected async beforeCreate(
    data: Record<string, unknown>,
    user: AuthUser,
  ): Promise<Record<string, unknown>> {
    this.normalizeOptions(data, data);
    return super.beforeCreate(data, user);
  }

  protected async beforeUpdate(
    data: Record<string, unknown>,
    existing: Question,
    user: AuthUser,
  ): Promise<Record<string, unknown>> {
    this.normalizeOptions(data, { ...existing, ...data });
    return super.beforeUpdate(data, existing, user);
  }

  /**
   * Multiple choice: at least two distinct, non-empty options and the correct answer
   * is one of them. Short answer: no options (stored as null).
   */
  private normalizeOptions(
    data: Record<string, unknown>,
    merged: Record<string, unknown>,
  ): void {
    const options = (merged.options as string[] | null | undefined) ?? [];
    if (merged.type === QuestionType.SHORT_ANSWER) {
      if (options.length > 0) {
        throw new BadRequestException(
          "A short_answer question must not have options",
        );
      }
      if (data.options !== undefined || data.type !== undefined)
        data.options = null;
      return;
    }
    const trimmed = options.map((option) => option.trim());
    if (trimmed.length < 2 || trimmed.some((option) => !option)) {
      throw new BadRequestException(
        "A multiple_choice question needs at least two non-empty options",
      );
    }
    if (new Set(trimmed).size !== trimmed.length) {
      throw new BadRequestException("Options must be distinct");
    }
    if (!trimmed.includes(String(merged.correctAnswer ?? "").trim())) {
      throw new BadRequestException("correctAnswer must be one of the options");
    }
    if (data.options !== undefined) data.options = trimmed;
  }
}
