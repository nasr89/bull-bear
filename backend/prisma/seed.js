import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Playbook seed data ────────────────────────────────
const FOLLOWUP_SCRIPTS = [
  {
    title: 'First Follow-Up — Check In',
    tag: 'Day 2-3',
    tagColor: 'gold',
    body: `Marhaba [Name] 👋
Ana [Your Name] min Bull & Bear.
Wanted to check in — did you have a chance to think about what we discussed?
No rush at all, just here if you have any questions 🙂`,
  },
  {
    title: 'Second Follow-Up — Add Value',
    tag: 'Day 5-7',
    tagColor: 'gold',
    body: `Hey [Name]!
Just wanted to share something quick — one of our members made a solid return this week following our signals 📈

This is exactly what we help people do at Bull & Bear — learn, trade, and grow.

Would love to show you how it works. 5 minutes is all it takes — when are you free?`,
  },
  {
    title: 'Third Follow-Up — Create Urgency',
    tag: 'Day 10-12',
    tagColor: 'gold',
    body: `Hi [Name],
I don't want to bother you — but I also don't want you to miss out.

We currently have a limited number of new account openings this month, and I'd love to reserve a spot for you.

If this isn't the right time, no problem at all — just let me know and I won't follow up again 🙏
But if you're even a little curious, let's talk!`,
  },
  {
    title: 'Breakup Message',
    tag: 'Final',
    tagColor: 'gray',
    body: `Hey [Name],
I won't keep reaching out — I respect your time.

If you ever decide you want to explore trading or investing in the future, I'm always here.

Bull & Bear will keep growing, and the door is open for you whenever you're ready 🚪📈

Wishing you all the best 🙏`,
  },
  {
    title: 'Ask for a Referral',
    tag: 'Referral',
    tagColor: 'green',
    body: `Hi [Name],
I understand if this isn't the right moment for you personally.

But do you have a friend or colleague who might be interested in trading or investing? 🤝

I'd really appreciate the introduction — and of course, if you ever change your mind, I'm here for you too!`,
  },
  {
    title: 'Email Outreach',
    tag: 'Cold Email',
    tagColor: 'gold',
    body: `Subject: Start Trading with Bull & Bear — Lebanon's Trading Community

Dear [Name],

I hope this message finds you well. My name is [Your Name], and I represent Bull & Bear Trading Community, a Lebanon-based platform helping individuals open trading accounts and build financial knowledge.

Whether you're a beginner or have some experience, we offer:
✅ Easy account opening
✅ Expert guidance & signals
✅ A supportive community of traders

I'd love to schedule a brief call to explain how we can help you start or grow your trading journey.

Feel free to reach me at [your number] or simply reply to this email.

Best regards,
[Your Name]
Sales Representative — Bull & Bear Trading Community`,
  },
]

const WHATSAPP_MESSAGES = [
  {
    title: 'Day 1 — First Contact',
    body: `Hi [Name] 👋 My name is [Your Name] from Bull & Bear Trading Community 🇱🇧

We help people in Lebanon start trading and investing — with full support and a real community behind them.

Are you currently investing, or thinking about starting? 📈`,
  },
  {
    title: 'Day 3 — Education',
    body: `💡 Did you know?

Many Lebanese are now turning to trading platforms to protect their savings and grow their wealth — especially after the banking crisis.

At Bull & Bear, we give you the tools, signals, and guidance to do this safely and smartly.

Want to learn how? 🙂`,
  },
  {
    title: 'Day 5 — Social Proof',
    body: `🎯 One of our members started with a small account 3 months ago.

Today he's up significantly — and more importantly, he UNDERSTANDS the market now.

That's what Bull & Bear does: we don't just give signals, we build real traders 💪

Would you like to hear more about how we can do the same for you?`,
  },
  {
    title: 'Day 7 — Offer & CTA',
    body: `Hi [Name]!

Opening an account with us is quick and easy — and you can start with an amount that fits your budget.

Here's what you get:
✅ Live trading signals
✅ 1-on-1 onboarding support
✅ Access to our private community
✅ Weekly analysis & market updates

Ready to take the first step? Let's set up a quick call 📞`,
  },
  {
    title: 'Day 10 — Urgency',
    body: `⏳ Quick update [Name]:

We're currently offering a special onboarding package for new members this month only.

I'd hate for you to miss this — it's one of the best moments to start.

Can I reserve a spot for you? Just say the word 🙏`,
  },
  {
    title: 'Day 14 — Final Nudge',
    body: `Hi [Name],

Last message from my side — I promise 😊

If trading and investing ever becomes something you want to explore, Bull & Bear will be here.

The market doesn't wait, but I respect your timeline.

Feel free to reach me anytime 🚀 Wishing you the best!`,
  },
]

