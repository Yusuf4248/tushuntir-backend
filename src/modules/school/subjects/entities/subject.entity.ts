import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";

@SchoolScope("global")
@Entity("subjects")
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "name", type: "varchar" })
  name: string;

  @Column({
    name: "code",
    type: "varchar",
    length: 32,
    nullable: true,
    unique: true,
  })
  code: string | null;
}
