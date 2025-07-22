import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Group } from "../../group/entities/group.entity";
import { ApiProperty } from "@nestjs/swagger";
import { PaymentType } from "../../payment-types/entities/payment-type.entity";
import { Student } from "../../student/entities/student.entities";

export enum PaymentStatus {
  PAID = "paid",
  UNPAID = "unpaid",
  UNCOMFIRMED = "uncomfirmed",
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1, description: "Tolov ID raqami" })
  id: number;

  @Column()
  @ApiProperty({ example: 150000, description: "Tolov summasi" })
  amount: number;

  @Column()
  @ApiProperty({
    example: "2025-06-01T09:00:00.000Z",
    description: "Tolov sanasi",
  })
  payment_date: Date;

  @ManyToOne(() => Group, (group) => group.payments)
  @ApiProperty({ type: () => Group, description: "Tolov bogliq guruh" })
  group: Group;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.UNCOMFIRMED,
  })
  @ApiProperty({
    enum: PaymentStatus,
    description: "Tolov holati (paid, unpaid, uncomfirmed)",
    default: PaymentStatus.UNCOMFIRMED,
  })
  status: PaymentStatus;

  @Column()
  @ApiProperty({ example: "Iyun oyi uchun tolov", description: "Izoh" })
  comment: string;

  @ManyToOne(() => PaymentType, (pt) => pt.payments)
  @ApiProperty({ type: () => PaymentType, description: "Tolov turi" })
  paymentType: PaymentType;

  @ManyToOne(() => Student, (student) => student.payments)
  @ApiProperty({ type: () => Student, description: "O'quvchi IDsi" })
  student: Student;

  @CreateDateColumn()
  @ApiProperty({
    example: "2025-05-29T14:00:00.000Z",
    description: "Yaratilgan vaqti",
  })
  created_at: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: "2025-05-29T14:10:00.000Z",
    description: "Yangilangan vaqti",
  })
  updated_at: Date;
}
