import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolClass } from "../../classes/entities/school-class.entity";
import { Student } from "../../../identity/student/entities/student.entity";

@Entity("class_students")
export class ClassStudent {
  @ApiProperty({ example: 1, description: "Unique identifier" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 2, description: "Class ID", type: () => SchoolClass })
  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.classStudents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "class_id" })
  schoolClass: SchoolClass;

  @ApiProperty({ example: 5, description: "Student ID", type: () => Student })
  @ManyToOne(() => Student, (student) => student.classStudents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "student_id" })
  student: Student;

  @ApiProperty({
    example: true,
    description: "Status of the teacher in the class (active/inactive)",
  })
  @Column({ type: "boolean" })
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
