import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolClass } from "../../classes/entities/school-class.entity";
import { Teacher } from "../../../identity/teacher/entities/teacher.entity";

@Entity("teacher_assignments")
export class TeacherAssignment {
  @ApiProperty({ example: 1, description: "Unique identifier" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 2, description: "Class ID", type: () => SchoolClass })
  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.teacherAssignments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "class_id" })
  schoolClass: SchoolClass;

  @ApiProperty({ example: 5, description: "Teacher ID", type: () => Teacher })
  @ManyToOne(() => Teacher, (teacher) => teacher.teacherAssignments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "teacher_id" })
  teacher: Teacher;

  @ApiProperty({
    example: true,
    description: "Status of the teacher in the class (active/inactive)",
  })
  @Column({ type: "boolean", default: true })
  status: boolean;

  @ApiProperty({
    example: "2025-01-01",
    description: "Start date of the class",
  })
  @Column({ type: "date", nullable: true })
  start_date: Date;

  @ApiProperty({
    example: "2025-12-01",
    description: "End date of the class",
  })
  @Column({ type: "date", nullable: true })
  end_date: Date;
}
