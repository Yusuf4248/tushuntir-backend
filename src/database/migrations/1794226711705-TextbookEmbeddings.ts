import { MigrationInterface, QueryRunner } from "typeorm";

/** pgvector embeddings for textbook chunks (1024 dims, HNSW cosine index), chunk order and topic key ideas. */
export class TextbookEmbeddings1794226711705 implements MigrationInterface {
  name = "TextbookEmbeddings1794226711705";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(
      `ALTER TABLE "textbook_chunks" ADD "position" smallint`,
    );
    await queryRunner.query(
      `ALTER TABLE "textbook_chunks" ADD "embedding" vector(1024)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_textbook_chunks_embedding_hnsw" ON "textbook_chunks" USING hnsw ("embedding" vector_cosine_ops)`,
    );
    await queryRunner.query(`ALTER TABLE "topics" ADD "key_ideas" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "key_ideas"`);
    await queryRunner.query(`DROP INDEX "IDX_textbook_chunks_embedding_hnsw"`);
    await queryRunner.query(
      `ALTER TABLE "textbook_chunks" DROP COLUMN "embedding"`,
    );
    await queryRunner.query(
      `ALTER TABLE "textbook_chunks" DROP COLUMN "position"`,
    );
  }
}
