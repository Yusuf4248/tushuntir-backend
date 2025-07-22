import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum LidStatus {
  YANGI = "yangi",
  TESTDAN_OTDI = "testdan_o'tdi",
  TESTGA_CHAQIRILDI = "testga_chaqirildi",
  QABUL_QILINDI = "qabul_qilindi",
  RAD_ETILDI = "rad_etildi",
}


@Entity("lid")
export class Lid {
  @ApiProperty({ example: 1, description: "Lid ID raqami" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Ali", description: "O'quvchining ismi" })
  @Column({ type: "varchar", nullable: false })
  first_name: string;

  @ApiProperty({ example: "Valiyev", description: "O'quvchining familiyasi" })
  @Column({ type: "varchar", nullable: false })
  last_name: string;

  @ApiProperty({
    example: "ali@example.com",
    description: "O'quvchining email manzili",
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    example: "hashed_password",
    description: "Parolning xeshlangan ko'rinishi",
  })
  @Column()
  password_hash: string;

  @ApiProperty({
    example: "IELTS",
    description: "O'quvchining maqsadi (targeti)",
  })
  @Column()
  target: string;

  @ApiProperty({
    example: "2025-06-01",
    description: "Test sanasi",
    required: false,
  })
  @Column({ nullable: true })
  test_date: Date;

  @ApiProperty({
    example: "2025-06-05",
    description: "Test dars (trial lesson) sanasi",
  })
  @Column({ nullable: true })
  trial_lesson_date: Date;

  @ApiProperty({ description: "Lid qaysi guruhga tegishli" })
  @Column({ nullable: true })
  groupId: number;

  @ApiProperty({
    enum: LidStatus,
    example: LidStatus.YANGI,
    description: "Lidning hozirgi statusi",
  })
  @Column({ type: "enum", enum: LidStatus, default: LidStatus.YANGI })
  lid_status: LidStatus;

  @ApiProperty({
    example: "Telefon orqali bog'lanib bo'lmadi",
    description: "Bekor qilish sababi",
  })
  @Column({ nullable: true })
  cancel_reason: string;

  @Column({ type: "boolean", default: false, nullable: true })
  is_active: boolean;

  @ApiProperty({
    example: "hashed_refresh_token",
    description: "Refresh token hash qiymati",
  })
  @Column({ default: "" })
  refresh_token_hash: string;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
