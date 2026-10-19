import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { MediaFile } from "../../media-files/entities/media-file.entity";

@SchoolScope({ via: "mediaFile", target: () => MediaFile })
@Entity("attachments")
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "media_file_id", type: "int" })
  mediaFileId: number;

  @ManyToOne(() => MediaFile, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "media_file_id" })
  mediaFile: MediaFile;

  @Column({ name: "entity_type", type: "varchar" })
  entityType: string;

  /** Id of that homework / submission / lesson / topic / user */
  @Column({ name: "entity_id", type: "int" })
  entityId: number;
}
