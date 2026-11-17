import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationData1794908202838 implements MigrationInterface {
  name = "NotificationData1794908202838";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" ADD "data" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "data"`);
  }
}
