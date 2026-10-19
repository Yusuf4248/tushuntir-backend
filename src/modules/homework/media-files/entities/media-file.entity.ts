import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { numberTransformer } from "../../../../common/transforms";
import { User } from "../../../identity/users/entities/user.entity";

@SchoolScope({ via: "uploader", target: () => User })
@Entity("media_files")
export class MediaFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "uploaded_by", type: "int", nullable: true })
  uploadedBy: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "uploaded_by" })
  uploader: User | null;

  /** Relative URL of the stored file */
  @Column({ name: "url", type: "varchar" })
  url: string;

  @Column({ name: "mime_type", type: "varchar", nullable: true })
  mimeType: string | null;

  @Column({
    name: "size_bytes",
    type: "bigint",
    transformer: numberTransformer,
    nullable: true,
  })
  sizeBytes: number | null;

  /** Filename used for downloads (addition to the DBML) */
  @Column({ name: "original_name", type: "varchar", nullable: true })
  originalName: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
