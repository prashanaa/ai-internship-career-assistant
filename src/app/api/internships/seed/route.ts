import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ApiResponse, Internship } from '@/lib/types'

// Seed internships derived from the original NANDHA.HTML plus extras,
// each tagged with a category and the skills needed for matching.
const SEED: Array<Omit<Internship, 'id' | 'createdAt'>> = [
  {
    title: 'Web Development Intern',
    company: 'Tech Solutions',
    location: 'Chennai',
    duration: '3 Months',
    stipend: '₹8,000 / Month',
    category: 'Web Development',
    skills: ['HTML', 'CSS', 'JavaScript', 'PHP'],
    description: 'Build and maintain responsive web interfaces and integrate backend APIs for client projects.',
  },
  {
    title: 'Data Analyst Intern',
    company: 'Data Works',
    location: 'Bangalore',
    duration: '6 Months',
    stipend: '₹12,000 / Month',
    category: 'Data Analytics',
    skills: ['Excel', 'SQL', 'Power BI', 'Python'],
    description: 'Analyze business datasets, build dashboards, and surface actionable insights for stakeholders.',
  },
  {
    title: 'AI & ML Intern',
    company: 'Future AI Labs',
    location: 'Coimbatore',
    duration: '4 Months',
    stipend: '₹10,000 / Month',
    category: 'Artificial Intelligence',
    skills: ['Python', 'Machine Learning', 'SQL'],
    description: 'Develop and train ML models, run experiments, and deploy prototypes to production research pipelines.',
  },
  {
    title: 'HR Management Intern',
    company: 'People First',
    location: 'Chennai',
    duration: '3 Months',
    stipend: '₹7,000 / Month',
    category: 'Human Resources',
    skills: ['Communication', 'Excel', 'Recruitment'],
    description: 'Support end-to-end recruitment, onboarding, and employee engagement programs.',
  },
  {
    title: 'Digital Marketing Intern',
    company: 'Creative Media',
    location: 'Remote',
    duration: '3 Months',
    stipend: '₹6,000 / Month',
    category: 'Digital Marketing',
    skills: ['SEO', 'Social Media', 'Content'],
    description: 'Plan and execute multi-channel campaigns, manage social content calendars, and report on growth.',
  },
  {
    title: 'Full Stack Developer Intern',
    company: 'Cloud Native Systems',
    location: 'Remote',
    duration: '6 Months',
    stipend: '₹15,000 / Month',
    category: 'Web Development',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL'],
    description: 'Ship production features across a Next.js + Prisma stack, including APIs, tests, and CI work.',
  },
  {
    title: 'DevOps Engineer Intern',
    company: 'ScaleOps',
    location: 'Bangalore',
    duration: '4 Months',
    stipend: '₹14,000 / Month',
    category: 'DevOps',
    skills: ['Linux', 'Docker', 'AWS', 'Git'],
    description: 'Automate deployments, manage infrastructure-as-code, and improve observability of services.',
  },
  {
    title: 'UI/UX Design Intern',
    company: 'Pixel Studio',
    location: 'Remote',
    duration: '3 Months',
    stipend: '₹9,000 / Month',
    category: 'Design',
    skills: ['Figma', 'Communication', 'Content'],
    description: 'Design accessible product flows, build a component library, and run usability tests with users.',
  },
]

export async function POST() {
  try {
    const existing = await db.internship.count()
    if (existing > 0) {
      return NextResponse.json<ApiResponse<{ count: number }>>({
        success: true,
        data: { count: existing },
      })
    }

    await db.internship.createMany({
      data: SEED.map((s) => ({ ...s, skills: JSON.stringify(s.skills) })),
    })

    return NextResponse.json<ApiResponse<{ count: number }>>({
      success: true,
      data: { count: SEED.length },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seed failed'
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 })
  }
}
