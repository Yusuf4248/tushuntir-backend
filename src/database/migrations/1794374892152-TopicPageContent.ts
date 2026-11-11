import { MigrationInterface, QueryRunner } from "typeorm";

export class TopicPageContent1794374892152 implements MigrationInterface {
  name = "TopicPageContent1794374892152";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "topics" ADD "summary" text`);
    await queryRunner.query(
      `ALTER TABLE "textbook_chunks" ADD "paragraph_pages" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "textbook_chunks" DROP COLUMN "paragraph_pages"`,
    );
    await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "summary"`);
  }
}
