import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Course } from "../../courses/entities/course.entity";
import { Homework } from "../../homeworks/entities/homework.entity";
import { Exam } from "../../exams/entities/exam.entity";
import { Lesson } from "../../lessons/entities/lesson.entity";
import { GroupTeacher } from "../../group-teachers/entities/group-teacher.entity";
import { GroupStudent } from "../../group-students/entities/group-student.entity";

export enum GroupStatus {
  NEW = "new",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

@Entity("groups")
export class Group {
  @ApiProperty({ example: 1, description: "Unique identifier" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: "Beginner Web Development",
    description: "Group name",
  })
  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @ApiProperty({ example: "2025-06-01", description: "Group start date" })
  @Column({ type: "date" })
  start_date: Date;

  @ApiProperty({ example: "2025-09-01", description: "Group end date" })
  @Column({ type: "date", nullable: true })
  end_date: Date;

  @ApiProperty({ example: "08:30", description: "Group start time" })
  @Column({ type: "time" })
  start_time: string;

  @ApiProperty({ example: "11:30", description: "Group end time" })
  @Column({ type: "time", nullable: true })
  end_time: string;

  @ApiProperty({ enum: GroupStatus, example: GroupStatus.NEW })
  @Column({
    type: "enum",
    enum: GroupStatus,
    default: GroupStatus.NEW,
  })
  status: GroupStatus;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date;

  @ApiProperty({ type: () => Course })
  @ManyToOne(() => Course, (course) => course.groups, { onDelete: "CASCADE" })
  course: Course;

  @OneToMany(() => GroupTeacher, (groupTeacher) => groupTeacher.group, {
    onDelete: "CASCADE",
  })
  @ApiProperty({ type: () => GroupTeacher })
  groupTeachers: GroupTeacher[];

  @OneToMany(() => GroupStudent, (groupStudent) => groupStudent.group, {
    onDelete: "CASCADE",
  })
  @ApiProperty({ type: () => GroupStudent })
  groupStudents: GroupStudent[];

  @OneToMany(() => Homework, (homework) => homework.group)
  @ApiProperty({ type: () => Homework })
  homework: Homework[];

  @OneToMany(() => Exam, (exam) => exam.group)
  @ApiProperty({ type: () => Exam })
  exams: Exam[];

  @OneToMany(() => Lesson, (lesson) => lesson.group, { onDelete: "CASCADE" })
  @ApiProperty({ type: () => Lesson })
  lessons: Lesson[];
}
