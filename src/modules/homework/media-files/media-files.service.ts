import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createReadStream } from "fs";
import { access } from "fs/promises";
import { In, Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { FileService } from "../../../shared/file/file.service";
import { Attachment } from "../attachments/entities/attachment.entity";
import { MediaFile } from "./entities/media-file.entity";

export interface MediaDownload {
  stream: NodeJS.ReadableStream;
  mimeType: string;
  sizeBytes: number | undefined;
  originalName: string;
}

@Injectable()
export class MediaFilesService extends CrudService<MediaFile> {
  protected readonly options: CrudOptions = {
    label: "Media file",
    relations: ["uploader"],
    filters: {
      uploadedBy: "uploadedBy",
      mimeType: "mimeType",
    },
    sortable: ["id", "sizeBytes", "originalName", "createdAt"],
  };

  constructor(
    @InjectRepository(MediaFile) repository: Repository<MediaFile>,
    private readonly files: FileService,
  ) {
    super(repository);
  }

  /** Stores the uploaded file on disk and records it. */
  async upload(
    file: Express.Multer.File | undefined,
    user: AuthUser,
  ): Promise<MediaFile> {
    const stored = await this.files.save(file);
    const saved = await this.repository.save(
      this.repository.create({ ...stored, uploadedBy: user.id }),
    );
    return this.findOne(saved.id, user);
  }

  async download(id: number, user: AuthUser): Promise<MediaDownload> {
    const media = await this.findOne(id, user);
    const filePath = this.files.pathOf(media.url);
    if (
      !filePath ||
      !(await access(filePath).then(
        () => true,
        () => false,
      ))
    ) {
      throw new NotFoundException(
        `The file of media file ${id} is missing on disk`,
      );
    }
    return {
      stream: createReadStream(filePath),
      mimeType: media.mimeType ?? "application/octet-stream",
      sizeBytes: media.sizeBytes ?? undefined,
      originalName: media.originalName ?? `file-${id}`,
    };
  }

  /** Deletes the record (its attachments cascade) and the file on disk. */
  async remove(id: number, user: AuthUser): Promise<void> {
    const media = await this.findOne(id, user);
    await super.remove(id, user);
    await this.files.remove(media.url);
  }

  /** A user's avatar: the media file attached with entity_type "user". */
  async findAvatar(userId: number): Promise<MediaFile> {
    const attachment = await this.manager.findOne(Attachment, {
      where: { entityType: "user", entityId: userId },
      relations: { mediaFile: true },
      order: { id: "DESC" },
    });
    if (!attachment)
      throw new NotFoundException(`User ${userId} has no avatar`);
    return attachment.mediaFile;
  }

  /** Uploads a new avatar for the user and removes the previous one. */
  async replaceAvatar(
    userId: number,
    file: Express.Multer.File | undefined,
    user: AuthUser,
  ): Promise<MediaFile> {
    const previous = await this.manager.find(Attachment, {
      where: { entityType: "user", entityId: userId },
      relations: { mediaFile: true },
    });
    const media = await this.upload(file, user);
    await this.manager.save(
      this.manager.create(Attachment, {
        mediaFileId: media.id,
        entityType: "user",
        entityId: userId,
      }),
    );
    if (previous.length) {
      await this.repository.delete({
        id: In(previous.map((a) => a.mediaFileId)),
      });
      await Promise.all(
        previous.map((a) => this.files.remove(a.mediaFile.url)),
      );
    }
    return media;
  }
}
