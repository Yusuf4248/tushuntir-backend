import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Room } from "../../../school/rooms/entities/room.entity";
import { SchoolClass } from "../../../school/classes/entities/school-class.entity";
import { Teacher } from "../../../../teacher/entities/teacher.entity";
import { ExamResult } from "../../exam-results/entities/exam-result.entity";

export enum ExamSessionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("exam_sessions")
export class ExamSession {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Final Exam" })
  @Column()
  title: string;

  @ApiProperty({ example: "This is the final exam for Module 1" })
  @Column()
  description: string;

  @ApiProperty({ example: "2025-06-01" })
  @Column({ type: "date" })
  date: Date;

  @ApiProperty({ enum: ExamSessionStatus, example: ExamSessionStatus.PENDING })
  @Column({ type: "enum", enum: ExamSessionStatus })
  status: ExamSessionStatus;

  @ApiProperty({ example: "14:00", description: "Start time (HH:mm)" })
  @Column({ type: "time" })
  start_time: string;

  @ApiProperty({ example: "15:30", description: "End time (HH:mm)" })
  @Column({ type: "time" })
  end_time: string;

  @ApiProperty({ type: () => Room })
  @ManyToOne(() => Room, (room) => room.examSessions)
  room: Room;

  @ApiProperty({ type: () => SchoolClass })
  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.examSessions)
  @JoinColumn({ name: "class_id" })
  schoolClass: SchoolClass;

  @ManyToMany(() => Teacher, (teacher) => teacher.examSessions, { nullable: true })
  @JoinTable({
    name: "exam_session_teachers",
    joinColumn: { name: "exam_session_id" },
    inverseJoinColumn: { name: "teacher_id" },
  })
  teacher: Teacher[];

  @OneToMany(() => ExamResult, (exam_result) => exam_result.examSession)
  examResults: ExamResult[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
