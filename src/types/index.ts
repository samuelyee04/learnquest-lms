// src/types/index.ts
// Shared TypeScript types used across the entire project

export type Role = 'STUDENT' | 'ADMIN'
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar: string | null
  xpPoints: number
  level: number
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface Program {
  id: string
  title: string
  description: string
  about: string
  outcome: string
  duration: string
  difficulty: Difficulty
  rewardPoints: number
  videoUrl: string | null
  thumbnail: string | null
  categoryId: string
  category: Category
  createdAt: string
  updatedAt: string
  _count: { enrollments: number }
  enrollment?: Enrollment | null
}

export interface Enrollment {
  id: string
  userId: string
  programId: string
  progress: number
  completed: boolean
  xpClaimed: boolean
  enrolledAt: string
  completedAt: string | null
  program?: Program
}

export interface Question {
  id: string
  text: string
  options: string[]
  order: number
  // answer is never sent to client
}

export interface Quiz {
  id: string
  programId: string
  questions: Question[]
}

export interface QuizResult {
  score: number
  total: number
  passed: boolean
  percentage: number
  breakdown: {
    questionId: string
    question: string
    selected: number
    correct: number
    isCorrect: boolean
  }[]
  resultId: string
}

export interface Episode {
  id: string
  programId: string
  title: string
  videoUrl: string | null
  duration: string | null
  order: number
  createdAt: string
}

export interface Discussion {
  id: string
  programId: string
  userId: string
  message: string
  likes: number
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

export interface AdminStats {
  totalEnrolled: number
  completionRate: number
  avgScore: number
  activeToday?: number
  avgTimePerLesson?: string
}