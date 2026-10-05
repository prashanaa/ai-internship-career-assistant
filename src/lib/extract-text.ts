// Server-side resume text extraction for PDF and DOCX files.
// Used by /api/resume/extract before sending text to the Dahl AI parser.

import { extractText as unpdfExtractText } from 'unpdf'
import mammoth from 'mammoth'

export interface ExtractResult {
  text: string
  pages?: number
  method: 'pdf' | 'docx' | 'txt' | 'md'
  warnings: string[]
}

/**
 * Extract plain text from an uploaded resume file buffer.
 * Supported formats: .pdf, .docx, .doc, .txt, .md
 */
export async function extractFileText(
  buffer: Buffer,
  fileName: string
): Promise<ExtractResult> {
  const ext = (fileName.toLowerCase().split('.').pop() ?? '').trim()
  const warnings: string[] = []

  switch (ext) {
    case 'pdf':
      return extractPdf(buffer, warnings)
    case 'docx':
      return extractDocx(buffer, warnings)
    case 'doc':
      // Legacy .doc binary format — mammoth only supports .docx. We attempt
      // mammoth but warn if it fails; the user should re-save as .docx.
      try {
        return await extractDocx(buffer, warnings, 'doc')
      } catch {
        throw new Error(
          'Legacy .doc format is not supported. Please re-save your resume as .docx or .pdf and upload again.'
        )
      }
    case 'txt':
    case 'md':
    case 'text':
      return {
        text: buffer.toString('utf-8'),
        method: ext === 'md' ? 'md' : 'txt',
        warnings,
      }
    default:
      throw new Error(
        `Unsupported file format ".${ext}". Please upload a PDF or DOCX file.`
      )
  }
}

async function extractPdf(buffer: Buffer, warnings: string[]): Promise<ExtractResult> {
  try {
    // unpdf expects a Uint8Array, not a Node Buffer
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    const result = await unpdfExtractText(uint8, { mergePages: true })
    const text = (result.text ?? '').trim()
    if (!text) {
      warnings.push(
        'No selectable text found. The PDF may be a scanned image — OCR is not supported.'
      )
    }
    return {
      text,
      pages: result.totalPages,
      method: 'pdf',
      warnings,
    }
  } catch (err) {
    throw new Error(
      `Could not read PDF: ${err instanceof Error ? err.message : 'unknown error'}. If this is a scanned image PDF, please paste the resume text manually.`
    )
  }
}

async function extractDocx(
  buffer: Buffer,
  warnings: string[],
  kind: 'docx' | 'doc' = 'docx'
): Promise<ExtractResult> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = (result.value ?? '').trim()
    if (!text) {
      warnings.push('No text content found in the document.')
    }
    if (result.messages?.length) {
      // Surface non-fatal mammoth messages as warnings (max 3)
      const notable = result.messages
        .filter((m) => m.type === 'warning')
        .slice(0, 3)
        .map((m) => m.message)
      warnings.push(...notable)
    }
    return { text, method: kind, warnings }
  } catch (err) {
    throw new Error(
      `Could not read ${kind.toUpperCase()} file: ${err instanceof Error ? err.message : 'unknown error'}.`
    )
  }
}
