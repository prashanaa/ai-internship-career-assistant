'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Loader2,
  Sparkles,
  FileText,
  Upload,
  BadgeCheck,
  FolderGit2,
  GraduationCap,
  ListChecks,
  ClipboardCheck,
  User,
  Mail,
  Phone,
  RefreshCw,
  FileType,
  FileCheck2,
} from 'lucide-react'
import type { Resume, ApiResponse } from '@/lib/types'
import { apiFetch } from '@/lib/api'

const SAMPLE_RESUME = `Nandha Kumar
Email: nandha.kumar@example.com | Phone: +91-9876543210

Objective
Final-year B.Tech AI & Data Science student seeking a Data Analyst / AI & ML internship to apply my Python, SQL and Machine Learning skills.

Education
- B.Tech in Artificial Intelligence & Data Science, Kumararaja Engineering College, 2022-2026 (CGPA 8.6)
- Higher Secondary, Govt Higher Sec School, 2022 (94%)

Skills
Programming: Python, SQL, JavaScript
Data: Pandas, NumPy, Power BI, Excel
ML: Machine Learning, Scikit-learn, TensorFlow
Web: HTML, CSS
Soft: Communication, Teamwork

Projects
1. Student Performance Predictor
   Built an ML model using Python and Scikit-learn to predict student grades from study hours and attendance. Achieved 89% accuracy.
   Skills: Python, Machine Learning, Scikit-learn, Pandas
2. Sales Dashboard in Power BI
   Created an interactive Power BI dashboard for a retail dataset summarizing revenue by region and product category.
   Skills: Power BI, SQL, Excel
3. Personal Portfolio Website
   Designed and deployed a responsive portfolio using HTML, CSS and JavaScript.
   Skills: HTML, CSS, JavaScript

Certifications
- Google Data Analytics Professional Certificate - Coursera (2024) - Verified
- Microsoft Power BI Data Analyst (PL-300) - Microsoft (2023) - Verified
- Intro to Machine Learning - Kaggle (2023)

Experience
- Data Science Intern, DataWorks Solutions (Jun 2025 - Aug 2025): Built data pipelines in Python and SQL.`

