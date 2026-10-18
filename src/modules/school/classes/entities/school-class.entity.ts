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
import { Subject } from "../../subjects/entities/subject.entity";
import { Homework } from "../../../homework/homework/entities/homework.entity";
import { Exam } from "../../../../exams/entities/exam.entity";
import { Lesson } from "../../../../lessons/entities/lesson.entity";
import { TeacherAssignment } from "../../teacher-assignments/entities/teacher-assignment.entity";
import { ClassStudent } from "../../class-students/entities/class-student.entity";

export enum ClassStatus {
  NEW = "new",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

@Entity("classes")
export class SchoolClass {
  @ApiProperty({ example: 1, description: "Unique identifier" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: "Beginner Web Development",
    description: "Class name",
  })
  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @ApiProperty({ example: "2025-06-01", description: "Class start date" })
  @Column({ type: "date" })
  start_date: Date;

  @ApiProperty({ example: "2025-09-01", description: "Class end date" })
  @Column({ type: "date", nullable: true })
  end_date: Date;

  @ApiProperty({ example: "08:30", description: "Class start time" })
  @Column({ type: "time" })
  start_time: string;

  @ApiProperty({ example: "11:30", description: "Class end time" })
  @Column({ type: "time", nullable: true })
  end_time: string;

  @ApiProperty({ enum: ClassStatus, example: ClassStatus.NEW })
  @Column({
    type: "enum",
    enum: ClassStatus,
    default: ClassStatus.NEW,
  })
  status: ClassStatus;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date;

  @ApiProperty({ type: () => Subject })
  @ManyToOne(() => Subject, (subject) => subject.classes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @OneToMany(() => TeacherAssignment, (teacherAssignment) => teacherAssignment.schoolClass, {
    onDelete: "CASCADE",
  })
  @ApiProperty({ type: () => TeacherAssignment })
  teacherAssignments: TeacherAssignment[];

  @OneToMany(() => ClassStudent, (classStudent) => classStudent.schoolClass, {
    onDelete: "CASCADE",
  })
  @ApiProperty({ type: () => ClassStudent })
  classStudents: ClassStudent[];

  @OneToMany(() => Homework, (homework) => homework.schoolClass)
  @ApiProperty({ type: () => Homework })
  homework: Homework[];

  @OneToMany(() => Exam, (exam) => exam.schoolClass)
  @ApiProperty({ type: () => Exam })
  exams: Exam[];

  @OneToMany(() => Lesson, (lesson) => lesson.schoolClass, { onDelete: "CASCADE" })
  @ApiProperty({ type: () => Lesson })
  lessons: Lesson[];
}
