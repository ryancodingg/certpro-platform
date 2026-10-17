import Papa from "papaparse"
import { fingerprint, questionSchema, type Question } from "./questions"
export function previewImport(text: string, format: "json" | "csv", existing: Question[]) {
  let rows: unknown[]
  if (format === "json") { const parsed = JSON.parse(text); if (!Array.isArray(parsed)) throw new Error("JSON must be an array of questions."); rows = parsed }
  else {
    const parsed = Papa.parse<Record<string, string>>(text, {header:true, skipEmptyLines:"greedy"})
    if (parsed.errors.length) throw new Error(parsed.errors.map(e => `Row ${(e.row ?? 0)+2}: ${e.message}`).join("; "))
    rows = parsed.data.map(row => {
      const result: Record<string, unknown> = {...row}
      for (const key of ["options","correctAnswer","statements","dropdownQuestions","dropdownOptions","images","isActive","isAiGenerated","hasCodeSnippet","hasEmbeddedContent"]) {
        if (row[key]) { try { result[key] = JSON.parse(row[key]) } catch { result[key] = row[key] } }
        else delete result[key]
      }
      if (!result.questionType) delete result.questionType
      if (!result.status) delete result.status
      return result
    })
  }
  if (!rows.length || rows.length > 200) throw new Error("Import between 1 and 200 questions per batch.")
  const seen = new Set(existing.map(fingerprint))
  const valid: Omit<Question,"id">[] = []
  const errors: string[] = []
  const duplicates: number[] = []
  rows.forEach((row,i) => {
    const result = questionSchema.safeParse(row)
    if (!result.success) { errors.push(`Row ${i+1}: ${result.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; ")}`); return }
    const key = fingerprint(result.data)
    if (seen.has(key)) { duplicates.push(i+1); return }
    seen.add(key)
    valid.push({...result.data, status:"draft", isActive:false})
  })
  return {valid, errors, duplicates, total:rows.length}
}
