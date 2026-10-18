import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Room } from "../../rooms/entities/room.entity";
import { Admin } from "../../../identity/admin/entities/admin.entity";
import { Teacher } from "../../../../teacher/entities/teacher.entity";

@Entity("schools")
export class School {
  @ApiProperty({ example: 1, description: "Filial ID raqami" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Chilonzor Filiali", description: "Filial nomi" })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    example: "Toshkent sh., Chilonzor 5",
    description: "Filial manzili",
  })
  @Column({ unique: true })
  address: string;

  @ApiProperty({ example: "+998901234567", description: "Qo'ng'iroq raqami" })
  @Column({ unique: true })
  call_number: string;

  @OneToMany(() => Room, (room) => room.school)
  room: Room[];

  @ManyToMany(() => Admin, (admin) => admin.school)
  admin: Admin[];

  @ManyToMany(() => Teacher, (teacher) => teacher.schools)
  teachers: Teacher[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
