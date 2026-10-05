import ZAI from 'z-ai-web-dev-sdk'
import type { ParsedResume } from '@/lib/types'

const SYSTEM_PROMPT = `You are an expert resume parser and career analyst specializing in technical resumes for internship applications.

Your task: Analyze the resume text provided by the user and extract structured data. You must respond with ONLY valid JSON (no markdown fences, no commentary).

The JSON must follow this exact schema:
{
  "name": "string - full name of the candidate, or empty string if not found",
  "email": "string - primary email, or empty string",
  "phone": "string - phone number, or empty string",
  "summary": "string - 1-2 sentence professional summary/objective rewritten by you in clear language, or empty string",
  "education": ["array of strings - each entry like 'B.Tech AI & Data Science, XYZ College, 2025'"],
  "skills": ["array of strings - ALL skills mentioned anywhere in the resume (technical, soft, tools, languages). Normalize casing (e.g. 'JavaScript', 'Python', 'SQL', 'Power BI', 'Machine Learning'). Deduplicate."],
  "projects": [
    {
      "name": "string - project title",
      "description": "string - 1-2 sentence description of what was built/achieved",
      "skills": ["array of strings - skills demonstrated in THIS project (must be a subset of the main skills list, normalized the same way)"]
    }
  ],
  "certifications": [
    {
      "name": "string - certification name",
      "issuer": "string - issuing organization",
      "date": "string - date or year, or empty string",
      "verified": true/false - set true only if the certification appears to be from a recognized provider with a clear completion
    }
  ],
  "experience": ["array of strings - each work/internship experience entry like 'Software Intern, ABC Corp (Jun 2024 - Aug 2024): Built internal dashboard'"]
}

Critical rules:
1. projectSkills must be DERIVED from the projects array - union of all skills mentioned across projects.
2. normalizedSkills must be a clean, deduplicated, title-cased version of the skills array, suitable for fuzzy matching against internship requirements.
3. If a section is completely absent from the resume, return an empty array, never invent data.
4. Be liberal in capturing skills (tools, frameworks, languages, methodologies, soft skills) but conservative in claiming certifications are verified.
5. Return ONLY the JSON object.`

export async function parseResume(rawText: string, fileName: string): Promise<ParsedResume> {
  const zai = await ZAI.create()

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Parse the following resume content (from file "${fileName}") and return the structured JSON.\n\n--- RESUME START ---\n${rawText}\n--- RESUME END ---`,
      },
    ],
    thinking: { type: 'disabled' },
  })

  const content = completion.choices[0]?.message?.content ?? ''
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  let parsed: ParsedResume
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // attempt to extract the first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error('AI returned an unparseable resume analysis.')
    }
    parsed = JSON.parse(match[0])
  }

  // Normalize and derive the reusable skill set
  const skills = Array.isArray(parsed.skills) ? parsed.skills : []
  const normalizedSkills = Array.from(
    new Set(skills.map((s) => normalizeSkill(s)).filter(Boolean))
  )

  const projects = Array.isArray(parsed.projects) ? parsed.projects : []
  const projectSkills = Array.from(
    new Set(
      projects.flatMap((p) => (Array.isArray(p.skills) ? p.skills : []))
        .map((s) => normalizeSkill(s))
        .filter(Boolean)
    )
  )

  return {
    name: parsed.name ?? '',
    email: parsed.email ?? '',
    phone: parsed.phone ?? '',
    summary: parsed.summary ?? '',
    education: Array.isArray(parsed.education) ? parsed.education : [],
    skills,
    projects: projects.filter((p) => p && p.name),
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    normalizedSkills,
    projectSkills,
  }
}

// Title-case-ish normalization that keeps common tech casing intact
const TECH_CASING: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  react: 'React',
  'react.js': 'React',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  vuejs: 'Vue.js',
  'vue.js': 'Vue.js',
  angular: 'Angular',
  python: 'Python',
  django: 'Django',
  flask: 'Flask',
  java: 'Java',
  'c++': 'C++',
  'c#': 'C#',
  c: 'C',
  'go': 'Go',
  golang: 'Go',
  rust: 'Rust',
  sql: 'SQL',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
  html: 'HTML',
  css: 'CSS',
  php: 'PHP',
  excel: 'Excel',
  'power bi': 'Power BI',
  powerbi: 'Power BI',
  tableau: 'Tableau',
  'machine learning': 'Machine Learning',
  ml: 'Machine Learning',
  'deep learning': 'Deep Learning',
  ai: 'AI',
  nlp: 'NLP',
  'natural language processing': 'NLP',
  'computer vision': 'Computer Vision',
  tensorflow: 'TensorFlow',
  pytorch: 'PyTorch',
  scikit: 'Scikit-learn',
  'scikit-learn': 'Scikit-learn',
  pandas: 'Pandas',
  numpy: 'NumPy',
  'seo': 'SEO',
  'social media': 'Social Media',
  'ms office': 'MS Office',
  communication: 'Communication',
  recruitment: 'Recruitment',
  figma: 'Figma',
  git: 'Git',
  github: 'GitHub',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  linux: 'Linux',
  jira: 'Jira',
  agile: 'Agile',
  scrum: 'Scrum',
}

export function normalizeSkill(input: string): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (!trimmed) return ''
  const lower = trimmed.toLowerCase()
  if (TECH_CASING[lower]) return TECH_CASING[lower]
  // Title case multi-word skills (e.g. "data analysis")
  return lower
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

// Compute match score between user's normalized skills and internship required skills
export function computeMatch(
  userSkills: string[],
  requiredSkills: string[]
): { matchScore: number; matchedSkills: string[]; missingSkills: string[] } {
  const userSet = new Set(userSkills.map((s) => s.toLowerCase()))
  const matched: string[] = []
  const missing: string[] = []

  for (const req of requiredSkills) {
    const reqLower = req.toLowerCase()
    // fuzzy: consider a skill matched if either side contains the other
    const isMatched = userSet.has(reqLower) ||
      [...userSet].some((u) => u.includes(reqLower) || reqLower.includes(u))
    if (isMatched) {
      matched.push(req)
    } else {
      missing.push(req)
    }
  }

  const matchScore = requiredSkills.length === 0
    ? 100
    : Math.round((matched.length / requiredSkills.length) * 100)

  return { matchScore, matchedSkills: matched, missingSkills: missing }
}
