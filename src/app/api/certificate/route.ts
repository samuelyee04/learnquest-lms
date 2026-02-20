// src/app/api/certificate/route.ts
// GET /api/certificate?programId=xxx
//
// Generates a PDF certificate for a completed program.
// Uses jsPDF (no browser/chromium needed — pure JS).
//
// Install: npm install jspdf

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json(
        { error: 'programId is required' },
        { status: 400 }
      )
    }

    // Check enrollment exists and is completed
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_programId: {
          userId:    session.user.id,
          programId,
        },
      },
      include: {
        program: { include: { category: true } },
        user:    { select: { id: true, name: true, email: true } },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this program' },
        { status: 404 }
      )
    }

    if (!enrollment.completed) {
      return NextResponse.json(
        { error: 'You have not completed this program yet' },
        { status: 403 }
      )
    }

    // ── Build the certificate as an HTML page and return it ─────────────────
    // The browser will render and print/save it as PDF using window.print()
    // This avoids any server-side PDF library dependency issues.
    //
    // Alternatively, see the jsPDF version below (commented out).

    const completedDate = enrollment.completedAt
      ? new Date(enrollment.completedAt).toLocaleDateString('en-US', {
          year: 'month', month: 'long', day: 'numeric'
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        })

    const catColor  = enrollment.program.category.color ?? '#00b4d8'
    const catIcon   = enrollment.program.category.icon  ?? '🎓'
    const studentName = enrollment.user.name
    const programTitle = enrollment.program.title
    const duration     = enrollment.program.duration
    const difficulty   = enrollment.program.difficulty

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Certificate — ${programTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #06060f;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px;
      font-family: 'Space Mono', monospace;
    }

    .cert {
      width: 900px;
      min-height: 620px;
      background: linear-gradient(145deg, #0d0d1a, #0a0a14);
      border: 2px solid ${catColor}44;
      border-radius: 24px;
      padding: 60px 70px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 80px ${catColor}22, inset 0 0 80px rgba(0,0,0,.4);
    }

    /* Corner decorations */
    .cert::before, .cert::after {
      content: '';
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      opacity: .08;
      background: ${catColor};
    }
    .cert::before { top: -40px; left: -40px; }
    .cert::after  { bottom: -40px; right: -40px; }

    /* Top accent bar */
    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, ${catColor}, #4cc9f0, transparent);
      border-radius: 2px;
      margin-bottom: 40px;
    }

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }

    .brand {
      font-family: 'Orbitron', monospace;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 4px;
      background: linear-gradient(90deg, #00f5d4, #4cc9f0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cert-id {
      font-size: 10px;
      color: rgba(255,255,255,.25);
      letter-spacing: 2px;
      text-align: right;
    }

    .main {
      text-align: center;
      margin-bottom: 50px;
    }

    .cert-of {
      font-size: 11px;
      color: rgba(255,255,255,.35);
      letter-spacing: 6px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .big-title {
      font-family: 'Orbitron', monospace;
      font-size: 36px;
      font-weight: 900;
      color: #fff;
      letter-spacing: 2px;
      margin-bottom: 28px;
      text-transform: uppercase;
    }

    .certifies {
      font-size: 12px;
      color: rgba(255,255,255,.4);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .student-name {
      font-family: 'Orbitron', monospace;
      font-size: 40px;
      font-weight: 700;
      color: ${catColor};
      letter-spacing: 1px;
      margin-bottom: 16px;
      text-shadow: 0 0 40px ${catColor}66;
    }

    .has-completed {
      font-size: 12px;
      color: rgba(255,255,255,.4);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .program-name {
      font-family: 'Orbitron', monospace;
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .program-meta {
      font-size: 11px;
      color: rgba(255,255,255,.35);
      letter-spacing: 2px;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${catColor}44, transparent);
      margin: 40px 0;
    }

    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      width: 160px;
      height: 1px;
      background: rgba(255,255,255,.2);
      margin: 0 auto 8px;
    }

    .signature-name {
      font-size: 11px;
      color: rgba(255,255,255,.5);
      letter-spacing: 2px;
    }

    .signature-title {
      font-size: 9px;
      color: rgba(255,255,255,.25);
      letter-spacing: 2px;
      margin-top: 3px;
    }

    .xp-badge {
      text-align: center;
      background: linear-gradient(135deg, #ffd60a22, #fb850022);
      border: 1px solid #ffd60a44;
      border-radius: 12px;
      padding: 14px 24px;
    }

    .xp-amount {
      font-family: 'Orbitron', monospace;
      font-size: 28px;
      font-weight: 900;
      color: #ffd60a;
    }

    .xp-label {
      font-size: 9px;
      color: rgba(255,255,255,.3);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .cat-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${catColor}18;
      border: 1px solid ${catColor}44;
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 11px;
      color: ${catColor};
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .print-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 14px 28px;
      background: linear-gradient(135deg, #00f5d4, #4cc9f0);
      color: #0a0a14;
      border: none;
      border-radius: 12px;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,245,212,.4);
    }

    @media print {
      body { background: white; padding: 0; }
      .cert { box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="accent-bar"></div>

    <div class="top-row">
      <div class="brand">🎮 LEARNQUEST</div>
      <div class="cert-id">
        CERTIFICATE ID<br/>
        LQ-${Date.now().toString(36).toUpperCase()}<br/>
        <span style="font-size:9px">ISSUED ${completedDate.toUpperCase()}</span>
      </div>
    </div>

    <div class="main">
      <div class="cert-of">Certificate of Completion</div>
      <div class="big-title">Achievement Unlocked</div>

      <div class="cat-badge">${catIcon} ${enrollment.program.category.name}</div>

      <div class="certifies">This certifies that</div>
      <div class="student-name">${studentName}</div>
      <div class="has-completed">has successfully completed</div>
      <div class="program-name">${programTitle}</div>
      <div class="program-meta">${duration} &nbsp;·&nbsp; ${difficulty}</div>
    </div>

    <div class="divider"></div>

    <div class="bottom-row">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">DR. MORGAN</div>
        <div class="signature-title">PROGRAM DIRECTOR · LEARNQUEST</div>
      </div>

      <div class="xp-badge">
        <div class="xp-amount">+${enrollment.program.rewardPoints}</div>
        <div class="xp-label">XP Earned</div>
      </div>

      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">${completedDate.toUpperCase()}</div>
        <div class="signature-title">DATE OF COMPLETION</div>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">
    📄 Save as PDF
  </button>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Suggest a filename when saved
        'Content-Disposition': `inline; filename="certificate-${programTitle.replace(/\s+/g, '-').toLowerCase()}.html"`,
      },
    })
  } catch (error) {
    console.error('[CERTIFICATE_GET]', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}