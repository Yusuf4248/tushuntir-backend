// Enums from docs/school-platform.dbml. The Postgres enum type names match the DBML.

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  TEACHER = "teacher",
  STUDENT = "student",
  PARENT = "parent",
}

export enum SchoolType {
  PUBLIC = "public",
  PRIVATE = "private",
}

export enum Shift {
  FIRST = "first",
  SECOND = "second",
  THIRD = "third",
}

export enum RoomType {
  CLASSROOM = "classroom",
  COMPUTER_LAB = "computer_lab",
  OTHER = "other",
}

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  EXCUSED = "excused",
}

export enum SubmissionStatus {
  SUBMITTED = "submitted",
  CHECKED = "checked",
  RETURNED = "returned",
  LATE = "late",
}

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  SHORT_ANSWER = "short_answer",
}

export enum QuestionStatus {
  DRAFT = "draft",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum QuizKind {
  PRACTICE = "practice",
  HOMEWORK = "homework",
  EXTRA_LESSON = "extra_lesson",
  MONTHLY_EXAM = "monthly_exam",
}

export enum AttemptMode {
  HOME = "home",
  EXAM = "exam",
}

export enum FlagStatus {
  OPEN = "open",
  REVIEWED = "reviewed",
  DISMISSED = "dismissed",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

/** Every role except super_admin belongs to exactly one school. */
export const SCHOOL_ROLES = [
  UserRole.ADMIN,
  UserRole.TEACHER,
  UserRole.STUDENT,
  UserRole.PARENT,
];

export const ALL_ROLES = Object.values(UserRole);

/** Roles that may use the admin-panel CRUD endpoints in this phase. */
export const ADMIN_PANEL_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
