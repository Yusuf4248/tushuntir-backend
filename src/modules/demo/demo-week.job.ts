import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { DataSource } from "typeorm";
import { addDays, isoWeekday, localDate } from "../../common/school-time";
import {
  describeProgress,
  resetDemoStudents,
} from "../../database/demo-reset-core";
import { deleteUploadedFiles } from "../../database/demo-school";
import { demoClassId, ensureWeekLessons } from "../../database/demo-week";
import { demoModeEnabled } from "./demo.service";

const JOB_NAME = "demo-week";

/**
 * Keeps the demo class ready, only with DEMO_MODE=true and only for the demo school; a real
 * school's lessons and students are never touched.
 * - At startup: creates this week's missing lessons and lesson quizzes from the timetable (the
 *   same as seed:mvp, without AI calls), and logs when the nightly run is next due. A restart
 *   never resets students, so it cannot wipe a demo in progress.
 * - Every day at 00:10 school time, weekends included: runs the same reset as `npm run
 *   demo:reset` (demo-reset-core.ts), so each day starts with a fresh "Bugungi vazifa" for the
 *   demo students.
 */
@Injectable()
export class DemoWeekJob implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoWeekJob.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    if (!demoModeEnabled()) return;
    try {
      const next = this.scheduler.getCronJob(JOB_NAME).nextDate();
      this.logger.log(
        `demo reset scheduled daily at 00:10 ${timeZone()}, next run ${next.toISO()}`,
      );
    } catch (error) {
      this.logger.error(
        `demo reset is not scheduled: ${(error as Error).message}`,
      );
    }
    // Not awaited: startup does not wait for it, and a failure is only logged.
    void this.run("startup");
  }

  @Cron("10 0 * * *", { name: JOB_NAME, timeZone: timeZone() })
  async daily(): Promise<void> {
    await this.reset("daily");
  }

  async run(reason: string): Promise<number | null> {
    if (!demoModeEnabled()) return null;
    try {
      const created = await this.dataSource.transaction(async (manager) => {
        const classId = await demoClassId(manager);
        if (!classId) return null;
        const today = localDate();
        const monday = addDays(today, 1 - isoWeekday(today));
        return (
          await ensureWeekLessons(manager, { classId, monday, update: false })
        ).created;
      });
      if (created === null) {
        this.logger.log(`demo week (${reason}): no demo school, skipped`);
      } else {
        this.logger.log(`demo week (${reason}): ${created} lesson(s) created`);
      }
      return created;
    } catch (error) {
      this.logger.error(
        `demo week (${reason}) failed: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /** The demo:reset steps for the demo students; returns how many were reset. */
  async reset(reason: string, now = new Date()): Promise<number | null> {
    if (!demoModeEnabled()) return null;
    try {
      const { students, removedFiles } = await this.dataSource.transaction(
        (manager) => resetDemoStudents(manager, { now }),
      );
      await deleteUploadedFiles(removedFiles);
      if (!students.length) {
        this.logger.log(`demo reset (${reason}): no demo students, skipped`);
      }
      for (const { student, progress } of students) {
        this.logger.log(
          `demo reset (${reason}): ${student.phone} ${describeProgress(progress)}`,
        );
      }
      return students.length;
    } catch (error) {
      this.logger.error(
        `demo reset (${reason}) failed: ${(error as Error).message}`,
      );
      return null;
    }
  }
}

/** Read when the class loads; APP_TIMEZONE defaults to the same value. */
function timeZone(): string {
  return process.env.APP_TIMEZONE?.trim() || "Asia/Tashkent";
}
