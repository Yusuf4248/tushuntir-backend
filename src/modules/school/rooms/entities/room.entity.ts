import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomType } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { School } from "../../schools/entities/school.entity";

@SchoolScope({ column: "schoolId" })
@Entity("rooms")
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_rooms_school_id")
  @Column({ name: "school_id", type: "int" })
  schoolId: number;

  @ManyToOne(() => School, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "school_id" })
  school: School;

  @Column({ name: "name", type: "varchar", nullable: true })
  name: string | null;

  @Column({
    name: "type",
    type: "enum",
    enum: RoomType,
    enumName: "room_type",
    nullable: true,
    default: RoomType.CLASSROOM,
  })
  type: RoomType | null;

  @Column({ name: "seats", type: "smallint", nullable: true })
  seats: number | null;
}
