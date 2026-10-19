import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { School } from "../../schools/entities/school.entity";

@SchoolScope({ column: "schoolId" })
@Entity("academic_years")
export class AcademicYear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "school_id", type: "int" })
  schoolId: number;

  @ManyToOne(() => School, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "school_id" })
  school: School;

  @Column({ name: "name", type: "varchar", nullable: true })
  name: string | null;

  @Column({ name: "starts_on", type: "date", nullable: true })
  startsOn: string | null;

  @Column({ name: "ends_on", type: "date", nullable: true })
  endsOn: string | null;

  @Column({
    name: "is_current",
    type: "boolean",
    nullable: true,
    default: false,
  })
  isCurrent: boolean | null;
}
