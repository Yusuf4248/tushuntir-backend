import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Shift } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { AcademicYear } from "../../academic-years/entities/academic-year.entity";
import { School } from "../../schools/entities/school.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Check("CHK_classes_grade", '"grade" BETWEEN 5 AND 11')
@Unique("UQ_classes_school_year_grade_letter", [
  "schoolId",
  "academicYearId",
  "grade",
  "letter",
])
@SchoolScope({ column: "schoolId" })
@Entity("classes")
export class SchoolClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "school_id", type: "int" })
  schoolId: number;

  @ManyToOne(() => School, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "school_id" })
  school: School;

  @Column({ name: "academic_year_id", type: "int" })
  academicYearId: number;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "academic_year_id" })
  academicYear: AcademicYear;

  @Column({ name: "homeroom_teacher_id", type: "int", nullable: true })
  homeroomTeacherId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "homeroom_teacher_id" })
  homeroomTeacher: User | null;

  @Column({ name: "grade", type: "smallint" })
  grade: number;

  @Column({ name: "letter", type: "varchar", length: 5 })
  letter: string;

  @Column({
    name: "shift",
    type: "enum",
    enum: Shift,
    enumName: "shift",
    nullable: true,
    default: Shift.FIRST,
  })
  shift: Shift | null;
}
