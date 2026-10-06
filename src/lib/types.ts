// Shared types used across frontend and backend

export type Role = 'student' | 'company'

export interface AuthUser {
  id: string
  name: string
  email: string
  course: string | null
  college: string | null
}

export interface CompanyAuthUser {
  id: string
  name: string
  email: string
  industry: string | null
  contactPerson: string | null
  location: string | null
}

// Union returned by the role-aware /api/auth/me
export type SessionPrincipal =
  | { role: 'student'; user: AuthUser }
  | { role: 'company'; company: CompanyAuthUser }

export interface ParsedProject {
  name: string
  description: string
  skills: string[]
}

export interface ParsedCertification {
  name: string
  issuer: string
  date: string
  verified: boolean
}

export interface ParsedResume {
  name: string
  email: string
  phone: string
  summary: string
  education: string[]
  skills: string[]
  projects: ParsedProject[]
  certifications: ParsedCertification[]
  experience: string[]
  // Derived, reusable skill set normalized for matching
  normalizedSkills: string[]
  // Skills inferred from projects (validated separately)
  projectSkills: string[]
}

export interface Resume {
  id: string
  userId: string
  fileName: string
  rawText: string
  parsedData: ParsedResume
  createdAt: string
  updatedAt: string
}

export interface Internship {
  id: string
  title: string
  company: string
  location: string
  duration: string
  stipend: string
  category: string
  skills: string[]
  description: string | null
  openings: number
  companyId: string | null
  postedBy: string
  createdAt: string
}

export interface InternshipRecommendation extends Internship {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
}

export interface Application {
  id: string
  userId: string
  internshipId: string
  status: string
  matchScore: number
  appliedAt: string
  internship: Internship
}

export interface InternshipNotification {
  id: string
  userId: string
  internshipId: string
  message: string
  read: boolean
  createdAt: string
  internship: Internship
}

export interface CompanyInternship extends Internship {
  applicantCount: number
}

export interface ParsedJobDescription {
  skills: string[]
  category: string
  stipend: string
  location: string
  summary: string
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}
