import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/** Languages the student app can show AI replies and quiz questions in; Uzbek is the default. */
export const APP_LANGUAGES = ["uz", "ru", "en"] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = "uz";

/**
 * The first supported language in an Accept-Language header, by quality ("ru-RU,ru;q=0.9" → ru,
 * "en-US" → en); uz when the header is missing or names none of uz / ru / en.
 */
export function parseAcceptLanguage(
  header: string | string[] | undefined,
): AppLanguage {
  const value = Array.isArray(header) ? header.join(",") : (header ?? "");
  const ranked = value
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return {
        primary: tag.split("-")[0],
        quality: q ? Number(q.slice(2)) || 0 : 1,
        index,
      };
    })
    .filter((entry) => entry.primary && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  const match = ranked.find((entry) =>
    (APP_LANGUAGES as readonly string[]).includes(entry.primary),
  );
  return (match?.primary as AppLanguage | undefined) ?? DEFAULT_LANGUAGE;
}

/** The request's language from its Accept-Language header (uz by default). */
export const Lang = createParamDecorator(
  (_: unknown, context: ExecutionContext): AppLanguage =>
    parseAcceptLanguage(
      context.switchToHttp().getRequest().headers["accept-language"],
    ),
);
