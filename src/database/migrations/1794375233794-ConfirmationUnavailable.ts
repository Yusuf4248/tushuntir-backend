import { MigrationInterface, QueryRunner } from "typeorm";

export class ConfirmationUnavailable1794375233794
  implements MigrationInterface
{
  name = "ConfirmationUnavailable1794375233794";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "confirmation_unavailable_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" DROP COLUMN "confirmation_unavailable_at"`,
    );
  }
}
