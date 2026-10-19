import { BadRequestException } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Lesson } from "../../daily/lessons/entities/lesson.entity";
import { TeacherAssignment } from "../teacher-assignments/entities/teacher-assignment.entity";
import { ClassStudent } from "./entities/class-student.entity";

/** Throws 400 unless every student is enrolled in the class taught by the teacher assignment. */
export async function assertEnrolledForAssignment(
  manager: EntityManager,
  teacherAssignmentId: number,
  studentIds: number[],
): Promise<void> {
  const assignment = await manager.findOne(TeacherAssignment, {
    where: { id: teacherAssignmentId },
    select: { id: true, classId: true },
  });
  if (!assignment) return; // reported as 404 by the reference check
  const enrolled = await manager
    .createQueryBuilder(ClassStudent, "enrolment")
    .select("enrolment.studentId", "studentId")
    .where("enrolment.classId = :classId", { classId: assignment.classId })
    .andWhere("enrolment.studentId IN (:...studentIds)", { studentIds })
    .getRawMany<{ studentId: number }>();
  const found = new Set(enrolled.map((row) => Number(row.studentId)));
  const missing = studentIds.filter((id) => !found.has(id));
  if (missing.length) {
    throw new BadRequestException(
      `Not enrolled in class ${assignment.classId}: student ${missing.join(", ")}`,
    );
  }
}

/** Same check, starting from a lesson. */
export async function assertEnrolledForLesson(
  manager: EntityManager,
  lessonId: number,
  studentIds: number[],
): Promise<void> {
  const lesson = await manager.findOne(Lesson, {
    where: { id: lessonId },
    select: { id: true, teacherAssignmentId: true },
  });
  if (!lesson) return; // reported as 404 by the reference check
  await assertEnrolledForAssignment(
    manager,
    lesson.teacherAssignmentId,
    studentIds,
  );
}
