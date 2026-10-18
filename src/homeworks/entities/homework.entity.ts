import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Teacher } from "../../teacher/entities/teacher.entity";
import { SchoolClass } from "../../modules/school/classes/entities/school-class.entity";
import { HomeworkSubmission } from "../../homework-submission/entities/homework-submission.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Lesson } from "../../lessons/entities/lesson.entity";

@Entity("homework")
export class Homework {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1, description: "Homework ID" })
  id: number;

  @ManyToOne(() => Teacher, (teacher) => teacher.homework)
  @ApiProperty({
    type: () => Teacher,
    description: "O'qituvchi obyektiga bog'lanish",
  })
  teacher: Teacher;

  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.homework, { onDelete: "CASCADE" })
  @ApiProperty({ type: () => SchoolClass, description: "Guruh obyektiga bog'lanish" })
  @JoinColumn({ name: "class_id" })
  schoolClass: SchoolClass;

  @Column()
  @ApiProperty({
    example: "Uyga vazifa tavsifi",
    description: "Vazifa tavsifi",
  })
  description: string;

  @Column()
  @ApiProperty({
    example: "2025-06-01T18:00:00.000Z",
    description: "Vazifa topshirish muddati",
  })
  deadline: Date;

  @OneToMany(
    () => HomeworkSubmission,
    (homework_submission) => homework_submission.homework
  )
  @ApiProperty({
    type: () => [HomeworkSubmission],
    description: "Vazifaga topshirilgan javoblar ro'yxati",
  })
  homework_submission: HomeworkSubmission[];

  @ManyToOne(() => Lesson, (lesson) => lesson.homework)
  lesson: Lesson;

  @CreateDateColumn({ name: "created_at" })
  @ApiProperty({
    example: "2025-06-18T12:00:00.000Z",
    description: "Yaratilgan sana",
  })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  @ApiProperty({
    example: "2025-06-19T12:00:00.000Z",
    description: "Oxirgi yangilanish",
  })
  updated_at: Date;
}
