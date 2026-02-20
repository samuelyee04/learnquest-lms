// prisma/seed.ts
// Run with: npx prisma db seed

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Web Development' },
      update: {},
      create: { name: 'Web Development', icon: '🌐', color: '#00f5d4' },
    }),
    prisma.category.upsert({
      where: { name: 'Data Science' },
      update: {},
      create: { name: 'Data Science', icon: '📊', color: '#f72585' },
    }),
    prisma.category.upsert({
      where: { name: 'Design' },
      update: {},
      create: { name: 'Design', icon: '🎨', color: '#ffd60a' },
    }),
    prisma.category.upsert({
      where: { name: 'AI & Machine Learning' },
      update: {},
      create: { name: 'AI & Machine Learning', icon: '🤖', color: '#7b2fbe' },
    }),
    prisma.category.upsert({
      where: { name: 'Cybersecurity' },
      update: {},
      create: { name: 'Cybersecurity', icon: '🛡️', color: '#4cc9f0' },
    }),
    prisma.category.upsert({
      where: { name: 'Mobile Development' },
      update: {},
      create: { name: 'Mobile Development', icon: '📱', color: '#fb8500' },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@learnquest.com' },
    update: {},
    create: {
      name:     'Dr. Morgan',
      email:    'admin@learnquest.com',
      password: adminPassword,
      role:     'ADMIN',
      xpPoints: 9999,
      level:    99,
    },
  })
  console.log(`✅ Admin user: ${admin.email} / password: admin123`)

  // ── Student user ────────────────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('student123', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@learnquest.com' },
    update: {},
    create: {
      name:     'Alex Rivera',
      email:    'student@learnquest.com',
      password: studentPassword,
      role:     'STUDENT',
      xpPoints: 1240,
      level:    7,
    },
  })
  console.log(`✅ Student user: ${student.email} / password: student123`)

  // ── Programs ────────────────────────────────────────────────────────────────
  const webCat  = categories[0]
  const dataCat = categories[1]
  const aiCat   = categories[3]

  const program1 = await prisma.program.upsert({
    where: { id: 'prog-react-mastery' },
    update: {},
    create: {
      id:           'prog-react-mastery',
      title:        'Full-Stack React Mastery',
      description:  'Build production-grade applications with React, Node.js, and PostgreSQL.',
      about:        'This comprehensive program takes you from React fundamentals through advanced patterns like compound components, custom hooks, and performance optimization.',
      outcome:      'Ship 3 full-stack projects • React/Node/Postgres mastery • Job-ready portfolio',
      duration:     '12 weeks',
      difficulty:   'INTERMEDIATE',
      rewardPoints: 500,
      videoUrl:     'https://www.youtube.com/embed/b9eMGE7QtTk',
      categoryId:   webCat.id,
    },
  })

  const program2 = await prisma.program.upsert({
    where: { id: 'prog-data-science' },
    update: {},
    create: {
      id:           'prog-data-science',
      title:        'Data Science with Python',
      description:  'From pandas to neural networks — a complete data science journey.',
      about:        'Master the full data science pipeline: data wrangling, exploratory analysis, statistical modeling, and machine learning.',
      outcome:      'Build 5 ML models • Data storytelling • Kaggle-ready skills',
      duration:     '16 weeks',
      difficulty:   'ADVANCED',
      rewardPoints: 700,
      videoUrl:     'https://www.youtube.com/embed/r-uOLxNrNk8',
      categoryId:   dataCat.id,
    },
  })

  const program3 = await prisma.program.upsert({
    where: { id: 'prog-ai-engineering' },
    update: {},
    create: {
      id:           'prog-ai-engineering',
      title:        'AI Engineering Bootcamp',
      description:  'Build and deploy production AI systems with LLMs and vector databases.',
      about:        'Hands-on AI engineering covering prompt engineering, RAG pipelines, fine-tuning open-source LLMs, and building agents.',
      outcome:      '5 AI projects deployed • LLM API mastery • Agent architecture skills',
      duration:     '20 weeks',
      difficulty:   'ADVANCED',
      rewardPoints: 900,
      videoUrl:     'https://www.youtube.com/embed/LE6bMBVLkXw',
      categoryId:   aiCat.id,
    },
  })

  console.log('✅ Created 3 programs')

  // ── Quizzes ─────────────────────────────────────────────────────────────────
  const quiz1 = await prisma.quiz.upsert({
    where:  { id: 'quiz-react' },
    update: {},
    create: {
      id:        'quiz-react',
      programId: program1.id,
      questions: {
        create: [
          {
            text:    'Which React hook is used to manage side effects?',
            options: ['useState', 'useEffect', 'useRef', 'useMemo'],
            answer:  1,
            order:   0,
          },
          {
            text:    'What does the "key" prop help React do in a list?',
            options: [
              'Style elements',
              'Identify elements for efficient re-rendering',
              'Pass data to children',
              'Handle events',
            ],
            answer: 1,
            order:  1,
          },
          {
            text:    'Which SQL clause filters grouped results?',
            options: ['WHERE', 'HAVING', 'FILTER', 'GROUP BY'],
            answer:  1,
            order:   2,
          },
        ],
      },
    },
  })

  const quiz2 = await prisma.quiz.upsert({
    where:  { id: 'quiz-datascience' },
    update: {},
    create: {
      id:        'quiz-datascience',
      programId: program2.id,
      questions: {
        create: [
          {
            text:    'Which Python library is primarily used for data manipulation?',
            options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
            answer:  1,
            order:   0,
          },
          {
            text:    'What does overfitting mean in machine learning?',
            options: [
              'Model is too simple',
              'Model memorizes training data and fails on new data',
              'Model has high bias',
              'Model trains too slowly',
            ],
            answer: 1,
            order:  1,
          },
          {
            text:    'Which algorithm can be used for both classification and regression?',
            options: ['K-Means', 'DBSCAN', 'Random Forest', 'PCA'],
            answer:  2,
            order:   2,
          },
        ],
      },
    },
  })

  console.log('✅ Created quizzes with questions')
  console.log('')
  console.log('🎮 Seed complete! Test accounts:')
  console.log('   Admin:   admin@learnquest.com   / admin123')
  console.log('   Student: student@learnquest.com / student123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())