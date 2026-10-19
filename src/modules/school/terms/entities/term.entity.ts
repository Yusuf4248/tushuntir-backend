import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { AcademicYear } from "../../academic-years/entities/academic-year.entity";

@SchoolScope({ via: "academicYear", target: () => AcademicYear })
@Entity("terms")
export class Term {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "academic_year_id", type: "int" })
  academicYearId: number;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "academic_year_id" })
  academicYear: AcademicYear;

  @Column({ name: "name", type: "varchar", nullable: true })
  name: string | null;

  @Column({ name: "starts_on", type: "date", nullable: true })
  startsOn: string | null;

  @Column({ name: "ends_on", type: "date", nullable: true })
  endsOn: string | null;
}
