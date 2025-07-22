import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Room } from "../../rooms/entities/room.entity";
import { Group } from "../../group/entities/group.entity";
import { Teacher } from "../../teacher/entities/teacher.entity";
import { ExamResult } from "../../exam-results/entities/exam-result.entity";

export enum ExamStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity()
export class Exam {
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

  @ApiProperty({ enum: ExamStatus, example: ExamStatus.PENDING })
  @Column({ type: "enum", enum: ExamStatus })
  status: ExamStatus;

  @ApiProperty({ example: "14:00", description: "Start time (HH:mm)" })
  @Column({ type: "time" })
  start_time: string;

  @ApiProperty({ example: "15:30", description: "End time (HH:mm)" })
  @Column({ type: "time" })
  end_time: string;

  @ApiProperty({ type: () => Room })
  @ManyToOne(() => Room, (room) => room.exams)
  room: Room;

  @ApiProperty({ type: () => Group })
  @ManyToOne(() => Group, (group) => group.exams)
  group: Group;

  @ManyToMany(() => Teacher, (teacher) => teacher.exam, { nullable: true })
  @JoinTable()
  teacher: Teacher[];

  @OneToMany(() => ExamResult, (exam_result) => exam_result.exam)
  exam_result: ExamResult[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
