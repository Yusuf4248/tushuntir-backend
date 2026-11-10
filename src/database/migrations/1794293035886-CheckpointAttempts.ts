import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckpointAttempts1794293035886 implements MigrationInterface {
  name = "CheckpointAttempts1794293035886";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "checkpoint_attempts" ("id" SERIAL NOT NULL, "student_id" integer NOT NULL, "topic_id" integer NOT NULL, "try_number" smallint NOT NULL, "mode" character varying(10), "prompt" text NOT NULL, "transcript" text, "follow_up" text, "follow_up_transcript" text, "result" character varying(10), "matched_ideas" jsonb, "missing_ideas" jsonb, "wrong_statements" jsonb, "feedback" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "judged_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_checkpoint_attempts_result" CHECK ("result" IN ('passed', 'not_yet')), CONSTRAINT "CHK_checkpoint_attempts_mode" CHECK ("mode" IN ('voice', 'text')), CONSTRAINT "PK_dd050bc4db11acb573826020561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_checkpoint_attempts_topic_id" ON "checkpoint_attempts" ("topic_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_checkpoint_attempts_student_topic" ON "checkpoint_attempts" ("student_id", "topic_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "checkpoint_attempts" ADD CONSTRAINT "FK_bdec69fbc8da54695b03aaced6f" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkpoint_attempts" ADD CONSTRAINT "FK_8fdb32ed74e5b38283abd7c6b91" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checkpoint_attempts" DROP CONSTRAINT "FK_8fdb32ed74e5b38283abd7c6b91"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkpoint_attempts" DROP CONSTRAINT "FK_bdec69fbc8da54695b03aaced6f"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_checkpoint_attempts_student_topic"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_checkpoint_attempts_topic_id"`);
    await queryRunner.query(`DROP TABLE "checkpoint_attempts"`);
  }
}
