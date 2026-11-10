export enum LessonStatus {
  UPCOMING = "upcoming",
  IN_PROGRESS = "in_progress",
  FINISHED = "finished",
}

/** locked: the lesson has not ended yet; done: submitted; overdue: deadline passed without a submission */
export enum StudentQuizStatus {
  LOCKED = "locked",
  AVAILABLE = "available",
  DONE = "done",
  OVERDUE = "overdue",
}

export enum MasteryStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  NEEDS_PRACTICE = "needs_practice",
  /** Three failed checkpoint tries since the last pass; the teacher is notified */
  NEEDS_HELP = "needs_help",
  MASTERED = "mastered",
}

/** Questions per lesson quiz attempt (fewer if the approved pool is smaller). */
export const QUESTIONS_PER_ATTEMPT = 10;

/** Quiz score (percent) needed for a topic to count as in progress rather than needing practice. */
export const MASTERY_PASS_PERCENT = 80;

/**
 * Topic mastery rule (part 1):
 * - no topic_mastery row → not_started
 * - is_mastered (set by the voice checkpoint in part 2) → mastered
 * - latest home quiz score ≥ 80% → in_progress
 * - otherwise → needs_practice
 */
export function masteryStatus(
  row:
    | { is_mastered: boolean | null; home_score: string | number | null }
    | undefined,
): MasteryStatus {
  if (!row) return MasteryStatus.NOT_STARTED;
  if (row.is_mastered) return MasteryStatus.MASTERED;
  if (
    row.home_score !== null &&
    Number(row.home_score) >= MASTERY_PASS_PERCENT
  ) {
    return MasteryStatus.IN_PROGRESS;
  }
  return MasteryStatus.NEEDS_PRACTICE;
}
