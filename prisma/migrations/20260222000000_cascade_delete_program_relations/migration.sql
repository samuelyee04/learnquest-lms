-- AlterTable: Add ON DELETE CASCADE so deleting a Program also deletes its enrollments, quizzes, discussions (and quiz questions/results)
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_programId_fkey";
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_programId_fkey";
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Discussion" DROP CONSTRAINT "Discussion_programId_fkey";
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Question" DROP CONSTRAINT "Question_quizId_fkey";
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuizResult" DROP CONSTRAINT "QuizResult_quizId_fkey";
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
