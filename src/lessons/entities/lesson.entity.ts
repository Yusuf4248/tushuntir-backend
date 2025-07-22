import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Group } from "../../group/entities/group.entity";
import { Attendance } from "../../attendance/entities/attendance.entity";
import { Homework } from "../../homeworks/entities/homework.entity";
import { Room } from "../../rooms/entities/room.entity";

export enum LessonStatus {
  NEW = "new",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

@Entity()
export class Lesson {
  @ApiProperty({ example: 1, description: "Lessonning ID raqami" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Matematika darsi", description: "Dars nomi" })
  @Column()
  title: string;

  @ApiProperty({
    example: "Bu dars algebra haqida bo'ladi",
    description: "Izoh yoki eslatma",
  })
  @Column()
  notes: string;

  @ApiProperty({
    example: "2025-01-01",
    description: "Dars sanasi",
  })
  @Column({ nullable: true })
  date: Date;

  @ApiProperty({
    enum: LessonStatus,
    example: LessonStatus.NEW,
    description: "Darsning holati (status)",
  })
  @Column({
    type: "enum",
    enum: LessonStatus,
    enumName: "lesson_status_enum",
    default: LessonStatus.NEW,
  })
  status: LessonStatus;

  @ApiProperty({
    type: () => Group,
    nullable: true,
    description: "Dars tegishli bo'lgan guruh",
  })
  @ManyToOne(() => Group, (group) => group.lessons, { nullable: true })
  group: Group;

  @ApiProperty({
    type: () => Room,
    nullable: true,
    description: "Dars bo'lib otadigan xona",
  })
  @ManyToOne(() => Room, (room) => room.lesson)
  room: Room;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.lesson, {
    nullable: true,
  })
  attendance: Attendance[];

  @OneToMany(() => Homework, (homework) => homework.lesson)
  homework: Homework[];
}
