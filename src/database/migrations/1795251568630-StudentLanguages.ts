import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentLanguages1795251568630 implements MigrationInterface {
  name = "StudentLanguages1795251568630";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "text_translations" ("id" SERIAL NOT NULL, "source_hash" character(64) NOT NULL, "language" character varying(5) NOT NULL, "source_text" text NOT NULL, "translated_text" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_text_translations_source_language" UNIQUE ("source_hash", "language"), CONSTRAINT "PK_d58a4b91f4fb94abdd36ebb0fb9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkpoint_attempts" ADD "language" character varying(5)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checkpoint_attempts" DROP COLUMN "language"`,
    );
    await queryRunner.query(`DROP TABLE "text_translations"`);
  }
}
