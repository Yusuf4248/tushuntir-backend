import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Branch } from "../../branches/entities/branch.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Exam } from "../../exams/entities/exam.entity";
import { Lesson } from "../../lessons/entities/lesson.entity";

@Entity("rooms")
export class Room {
  @ApiProperty({
    example: 1,
    description: "Xonaning ID raqami",
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: "Room A",
    description: "Xonaning nomi",
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 25,
    description: "Xona sig'imi (nechta odam sig'adi)",
  })
  @Column()
  capacity: number;

  @ApiProperty({
    example: 1,
    description: "Xonaga tegishli filialning ID raqami",
  })
  @Column({ nullable: true })
  branchId: number;

  @ApiProperty({
    type: () => Branch,
    description: "Xonaga tegishli filial (branch)",
  })
  @ManyToOne(() => Branch, (branch) => branch.room, { eager: false })
  branch: Branch;

  @OneToMany(() => Exam, (exam) => exam.room)
  exams: Exam[];

  @ApiProperty({
    type: () => Room,
    nullable: true,
    description: "Shu xanada bo'ladigan dars",
  })
  @OneToMany(() => Lesson, (lesson) => lesson.room, { nullable: true })
  lesson: Lesson[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
