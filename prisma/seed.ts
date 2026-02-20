// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
}

model User {
  id          String       @id @default(cuid())
  name        String
  email       String       @unique
  password    String
  role        Role         @default(STUDENT)
  avatar      String?
  xpPoints    Int          @default(0)
  level       Int          @default(1)
  createdAt   DateTime     @default(now())
  enrollments Enrollment[]
  discussions Discussion[]
  quizResults QuizResult[]
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  icon     String
  color    String
  programs Program[]
}

model Program {
  id           String       @id @default(cuid())
  title        String
  description  String
  about        String
  outcome      String
  duration     String
  difficulty   Difficulty   @default(BEGINNER)
  rewardPoints Int          @default(100)
  videoUrl     String?
  thumbnail    String?
  categoryId   String
  category     Category     @relation(fields: [categoryId], references: [id])
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  enrollments  Enrollment[]
  discussions  Discussion[]
  quizzes      Quiz[]
}

model Enrollment {
  id          String    @id @default(cuid())
  userId      String
  programId   String
  user        User      @relation(fields: [userId], references: [id])
  program     Program   @relation(fields: [programId], references: [id])
  progress    Int       @default(0)
  completed   Boolean   @default(false)
  enrolledAt  DateTime  @default(now())
  completedAt DateTime?

  @@unique([userId, programId])
}

model Quiz {
  id        String       @id @default(cuid())
  programId String
  program   Program      @relation(fields: [programId], references: [id])
  questions Question[]
  results   QuizResult[]
}

model Question {
  id      String   @id @default(cuid())
  quizId  String
  quiz    Quiz     @relation(fields: [quizId], references: [id])
  text    String
  options String[]
  answer  Int
  order   Int      @default(0)
}

model QuizResult {
  id        String   @id @default(cuid())
  userId    String
  quizId    String
  user      User     @relation(fields: [userId], references: [id])
  quiz      Quiz     @relation(fields: [quizId], references: [id])
  score     Int
  total     Int
  passed    Boolean
  createdAt DateTime @default(now())
}

model Discussion {
  id        String   @id @default(cuid())
  programId String
  userId    String
  program   Program  @relation(fields: [programId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  message   String
  likes     Int      @default(0)
  createdAt DateTime @default(now())
}

enum Role {
  STUDENT
  ADMIN
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

