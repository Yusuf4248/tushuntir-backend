import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

/**
 * Cache of AI translations of Uzbek app content (quiz questions, options, hints, explanations,
 * mistake explanations, key ideas) into Russian or English: each text is translated once per
 * language and reused for every student.
 */
@Unique("UQ_text_translations_source_language", ["sourceHash", "language"])
@Entity("text_translations")
export class TextTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  /** sha256 of the source text (trimmed) */
  @Column({ name: "source_hash", type: "char", length: 64 })
  sourceHash: string;

  /** ru | en */
  @Column({ name: "language", type: "varchar", length: 5 })
  language: string;

  @Column({ name: "source_text", type: "text" })
  sourceText: string;

  @Column({ name: "translated_text", type: "text" })
  translatedText: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