const OBJECTIONS = [
  {
    title: `Ma 3andi flous — I don't have money to invest`,
    body: `That's completely fine! We have accounts that start with very small amounts. The goal first is learning — the money grows as your knowledge grows. What matters is starting, not the size. Can I show you our minimum options?`,
  },
  {
    title: `El trading khassar — it's risky`,
    body: `You're right that risk exists — and that's exactly WHY we exist. We train you to manage risk properly. No professional trader goes in blind. With Bull & Bear, you learn risk management from day one. Would you like to see how we do it?`,
  },
  {
    title: `Ma btiwsak el manatir — I don't trust platforms in Lebanon`,
    body: `I completely understand — especially after everything that happened with the banks. This is why our funds are held internationally and regulated. I can walk you through exactly how your money is protected. Would that help ease your concern?`,
  },
  {
    title: `Ma 3andi waqt — No time to learn trading`,
    body: `That's exactly why we offer signals and managed guidance — you don't need to sit in front of a screen all day. Many of our members have full-time jobs. We make it manageable. Even 30 minutes a day is enough to start.`,
  },
  {
    title: `Baddi fakker — I need to think about it`,
    body: `Of course! Can I ask — what's the main thing you want to think through? Sometimes I can answer it right now and save you the wait. And if not, no pressure — I'll check in with you in a couple of days 🙂`,
  },
  {
    title: `Shu btefrak — el market mazbout?`,
    body: `Great question. The market always moves — up or down, there are opportunities. We don't just buy and hope. We read the market and trade both directions. I can show you examples of trades we took in both bull and bear conditions.`,
  },
  {
    title: `3andi shi tene — I already use something else`,
    body: `That's great you're already active! What platform are you on? Many of our members use multiple resources. Bull & Bear often adds value because of the community and live signals — it's not either/or. Could I show you what we offer on top of what you have?`,
  },
]

const PRO_TIPS = [
  {
    title: 'Trust First, Sell Second',
    tag: '🤝',
    body: `Lebanese clients buy from people they trust. Build rapport before pitching. Ask about their financial situation first — listen, then offer.`,
  },
  {
    title: 'Speak Arabizi',
    tag: '🗣️',
    body: `Mix Arabic and English naturally. "3andi offer 7elo 3aleik" feels warmer than formal English. Match the client's language style.`,
  },
  {
    title: 'WhatsApp > Email',
    tag: '📲',
    body: `In Lebanon, WhatsApp is king. Prioritize it over email. Voice notes can also feel more personal and get higher response rates.`,
  },
  {
    title: 'Referrals Are Gold',
    tag: '👥',
    body: `Every client you close is a door to 3–5 more. Always ask "Do you have a friend who might be interested?" at the end of every onboarding.`,
  },
  {
    title: 'Address the Banking Trauma',
    tag: '📉',
    body: `Many Lebanese lost trust after 2019. Acknowledge this directly. Explain fund safety and international regulation clearly.`,
  },
  {
    title: 'Best Call Times',
    tag: '🕐',
    body: `10am–12pm and 5pm–8pm are peak response windows in Lebanon. Avoid Friday afternoons and Sunday mornings.`,
  },
  {
    title: `Show, Don't Tell`,
    tag: '📊',
    body: `Share real screenshots of signals, results, or community activity. Proof beats promises every time in a skeptical market.`,
  },
  {
    title: 'Target the Right Profile',
    tag: '🎯',
    body: `Focus on: business owners, expats sending remittances, young professionals 25–40, and people already asking about crypto or forex online.`,
  },
]

async function seedPlaybook() {
  const all = [
    ...FOLLOWUP_SCRIPTS.map((s, i) => ({ ...s, category: 'FOLLOWUP_SCRIPT', sortOrder: i })),
    ...WHATSAPP_MESSAGES.map((s, i) => ({ ...s, category: 'WHATSAPP_MESSAGE', sortOrder: i })),
    ...OBJECTIONS.map((s, i) => ({ ...s, category: 'OBJECTION', sortOrder: i })),
    ...PRO_TIPS.map((s, i) => ({ ...s, category: 'PRO_TIP', sortOrder: i })),
  ]

  for (const item of all) {
    await prisma.playbookItem.upsert({
      where: { category_title: { category: item.category, title: item.title } },
      update: {
        body: item.body,
        tag: item.tag ?? null,
        tagColor: item.tagColor ?? null,
        sortOrder: item.sortOrder,
      },
      create: {
        category: item.category,
        title: item.title,
        body: item.body,
        tag: item.tag ?? null,
        tagColor: item.tagColor ?? null,
        sortOrder: item.sortOrder,
      },
    })
  }
  return all.length
}

async function main() {
  console.log('🌱 Seeding database...')

  const superadminPassword = await bcrypt.hash('SuperAdmin@123', 12)
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const userPassword = await bcrypt.hash('User@123', 12)

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@bullandbear.lb' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@bullandbear.lb',
      password: superadminPassword,
      role: 'SUPERADMIN',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bullandbear.lb' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@bullandbear.lb',
      password: adminPassword,
      role: 'ADMIN',
      createdById: superadmin.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'user@bullandbear.lb' },
    update: {},
    create: {
      name: 'Sales Rep',
      email: 'user@bullandbear.lb',
      password: userPassword,
      role: 'USER',
      createdById: admin.id,
    },
  })

  const playbookCount = await seedPlaybook()

  console.log('✅ Seed complete.')
  console.log('─────────────────────────────────────────')
  console.log('SUPERADMIN → superadmin@bullandbear.lb / SuperAdmin@123')
  console.log('ADMIN      → admin@bullandbear.lb      / Admin@123')
  console.log('USER       → user@bullandbear.lb       / User@123')
  console.log(`Playbook   → ${playbookCount} items (scripts, whatsapp, objections, tips)`)
  console.log('─────────────────────────────────────────')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
