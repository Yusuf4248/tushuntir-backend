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
import { School } from "../../schools/entities/school.entity";
import { ApiProperty } from "@nestjs/swagger";
import { ExamSession } from "../../../assessment/exam-sessions/entities/exam-session.entity";
import { Lesson } from "../../../daily/lessons/entities/lesson.entity";

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
  @Column({ name: "school_id", nullable: true })
  schoolId: number;

  @ApiProperty({
    type: () => School,
    description: "Xonaga tegishli filial (school)",
  })
  @ManyToOne(() => School, (school) => school.room, { eager: false })
  @JoinColumn({ name: "school_id" })
  school: School;

  @OneToMany(() => ExamSession, (examSession) => examSession.room)
  examSessions: ExamSession[];

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
