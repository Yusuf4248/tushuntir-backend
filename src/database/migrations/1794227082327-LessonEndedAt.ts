import { MigrationInterface, QueryRunner } from "typeorm";

export class LessonEndedAt1794227082327 implements MigrationInterface {
  name = "LessonEndedAt1794227082327";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD "ended_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "ended_at"`);
  }
}
