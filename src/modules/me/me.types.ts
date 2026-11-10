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

export enum CheckpointResult {
  PASSED = "passed",
  NOT_YET = "not_yet",
}

/** Share of a topic's key ideas a checkpoint explanation must cover (and no wrong statement). */
export const CHECKPOINT_PASS_SHARE = 0.8;

/** Failed checkpoint tries since the last pass after which the topic needs the teacher's help. */
export const NEEDS_HELP_AFTER_TRIES = 3;

/**
 * Topic mastery rule:
 * - is_mastered (set when the Tushuntir checkpoint is passed) → mastered
 * - 3 or more not_yet checkpoint tries since the last pass → needs_help
 * - no topic_mastery row → not_started
 * - latest quiz score ≥ 80% → in_progress
 * - otherwise → needs_practice
 */
export function masteryStatus(
  row:
    | { is_mastered: boolean | null; home_score: string | number | null }
    | undefined,
  notYetSinceLastPass = 0,
): MasteryStatus {
  if (row?.is_mastered) return MasteryStatus.MASTERED;
  if (notYetSinceLastPass >= NEEDS_HELP_AFTER_TRIES) {
    return MasteryStatus.NEEDS_HELP;
  }
  if (!row) return MasteryStatus.NOT_STARTED;
  if (
    row.home_score !== null &&
    Number(row.home_score) >= MASTERY_PASS_PERCENT
  ) {
    return MasteryStatus.IN_PROGRESS;
  }
  return MasteryStatus.NEEDS_PRACTICE;
}
