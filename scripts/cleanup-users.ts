// One-off cleanup script: delete all users, companies, resumes, applications,
// and notifications from the local SQLite DB (keeps the seeded Internships).
// Run with: bun run scripts/cleanup-users.ts

import { db } from '@/lib/db'

async function main() {
  const n1 = await db.notification.deleteMany({})
  const n2 = await db.application.deleteMany({})
  const n3 = await db.resume.deleteMany({})
  const n4 = await db.user.deleteMany({})
  const n5 = await db.company.deleteMany({})
  const internships = await db.internship.count()

  console.log('=== Cleanup complete ===')
  console.log(`  notifications deleted: ${n1.count}`)
  console.log(`  applications deleted:  ${n2.count}`)
  console.log(`  resumes deleted:      ${n3.count}`)
  console.log(`  users deleted:        ${n4.count}`)
  console.log(`  companies deleted:    ${n5.count}`)
  console.log(`  internships kept:     ${internships} (seeded, not deleted)`)
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
