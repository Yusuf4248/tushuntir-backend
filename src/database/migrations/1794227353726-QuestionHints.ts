import { MigrationInterface, QueryRunner } from "typeorm";

export class QuestionHints1794227353726 implements MigrationInterface {
  name = "QuestionHints1794227353726";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" ADD "hints" jsonb`);
    await queryRunner.query(`ALTER TABLE "questions" ADD "explanation" text`);
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "option_misconceptions" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" DROP COLUMN "option_misconceptions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP COLUMN "explanation"`,
    );
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "hints"`);
  }
}
