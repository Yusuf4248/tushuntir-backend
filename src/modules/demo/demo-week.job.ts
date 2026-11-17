import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DataSource } from "typeorm";
import { addDays, isoWeekday, localDate } from "../../common/school-time";
import { demoClassId, ensureWeekLessons } from "../../database/demo-week";
import { demoModeEnabled } from "./demo.service";

/**
 * Keeps the demo class's current week filled: every day at 00:10 school time (and once at
 * startup) it creates this week's missing lessons and lesson quizzes from the timetable, the
 * same as seed:mvp, without AI calls. Existing lessons are left as they are. Only with
 * DEMO_MODE=true, and only for the demo school; a real school's lessons are never created.
 */
@Injectable()
export class DemoWeekJob implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoWeekJob.name);

  constructor(private readonly dataSource: DataSource) {}

  onApplicationBootstrap(): void {
    // Not awaited: startup does not wait for it, and a failure is only logged.
    void this.run("startup");
  }

  // The time zone is read when the class loads; APP_TIMEZONE defaults to the same value.
  @Cron("10 0 * * *", {
    name: "demo-week",
    timeZone: process.env.APP_TIMEZONE?.trim() || "Asia/Tashkent",
  })
  async daily(): Promise<void> {
    await this.run("daily");
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
}
