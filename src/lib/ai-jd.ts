// AI job-description parser using the Dahl Inference API.
// When a company posts an internship, this parses the free-text job
// description and extracts: required skills (the matching "filters"),
// category, stipend, location, and a short summary. The extracted skills
// become the internship's `skills` field used to match student resumes.

import { dahlChat } from '@/lib/dahl-client'
import type { ParsedJobDescription } from '@/lib/types'

const SYSTEM_PROMPT = `You are an expert technical recruiter and internship analyst.

Your task: Parse a company's internship job description and extract structured data for matching against student resumes. Respond with ONLY valid JSON (no markdown fences, no commentary, no reasoning trace).

The JSON must follow this exact schema:
{
  "skills": ["array of strings — every skill, tool, framework, language, or soft skill required or desired by the job description. Normalize casing (e.g. 'JavaScript', 'Python', 'SQL', 'Power BI', 'Machine Learning', 'React', 'Node.js'). Deduplicate. Include both hard skills and clearly-stated soft skills. Never invent skills that are not in the description."],
  "category": "string — the best-fit category. Pick the closest from this list: 'Web Development', 'Data Analytics', 'Artificial Intelligence', 'Software Engineering', 'Human Resources', 'Digital Marketing', 'DevOps', 'Design', 'Mobile Development', 'Cloud Engineering', 'Cybersecurity', 'Other'. If none fit, use 'Other'.",
  "stipend": "string — the stipend/salary if mentioned, formatted like '₹10,000 / Month' or 'Unpaid'. Empty string if not mentioned.",
  "location": "string — the work location if mentioned (e.g. 'Chennai', 'Remote', 'Bangalore'). Empty string if not mentioned.",
  "summary": "string — a 1-2 sentence summary of the role rewritten in clear language, suitable to show to students."
}

Critical rules:
1. Only include skills actually present in the job description — do not infer skills the company did not mention.
2. Be liberal in capturing skills (tools, frameworks, languages, methodologies, named soft skills) but conservative about adding ones not stated.
3. If the description is sparse, return short/empty arrays and strings — never invent content.
4. Return ONLY the JSON object — no prose, no markdown fences, no explanation.`

export async function parseJobDescription(
  jobDescription: string,
  designation: string,
  companyName: string
): Promise<ParsedJobDescription> {
  const content = await dahlChat({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Company: ${companyName}\nDesignation/Role: ${designation}\n\nParse the following internship job description and return the structured JSON.\n\n--- JOB DESCRIPTION START ---\n${jobDescription}\n--- JOB DESCRIPTION END ---`,
      },
    ],
    temperature: 0.1,
    maxTokens: 2048,
  })

  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  let parsed: ParsedJobDescription
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error('AI returned an unparseable job description analysis.')
    }
    parsed = JSON.parse(match[0])
  }

  return {
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    category: typeof parsed.category === 'string' && parsed.category ? parsed.category : 'Other',
    stipend: typeof parsed.stipend === 'string' ? parsed.stipend : '',
    location: typeof parsed.location === 'string' ? parsed.location : '',
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
  }
}
