import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Branch } from "../../branches/entities/branch.entity";
import { Student } from "../../student/entities/student.entities";

@Entity("events")
export class Event {
  @ApiProperty({ example: 1, description: "Eventning ID raqami" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Frontend Bootcamp", description: "Tadbir nomi" })
  @Column()
  name: string;

  @ApiProperty({
    example: "3 kunlik intensiv dasturlash kursi",
    description: "Tadbir tavsifi",
  })
  @Column()
  description: string;

  @ApiProperty({
    example: "2025-06-01T09:00:00.000Z",
    description: "Boshlanish vaqti",
  })
  @Column()
  start_time: Date;

  @ApiProperty({
    example: "2025-06-03T17:00:00.000Z",
    description: "Tugash vaqti",
  })
  @Column()
  end_time: Date;

  @ApiProperty({ example: 50, description: "Maksimal ishtirokchilar soni" })
  @Column()
  max_participants: number;

  @ApiProperty({ example: true, description: "Tadbir faolligi holati" })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty({
    type: () => Branch,
    description: "Tadbir o'tkaziladigan filial",
  })
  @ManyToOne(() => Branch, (branch) => branch.events)
  branch: Branch;

  @ManyToMany(() => Student, (student) => student.events, { nullable: true })
  @JoinTable()
  students: Student[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
