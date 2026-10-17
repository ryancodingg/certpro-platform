"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  Download,
  BarChart3,
  Database,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Settings,
  Brain,
  Globe,
  Zap,
  RefreshCw,
  Cloud,
  HardDrive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ChevronDown,
  Code,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthNav } from "@/components/auth-nav"
import {
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  bulkAddQuestions,
  getQuestionStats,
  initializeSampleQuestions,
  type Question,
} from "@/lib/firestore"

// CertPro Logo Component
const CertProLogo = ({ className = "text-2xl" }: { className?: string }) => (
  <div className={`font-bold gradient-text ${className}`}>CertPro</div>
)

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [importData, setImportData] = useState("")
  const [exportData, setExportData] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [storageMode, setStorageMode] = useState<"firebase" | "localStorage">("localStorage")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const questionsPerPage = 25

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    scenario: "",
    options: ["", "", "", ""],
    statements: ["", "", ""],
    correctAnswer: [] as number[] | boolean[] | string[],
    explanation: "",
    topic: "",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    certification: "dp-700",
    sourceUrl: "",
    isActive: true,
    isAiGenerated: false,
    questionType: "single" as "single" | "multiple" | "yesno" | "dropdown",
    imageUrl: "",
    hasEmbeddedContent: false,
    images: [] as { url: string; alt: string; caption?: string; position: "top" | "middle" | "bottom" | "inline" }[],
    dropdownQuestions: ["", ""],
    dropdownOptions: [
      ["", "", ""],
      ["", "", ""],
    ] as string[][],
    codeSnippet: "",
    codeLanguage: "javascript" as
      | "javascript"
      | "python"
      | "sql"
      | "csharp"
      | "java"
      | "typescript"
      | "json"
      | "xml"
      | "yaml"
      | "bash"
      | "powershell",
    hasCodeSnippet: false,
  })

  const certifications = [
    { value: "dp-700", label: "Microsoft DP-700 (Azure Data Fundamentals)" },
    { value: "az-900", label: "Microsoft AZ-900 (Azure Fundamentals)" },
    { value: "dp-203", label: "Microsoft DP-203 (Azure Data Engineer Associate)" },
    { value: "aws-clf-c02", label: "AWS CLF-C02 (Cloud Practitioner)" },
    { value: "aws-saa-c03", label: "AWS SAA-C03 (Solutions Architect Associate)" },
    { value: "ccna", label: "Cisco CCNA (Network Associate)" },
    { value: "databricks-certified-associate-developer", label: "Databricks Associate Developer" },
    { value: "databricks-certified-data-engineer-associate", label: "Databricks Data Engineer Associate" },
    { value: "databricks-certified-machine-learning-associate", label: "Databricks ML Associate" },
  ]

  useEffect(() => {
    loadQuestions()
    loadStats()
    checkStorageMode()
  }, [currentPage])

  const checkStorageMode = () => {
    // Check if Firebase is configured by looking for environment variables
    const isFirebaseConfigured = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    )
    setStorageMode(isFirebaseConfigured ? "firebase" : "localStorage")
  }

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const result = await getAllQuestions(currentPage, questionsPerPage)
      setQuestions(result.questions)
      setTotalPages(result.totalPages)
      setTotalQuestions(result.total)
      console.log(`📊 Loaded ${result.questions.length} questions (page ${currentPage} of ${result.totalPages})`)
    } catch (error) {
      console.error("Error loading questions:", error)
      showMessage("error", "Failed to load questions")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await getQuestionStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const resetForm = () => {
    setFormData({
      question: "",
      scenario: "",
      options: ["", "", "", ""],
      statements: ["", "", ""],
      correctAnswer: [],
      explanation: "",
      topic: "",
      difficulty: "Medium",
      certification: "dp-700",
      sourceUrl: "",
      isActive: true,
      isAiGenerated: false,
      questionType: "single",
      imageUrl: "",
      hasEmbeddedContent: false,
      images: [],
      dropdownQuestions: ["", ""],
      dropdownOptions: [
        ["", "", ""],
        ["", "", ""],
      ],
      codeSnippet: "",
      codeLanguage: "javascript",
      hasCodeSnippet: false,
    })
  }

  const handleAddQuestion = async () => {
    if (!formData.question.trim()) {
      showMessage("error", "Please fill in the question field")
      return
    }

    // Validate based on question type
    if (formData.questionType === "yesno") {
      if (formData.statements.some((stmt) => !stmt.trim()) || (formData.correctAnswer as boolean[]).length === 0) {
        showMessage("error", "Please fill in all statements and select Yes/No answers")
        return
      }
    } else if (formData.questionType === "dropdown") {
      if (
        formData.dropdownQuestions.some((q) => !q.trim()) ||
        formData.dropdownOptions.some((opts) => opts.filter((opt) => opt.trim()).length === 0) ||
        (formData.correctAnswer as string[]).length === 0
      ) {
        showMessage(
          "error",
          "Please fill in all dropdown questions, at least one option per dropdown, and select correct answers",
        )
        return
      }
    } else {
      if (formData.options.some((opt) => !opt.trim()) || formData.correctAnswer.length === 0) {
        showMessage("error", "Please fill in all options and select correct answers")
        return
      }
    }

    setSaving(true)
    try {
      const questionData = {
        ...formData,
        // Filter out empty options for dropdown questions
        dropdownOptions:
          formData.questionType === "dropdown"
            ? formData.dropdownOptions.map((opts) => opts.filter((opt) => opt.trim() !== ""))
            : formData.dropdownOptions,
        correctAnswer:
          formData.questionType === "single"
            ? (formData.correctAnswer as number[])[0]
            : formData.questionType === "yesno"
              ? formData.correctAnswer
              : formData.questionType === "dropdown"
                ? formData.correctAnswer
                : formData.correctAnswer,
        createdAt: new Date().toISOString().split("T")[0],
      }

      await addQuestion(questionData)
      await loadQuestions()
      await loadStats()
      resetForm()
      setShowAddForm(false)
      showMessage("success", "Question added successfully!")
    } catch (error) {
      console.error("Error adding question:", error)
      showMessage("error", "Failed to add question")
    } finally {
      setSaving(false)
    }
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      question: question.question,
      scenario: question.scenario || "",
      options: question.options.length > 0 ? question.options : ["", "", "", ""],
      statements: question.statements || ["", "", ""],
      correctAnswer: Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer as number],
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
      certification: question.certification,
      sourceUrl: question.sourceUrl || "",
      isActive: question.isActive,
      isAiGenerated: question.isAiGenerated,
      questionType: question.questionType || "single",
      imageUrl: question.imageUrl || "",
      hasEmbeddedContent: question.hasEmbeddedContent || false,
      images: question.images || [],
      dropdownQuestions: question.dropdownQuestions || ["", ""],
      dropdownOptions: question.dropdownOptions || [
        ["", "", ""],
        ["", "", ""],
      ],
      codeSnippet: question.codeSnippet || "",
      codeLanguage: question.codeLanguage || "javascript",
      hasCodeSnippet: question.hasCodeSnippet || false,
    })
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return

    setSaving(true)
    try {
      const questionData = {
        ...formData,
        // Filter out empty options for dropdown questions
        dropdownOptions:
          formData.questionType === "dropdown"
            ? formData.dropdownOptions.map((opts) => opts.filter((opt) => opt.trim() !== ""))
            : formData.dropdownOptions,
        correctAnswer:
          formData.questionType === "single"
            ? (formData.correctAnswer as number[])[0]
            : formData.questionType === "yesno"
              ? formData.correctAnswer
              : formData.questionType === "dropdown"
                ? formData.correctAnswer
                : formData.correctAnswer,
      }

      await updateQuestion(editingQuestion.id, questionData)
      await loadQuestions()
      await loadStats()
      setEditingQuestion(null)
      resetForm()
      showMessage("success", "Question updated successfully!")
    } catch (error) {
      console.error("Error updating question:", error)
      showMessage("error", "Failed to update question")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return

    try {
      await deleteQuestion(questionId)
      await loadQuestions()
      await loadStats()
      showMessage("success", "Question deleted successfully!")
    } catch (error) {
      console.error("Error deleting question:", error)
      showMessage("error", "Failed to delete question")
    }
  }

  const handleImport = async () => {
    if (!importData.trim()) {
      showMessage("error", "Please paste JSON data to import")
      return
    }

    try {
      const parsedData = JSON.parse(importData)
      const questionsToImport = Array.isArray(parsedData) ? parsedData : [parsedData]

      // Validate and clean the data
      const validQuestions = questionsToImport
        .filter(
          (q) => q.question && (q.options || q.statements || q.dropdownQuestions) && q.correctAnswer !== undefined,
        )
        .map((q) => ({
          question: q.question,
          scenario: q.scenario || "",
          options: q.options || [],
          statements: q.statements || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          topic: q.topic || "General",
          difficulty: q.difficulty || "Medium",
          certification: q.certification || "dp-700",
          sourceUrl: q.sourceUrl || "",
          isActive: q.isActive !== false,
          isAiGenerated: q.isAiGenerated || false,
          questionType: q.questionType || "single",
          imageUrl: q.imageUrl || "",
          hasEmbeddedContent: q.hasEmbeddedContent || false,
          images: q.images || [],
          dropdownQuestions: q.dropdownQuestions || [],
          dropdownOptions: q.dropdownOptions || [],
          codeSnippet: q.codeSnippet || "",
          codeLanguage: q.codeLanguage || "javascript",
          hasCodeSnippet: q.hasCodeSnippet || false,
          createdAt: new Date().toISOString().split("T")[0],
        }))

      if (validQuestions.length === 0) {
        showMessage("error", "No valid questions found in the imported data")
        return
      }

      setSaving(true)
      await bulkAddQuestions(validQuestions)
      await loadQuestions()
      await loadStats()
      setImportData("")
      showMessage("success", `Successfully imported ${validQuestions.length} questions!`)
    } catch (error) {
      console.error("Error importing questions:", error)
      showMessage("error", "Failed to import questions. Please check the JSON format.")
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    const exportQuestions = questions.map((q) => ({
      question: q.question,
      scenario: q.scenario,
      options: q.options,
      statements: q.statements,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      certification: q.certification,
      sourceUrl: q.sourceUrl,
      isActive: q.isActive,
      isAiGenerated: q.isAiGenerated,
      questionType: q.questionType,
      imageUrl: q.imageUrl,
      hasEmbeddedContent: q.hasEmbeddedContent,
      images: q.images,
      dropdownQuestions: q.dropdownQuestions,
      dropdownOptions: q.dropdownOptions,
      codeSnippet: q.codeSnippet,
      codeLanguage: q.codeLanguage,
      hasCodeSnippet: q.hasCodeSnippet,
      createdAt: q.createdAt,
    }))

    setExportData(JSON.stringify(exportQuestions, null, 2))
    showMessage("success", "Questions exported successfully! Copy the JSON data below.")
  }

  const handleInitializeSample = async () => {
    if (!confirm("This will add sample questions. Continue?")) return

    setSaving(true)
    try {
      await initializeSampleQuestions()
      await loadQuestions()
      await loadStats()
      showMessage("success", "Sample questions initialized successfully!")
    } catch (error) {
      console.error("Error initializing sample questions:", error)
      showMessage("error", "Failed to initialize sample questions")
    } finally {
      setSaving(false)
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const handleStatementChange = (index: number, value: string) => {
    const newStatements = [...formData.statements]
    newStatements[index] = value
    setFormData({ ...formData, statements: newStatements })
  }

  const handleDropdownQuestionChange = (index: number, value: string) => {
    const newDropdownQuestions = [...formData.dropdownQuestions]
    newDropdownQuestions[index] = value
    setFormData({ ...formData, dropdownQuestions: newDropdownQuestions })
  }

  const handleDropdownOptionChange = (dropdownIndex: number, optionIndex: number, value: string) => {
    const newDropdownOptions = [...formData.dropdownOptions]
    newDropdownOptions[dropdownIndex][optionIndex] = value
    setFormData({ ...formData, dropdownOptions: newDropdownOptions })
  }

  const handleDropdownCorrectAnswerChange = (index: number, value: string) => {
    const newCorrectAnswer = [...(formData.correctAnswer as string[])]
    newCorrectAnswer[index] = value
    setFormData({ ...formData, correctAnswer: newCorrectAnswer })
  }

  const handleCorrectAnswerChange = (index: number, checked: boolean) => {
    if (formData.questionType === "yesno") {
      const newCorrectAnswer = [...(formData.correctAnswer as boolean[])]
      newCorrectAnswer[index] = checked
      setFormData({ ...formData, correctAnswer: newCorrectAnswer })
    } else {
      let newCorrectAnswer = [...(formData.correctAnswer as number[])]

      if (formData.questionType === "single") {
        newCorrectAnswer = checked ? [index] : []
      } else {
        if (checked) {
          if (!newCorrectAnswer.includes(index)) {
            newCorrectAnswer.push(index)
          }
        } else {
          newCorrectAnswer = newCorrectAnswer.filter((i) => i !== index)
        }
      }

      setFormData({ ...formData, correctAnswer: newCorrectAnswer })
    }
  }

  const handleAddImage = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { url: "", alt: "", caption: "", position: "middle" }],
    })
  }

  const handleImageChange = (index: number, field: string, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = { ...newImages[index], [field]: value }
    setFormData({ ...formData, images: newImages })
  }

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    setFormData({ ...formData, images: newImages })
  }

  const handleAddDropdown = () => {
    setFormData({
      ...formData,
      dropdownQuestions: [...formData.dropdownQuestions, ""],
      dropdownOptions: [...formData.dropdownOptions, ["", "", ""]],
      correctAnswer: [...(formData.correctAnswer as string[]), ""],
    })
  }

  const handleRemoveDropdown = (index: number) => {
    const newDropdownQuestions = formData.dropdownQuestions.filter((_, i) => i !== index)
    const newDropdownOptions = formData.dropdownOptions.filter((_, i) => i !== index)
    const newCorrectAnswer = (formData.correctAnswer as string[]).filter((_, i) => i !== index)
    setFormData({
      ...formData,
      dropdownQuestions: newDropdownQuestions,
      dropdownOptions: newDropdownOptions,
      correctAnswer: newCorrectAnswer,
    })
  }

  const handleAddDropdownOption = (dropdownIndex: number) => {
    const newDropdownOptions = [...formData.dropdownOptions]
    newDropdownOptions[dropdownIndex] = [...newDropdownOptions[dropdownIndex], ""]
    setFormData({ ...formData, dropdownOptions: newDropdownOptions })
  }

  const handleRemoveDropdownOption = (dropdownIndex: number, optionIndex: number) => {
    const newDropdownOptions = [...formData.dropdownOptions]
    newDropdownOptions[dropdownIndex] = newDropdownOptions[dropdownIndex].filter((_, i) => i !== optionIndex)
    setFormData({ ...formData, dropdownOptions: newDropdownOptions })
  }

  const generateSampleJSON = () => {
    const sampleQuestions = [
      {
        question: "What is Azure Data Factory?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 1,
        explanation: "Explanation here",
        topic: "Azure Services",
        difficulty: "Medium",
        certification: "dp-700",
        questionType: "single",
        isActive: true,
        isAiGenerated: false,
      },
      {
        question: "Yes/No Question Example",
        scenario: "You have a deployment pipeline scenario...",
        statements: ["Statement 1 to evaluate", "Statement 2 to evaluate", "Statement 3 to evaluate"],
        correctAnswer: [true, false, true],
        explanation: "Explanation for Yes/No answers",
        topic: "Deployment",
        difficulty: "Hard",
        certification: "dp-700",
        questionType: "yesno",
        isActive: true,
        isAiGenerated: false,
      },
      {
        question: "Question with embedded image/table",
        scenario: "You have a storage container with files...",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 2,
        explanation: "Explanation with reference to the image",
        topic: "Storage",
        difficulty: "Hard",
        certification: "dp-700",
        questionType: "single",
        imageUrl: "https://example.com/image.png",
        hasEmbeddedContent: true,
        images: [
          {
            url: "https://example.com/table-image.png",
            alt: "Table showing file information",
            caption: "File storage details",
            position: "middle",
          },
        ],
        isActive: true,
        isAiGenerated: false,
      },
      {
        question: "Dropdown Question Example",
        scenario: "You have an EventStream that fails...",
        dropdownQuestions: ["To find the error details:", "To find the total number of errors:"],
        dropdownOptions: [
          ["Data insights", "Data preview", "Details", "Runtime logs"],
          ["Data insights", "Details", "Runtime logs"], // Different number of options
        ],
        correctAnswer: ["Runtime logs", "Details"],
        explanation: "Runtime logs show error details with timestamps, Details shows error counts",
        topic: "EventStream",
        difficulty: "Hard",
        certification: "dp-700",
        questionType: "dropdown",
        hasEmbeddedContent: true,
        isActive: true,
        isAiGenerated: false,
      },
      {
        question: "What will be the output of this Python code?",
        options: ["[1, 2, 3, 4, 5]", "[5, 4, 3, 2, 1]", "[1, 3, 5, 2, 4]", "Error"],
        correctAnswer: 1,
        explanation: "The reverse() method modifies the list in-place and returns None.",
        topic: "Python Programming",
        difficulty: "Easy",
        certification: "dp-700",
        questionType: "single",
        hasCodeSnippet: true,
        codeSnippet: "numbers = [1, 2, 3, 4, 5]\nnumbers.reverse()\nprint(numbers)",
        codeLanguage: "python",
        isActive: true,
        isAiGenerated: false,
      },
    ]

    setImportData(JSON.stringify(sampleQuestions, null, 2))
    showMessage("success", "Sample JSON format generated!")
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button
              onClick={() => handlePageChange(1)}
              variant="outline"
              size="sm"
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            onClick={() => handlePageChange(page)}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={
              currentPage === page
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
            }
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <Button
              onClick={() => handlePageChange(totalPages)}
              variant="outline"
              size="sm"
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black grid-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <Database className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-gray-400 font-light text-lg">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ""],
    })
  }

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      // Also update correctAnswer to remove any references to removed options
      let newCorrectAnswer = [...(formData.correctAnswer as number[])]
      newCorrectAnswer = newCorrectAnswer
        .filter((answerIndex) => answerIndex !== index)
        .map((answerIndex) => (answerIndex > index ? answerIndex - 1 : answerIndex))

      setFormData({
        ...formData,
        options: newOptions,
        correctAnswer: newCorrectAnswer,
      })
    }
  }

  return (
    <div className="min-h-screen bg-black grid-pattern">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <CertProLogo />
              <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50 text-purple-300">
                Admin Panel
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                {storageMode === "firebase" ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <Cloud className="h-4 w-4" />
                    <span>Firestore</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <HardDrive className="h-4 w-4" />
                    <span>localStorage</span>
                  </div>
                )}
              </div>
              <AuthNav />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Message Alert */}
        {message && (
          <Alert
            className={`mb-6 ${message.type === "success" ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}`}
          >
            <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-gray-800">
            <TabsTrigger value="questions" className="data-[state=active]:bg-blue-600">
              <FileText className="h-4 w-4 mr-2" />
              Questions ({totalQuestions})
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="import-export" className="data-[state=active]:bg-blue-600">
              <Database className="h-4 w-4 mr-2" />
              Import/Export
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Question Management</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Showing {questions.length} of {totalQuestions} questions (Page {currentPage} of {totalPages})
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
                <Button
                  onClick={loadQuestions}
                  variant="outline"
                  className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Add/Edit Question Form */}
            {(showAddForm || editingQuestion) && (
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {editingQuestion ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {editingQuestion ? "Edit Question" : "Add New Question"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Certification</label>
                      <Select
                        value={formData.certification}
                        onValueChange={(value) => setFormData({ ...formData, certification: value })}
                      >
                        <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {certifications.map((cert) => (
                            <SelectItem key={cert.value} value={cert.value} className="text-white hover:bg-gray-700">
                              {cert.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Question Type</label>
                      <Select
                        value={formData.questionType}
                        onValueChange={(value: "single" | "multiple" | "yesno" | "dropdown") =>
                          setFormData({ ...formData, questionType: value, correctAnswer: [] })
                        }
                      >
                        <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="single" className="text-white hover:bg-gray-700">
                            Single Choice
                          </SelectItem>
                          <SelectItem value="multiple" className="text-white hover:bg-gray-700">
                            Multiple Choice
                          </SelectItem>
                          <SelectItem value="yesno" className="text-white hover:bg-gray-700">
                            Yes/No Questions
                          </SelectItem>
                          <SelectItem value="dropdown" className="text-white hover:bg-gray-700">
                            Dropdown Questions
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Question</label>
                    <Textarea
                      placeholder="Enter your question..."
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className="bg-gray-800/50 border-gray-700 text-white min-h-[100px]"
                    />
                  </div>

                  {/* Code Snippet Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">Code Snippet</label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.hasCodeSnippet}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasCodeSnippet: checked })}
                        />
                        <label className="text-sm text-gray-300">Include Code</label>
                      </div>
                    </div>

                    {formData.hasCodeSnippet && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Programming Language</label>
                          <Select
                            value={formData.codeLanguage}
                            onValueChange={(
                              value:
                                | "javascript"
                                | "python"
                                | "sql"
                                | "csharp"
                                | "java"
                                | "typescript"
                                | "json"
                                | "xml"
                                | "yaml"
                                | "bash"
                                | "powershell",
                            ) => setFormData({ ...formData, codeLanguage: value })}
                          >
                            <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="javascript" className="text-white hover:bg-gray-700">
                                JavaScript
                              </SelectItem>
                              <SelectItem value="typescript" className="text-white hover:bg-gray-700">
                                TypeScript
                              </SelectItem>
                              <SelectItem value="python" className="text-white hover:bg-gray-700">
                                Python
                              </SelectItem>
                              <SelectItem value="sql" className="text-white hover:bg-gray-700">
                                SQL
                              </SelectItem>
                              <SelectItem value="csharp" className="text-white hover:bg-gray-700">
                                C#
                              </SelectItem>
                              <SelectItem value="java" className="text-white hover:bg-gray-700">
                                Java
                              </SelectItem>
                              <SelectItem value="json" className="text-white hover:bg-gray-700">
                                JSON
                              </SelectItem>
                              <SelectItem value="xml" className="text-white hover:bg-gray-700">
                                XML
                              </SelectItem>
                              <SelectItem value="yaml" className="text-white hover:bg-gray-700">
                                YAML
                              </SelectItem>
                              <SelectItem value="bash" className="text-white hover:bg-gray-700">
                                Bash
                              </SelectItem>
                              <SelectItem value="powershell" className="text-white hover:bg-gray-700">
                                PowerShell
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Code</label>
                          <Textarea
                            placeholder="Enter your code snippet here..."
                            value={formData.codeSnippet}
                            onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
                            className="bg-gray-800/50 border-gray-700 text-white min-h-[150px] font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500">
                            Code will be displayed with syntax highlighting for {formData.codeLanguage}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(formData.questionType === "yesno" || formData.questionType === "dropdown") && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Scenario (Optional)</label>
                      <Textarea
                        placeholder="Enter the scenario context..."
                        value={formData.scenario}
                        onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                        className="bg-gray-800/50 border-gray-700 text-white min-h-[150px]"
                      />
                    </div>
                  )}

                  {/* Image Management Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">Images & Embedded Content</label>
                      <Button
                        type="button"
                        onClick={handleAddImage}
                        variant="outline"
                        size="sm"
                        className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Main Image URL (Legacy)</label>
                      <Input
                        placeholder="https://example.com/image.png"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="bg-gray-800/50 border-gray-700 text-white"
                      />
                    </div>

                    {formData.images.map((image, index) => (
                      <Card key={index} className="bg-gray-800/30 border-gray-700">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-300">Image {index + 1}</h4>
                            <Button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              variant="outline"
                              size="sm"
                              className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-xs text-gray-400">Image URL</label>
                              <Input
                                placeholder="https://example.com/image.png"
                                value={image.url}
                                onChange={(e) => handleImageChange(index, "url", e.target.value)}
                                className="bg-gray-800/50 border-gray-700 text-white text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs text-gray-400">Alt Text</label>
                              <Input
                                placeholder="Description of the image"
                                value={image.alt}
                                onChange={(e) => handleImageChange(index, "alt", e.target.value)}
                                className="bg-gray-800/50 border-gray-700 text-white text-sm"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-xs text-gray-400">Caption (Optional)</label>
                              <Input
                                placeholder="Image caption"
                                value={image.caption || ""}
                                onChange={(e) => handleImageChange(index, "caption", e.target.value)}
                                className="bg-gray-800/50 border-gray-700 text-white text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs text-gray-400">Position</label>
                              <Select
                                value={image.position}
                                onChange={(e) => handleImageChange(index, "position", e.target.value)}
                              >
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem value="top" className="text-white hover:bg-gray-700">
                                    Top
                                  </SelectItem>
                                  <SelectItem value="middle" className="text-white hover:bg-gray-700">
                                    Middle
                                  </SelectItem>
                                  <SelectItem value="bottom" className="text-white hover:bg-gray-700">
                                    Bottom
                                  </SelectItem>
                                  <SelectItem value="inline" className="text-white hover:bg-gray-700">
                                    Inline
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.hasEmbeddedContent}
                        onCheckedChange={(checked) => setFormData({ ...formData, hasEmbeddedContent: checked })}
                      />
                      <label className="text-sm text-gray-300">Has Embedded Content (Tables/Images)</label>
                    </div>
                  </div>

                  {/* Question Type Specific Fields */}
                  {formData.questionType === "dropdown" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">Dropdown Questions</label>
                        <Button
                          type="button"
                          onClick={handleAddDropdown}
                          variant="outline"
                          size="sm"
                          className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Dropdown
                        </Button>
                      </div>

                      {formData.dropdownQuestions.map((dropdownQuestion, dropdownIndex) => (
                        <Card key={dropdownIndex} className="bg-gray-800/30 border-gray-700">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-300">Dropdown {dropdownIndex + 1}</h4>
                              {formData.dropdownQuestions.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => handleRemoveDropdown(dropdownIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs text-gray-400">Question/Prompt</label>
                              <Input
                                placeholder="e.g., To find the error details:"
                                value={dropdownQuestion}
                                onChange={(e) => handleDropdownQuestionChange(dropdownIndex, e.target.value)}
                                className="bg-gray-800/50 border-gray-700 text-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs text-gray-400">Dropdown Options</label>
                                <Button
                                  type="button"
                                  onClick={() => handleAddDropdownOption(dropdownIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-gray-700/50 border-gray-600 hover:bg-gray-600 text-white text-xs px-2 py-1"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {formData.dropdownOptions[dropdownIndex]?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center gap-2">
                                    <Input
                                      placeholder={`Option ${optionIndex + 1}`}
                                      value={option}
                                      onChange={(e) =>
                                        handleDropdownOptionChange(dropdownIndex, optionIndex, e.target.value)
                                      }
                                      className="bg-gray-800/50 border-gray-700 text-white text-sm"
                                    />
                                    {formData.dropdownOptions[dropdownIndex].length > 2 && (
                                      <Button
                                        type="button"
                                        onClick={() => handleRemoveDropdownOption(dropdownIndex, optionIndex)}
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300 px-2"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs text-gray-400">Correct Answer</label>
                              <Select
                                value={(formData.correctAnswer as string[])[dropdownIndex] || ""}
                                onValueChange={(value) => handleDropdownCorrectAnswerChange(dropdownIndex, value)}
                              >
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                  <SelectValue placeholder="Select correct answer" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  {formData.dropdownOptions[dropdownIndex]
                                    ?.filter((option) => option.trim() !== "") // Filter out empty options
                                    .map((option, optionIndex) => (
                                      <SelectItem
                                        key={optionIndex}
                                        value={option}
                                        className="text-white hover:bg-gray-700"
                                      >
                                        {option}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : formData.questionType === "yesno" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Statements to Evaluate</label>
                      <div className="space-y-3">
                        {formData.statements.map((statement, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleCorrectAnswerChange(index, true)}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  (formData.correctAnswer as boolean[])[index] === true
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }`}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCorrectAnswerChange(index, false)}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  (formData.correctAnswer as boolean[])[index] === false
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }`}
                              >
                                No
                              </button>
                            </div>
                            <Input
                              placeholder={`Statement ${index + 1}`}
                              value={statement}
                              onChange={(e) => handleStatementChange(index, e.target.value)}
                              className="bg-gray-800/50 border-gray-700 text-white"
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            statements: [...formData.statements, ""],
                            correctAnswer: [...(formData.correctAnswer as boolean[]), false],
                          })
                        }
                        variant="outline"
                        size="sm"
                        className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Statement
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">Answer Options</label>
                        <Button
                          type="button"
                          onClick={handleAddOption}
                          variant="outline"
                          size="sm"
                          className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {formData.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input
                              type={formData.questionType === "single" ? "radio" : "checkbox"}
                              name="correctAnswer"
                              checked={(formData.correctAnswer as number[]).includes(index)}
                              onChange={(e) => handleCorrectAnswerChange(index, e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                            />
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              className="bg-gray-800/50 border-gray-700 text-white"
                            />
                            {formData.options.length > 2 && (
                              <Button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                variant="outline"
                                size="sm"
                                className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300 px-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formData.questionType === "single"
                          ? "Select one correct answer"
                          : "Select all correct answers"}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Topic</label>
                      <Input
                        placeholder="e.g., Azure Data Services"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="bg-gray-800/50 border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Difficulty</label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(value: "Easy" | "Medium" | "Hard") =>
                          setFormData({ ...formData, difficulty: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="Easy" className="text-white hover:bg-gray-700">
                            Easy
                          </SelectItem>
                          <SelectItem value="Medium" className="text-white hover:bg-gray-700">
                            Medium
                          </SelectItem>
                          <SelectItem value="Hard" className="text-white hover:bg-gray-700">
                            Hard
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Explanation</label>
                    <Textarea
                      placeholder="Explain why this is the correct answer..."
                      value={formData.explanation}
                      onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                      className="bg-gray-800/50 border-gray-700 text-white min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Source URL (Optional)</label>
                    <Input
                      placeholder="https://docs.microsoft.com/..."
                      value={formData.sourceUrl}
                      onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <label className="text-sm text-gray-300">Active</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.isAiGenerated}
                          onCheckedChange={(checked) => setFormData({ ...formData, isAiGenerated: checked })}
                        />
                        <label className="text-sm text-gray-300">AI Generated</label>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setShowAddForm(false)
                          setEditingQuestion(null)
                          resetForm()
                        }}
                        variant="outline"
                        className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                        disabled={saving}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {editingQuestion ? "Update" : "Add"} Question
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question.id} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-blue-300">
                            {question.certification.toUpperCase()}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${
                              question.difficulty === "Easy"
                                ? "bg-green-500/20 border-green-500/50 text-green-300"
                                : question.difficulty === "Medium"
                                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                                  : "bg-red-500/20 border-red-500/50 text-red-300"
                            }`}
                          >
                            {question.difficulty}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50 text-purple-300">
                            {question.topic}
                          </Badge>
                          {question.questionType === "multiple" && (
                            <Badge variant="outline" className="bg-orange-500/20 border-orange-500/50 text-orange-300">
                              Multiple Choice
                            </Badge>
                          )}
                          {question.questionType === "yesno" && (
                            <Badge variant="outline" className="bg-cyan-500/20 border-cyan-500/50 text-cyan-300">
                              Yes/No
                            </Badge>
                          )}
                          {question.questionType === "dropdown" && (
                            <Badge variant="outline" className="bg-teal-500/20 border-teal-500/50 text-teal-300">
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Dropdown
                            </Badge>
                          )}
                          {(question.imageUrl || (question.images && question.images.length > 0)) && (
                            <Badge variant="outline" className="bg-pink-500/20 border-pink-500/50 text-pink-300">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Images
                            </Badge>
                          )}
                          {question.hasEmbeddedContent && (
                            <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/50 text-indigo-300">
                              Embedded
                            </Badge>
                          )}
                          {question.hasCodeSnippet && question.codeSnippet && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            >
                              <Code className="h-3 w-3 mr-1" />
                              Code
                            </Badge>
                          )}
                          {question.isAiGenerated && (
                            <Badge variant="outline" className="bg-cyan-500/20 border-cyan-500/50 text-cyan-300">
                              <Brain className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                          {!question.isActive && (
                            <Badge variant="outline" className="bg-gray-500/20 border-gray-500/50 text-gray-400">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{question.question}</h3>

                        {question.scenario && (
                          <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-100 text-sm leading-relaxed">{question.scenario}</p>
                          </div>
                        )}

                        {question.hasCodeSnippet && question.codeSnippet && (
                          <div className="mb-3 p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                                {question.codeLanguage} Code
                              </span>
                              <Badge variant="outline" className="bg-gray-700/50 border-gray-600 text-gray-300 text-xs">
                                <Code className="h-3 w-3 mr-1" />
                                {question.codeLanguage}
                              </Badge>
                            </div>
                            <pre className="text-sm text-gray-100 overflow-x-auto">
                              <code>{question.codeSnippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Display Images */}
                        {question.imageUrl && (
                          <div className="mb-3">
                            <Image
                              src={question.imageUrl || "/placeholder.svg"}
                              alt="Question image"
                              width={600}
                              height={400}
                              className="rounded-lg border border-gray-700"
                            />
                          </div>
                        )}

                        {question.images && question.images.length > 0 && (
                          <div className="mb-3 space-y-3">
                            {question.images.map((image, index) => (
                              <div key={index} className="space-y-2">
                                <Image
                                  src={image.url || "/placeholder.svg"}
                                  alt={image.alt}
                                  width={600}
                                  height={400}
                                  className="rounded-lg border border-gray-700"
                                />
                                {image.caption && (
                                  <p className="text-gray-400 text-sm italic text-center">{image.caption}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.questionType === "dropdown" ? (
                          <div className="space-y-3 mb-3">
                            {question.dropdownQuestions?.map((dropdownQuestion, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 text-sm p-3 bg-teal-500/10 border border-teal-500/30 rounded"
                              >
                                <span className="text-teal-300 font-medium min-w-0 flex-1">{dropdownQuestion}</span>
                                <div className="flex items-center gap-2 bg-teal-600/20 px-3 py-1 rounded border border-teal-500/40">
                                  <ChevronDown className="h-3 w-3 text-teal-400" />
                                  <span className="text-teal-200 font-medium">
                                    {(question.correctAnswer as string[])[index]}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : question.questionType === "yesno" ? (
                          <div className="space-y-2 mb-3">
                            {question.statements?.map((statement, index) => (
                              <div
                                key={index}
                                className={`flex items-center gap-3 text-sm p-2 rounded ${
                                  (question.correctAnswer as boolean[])[index]
                                    ? "bg-green-500/10 border border-green-500/30 text-green-300"
                                    : "bg-red-500/10 border border-red-500/30 text-red-300"
                                }`}
                              >
                                <span className="font-mono font-bold">
                                  {(question.correctAnswer as boolean[])[index] ? "YES" : "NO"}
                                </span>
                                <span>{statement}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1 mb-3">
                            {question.options.map((option, index) => (
                              <div
                                key={index}
                                className={`flex items-center gap-2 text-sm ${
                                  (
                                    Array.isArray(question.correctAnswer)
                                      ? question.correctAnswer.includes(index)
                                      : question.correctAnswer === index
                                  )
                                    ? "text-green-300 font-medium"
                                    : "text-gray-400"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    (
                                      Array.isArray(question.correctAnswer)
                                        ? question.correctAnswer.includes(index)
                                        : question.correctAnswer === index
                                    )
                                      ? "bg-green-600 border-green-500"
                                      : "border-gray-600"
                                  }`}
                                >
                                  {(Array.isArray(question.correctAnswer)
                                    ? question.correctAnswer.includes(index)
                                    : question.correctAnswer === index) && (
                                    <CheckCircle className="h-2 w-2 text-white" />
                                  )}
                                </div>
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-gray-400 text-sm leading-relaxed">{question.explanation}</p>
                        {question.sourceUrl && (
                          <a
                            href={question.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mt-2"
                          >
                            <Globe className="h-3 w-3" />
                            Source
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEditQuestion(question)}
                          size="sm"
                          variant="outline"
                          className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteQuestion(question.id)}
                          size="sm"
                          variant="outline"
                          className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && (
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-500/20 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Questions Found</h3>
                    <p className="text-gray-400 mb-6">
                      Get started by adding your first question or importing existing questions.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Question
                      </Button>
                      <Button
                        onClick={handleInitializeSample}
                        variant="outline"
                        className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Add Sample Questions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Statistics Overview</h2>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-300 text-sm font-medium">Total Questions</p>
                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-300 text-sm font-medium">Active Questions</p>
                        <p className="text-3xl font-bold text-white">{stats.active}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-300 text-sm font-medium">With Images</p>
                        <p className="text-3xl font-bold text-white">{stats.withImages}</p>
                      </div>
                      <ImageIcon className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-300 text-sm font-medium">With Code</p>
                        <p className="text-3xl font-bold text-white">{stats.withCodeSnippets}</p>
                      </div>
                      <Code className="h-8 w-8 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Questions by Difficulty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.byDifficulty).map(([difficulty, count]) => (
                        <div key={difficulty} className="flex items-center justify-between">
                          <span className="text-gray-300">{difficulty}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-20 h-2 rounded-full ${
                                difficulty === "Easy"
                                  ? "bg-green-500"
                                  : difficulty === "Medium"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${Math.max((count / stats.total) * 100, 10)}px` }}
                            ></div>
                            <span className="text-white font-mono text-sm w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Questions by Certification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.byCertification).map(([cert, count]) => (
                        <div key={cert} className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{cert.toUpperCase()}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-20 h-2 bg-blue-500 rounded-full"
                              style={{ width: `${Math.max((count / stats.total) * 100, 10)}px` }}
                            ></div>
                            <span className="text-white font-mono text-sm w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="import-export" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Import & Export Questions</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={generateSampleJSON}
                      variant="outline"
                      size="sm"
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                    >
                      Generate Sample JSON
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Paste your JSON questions data here..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white min-h-[200px] font-mono text-sm"
                  />
                  <Button
                    onClick={handleImport}
                    disabled={!importData.trim() || saving}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Import Questions
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleExport}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Current Page
                  </Button>
                  {exportData && (
                    <Textarea
                      value={exportData}
                      readOnly
                      className="bg-gray-800/50 border-gray-700 text-white min-h-[200px] font-mono text-sm"
                      placeholder="Exported data will appear here..."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Settings & Tools</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Storage Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {storageMode === "firebase" ? (
                        <Cloud className="h-5 w-5 text-green-400" />
                      ) : (
                        <HardDrive className="h-5 w-5 text-yellow-400" />
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {storageMode === "firebase" ? "Firestore Database" : "Local Storage"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {storageMode === "firebase"
                            ? "Questions are stored in Firebase Firestore"
                            : "Questions are stored locally in browser"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        storageMode === "firebase"
                          ? "bg-green-500/20 border-green-500/50 text-green-300"
                          : "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                      }
                    >
                      {storageMode === "firebase" ? "Cloud" : "Local"}
                    </Badge>
                  </div>

                  {storageMode === "localStorage" && (
                    <Alert className="border-yellow-500/50 bg-yellow-500/10">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-yellow-300">
                        Configure Firebase environment variables to enable cloud storage and prevent data loss on
                        deployments.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleInitializeSample}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                    Initialize Sample Questions
                  </Button>

                  <Button
                    onClick={() => {
                      loadQuestions()
                      loadStats()
                    }}
                    variant="outline"
                    className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
