import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("media")
export class Media {
  @ApiProperty({ example: 1, description: "Media yozuvining unikal ID raqami" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 42,
    description: "Bog'langan jadvaldagi yozuv IDsi (masalan: homework.id)",
  })
  @Column({ type: "bigint" })
  table_id: number;

  @ApiProperty({
    example: "homework",
    description:
      "Bog'langan jadval nomi (masalan: homework yoki homework_submission)",
  })
  @Column()
  table_name: string;

  @ApiProperty({
    example: "https://example.com/uploads/assignment1.pdf",
    description: "Fayl URL yoki yo'li",
  })
  @Column()
  files: string;

  @ApiProperty({
    example: "application/pdf",
    description: "Fayl turi (MIME type)",
  })
  @Column()
  type: string;

  @ApiProperty({ example: "assignment1.pdf", description: "Fayl nomi" })
  @Column()
  file_name: string;

  @ApiProperty({ example: 2.54, description: "Fayl hajmi megabaytlarda" })
  @Column({ type: "decimal" })
  size: number;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
