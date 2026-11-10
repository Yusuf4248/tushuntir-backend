import { MigrationInterface, QueryRunner } from "typeorm";

export class MistakeReview1794285804922 implements MigrationInterface {
  name = "MistakeReview1794285804922";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "variant_of_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" ADD "mistake_explanation" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" ADD "fixed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_questions_variant_of_id" ON "questions" ("variant_of_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_0ba6630de4f0fff2f7a9bb49223" FOREIGN KEY ("variant_of_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_0ba6630de4f0fff2f7a9bb49223"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_questions_variant_of_id"`);
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" DROP COLUMN "fixed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" DROP COLUMN "mistake_explanation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP COLUMN "variant_of_id"`,
    );
  }
}
