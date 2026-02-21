// prisma/seed.ts
// Run with: npx prisma db seed

import { PrismaClient, Difficulty, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load .env manually
dotenv.config()

// ✅ Prisma 7 requires the adapter to be passed in
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main(): Promise<void> {
  console.log('🌱 Starting seed...')
  console.log(`📡 Connecting to: ${process.env.DATABASE_URL?.split('@')[1]}`)

  // ── 1. CATEGORIES ──────────────────────────────────────────────────────────
  console.log('Creating categories...')

  const webDev = await prisma.category.upsert({
    where:  { name: 'Web Development' },
    update: {},
    create: { name: 'Web Development', icon: '🌐', color: '#00f5d4' },
  })

  const dataScience = await prisma.category.upsert({
    where:  { name: 'Data Science' },
    update: {},
    create: { name: 'Data Science', icon: '📊', color: '#f72585' },
  })

  const design = await prisma.category.upsert({
    where:  { name: 'Design' },
    update: {},
    create: { name: 'Design', icon: '🎨', color: '#ffd60a' },
  })

  const aiML = await prisma.category.upsert({
    where:  { name: 'AI & Machine Learning' },
    update: {},
    create: { name: 'AI & Machine Learning', icon: '🤖', color: '#7b2fbe' },
  })

  const cyber = await prisma.category.upsert({
    where:  { name: 'Cybersecurity' },
    update: {},
    create: { name: 'Cybersecurity', icon: '🛡️', color: '#4cc9f0' },
  })

  const mobile = await prisma.category.upsert({
    where:  { name: 'Mobile Development' },
    update: {},
    create: { name: 'Mobile Development', icon: '📱', color: '#fb8500' },
  })

  console.log('✅ Created 6 categories')

  // ── 2. USERS ───────────────────────────────────────────────────────────────
  console.log('Creating users...')

  const adminHash   = await bcrypt.hash('admin123', 12)
  const studentHash = await bcrypt.hash('student123', 12)

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@learnquest.com' },
    update: {},
    create: {
      name:     'Dr. Morgan',
      email:    'admin@learnquest.com',
      password: adminHash,
      role:     Role.ADMIN,
      xpPoints: 9999,
      level:    99,
    },
  })

  const student = await prisma.user.upsert({
    where:  { email: 'student@learnquest.com' },
    update: {},
    create: {
      name:     'Alex Rivera',
      email:    'student@learnquest.com',
      password: studentHash,
      role:     Role.STUDENT,
      xpPoints: 1240,
      level:    7,
    },
  })

  console.log(`✅ Created admin:   ${admin.email}`)
  console.log(`✅ Created student: ${student.email}`)

  // ── 3. PROGRAMS ────────────────────────────────────────────────────────────
  console.log('Creating programs...')

  const program1 = await prisma.program.upsert({
    where:  { title: 'Full-Stack React Mastery' },
    update: {},
    create: {
      title:        'Full-Stack React Mastery',
      description:  'Build production-grade applications with React, Node.js, and PostgreSQL.',
      about:        'This comprehensive program takes you from React fundamentals through advanced patterns like compound components, custom hooks, and performance optimization. You will deploy real apps to the cloud.',
      outcome:      'Ship 3 full-stack projects • React/Node/Postgres mastery • Job-ready portfolio',
      duration:     '12 weeks',
      difficulty:   Difficulty.INTERMEDIATE,
      rewardPoints: 500,
      videoUrl:     'https://www.youtube.com/embed/b9eMGE7QtTk',
      categoryId:   webDev.id,
    },
  })

  const program2 = await prisma.program.upsert({
    where:  { title: 'Data Science with Python' },
    update: {},
    create: {
      title:        'Data Science with Python',
      description:  'From pandas to neural networks — a complete data science journey.',
      about:        'Master the full data science pipeline: data wrangling, exploratory analysis, statistical modeling, machine learning, and visualization with Matplotlib and Seaborn.',
      outcome:      'Build 5 ML models • Data storytelling • Kaggle-ready skills',
      duration:     '16 weeks',
      difficulty:   Difficulty.ADVANCED,
      rewardPoints: 700,
      videoUrl:     'https://www.youtube.com/embed/r-uOLxNrNk8',
      categoryId:   dataScience.id,
    },
  })

  const program3 = await prisma.program.upsert({
    where:  { title: 'UI/UX Design Systems' },
    update: {},
    create: {
      title:        'UI/UX Design Systems',
      description:  'Create scalable design systems used by Fortune 500 companies.',
      about:        'Learn atomic design principles, Figma component libraries, accessibility (WCAG 2.2), motion design, and design tokens.',
      outcome:      'Complete design system • Figma mastery • WCAG certification prep',
      duration:     '8 weeks',
      difficulty:   Difficulty.BEGINNER,
      rewardPoints: 350,
      videoUrl:     'https://www.youtube.com/embed/wIuVvCuiJhU',
      categoryId:   design.id,
    },
  })

  const program4 = await prisma.program.upsert({
    where:  { title: 'AI Engineering Bootcamp' },
    update: {},
    create: {
      title:        'AI Engineering Bootcamp',
      description:  'Build and deploy production AI systems with LLMs and vector databases.',
      about:        'Hands-on AI engineering covering prompt engineering, RAG pipelines, fine-tuning open-source LLMs, building agents with tool use, and deploying AI APIs at scale.',
      outcome:      '5 AI projects deployed • LLM API mastery • Agent architecture skills',
      duration:     '20 weeks',
      difficulty:   Difficulty.ADVANCED,
      rewardPoints: 900,
      videoUrl:     'https://www.youtube.com/embed/LE6bMBVLkXw',
      categoryId:   aiML.id,
    },
  })

  const program5 = await prisma.program.upsert({
    where:  { title: 'Ethical Hacking & Pen Testing' },
    update: {},
    create: {
      title:        'Ethical Hacking & Pen Testing',
      description:  'Learn to think like an attacker. Defend like a professional.',
      about:        'Covers the full penetration testing methodology: reconnaissance, scanning, exploitation, post-exploitation, and reporting. Labs include real vulnerable machines in a safe environment.',
      outcome:      'CEH prep • 20+ lab machines • Bug bounty foundations',
      duration:     '14 weeks',
      difficulty:   Difficulty.ADVANCED,
      rewardPoints: 600,
      videoUrl:     'https://www.youtube.com/embed/3Kq1MIfTWCE',
      categoryId:   cyber.id,
    },
  })

  const program6 = await prisma.program.upsert({
    where:  { title: 'Flutter Cross-Platform Dev' },
    update: {},
    create: {
      title:        'Flutter Cross-Platform Dev',
      description:  'One codebase. iOS, Android, Web, and Desktop.',
      about:        'Master Dart and Flutter to build beautiful, natively compiled applications. Covers state management with Riverpod, Firebase integration, custom animations, and App Store deployment.',
      outcome:      '3 published apps • Dart mastery • Firebase integration',
      duration:     '10 weeks',
      difficulty:   Difficulty.INTERMEDIATE,
      rewardPoints: 450,
      videoUrl:     'https://www.youtube.com/embed/VPvVD8t02U8',
      categoryId:   mobile.id,
    },
  })

  console.log('✅ Created 6 programs')

  // ── 4. QUIZZES ─────────────────────────────────────────────────────────────
  console.log('Creating quizzes...')

  await prisma.quiz.deleteMany({
    where: {
      programId: {
        in: [
          program1.id, program2.id, program3.id,
          program4.id, program5.id, program6.id,
        ],
      },
    },
  })

  await prisma.quiz.create({
    data: {
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
            text:    'What does the key prop help React do in a list?',
            options: [
              'Style list elements',
              'Identify elements for efficient re-rendering',
              'Pass data to child components',
              'Handle click events',
            ],
            answer: 1,
            order:  1,
          },
          {
            text:    'Which SQL clause filters results after grouping?',
            options: ['WHERE', 'HAVING', 'FILTER', 'GROUP BY'],
            answer:  1,
            order:   2,
          },
        ],
      },
    },
  })

  await prisma.quiz.create({
    data: {
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
            text:    'Which algorithm works for both classification and regression?',
            options: ['K-Means', 'DBSCAN', 'Random Forest', 'PCA'],
            answer:  2,
            order:   2,
          },
        ],
      },
    },
  })

  await prisma.quiz.create({
    data: {
      programId: program3.id,
      questions: {
        create: [
          {
            text:    'What is the smallest unit in Atomic Design?',
            options: ['Molecules', 'Organisms', 'Atoms', 'Templates'],
            answer:  2,
            order:   0,
          },
          {
            text:    'Which WCAG level is the minimum for legal compliance in most countries?',
            options: ['Level A', 'Level AA', 'Level AAA', 'Level B'],
            answer:  1,
            order:   1,
          },
          {
            text:    'What are design tokens?',
            options: [
              'UI components',
              'Named design decisions stored as data',
              'Color palettes only',
              'Icon sets',
            ],
            answer: 1,
            order:  2,
          },
        ],
      },
    },
  })

  await prisma.quiz.create({
    data: {
      programId: program4.id,
      questions: {
        create: [
          {
            text:    'What does RAG stand for in AI engineering?',
            options: [
              'Random Aggregation Graph',
              'Retrieval Augmented Generation',
              'Recursive Attention Gate',
              'Relational AI Graph',
            ],
            answer: 1,
            order:  0,
          },
          {
            text:    'What is a vector database primarily used for?',
            options: [
              'SQL queries',
              'Semantic similarity search',
              'Graph traversal',
              'Time-series data',
            ],
            answer: 1,
            order:  1,
          },
          {
            text:    'Which technique updates model weights on new domain data?',
            options: [
              'Prompt engineering',
              'Few-shot learning',
              'Fine-tuning',
              'RAG',
            ],
            answer: 2,
            order:  2,
          },
        ],
      },
    },
  })

  await prisma.quiz.create({
    data: {
      programId: program5.id,
      questions: {
        create: [
          {
            text:    'What does SQL Injection exploit?',
            options: [
              'Weak passwords',
              'Unsanitized database queries',
              'Open network ports',
              'Phishing links',
            ],
            answer: 1,
            order:  0,
          },
          {
            text:    'Which tool is commonly used for network port scanning?',
            options: ['Wireshark', 'Metasploit', 'Nmap', 'Burp Suite'],
            answer:  2,
            order:   1,
          },
          {
            text:    'What is a zero-day vulnerability?',
            options: [
              'A known vulnerability with an available patch',
              'An unknown vulnerability with no patch yet',
              'A vulnerability that is 0 days old',
              'A test vulnerability in a sandbox',
            ],
            answer: 1,
            order:  2,
          },
        ],
      },
    },
  })

  await prisma.quiz.create({
    data: {
      programId: program6.id,
      questions: {
        create: [
          {
            text:    'What programming language does Flutter use?',
            options: ['Kotlin', 'Swift', 'Dart', 'JavaScript'],
            answer:  2,
            order:   0,
          },
          {
            text:    'Which state management solution is recommended for large Flutter apps?',
            options: ['setState', 'Provider', 'Riverpod', 'GetX'],
            answer:  2,
            order:   1,
          },
          {
            text:    'In Flutter, what is a Widget?',
            options: [
              'A database connection',
              'Everything visible on screen',
              'An API call handler',
              'A routing system',
            ],
            answer: 1,
            order:  2,
          },
        ],
      },
    },
  })

  console.log('✅ Created 6 quizzes with 3 questions each')

  // ── 5. SAMPLE DISCUSSIONS ──────────────────────────────────────────────────
  console.log('Creating sample discussions...')

  await prisma.discussion.deleteMany({
    where: { programId: program1.id },
  })

  await prisma.discussion.createMany({
    data: [
      {
        programId: program1.id,
        userId:    student.id,
        message:   'Just finished Week 3 — the custom hooks section is mind-blowing! 🔥',
        likes:     12,
      },
      {
        programId: program1.id,
        userId:    admin.id,
        message:   'Great work everyone! Remember to push your projects to GitHub.',
        likes:     8,
      },
    ],
  })

  console.log('✅ Created sample discussions')

  // ── DONE ───────────────────────────────────────────────────────────────────
  console.log('')
  console.log('🎮 Seed complete!')
  console.log('─────────────────────────────────')
  console.log('Test accounts:')
  console.log('  Admin:   admin@learnquest.com   / admin123')
  console.log('  Student: student@learnquest.com / student123')
  console.log('─────────────────────────────────')
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
