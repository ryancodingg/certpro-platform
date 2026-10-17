"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ConverterPage() {
  const [csvInput, setCsvInput] = useState("")
  const [jsonOutput, setJsonOutput] = useState("")
  const [error, setError] = useState("")
  const [selectedCertification, setSelectedCertification] = useState("dp-700")

  const certifications = [
    { id: "dp-700", name: "Microsoft DP-700 - Azure Data Fundamentals" },
    { id: "az-900", name: "Microsoft AZ-900 - Azure Fundamentals" },
    { id: "dp-203", name: "Microsoft DP-203 - Azure Data Engineer Associate" },
    { id: "aws-clf-c02", name: "AWS CLF-C02 - Cloud Practitioner" },
    { id: "aws-saa-c03", name: "AWS SAA-C03 - Solutions Architect Associate" },
    { id: "ccna", name: "Cisco CCNA - Network Associate" },
  ]

  const convertCsvToJson = () => {
    try {
      setError("")

      if (!csvInput.trim()) {
        setError("Please paste your CSV data")
        return
      }

      const lines = csvInput.trim().split("\n")
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

      const questions = []

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])

        if (values.length < 9) continue // Skip incomplete rows

        const correctAnswerLetter = values[5].trim().toUpperCase()
        let correctAnswerIndex = 0

        switch (correctAnswerLetter) {
          case "A":
            correctAnswerIndex = 0
            break
          case "B":
            correctAnswerIndex = 1
            break
          case "C":
            correctAnswerIndex = 2
            break
          case "D":
            correctAnswerIndex = 3
            break
          default:
            correctAnswerIndex = 0
        }

        const question = {
          question: values[0].trim(),
          options: [values[1].trim(), values[2].trim(), values[3].trim(), values[4].trim()],
          correctAnswer: correctAnswerIndex,
          explanation: values[6].trim(),
          topic: values[7].trim(),
          difficulty: values[8].trim(),
          certification: selectedCertification, // Use selected certification
          sourceUrl: values[9] ? values[9].trim() : "", // Optional source URL
        }

        questions.push(question)
      }

      setJsonOutput(JSON.stringify(questions, null, 2))
    } catch (err) {
      setError("Error parsing CSV. Please check your format.")
      console.error(err)
    }
  }

  // Simple CSV parser that handles quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }

    result.push(current) // Add the last field
    return result
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonOutput)
    alert("JSON copied to clipboard!")
  }

  const downloadJson = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedCertification}-questions.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sampleCsv = `Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Topic,Difficulty,Source URL
"What is the primary purpose of Azure Data Factory?","To store data","To orchestrate data pipelines","To visualize data","To secure data","B","Azure Data Factory is designed for creating and managing data pipelines for ETL/ELT processes","Azure Data Services","Medium","https://docs.microsoft.com/en-us/azure/data-factory/"
"Which Azure service is best for NoSQL databases?","SQL Database","Cosmos DB","Table Storage","Blob Storage","B","Azure Cosmos DB is a fully managed NoSQL database service with multiple data models","Azure Data Services","Easy","https://docs.microsoft.com/en-us/azure/cosmos-db/"
"What does ETL stand for?","Execute, Test, Launch","Extract, Transform, Load","Evaluate, Track, Log","Export, Transfer, Link","B","ETL is the process of extracting data from sources, transforming it, and loading it into a target system","Data Concepts","Easy","https://docs.microsoft.com/en-us/azure/architecture/data-guide/relational-data/etl"`

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CSV to JSON Converter</h1>
            <p className="text-gray-600">Convert spreadsheet data to JSON for bulk import</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Certification & Paste CSV Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="certification">Target Certification</Label>
                <Select value={selectedCertification} onValueChange={setSelectedCertification}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select certification" />
                  </SelectTrigger>
                  <SelectContent>
                    {certifications.map((cert) => (
                      <SelectItem key={cert.id} value={cert.id}>
                        {cert.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="csv-input">CSV Data from Spreadsheet</Label>
                <Textarea
                  id="csv-input"
                  placeholder="Paste your CSV data here..."
                  className="min-h-[300px] font-mono text-sm"
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={convertCsvToJson} className="flex-1">
                  Convert to JSON
                </Button>
                <Button variant="outline" onClick={() => setCsvInput(sampleCsv)}>
                  Load Sample
                </Button>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Copy JSON Output</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="json-output">Generated JSON for {selectedCertification.toUpperCase()}</Label>
                <Textarea
                  id="json-output"
                  placeholder="JSON output will appear here..."
                  className="min-h-[300px] font-mono text-sm"
                  value={jsonOutput}
                  readOnly
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={copyToClipboard} disabled={!jsonOutput} className="flex items-center gap-2 flex-1">
                  <Copy className="h-4 w-4" />
                  Copy JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadJson}
                  disabled={!jsonOutput}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 How to Use This Converter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Spreadsheet Setup:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Select the target certification from the dropdown above</li>
                  <li>Create a spreadsheet with these exact column headers:</li>
                  <div className="bg-gray-100 p-2 rounded font-mono text-xs mt-1 mb-2">
                    Question | Option A | Option B | Option C | Option D | Correct Answer | Explanation | Topic |
                    Difficulty | Source URL
                  </div>
                  <li>Fill in your questions row by row</li>
                  <li>Use A, B, C, or D for the "Correct Answer" column</li>
                  <li>Select all data and copy (Ctrl+C)</li>
                  <li>Paste into the CSV input box above</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-3">After Conversion:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Click "Convert to JSON" to generate the output</li>
                  <li>The certification field will be automatically set to your selection</li>
                  <li>Copy the JSON from the output box</li>
                  <li>Go to Admin Panel → Bulk Import tab</li>
                  <li>Paste the JSON and click "Import Questions"</li>
                  <li>Your questions will be added to the selected certification!</li>
                </ol>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Pro Tip:</strong> The converter automatically assigns questions to the selected
                    certification, so you don't need to manually add the certification field!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Format */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📝 Sample Spreadsheet Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Question</th>
                    <th className="border border-gray-300 p-2">Option A</th>
                    <th className="border border-gray-300 p-2">Option B</th>
                    <th className="border border-gray-300 p-2">Option C</th>
                    <th className="border border-gray-300 p-2">Option D</th>
                    <th className="border border-gray-300 p-2">Correct Answer</th>
                    <th className="border border-gray-300 p-2">Explanation</th>
                    <th className="border border-gray-300 p-2">Topic</th>
                    <th className="border border-gray-300 p-2">Difficulty</th>
                    <th className="border border-gray-300 p-2">Source URL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">What is Azure Data Factory?</td>
                    <td className="border border-gray-300 p-2">Storage service</td>
                    <td className="border border-gray-300 p-2 bg-green-50">Data integration service</td>
                    <td className="border border-gray-300 p-2">Analytics service</td>
                    <td className="border border-gray-300 p-2">Security service</td>
                    <td className="border border-gray-300 p-2 font-bold">B</td>
                    <td className="border border-gray-300 p-2">Azure Data Factory is designed for...</td>
                    <td className="border border-gray-300 p-2">Azure Data Services</td>
                    <td className="border border-gray-300 p-2">Medium</td>
                    <td className="border border-gray-300 p-2 text-blue-600">https://docs.microsoft.com/...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
