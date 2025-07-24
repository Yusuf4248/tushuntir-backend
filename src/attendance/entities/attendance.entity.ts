import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Student } from "../../student/entities/student.entities";
import { Lesson } from "../../lessons/entities/lesson.entity";

export enum AttendanceStatus {
  CAME = "came",
  DID_NOT_CAME = "did not came",
  LATE = "late",
  PENDING = "pending",
}

@Entity()
export class Attendance {
  @ApiProperty({ example: 1, description: "Unikal ID raqami" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Student, description: "Talaba obyekti" })
  @ManyToOne(() => Student, (student) => student.attendance)
  student: Student;

  @ApiProperty({ type: () => Lesson, description: "Dars jadvali obyekti" })
  @ManyToOne(() => Lesson, (lesson) => lesson.attendance, {
    eager: false,
  })
  lesson: Lesson;

  @ApiProperty({
    example: "2025-06-01T09:00:00.000Z",
    description: "Davomat sanasi",
  })
  @Column()
  date: Date;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.CAME,
    description: "Talabaning holati (masalan: bor, yo'q)",
  })
  @Column({
    type: "enum",
    enum: AttendanceStatus,
  })
  status: AttendanceStatus;

  @ApiProperty({
    example: "Darsga ma'lum sababga ko'ra kech qoldi.",
    description: "O'quvchining dars kelgan yoki kelmaganligi haqida tavsif",
  })
  @Column({ default: "" })
  description: string;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
