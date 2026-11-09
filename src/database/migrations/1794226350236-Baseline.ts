import { MigrationInterface, QueryRunner } from "typeorm";

export class Baseline1794226350236 implements MigrationInterface {
  name = "Baseline1794226350236";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."school_type" AS ENUM('public', 'private')`,
    );
    await queryRunner.query(
      `CREATE TABLE "schools" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "region" character varying NOT NULL, "district" character varying NOT NULL, "type" "public"."school_type" NOT NULL, "emaktab_id" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_95b932e47ac129dd8e23a0db548" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."room_type" AS ENUM('classroom', 'computer_lab', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "rooms" ("id" SERIAL NOT NULL, "school_id" integer NOT NULL, "name" character varying, "type" "public"."room_type" DEFAULT 'classroom', "seats" smallint, CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rooms_school_id" ON "rooms" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "subjects" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "code" character varying(32), CONSTRAINT "UQ_542cbba74dde3c82ab49c573109" UNIQUE ("code"), CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "textbooks" ("id" SERIAL NOT NULL, "subject_id" integer NOT NULL, "grade" smallint NOT NULL, "title" character varying, "language" character varying, "edition_year" smallint, CONSTRAINT "CHK_textbooks_grade" CHECK ("grade" BETWEEN 5 AND 11), CONSTRAINT "PK_9eca826babdc2aac3dd8534ad69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chapters" ("id" SERIAL NOT NULL, "textbook_id" integer NOT NULL, "number" smallint, "title" character varying, CONSTRAINT "PK_a2bbdbb4bdc786fe0cb0fcfc4a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "topics" ("id" SERIAL NOT NULL, "chapter_id" integer NOT NULL, "position" smallint, "title" character varying NOT NULL, "is_exam_topic" boolean DEFAULT false, CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'teacher', 'student', 'parent')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "school_id" integer, "role" "public"."user_role" NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone" character varying(32), "email" character varying, "password_hash" character varying NOT NULL, "language" character varying DEFAULT 'uz', "is_active" boolean DEFAULT true, "last_login_at" TIMESTAMP WITH TIME ZONE, "refresh_token_hash" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_school_id" ON "users" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "support_groups" ("id" SERIAL NOT NULL, "school_id" integer NOT NULL, "topic_id" integer NOT NULL, "teacher_id" integer NOT NULL, "room_id" integer, "scheduled_at" TIMESTAMP WITH TIME ZONE, "status" character varying, CONSTRAINT "PK_db127a199a4608510d5922a0f08" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_groups_school_id" ON "support_groups" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "support_group_students" ("id" SERIAL NOT NULL, "support_group_id" integer NOT NULL, "student_id" integer NOT NULL, "attended" boolean, CONSTRAINT "UQ_support_group_students_group_student" UNIQUE ("support_group_id", "student_id"), CONSTRAINT "PK_9ae26576a13987246f7c9cd54e9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_group_students_student_id" ON "support_group_students" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "type" character varying, "title" character varying, "body" text, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "academic_years" ("id" SERIAL NOT NULL, "school_id" integer NOT NULL, "name" character varying, "starts_on" date, "ends_on" date, "is_current" boolean DEFAULT false, CONSTRAINT "PK_2021b90bfbfa6c9da7df34ca1cf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_academic_years_school_id" ON "academic_years" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."shift" AS ENUM('first', 'second', 'third')`,
    );
    await queryRunner.query(
      `CREATE TABLE "classes" ("id" SERIAL NOT NULL, "school_id" integer NOT NULL, "academic_year_id" integer NOT NULL, "homeroom_teacher_id" integer, "grade" smallint NOT NULL, "letter" character varying(5) NOT NULL, "shift" "public"."shift" DEFAULT 'first', CONSTRAINT "UQ_classes_school_year_grade_letter" UNIQUE ("school_id", "academic_year_id", "grade", "letter"), CONSTRAINT "CHK_classes_grade" CHECK ("grade" BETWEEN 5 AND 11), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "teacher_assignments" ("id" SERIAL NOT NULL, "teacher_id" integer NOT NULL, "class_id" integer NOT NULL, "subject_id" integer NOT NULL, CONSTRAINT "UQ_teacher_assignments_teacher_class_subject" UNIQUE ("teacher_id", "class_id", "subject_id"), CONSTRAINT "PK_49fabd5cfe8fa2beb47a0b0fed9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teacher_assignments_class_id" ON "teacher_assignments" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "terms" ("id" SERIAL NOT NULL, "academic_year_id" integer NOT NULL, "name" character varying, "starts_on" date, "ends_on" date, CONSTRAINT "PK_33b6fe77d6ace7ff43cc8a65958" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_terms_academic_year_id" ON "terms" ("academic_year_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "timetable_slots" ("id" SERIAL NOT NULL, "teacher_assignment_id" integer NOT NULL, "room_id" integer, "term_id" integer, "weekday" smallint, "period" smallint, "starts_at" TIME, "ends_at" TIME, CONSTRAINT "CHK_timetable_slots_weekday" CHECK ("weekday" BETWEEN 1 AND 6), CONSTRAINT "PK_b2253a56b9d36d00f84aff7efcc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_timetable_slots_teacher_assignment_id" ON "timetable_slots" ("teacher_assignment_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "class_students" ("id" SERIAL NOT NULL, "class_id" integer NOT NULL, "student_id" integer NOT NULL, "joined_on" date, CONSTRAINT "UQ_class_students_class_student" UNIQUE ("class_id", "student_id"), CONSTRAINT "PK_f1ef7a4fd2eabf7ef3c6bc7cae3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_students_student_id" ON "class_students" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "topic_mastery" ("id" SERIAL NOT NULL, "student_id" integer NOT NULL, "topic_id" integer NOT NULL, "mastery" smallint, "home_score" numeric(5,2), "exam_score" numeric(5,2), "is_mastered" boolean DEFAULT false, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_topic_mastery_student_topic" UNIQUE ("student_id", "topic_id"), CONSTRAINT "CHK_topic_mastery_mastery" CHECK ("mastery" BETWEEN 0 AND 100), CONSTRAINT "PK_2849b7bdcf158f371e805673287" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_topic_mastery_topic_id" ON "topic_mastery" ("topic_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "textbook_chunks" ("id" SERIAL NOT NULL, "topic_id" integer NOT NULL, "page" smallint, "content" text NOT NULL, CONSTRAINT "PK_7667d7c87772a7e0d33438e1278" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_textbook_chunks_topic_id" ON "textbook_chunks" ("topic_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_kind" AS ENUM('practice', 'homework', 'extra_lesson', 'monthly_exam')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quizzes" ("id" SERIAL NOT NULL, "topic_id" integer, "class_id" integer, "created_by" integer, "kind" "public"."quiz_kind" NOT NULL, "title" character varying, "time_limit_min" smallint, "shuffle_questions" boolean DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quizzes_topic_id" ON "quizzes" ("topic_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quizzes_class_id" ON "quizzes" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'short_answer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."question_status" AS ENUM('draft', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" SERIAL NOT NULL, "topic_id" integer NOT NULL, "source_chunk_id" integer, "approved_by" integer, "type" "public"."question_type" NOT NULL, "prompt" text NOT NULL, "options" jsonb, "correct_answer" text NOT NULL, "hint" text, "difficulty" smallint, "generated_by_ai" boolean DEFAULT true, "status" "public"."question_status" DEFAULT 'draft', "approved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_questions_difficulty" CHECK ("difficulty" BETWEEN 1 AND 3), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_questions_topic_id" ON "questions" ("topic_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_questions" ("id" SERIAL NOT NULL, "quiz_id" integer NOT NULL, "question_id" integer NOT NULL, "position" smallint, "points" smallint DEFAULT '1', CONSTRAINT "UQ_quiz_questions_quiz_question" UNIQUE ("quiz_id", "question_id"), CONSTRAINT "PK_ec0447fd30d9f5c182e7653bfd3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "exam_sessions" ("id" SERIAL NOT NULL, "school_id" integer NOT NULL, "quiz_id" integer NOT NULL, "room_id" integer, "supervisor_id" integer, "starts_at" TIMESTAMP WITH TIME ZONE, "ends_at" TIMESTAMP WITH TIME ZONE, "access_code" character varying(32), CONSTRAINT "PK_e7864af3b38e87bb9ca90d96322" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_sessions_school_id" ON "exam_sessions" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_sessions_quiz_id" ON "exam_sessions" ("quiz_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attempt_mode" AS ENUM('home', 'exam')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attempts" ("id" SERIAL NOT NULL, "quiz_id" integer NOT NULL, "student_id" integer NOT NULL, "exam_session_id" integer, "mode" "public"."attempt_mode" NOT NULL, "score_percent" numeric(5,2), "started_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "finished_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_295ca261e361fd2fd217754dcac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attempts_quiz_id" ON "attempts" ("quiz_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attempts_student_id" ON "attempts" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attempts_exam_session_id" ON "attempts" ("exam_session_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attempt_answers" ("id" SERIAL NOT NULL, "attempt_id" integer NOT NULL, "question_id" integer NOT NULL, "answer" text, "is_correct" boolean, "hints_used" smallint DEFAULT '0', "points_earned" numeric(5,2), "ai_feedback" text, CONSTRAINT "PK_b5f6f0c32809f5b14da916e6f06" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attempt_answers_attempt_id" ON "attempt_answers" ("attempt_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_sessions" ("id" SERIAL NOT NULL, "student_id" integer NOT NULL, "subject_id" integer NOT NULL, "topic_id" integer, "kind" character varying, "started_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "ended_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_4a05e88d377dad1c58c3cb95c04" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_sessions_student_id" ON "ai_sessions" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_messages" ("id" SERIAL NOT NULL, "session_id" integer NOT NULL, "role" character varying, "content" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a390434d4a515ba18a41bc996c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_messages_session_id" ON "ai_messages" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "parent_students" ("id" SERIAL NOT NULL, "parent_id" integer NOT NULL, "student_id" integer NOT NULL, "relation" character varying, CONSTRAINT "UQ_parent_students_parent_student" UNIQUE ("parent_id", "student_id"), CONSTRAINT "PK_2707b9be03fad93515167debe7a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parent_students_student_id" ON "parent_students" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "media_files" ("id" SERIAL NOT NULL, "uploaded_by" integer, "url" character varying NOT NULL, "mime_type" character varying, "size_bytes" bigint, "original_name" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_93b4da6741cd150e76f9ac035d8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lessons" ("id" SERIAL NOT NULL, "teacher_assignment_id" integer NOT NULL, "timetable_slot_id" integer, "topic_id" integer, "date" date NOT NULL, "notes" text, CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lessons_teacher_assignment_id" ON "lessons" ("teacher_assignment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lessons_topic_id" ON "lessons" ("topic_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "homework" ("id" SERIAL NOT NULL, "lesson_id" integer NOT NULL, "quiz_id" integer, "created_by" integer, "title" character varying NOT NULL, "description" text, "due_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_90dbf463ef94040ed137c4fd38d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_homework_lesson_id" ON "homework" ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."submission_status" AS ENUM('submitted', 'checked', 'returned', 'late')`,
    );
    await queryRunner.query(
      `CREATE TABLE "homework_submissions" ("id" SERIAL NOT NULL, "homework_id" integer NOT NULL, "student_id" integer NOT NULL, "checked_by" integer, "answer_text" text, "status" "public"."submission_status" DEFAULT 'submitted', "score" smallint, "feedback" text, "submitted_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "checked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_homework_submissions_homework_student" UNIQUE ("homework_id", "student_id"), CONSTRAINT "PK_4c570ffb4ce1a34b63afa9d1b26" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_homework_submissions_student_id" ON "homework_submissions" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attachments" ("id" SERIAL NOT NULL, "media_file_id" integer NOT NULL, "entity_type" character varying NOT NULL, "entity_id" integer NOT NULL, CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "grades" ("id" SERIAL NOT NULL, "student_id" integer NOT NULL, "teacher_assignment_id" integer NOT NULL, "lesson_id" integer, "kind" character varying, "value" smallint, "comment" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_grades_value" CHECK ("value" BETWEEN 2 AND 5), CONSTRAINT "PK_4740fb6f5df2505a48649f1687b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grades_student_id" ON "grades" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grades_teacher_assignment_id" ON "grades" ("teacher_assignment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grades_lesson_id" ON "grades" ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendance" ("id" SERIAL NOT NULL, "lesson_id" integer NOT NULL, "student_id" integer NOT NULL, "status" "public"."attendance_status" NOT NULL, "note" character varying, CONSTRAINT "UQ_attendance_lesson_student" UNIQUE ("lesson_id", "student_id"), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_student_id" ON "attendance" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."flag_status" AS ENUM('open', 'reviewed', 'dismissed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "integrity_flags" ("id" SERIAL NOT NULL, "student_id" integer NOT NULL, "topic_id" integer NOT NULL, "exam_session_id" integer NOT NULL, "reviewed_by" integer, "home_score" numeric(5,2), "exam_score" numeric(5,2), "gap" numeric(5,2), "status" "public"."flag_status" DEFAULT 'open', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_519c19074981f9e2a04d85015a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_integrity_flags_student_id" ON "integrity_flags" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "exam_session_students" ("id" SERIAL NOT NULL, "exam_session_id" integer NOT NULL, "student_id" integer NOT NULL, "seat" character varying(16), "status" character varying, CONSTRAINT "UQ_exam_session_students_session_student" UNIQUE ("exam_session_id", "student_id"), CONSTRAINT "PK_df3f80f69977a6feb533a2e91aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_session_students_student_id" ON "exam_session_students" ("student_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "FK_ffaac60590923112dad474b21dc" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "textbooks" ADD CONSTRAINT "FK_184f2328471d54b750f7e11a183" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" ADD CONSTRAINT "FK_377d96dec58a045075b0c991847" FOREIGN KEY ("textbook_id") REFERENCES "textbooks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "topics" ADD CONSTRAINT "FK_2f2a189343a6f07bb29954402fb" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_25e1cf8f41bae2f3d11f3c2a028" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_groups" ADD CONSTRAINT "FK_c12573410e23aaf76db79995f13" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_groups" ADD CONSTRAINT "FK_1b56ad02e1b1daeef4a07bceed3" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_groups" ADD CONSTRAINT "FK_423e501ffea81eeb609a2faf984" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_groups" ADD CONSTRAINT "FK_91eb03777b17f452557800404a6" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_group_students" ADD CONSTRAINT "FK_67eb3ba1bb633219bc682e4cc35" FOREIGN KEY ("support_group_id") REFERENCES "support_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_group_students" ADD CONSTRAINT "FK_6ac0529ef0499fe36b53ae4b494" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_years" ADD CONSTRAINT "FK_b293eb7909d2a3aae86c4380713" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ADD CONSTRAINT "FK_398f3990f5da4a1efda173f576f" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ADD CONSTRAINT "FK_28b990f2f869e1d1652a15388f5" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ADD CONSTRAINT "FK_5f17c07d8e2590c3c148b173363" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_assignments" ADD CONSTRAINT "FK_a063342479f3789f5ff6f22aa6b" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_assignments" ADD CONSTRAINT "FK_c1bd828e100d9b3c72402672938" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_assignments" ADD CONSTRAINT "FK_05177d586094d252e606df5025f" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms" ADD CONSTRAINT "FK_733590da28e000d72a406ff95a9" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetable_slots" ADD CONSTRAINT "FK_2fff1d74845104651c407c7cc00" FOREIGN KEY ("teacher_assignment_id") REFERENCES "teacher_assignments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetable_slots" ADD CONSTRAINT "FK_66b6e21ea6eb2501fe4608b5fa0" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetable_slots" ADD CONSTRAINT "FK_0a2d353505804706efb1daa6fff" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ADD CONSTRAINT "FK_43e081daadb906f3dc41bb267dd" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ADD CONSTRAINT "FK_6d12f65ab61f9f92e3d7e95ad23" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "topic_mastery" ADD CONSTRAINT "FK_d905f2abb6c39a887c47973392c" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "topic_mastery" ADD CONSTRAINT "FK_5948fa9e6bfef2b4367135b4deb" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "textbook_chunks" ADD CONSTRAINT "FK_e5d62b76416d91b3829ff0f10da" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_f9e23f0ec70c755515c8a394923" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_8b37654ebf6552df74c2425719e" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_4eb3cacff4db73542f37b5a4358" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_ce6cbf3cfa665d1199cacc8e2c2" FOREIGN KEY ("source_chunk_id") REFERENCES "textbook_chunks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_b03a4a9cb6c0784ba04a85bb1d6" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD CONSTRAINT "FK_14c6d2b8f5be0bdb406a3895bb4" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD CONSTRAINT "FK_cc21f101ddb63427e884d2188b4" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_sessions" ADD CONSTRAINT "FK_2822a286ace25f9ce58a57c1cf0" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_sessions" ADD CONSTRAINT "FK_5d08edf7f88087da41ceaa724da" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_sessions" ADD CONSTRAINT "FK_b25307413c050fa04c3758893b7" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_sessions" ADD CONSTRAINT "FK_29c54aa17d9d2919dda52efc855" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD CONSTRAINT "FK_249da279880fff0c23541e52515" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD CONSTRAINT "FK_cd366222554b0598bc644d23698" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD CONSTRAINT "FK_c4a49151cdbbaeff4f236d70e9a" FOREIGN KEY ("exam_session_id") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_32015c863766540050618a1165c" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_fff29b83c9965e08837b508f0cd" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_sessions" ADD CONSTRAINT "FK_79fe568996ed8cc4ec13b68e23e" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_sessions" ADD CONSTRAINT "FK_6b896bf8e5b5c8a1bd4ebcafac0" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_sessions" ADD CONSTRAINT "FK_553b4712a804c4966b3ea11dfc4" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ADD CONSTRAINT "FK_402f61f62d315cff443ee262f2d" FOREIGN KEY ("session_id") REFERENCES "ai_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_students" ADD CONSTRAINT "FK_0b5ad7b1365e1d5e0181e86cbc5" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_students" ADD CONSTRAINT "FK_5b645c512c1e80fa277f034ab6c" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" ADD CONSTRAINT "FK_78f2e01705ad1a9b77ef3ee3777" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "FK_aae46d2f0937b41ab720d4d773d" FOREIGN KEY ("teacher_assignment_id") REFERENCES "teacher_assignments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "FK_a9ba2f51d96b733e91f41c6bec1" FOREIGN KEY ("timetable_slot_id") REFERENCES "timetable_slots"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "FK_1dc6a3509df72e37a9282f67965" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework" ADD CONSTRAINT "FK_de7bc545853203cd392915c99ec" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework" ADD CONSTRAINT "FK_d9de11b40d35526212412b2a053" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework" ADD CONSTRAINT "FK_b2697d15309599bde02b193c8b8" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework_submissions" ADD CONSTRAINT "FK_f53e5ae262ff2280a092dff54bb" FOREIGN KEY ("homework_id") REFERENCES "homework"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework_submissions" ADD CONSTRAINT "FK_1397103587dce2c2320ee2c2f23" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework_submissions" ADD CONSTRAINT "FK_3edd5f17d2df42a438f2aeb25c0" FOREIGN KEY ("checked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_8f6db8c3443ff3c27b4d435c3b1" FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_9acca493883cee3b9e8f9e01cd1" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_26aa1691f1a044bb3b1272c82fa" FOREIGN KEY ("teacher_assignment_id") REFERENCES "teacher_assignments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_dd580436ff8ba20f395040b89da" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_231d6c08ae2a023f6e64fef4b5f" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "integrity_flags" ADD CONSTRAINT "FK_7b366938ac8f0b443563977d5b2" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "integrity_flags" ADD CONSTRAINT "FK_0f1c1722554fa330d30a80614e7" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "integrity_flags" ADD CONSTRAINT "FK_06e49fbd605e3c531e7c4d90076" FOREIGN KEY ("exam_session_id") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "integrity_flags" ADD CONSTRAINT "FK_1178538894b512c7c8ff7f41ec4" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session_students" ADD CONSTRAINT "FK_138f22cc23ee53849ba34b4fb99" FOREIGN KEY ("exam_session_id") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session_students" ADD CONSTRAINT "FK_a34758bca970b11ae01bc986394" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exam_session_students" DROP CONSTRAINT "FK_a34758bca970b11ae01bc986394"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session_students" DROP CONSTRAINT "FK_138f22cc23ee53849ba34b4fb99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "integrity_flags" DROP CONSTRAINT "FK_1178538894b512c7c8ff7f41ec4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "integrity_flags" DROP CONSTRAINT "FK_06e49fbd605e3c531e7c4d90076"`,
    );
    await queryRunner.query(
      `ALTER TABLE "integrity_flags" DROP CONSTRAINT "FK_0f1c1722554fa330d30a80614e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "integrity_flags" DROP CONSTRAINT "FK_7b366938ac8f0b443563977d5b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_231d6c08ae2a023f6e64fef4b5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_dd580436ff8ba20f395040b89da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_26aa1691f1a044bb3b1272c82fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_9acca493883cee3b9e8f9e01cd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_8f6db8c3443ff3c27b4d435c3b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework_submissions" DROP CONSTRAINT "FK_3edd5f17d2df42a438f2aeb25c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework_submissions" DROP CONSTRAINT "FK_1397103587dce2c2320ee2c2f23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework_submissions" DROP CONSTRAINT "FK_f53e5ae262ff2280a092dff54bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework" DROP CONSTRAINT "FK_b2697d15309599bde02b193c8b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework" DROP CONSTRAINT "FK_d9de11b40d35526212412b2a053"`,
    );
    await queryRunner.query(
      `ALTER TABLE "homework" DROP CONSTRAINT "FK_de7bc545853203cd392915c99ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT "FK_1dc6a3509df72e37a9282f67965"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT "FK_a9ba2f51d96b733e91f41c6bec1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT "FK_aae46d2f0937b41ab720d4d773d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" DROP CONSTRAINT "FK_78f2e01705ad1a9b77ef3ee3777"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_students" DROP CONSTRAINT "FK_5b645c512c1e80fa277f034ab6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_students" DROP CONSTRAINT "FK_0b5ad7b1365e1d5e0181e86cbc5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" DROP CONSTRAINT "FK_402f61f62d315cff443ee262f2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_sessions" DROP CONSTRAINT "FK_553b4712a804c4966b3ea11dfc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_sessions" DROP CONSTRAINT "FK_6b896bf8e5b5c8a1bd4ebcafac0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_sessions" DROP CONSTRAINT "FK_79fe568996ed8cc4ec13b68e23e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_fff29b83c9965e08837b508f0cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_32015c863766540050618a1165c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP CONSTRAINT "FK_c4a49151cdbbaeff4f236d70e9a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP CONSTRAINT "FK_cd366222554b0598bc644d23698"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP CONSTRAINT "FK_249da279880fff0c23541e52515"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_sessions" DROP CONSTRAINT "FK_29c54aa17d9d2919dda52efc855"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_sessions" DROP CONSTRAINT "FK_b25307413c050fa04c3758893b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_sessions" DROP CONSTRAINT "FK_5d08edf7f88087da41ceaa724da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_sessions" DROP CONSTRAINT "FK_2822a286ace25f9ce58a57c1cf0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP CONSTRAINT "FK_cc21f101ddb63427e884d2188b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP CONSTRAINT "FK_14c6d2b8f5be0bdb406a3895bb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_b03a4a9cb6c0784ba04a85bb1d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_ce6cbf3cfa665d1199cacc8e2c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_4eb3cacff4db73542f37b5a4358"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_8b37654ebf6552df74c2425719e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_f9e23f0ec70c755515c8a394923"`,
    );
    await queryRunner.query(
      `ALTER TABLE "textbook_chunks" DROP CONSTRAINT "FK_e5d62b76416d91b3829ff0f10da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "topic_mastery" DROP CONSTRAINT "FK_5948fa9e6bfef2b4367135b4deb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "topic_mastery" DROP CONSTRAINT "FK_d905f2abb6c39a887c47973392c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" DROP CONSTRAINT "FK_6d12f65ab61f9f92e3d7e95ad23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" DROP CONSTRAINT "FK_43e081daadb906f3dc41bb267dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetable_slots" DROP CONSTRAINT "FK_0a2d353505804706efb1daa6fff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetable_slots" DROP CONSTRAINT "FK_66b6e21ea6eb2501fe4608b5fa0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetable_slots" DROP CONSTRAINT "FK_2fff1d74845104651c407c7cc00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms" DROP CONSTRAINT "FK_733590da28e000d72a406ff95a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_assignments" DROP CONSTRAINT "FK_05177d586094d252e606df5025f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_assignments" DROP CONSTRAINT "FK_c1bd828e100d9b3c72402672938"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_assignments" DROP CONSTRAINT "FK_a063342479f3789f5ff6f22aa6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" DROP CONSTRAINT "FK_5f17c07d8e2590c3c148b173363"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" DROP CONSTRAINT "FK_28b990f2f869e1d1652a15388f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" DROP CONSTRAINT "FK_398f3990f5da4a1efda173f576f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_years" DROP CONSTRAINT "FK_b293eb7909d2a3aae86c4380713"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_group_students" DROP CONSTRAINT "FK_6ac0529ef0499fe36b53ae4b494"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_group_students" DROP CONSTRAINT "FK_67eb3ba1bb633219bc682e4cc35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_groups" DROP CONSTRAINT "FK_91eb03777b17f452557800404a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_groups" DROP CONSTRAINT "FK_423e501ffea81eeb609a2faf984"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_groups" DROP CONSTRAINT "FK_1b56ad02e1b1daeef4a07bceed3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_groups" DROP CONSTRAINT "FK_c12573410e23aaf76db79995f13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_25e1cf8f41bae2f3d11f3c2a028"`,
    );
    await queryRunner.query(
      `ALTER TABLE "topics" DROP CONSTRAINT "FK_2f2a189343a6f07bb29954402fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" DROP CONSTRAINT "FK_377d96dec58a045075b0c991847"`,
    );
    await queryRunner.query(
      `ALTER TABLE "textbooks" DROP CONSTRAINT "FK_184f2328471d54b750f7e11a183"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "FK_ffaac60590923112dad474b21dc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_exam_session_students_student_id"`,
    );
    await queryRunner.query(`DROP TABLE "exam_session_students"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_integrity_flags_student_id"`,
    );
    await queryRunner.query(`DROP TABLE "integrity_flags"`);
    await queryRunner.query(`DROP TYPE "public"."flag_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_attendance_student_id"`);
    await queryRunner.query(`DROP TABLE "attendance"`);
    await queryRunner.query(`DROP TYPE "public"."attendance_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_grades_lesson_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_grades_teacher_assignment_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_grades_student_id"`);
    await queryRunner.query(`DROP TABLE "grades"`);
    await queryRunner.query(`DROP TABLE "attachments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_homework_submissions_student_id"`,
    );
    await queryRunner.query(`DROP TABLE "homework_submissions"`);
    await queryRunner.query(`DROP TYPE "public"."submission_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_homework_lesson_id"`);
    await queryRunner.query(`DROP TABLE "homework"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_lessons_topic_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_lessons_teacher_assignment_id"`,
    );
    await queryRunner.query(`DROP TABLE "lessons"`);
    await queryRunner.query(`DROP TABLE "media_files"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_parent_students_student_id"`,
    );
    await queryRunner.query(`DROP TABLE "parent_students"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_messages_session_id"`);
    await queryRunner.query(`DROP TABLE "ai_messages"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_sessions_student_id"`);
    await queryRunner.query(`DROP TABLE "ai_sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_attempt_answers_attempt_id"`,
    );
    await queryRunner.query(`DROP TABLE "attempt_answers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_attempts_exam_session_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_attempts_student_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_attempts_quiz_id"`);
    await queryRunner.query(`DROP TABLE "attempts"`);
    await queryRunner.query(`DROP TYPE "public"."attempt_mode"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_exam_sessions_quiz_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_exam_sessions_school_id"`,
    );
    await queryRunner.query(`DROP TABLE "exam_sessions"`);
    await queryRunner.query(`DROP TABLE "quiz_questions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_questions_topic_id"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TYPE "public"."question_status"`);
    await queryRunner.query(`DROP TYPE "public"."question_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_quizzes_class_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_quizzes_topic_id"`);
    await queryRunner.query(`DROP TABLE "quizzes"`);
    await queryRunner.query(`DROP TYPE "public"."quiz_kind"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_textbook_chunks_topic_id"`,
    );
    await queryRunner.query(`DROP TABLE "textbook_chunks"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_topic_mastery_topic_id"`);
    await queryRunner.query(`DROP TABLE "topic_mastery"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_class_students_student_id"`,
    );
    await queryRunner.query(`DROP TABLE "class_students"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_timetable_slots_teacher_assignment_id"`,
    );
    await queryRunner.query(`DROP TABLE "timetable_slots"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_terms_academic_year_id"`);
    await queryRunner.query(`DROP TABLE "terms"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_teacher_assignments_class_id"`,
    );
    await queryRunner.query(`DROP TABLE "teacher_assignments"`);
    await queryRunner.query(`DROP TABLE "classes"`);
    await queryRunner.query(`DROP TYPE "public"."shift"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_academic_years_school_id"`,
    );
    await queryRunner.query(`DROP TABLE "academic_years"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_id"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_support_group_students_student_id"`,
    );
    await queryRunner.query(`DROP TABLE "support_group_students"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_support_groups_school_id"`,
    );
    await queryRunner.query(`DROP TABLE "support_groups"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_school_id"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
    await queryRunner.query(`DROP TABLE "topics"`);
    await queryRunner.query(`DROP TABLE "chapters"`);
    await queryRunner.query(`DROP TABLE "textbooks"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_rooms_school_id"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TYPE "public"."room_type"`);
    await queryRunner.query(`DROP TABLE "schools"`);
    await queryRunner.query(`DROP TYPE "public"."school_type"`);
  }
}
