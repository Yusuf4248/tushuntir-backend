import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/identity/auth/auth.module";
import { SchoolsModule } from "./modules/school/schools/schools.module";
import { UsersModule } from "./modules/identity/users/users.module";
import { ParentStudentsModule } from "./modules/identity/parent-students/parent-students.module";
import { SubjectsModule } from "./modules/school/subjects/subjects.module";
import { AcademicYearsModule } from "./modules/school/academic-years/academic-years.module";
import { TermsModule } from "./modules/school/terms/terms.module";
import { RoomsModule } from "./modules/school/rooms/rooms.module";
import { ClassesModule } from "./modules/school/classes/classes.module";
import { ClassStudentsModule } from "./modules/school/class-students/class-students.module";
import { TeacherAssignmentsModule } from "./modules/school/teacher-assignments/teacher-assignments.module";
import { TimetableSlotsModule } from "./modules/school/timetable-slots/timetable-slots.module";
import { TextbooksModule } from "./modules/learning/textbooks/textbooks.module";
import { ChaptersModule } from "./modules/learning/chapters/chapters.module";
import { TopicsModule } from "./modules/learning/topics/topics.module";
import { TextbookChunksModule } from "./modules/learning/textbook-chunks/textbook-chunks.module";
import { LessonsModule } from "./modules/daily/lessons/lessons.module";
import { AttendanceModule } from "./modules/daily/attendance/attendance.module";
import { GradesModule } from "./modules/daily/grades/grades.module";
import { QuestionsModule } from "./modules/learning/questions/questions.module";
import { QuizzesModule } from "./modules/learning/quizzes/quizzes.module";
import { QuizQuestionsModule } from "./modules/learning/quiz-questions/quiz-questions.module";
import { HomeworkModule } from "./modules/homework/homework/homework.module";
import { HomeworkSubmissionsModule } from "./modules/homework/homework-submissions/homework-submissions.module";
import { MediaFilesModule } from "./modules/homework/media-files/media-files.module";
import { AttachmentsModule } from "./modules/homework/attachments/attachments.module";
import { ExamSessionsModule } from "./modules/assessment/exam-sessions/exam-sessions.module";
import { ExamSessionStudentsModule } from "./modules/assessment/exam-session-students/exam-session-students.module";
import { AttemptsModule } from "./modules/learning/attempts/attempts.module";
import { AttemptAnswersModule } from "./modules/learning/attempt-answers/attempt-answers.module";
import { TopicMasteryModule } from "./modules/learning/topic-mastery/topic-mastery.module";
import { IntegrityFlagsModule } from "./modules/assessment/integrity-flags/integrity-flags.module";
import { AiSessionsModule } from "./modules/learning/ai-sessions/ai-sessions.module";
import { AiMessagesModule } from "./modules/learning/ai-messages/ai-messages.module";
import { SupportGroupsModule } from "./modules/support/support-groups/support-groups.module";
import { SupportGroupStudentsModule } from "./modules/support/support-group-students/support-group-students.module";
import { NotificationsModule } from "./modules/support/notifications/notifications.module";
import { MailModule } from "./shared/mail/mail.module";
import { FileModule } from "./shared/file/file.module";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    DatabaseModule,
    AuthModule,
    SchoolsModule,
    UsersModule,
    ParentStudentsModule,
    SubjectsModule,
    AcademicYearsModule,
    TermsModule,
    RoomsModule,
    ClassesModule,
    ClassStudentsModule,
    TeacherAssignmentsModule,
    TimetableSlotsModule,
    TextbooksModule,
    ChaptersModule,
    TopicsModule,
    TextbookChunksModule,
    LessonsModule,
    AttendanceModule,
    GradesModule,
    QuestionsModule,
    QuizzesModule,
    QuizQuestionsModule,
    HomeworkModule,
    HomeworkSubmissionsModule,
    MediaFilesModule,
    AttachmentsModule,
    ExamSessionsModule,
    ExamSessionStudentsModule,
    AttemptsModule,
    AttemptAnswersModule,
    TopicMasteryModule,
    IntegrityFlagsModule,
    AiSessionsModule,
    AiMessagesModule,
    SupportGroupsModule,
    SupportGroupStudentsModule,
    NotificationsModule,
    MailModule,
    FileModule,
  ],
})
export class AppModule {}
