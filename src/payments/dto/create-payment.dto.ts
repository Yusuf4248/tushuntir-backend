import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
} from "class-validator";
import { PaymentStatus } from "../entities/payment.entity";

export class CreatePaymentDto {
  @ApiProperty({ example: 150000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: "2025-06-01T09:00:00.000Z" })
  @IsDateString()
  payment_date: Date;

  @ApiProperty({ example: 3 })
  @IsNumber()
  groupId: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  studentId: number;

  @ApiProperty({ example: PaymentStatus.UNCOMFIRMED, enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ example: "Iyun oyi uchun to'lov" })
  @IsString()
  comment: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  paymentTypeId: number;
}
