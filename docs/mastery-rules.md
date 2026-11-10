# Mastery and unlock rules

How the student app decides each topic's status and whether it is unlocked.
`GET /api/me/mastery` returns both for every topic of the student's subjects, in book order.

## Topic status

Checked top to bottom; the first rule that matches wins.

| Status | When | Set by |
|---|---|---|
| `mastered` | The student passed the Tushuntir checkpoint for the topic (`topic_mastery.is_mastered = true`). | `POST /me/checkpoints/:id/answer` with outcome `passed` |
| `needs_help` | 3 or more `not_yet` checkpoint tries since the last pass. | Derived from `checkpoint_attempts`; the 3rd failed try notifies the class's subject teacher (notification type `needs_help`) |
| `not_started` | No quiz submitted for the topic yet (no `topic_mastery` row). | — |
| `in_progress` | Latest quiz score (lesson or practice quiz) is 80% or more. | `POST /me/attempts/:id/submit` |
| `needs_practice` | Latest quiz score is below 80%. | `POST /me/attempts/:id/submit` |

Notes:
- `mastered` stays once earned. A later failed checkpoint try does not take it away. Three failed tries after a pass still notify the teacher, and `GET /me/topics/:id/checkpoint/status` shows `needsHelp: true`.
- A student who keeps trying is never blocked: tries are unlimited, also in `needs_help`.
- `GET /me/weak-topics` lists the topics in `needs_practice` or `needs_help`, with the sub-skills that went wrong.

## Checkpoint pass rule

- The student explains the topic to the AI classmate Sardor by voice or text.
- The answer is judged against the topic's `key_ideas` by meaning, not wording. Speech-recognition errors and Uzbek-Russian mixing are accepted.
- **Pass:** at least 80% of the key ideas are covered (4 of 5, or 4 of 4) and there is no wrong statement.
- **Follow-up:** if the first answer of a try misses ideas, Sardor asks one follow-up question. The try is then judged on both answers together.
- **Not yet:** the student gets a short explanation of what was missing, and the next try opens with a new question.

## Unlock rule

- A topic is **unlocked** when any of these holds:
  - it is the first topic of its textbook;
  - the topic before it is `mastered`;
  - it is `mastered` itself. The timetable can teach topics out of book order, and a mastered topic is never shown as locked.
- **Book order:** chapter number, then topic position, then id.
- `unlocked` is **information only**. Lessons, the textbook, quizzes, practice and the checkpoint stay open for locked topics too, because the timetable decides what is taught each day. The app can show a lock icon or "Avvalgi mavzuni o'zlashtiring" ("Master the previous topic first").
- A passed checkpoint returns `nextTopic` with the topic it unlocked.

## Where the rules live in code

- `src/modules/me/me.types.ts`:
  - `masteryStatus()`
  - `MASTERY_PASS_PERCENT` (80)
  - `CHECKPOINT_PASS_SHARE` (0.8)
  - `NEEDS_HELP_AFTER_TRIES` (3)
- `src/modules/me/student-schedule.service.ts`:
  - `mastery()`: status and unlocked per topic;
  - `checkpointStats()`.
