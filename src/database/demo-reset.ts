/**
 * npm run demo:reset [-- <student phone>]
 * Puts the demo students back to a fresh start so the demo can be run (and recorded) again: the
 * main demo student and the next two existing students of 7-A, all in the same state (every step
 * is in demo-reset-core.ts). With a phone number, only that student is reset.
 * The app runs the same reset every night at 00:10 school time (DemoWeekJob, DEMO_MODE only).
 * Afterwards it translates the class's subject, chapter, topic, quiz and homework names into
 * Russian and English (cached in text_translations; only new ones call the AI), so the app shows
 * them at once with Accept-Language ru / en.
 * History is kept: attendance, grades, the seeded notifications and older submissions.
 * Generated questions, confirmation questions and textbook content are kept.
 *
 * Only runs with DEMO_MODE=true. Uses DATABASE_URL when set (e.g. production), else PG_*.
 */
import { ConfigService } from "@nestjs/config";
import { readAiConfig } from "../modules/ai/ai.config";
import { createLlmService } from "../modules/ai/ai.module";
import { TranslationService } from "../modules/ai/translation/translation.service";
import dataSource from "./data-source";
import {
  demoContentTexts,
  demoStudents,
  describeProgress,
  findStudents,
  resetDemoStudents,
} from "./demo-reset-core";
import { deleteUploadedFiles } from "./demo-school";

/** The database name only, never the host or the credentials. */
function databaseName(): string {
  const options = dataSource.options as { url?: string; database?: string };
  if (options.url) return new URL(options.url).pathname.replace(/^\//, "");
  return options.database ?? "?";
}

async function main() {
  if (process.env.DEMO_MODE?.trim() !== "true") {
    throw new Error("refusing to run: DEMO_MODE is not true");
  }
  const phone = process.argv[2]?.trim();
  await dataSource.initialize();
  try {
    console.log(`Resetting demo students in database "${databaseName()}"`);
    const { students, removedFiles } = await dataSource.transaction(
      async (manager) => {
        const chosen = phone
          ? await findStudents(manager, [phone])
          : await demoStudents(manager);
        if (!chosen.length) {
          throw new Error(
            phone
              ? `no student with phone ${phone}`
              : "the demo student is not in the demo school's 7-A (run seed:mvp)",
          );
        }
        return resetDemoStudents(manager, { students: chosen });
      },
    );
    await deleteUploadedFiles(removedFiles);
    for (const { student, counts, progress } of students) {
      console.log(`\n${student.name} (${student.phone}, id ${student.id})`);
      for (const [label, count] of Object.entries(counts)) {
        console.log(`  ${label}: ${count}`);
      }
      console.log(`  ${describeProgress(progress)}`);
      console.log(`  mastered: ${progress?.mastered.join(", ") || "-"}`);
    }
    await prewarmTranslations(students.map(({ student }) => student.id));
    console.log("\nReady to log in (password: SEED_DEMO_PASSWORD):");
    for (const { student } of students) {
      console.log(`  ${student.phone}  ${student.name}`);
    }
    console.log(
      "Done. Generated questions and textbook content were not touched.",
    );
  } finally {
    await dataSource.destroy();
  }
}

/** Never fails the reset: without the AI the app shows these names in Uzbek. */
async function prewarmTranslations(studentIds: number[]): Promise<void> {
  try {
    const texts = await demoContentTexts(dataSource.manager, studentIds);
    const translation = new TranslationService(
      dataSource,
      createLlmService(readAiConfig(new ConfigService())),
    );
    console.log(`\nTranslations of ${texts.length} content names:`);
    const results = await Promise.all(
      (["ru", "en"] as const).map((language) =>
        translation.prewarm(texts, language),
      ),
    );
    for (const [i, language] of (["ru", "en"] as const).entries()) {
      const r = results[i];
      console.log(
        `  ${language}: ${r.texts - r.missing} of ${r.texts} ready (${r.translated} newly translated)` +
          (r.missing ? `, ${r.missing} still in Uzbek (AI unavailable)` : ""),
      );
    }
  } catch (error) {
    console.log(
      `\nTranslations skipped: ${(error as Error).message}. The app shows these names in Uzbek until they are translated.`,
    );
  }
}

main().catch((error: Error) => {
  console.error(`demo:reset failed: ${error.message}`);
  process.exit(1);
});
