import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatReplyMeta1794387424979 implements MigrationInterface {
  name = "ChatReplyMeta1794387424979";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ai_messages" ADD "reply_meta" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_messages" DROP COLUMN "reply_meta"`,
    );
  }
}
