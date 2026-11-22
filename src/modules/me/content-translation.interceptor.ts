import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  StreamableFile,
} from "@nestjs/common";
import { from, mergeMap, Observable } from "rxjs";
import { parseAcceptLanguage } from "../../common/i18n/language";
import { StudentTranslator, TranslationBatch } from "./student-translator";

/** Fields holding a content title anywhere in a /me response. */
const TITLE_KEYS = new Set(["title", "topicTitle", "subjectName"]);

function isWalkable(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Date) &&
    !(value instanceof StreamableFile) &&
    !ArrayBuffer.isView(value)
  );
}

/**
 * Queues the content names of a /me response for translation, in place:
 * - `title`, `topicTitle`, `subjectName` anywhere (topics, chapters, quizzes, homework, lessons);
 * - `subject`: a subject name string, or a `{ id, name }` reference;
 * - `name` of a /me/subjects item (it has `topicsTotal`);
 * - `body` of a notification (it has `readAt`).
 * People's names, classes, terms, answers and texts the student wrote are not touched.
 */
export function queueContentTexts(
  value: unknown,
  batch: TranslationBatch,
): void {
  if (Array.isArray(value)) {
    for (const item of value) queueContentTexts(item, batch);
    return;
  }
  if (!isWalkable(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "string") {
      if (
        TITLE_KEYS.has(key) ||
        key === "subject" ||
        (key === "name" && "topicsTotal" in value) ||
        (key === "body" && "readAt" in value)
      ) {
        batch.text(child, (t) => (value[key] = t));
      }
    } else if (
      key === "subject" &&
      isWalkable(child) &&
      typeof child.name === "string"
    ) {
      batch.text(child.name, (t) => (child.name = t));
    } else {
      queueContentTexts(child, batch);
    }
  }
}

/**
 * With Accept-Language ru or en, translates the content names in a /me response (subjects,
 * topics, quizzes, lessons' topics, homework titles, notification texts) through the cached
 * TranslationService. Uzbek requests pass through untouched. If translating fails the response
 * keeps its Uzbek texts.
 */
@Injectable()
export class ContentTranslationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ContentTranslationInterceptor.name);

  constructor(private readonly translator: StudentTranslator) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const language = parseAcceptLanguage(
      context.switchToHttp().getRequest().headers["accept-language"],
    );
    if (language === "uz") return next.handle();
    return next.handle().pipe(
      mergeMap((body: unknown) =>
        from(
          (async () => {
            try {
              const batch = this.translator.batch(language);
              queueContentTexts(body, batch);
              await batch.run();
            } catch (error) {
              this.logger.warn(
                `content names left in Uzbek: ${(error as Error).message}`,
              );
            }
            return body;
          })(),
        ),
      ),
    );
  }
}