export function ResumeSection() {
  const { resume, setResume, user, setPage } = useAppStore()
  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('resume.pdf')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [extractMethod, setExtractMethod] = useState<string | null>(null)

  const analyze = async (text: string, name: string) => {
    if (!user) {
      toast.error('Please sign in to analyze and save your resume.')
      setPage('auth')
      return
    }
    if (text.trim().length < 30) {
      toast.error('Resume text is too short.')
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch<ApiResponse<Resume>>('/api/resume', {
        method: 'POST',
        body: JSON.stringify({ rawText: text, fileName: name }),
      })
      if (!data.success || !data.data) {
        throw new Error(data.error || 'AI analysis failed')
      }
      setResume(data.data)
      toast.success('Resume analyzed! Skills, projects & certifications validated.')
      // smooth scroll to results
      setTimeout(() => {
        document.getElementById('resume-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase()
    const ext = name.split('.').pop() ?? ''
    const supported = ['pdf', 'docx', 'doc', 'txt', 'md']
    if (!supported.includes(ext)) {
      toast.error(`Unsupported format ".${ext}". Please upload a PDF or DOCX file.`)
      return
    }

    setFileName(file.name)
    setExtractMethod(null)

    // Plain text formats — read directly on the client (no server round-trip)
    if (ext === 'txt' || ext === 'md') {
      try {
        const text = await file.text()
        setRawText(text)
        setExtractMethod(ext)
        toast.info(`Loaded "${file.name}". Review the text, then click Analyze with AI.`)
      } catch {
        toast.error('Could not read the text file.')
      }
      return
    }

    // PDF / DOCX — upload to the server for text extraction
    if (!user) {
      toast.error('Please sign in to upload a resume file.')
      setPage('auth')
      return
    }
    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      // Use the apiFetch token helper but send multipart, so attach the header manually
      const { getToken } = await import('@/lib/api')
      const token = getToken()
      const res = await fetch('/api/resume/extract', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract text from file')
      }
      setRawText(data.data.text)
      setExtractMethod(data.data.method)
      const warn = data.data.warnings?.length
        ? ` (${data.data.warnings.join('; ')})`
        : ''
      toast.success(
        `Extracted text from "${file.name}" (${data.data.method.toUpperCase()}).${warn} Review and click Analyze with AI.`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void handleFile(file)
    } else {
      toast.error('Please drop a PDF or DOCX file.')
    }
  }

  const parsed = resume?.parsedData

  return (
    <div className="bg-brand-light py-10 animate-section">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand">Resume AI Analysis</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Upload your resume as a <span className="font-semibold text-brand">PDF</span> or{' '}
            <span className="font-semibold text-brand">DOCX</span> file (or paste the text). Our AI
            validates your skills, projects and certifications and turns them into reusable data for
            internship matching.
          </p>
        </div>

        <Card className="border-brand/20 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand">
              <Sparkles className="h-5 w-5" />
              Submit your resume
            </CardTitle>
            <CardDescription>
              We never store raw files long-term — only the parsed, structured result tied to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`rounded-lg border-2 border-dashed p-5 text-center transition ${
                dragging ? 'border-brand bg-brand/5' : 'border-brand/30'
              }`}
            >
              {extracting ? (
                <>
                  <Loader2 className="h-7 w-7 mx-auto text-brand animate-spin" />
                  <p className="mt-2 text-sm font-medium text-brand">
                    Extracting text from your file…
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reading the document and converting it to plain text for AI analysis.
                  </p>
                </>
              ) : (
                <>
                  <FileType className="h-7 w-7 mx-auto text-brand/70" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag &amp; drop your resume, or
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                    <Badge variant="outline" className="border-brand/40 text-brand">PDF</Badge>
                    <Badge variant="outline" className="border-brand/40 text-brand">DOCX</Badge>
                    <Badge variant="outline" className="border-brand/30 text-brand/70">TXT</Badge>
                    <Badge variant="outline" className="border-brand/30 text-brand/70">MD</Badge>
                  </div>
                  <label className="mt-3 inline-block">
                    <Input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void handleFile(f)
                        e.target.value = '' // allow re-uploading the same file
                      }}
                    />
                    <span className="inline-flex cursor-pointer items-center rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-deep">
                      <Upload className="h-4 w-4 mr-1.5" />
                      Choose file
                    </span>
                  </label>
                  <button
                    type="button"
                    className="ml-2 text-xs text-brand underline"
                    onClick={() => {
                      setRawText(SAMPLE_RESUME)
                      setFileName('sample-resume.pdf')
                      setExtractMethod('sample')
                      toast.info('Sample resume loaded — click Analyze with AI.')
                    }}
                  >
                    or load a sample resume
                  </button>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fileName">File name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="resume.pdf"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="rawText">
                  Resume content
                </Label>
                {extractMethod && rawText.trim().length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Extracted from {extractMethod.toUpperCase()}
                  </span>
                )}
              </div>
              <Textarea
                id="rawText"
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value)
                  setExtractMethod(null)
                }}
                placeholder="Upload a PDF/DOCX above, or paste the full text of your resume here..."
                className="min-h-[220px] custom-scroll font-mono text-sm"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Review the extracted text before analyzing — you can edit it.</span>
                <span>{rawText.length.toLocaleString()} / 12,000 characters</span>
              </div>
            </div>

            <Button
              onClick={() => void analyze(rawText, fileName)}
              disabled={loading || rawText.trim().length < 30}
              className="w-full bg-brand hover:bg-brand-deep text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI is validating your skills...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {parsed && (
          <div id="resume-results" className="mt-8 space-y-6">
            <Card className="border-brand/20">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-brand flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5" />
                    Validated Resume Profile
                  </CardTitle>
                  <CardDescription>
                    AI-extracted and structured from your resume. This data powers internship recommendations.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPage('internships')} className="border-brand text-brand hover:bg-brand hover:text-white">
                  View matched internships
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <IdentityTile icon={User} label="Name" value={parsed.name || '—'} />
                  <IdentityTile icon={Mail} label="Email" value={parsed.email || '—'} />
                  <IdentityTile icon={Phone} label="Phone" value={parsed.phone || '—'} />
                </div>

                {parsed.summary && (
                  <div className="rounded-lg bg-brand-light p-4 text-sm text-brand-deep/90">
                    <span className="font-semibold text-brand">Summary:</span>{' '}
                    {parsed.summary}
                  </div>
                )}

                {/* Education */}
                {parsed.education.length > 0 && (
                  <Block icon={GraduationCap} title="Education">
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {parsed.education.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </Block>
                )}

                {/* Skills — the reusable data */}
                <Block icon={ListChecks} title={`Skills (${parsed.normalizedSkills.length} normalized)`}>
                  <div className="flex flex-wrap gap-2">
                    {parsed.normalizedSkills.map((s) => (
                      <Badge key={s} variant="secondary" className="bg-brand/10 text-brand border border-brand/20">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </Block>

                {/* Project skills (derived from projects) */}
                {parsed.projectSkills.length > 0 && (
                  <Block icon={FolderGit2} title={`Skills validated from projects (${parsed.projectSkills.length})`}>
                    <p className="text-xs text-muted-foreground mb-2">
                      These are skills the AI confirmed are actually demonstrated in your projects —
                      stronger evidence for recruiters.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parsed.projectSkills.map((s) => (
                        <Badge key={s} className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <BadgeCheck className="h-3 w-3 mr-1" />
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </Block>
                )}

                {/* Projects */}
                {parsed.projects.length > 0 && (
                  <Block icon={FolderGit2} title={`Projects (${parsed.projects.length})`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {parsed.projects.map((p, i) => (
                        <div key={i} className="rounded-lg border border-brand/15 p-3 bg-white">
                          <div className="font-semibold text-brand">{p.name}</div>
                          <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                          {p.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {p.skills.map((s) => (
                                <span key={s} className="text-[11px] rounded bg-brand/5 text-brand px-1.5 py-0.5">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Block>
                )}

                {/* Certifications */}
                {parsed.certifications.length > 0 && (
                  <Block icon={ClipboardCheck} title={`Certifications (${parsed.certifications.length})`}>
                    <div className="space-y-2">
                      {parsed.certifications.map((c, i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border border-brand/15 p-3 bg-white"
                        >
                          <div>
                            <div className="font-medium text-brand">{c.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {c.issuer}
                              {c.date ? ` · ${c.date}` : ''}
                            </div>
                          </div>
                          {c.verified ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <BadgeCheck className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </Block>
                )}

                {/* Experience */}
                {parsed.experience.length > 0 && (
                  <Block icon={FileText} title="Experience">
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {parsed.experience.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </Block>
                )}

                <div className="flex items-center justify-between rounded-lg bg-brand-light p-3">
                  <div className="text-sm">
                    <span className="font-semibold text-brand">Reusable skill set:</span>{' '}
                    <span className="text-muted-foreground">
                      {parsed.normalizedSkills.length} skills ready for internship matching.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void analyze(resume.rawText, resume.fileName)}
                    disabled={loading}
                    className="border-brand text-brand hover:bg-brand hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Re-run AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function IdentityTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-brand/15 bg-white p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-brand/70">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-brand truncate" title={value}>
        {value}
      </div>
    </div>
  )
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-brand" />
        <h3 className="font-semibold text-brand">{title}</h3>
      </div>
      {children}
    </div>
  )
}
