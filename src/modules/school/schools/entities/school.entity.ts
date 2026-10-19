import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolType } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";

@SchoolScope({ column: "id" })
@Entity("schools")
export class School {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "name", type: "varchar" })
  name: string;

  @Column({ name: "region", type: "varchar" })
  region: string;

  /** Used by the city dashboard */
  @Column({ name: "district", type: "varchar" })
  district: string;

  @Column({
    name: "type",
    type: "enum",
    enum: SchoolType,
    enumName: "school_type",
  })
  type: SchoolType;

  /** For a future eMaktab connection */
  @Column({ name: "emaktab_id", type: "varchar", nullable: true })
  emaktabId: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
