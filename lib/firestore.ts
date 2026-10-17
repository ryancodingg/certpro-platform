import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number | number[] | boolean[] | string[] // Added string[] for dropdown questions
  explanation: string
  topic: string
  difficulty: "Easy" | "Medium" | "Hard"
  certification: string
  sourceUrl?: string
  isActive: boolean
  isAiGenerated: boolean
  createdAt: string
  questionType?: "single" | "multiple" | "yesno" | "dropdown" // Added dropdown type
  imageUrl?: string
  scenario?: string
  statements?: string[]
  // New fields for enhanced image support
  images?: {
    url: string
    alt: string
    caption?: string
    position: "top" | "middle" | "bottom" | "inline"
  }[]
  hasEmbeddedContent?: boolean
  // New fields for dropdown questions
  dropdownQuestions?: string[] // The questions/prompts for each dropdown
  dropdownOptions?: string[][] // Array of options for each dropdown
  // New fields for code snippets
  codeSnippet?: string
  codeLanguage?:
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
    | "powershell"
  hasCodeSnippet?: boolean
}

const QUESTIONS_COLLECTION = "questions"
const FALLBACK_STORAGE_KEY = "certification-questions"

// Certification question limits
const CERTIFICATION_LIMITS = {
  "dp-700": 50,
  "az-900": 40,
  "dp-203": 60,
  "aws-clf-c02": 65,
  "aws-saa-c03": 65,
  ccna: 100,
  "databricks-certified-associate-developer": 45,
  "databricks-certified-data-engineer-associate": 45,
  "databricks-certified-machine-learning-associate": 45,
} as const

// Fallback to localStorage if Firebase is not configured
const isFirebaseAvailable = () => {
  return db !== null && db !== undefined
}

// Helper function to flatten nested arrays for Firestore
const flattenDropdownOptions = (dropdownOptions?: string[][]): string[] => {
  if (!dropdownOptions) return []
  return dropdownOptions.flat()
}

// Helper function to reconstruct nested arrays from Firestore
const reconstructDropdownOptions = (flatOptions: string[], dropdownQuestions?: string[]): string[][] => {
  if (!flatOptions || !dropdownQuestions) return []

  const result: string[][] = []
  let currentIndex = 0

  for (let i = 0; i < dropdownQuestions.length; i++) {
    // Find the next empty string or end of array to determine options count
    const startIndex = currentIndex
    let optionsCount = 0

    // Count non-empty options for this dropdown
    while (currentIndex < flatOptions.length && flatOptions[currentIndex] !== "") {
      optionsCount++
      currentIndex++
    }

    // If we hit an empty string, skip it for the next dropdown
    if (currentIndex < flatOptions.length && flatOptions[currentIndex] === "") {
      currentIndex++
    }

    // Extract options for this dropdown
    const options = flatOptions.slice(startIndex, startIndex + optionsCount)
    result.push(options)
  }

  return result
}

// Helper function to prepare question data for Firestore
const prepareQuestionForFirestore = (questionData: Omit<Question, "id">) => {
  const prepared = { ...questionData }

  // Remove undefined values to prevent Firestore errors
  Object.keys(prepared).forEach((key) => {
    if (prepared[key as keyof typeof prepared] === undefined) {
      delete prepared[key as keyof typeof prepared]
    }
  })

  // Handle dropdown questions - flatten nested arrays for Firestore
  if (prepared.questionType === "dropdown" && prepared.dropdownOptions) {
    // Flatten the nested array with separators
    const flatOptions: string[] = []
    prepared.dropdownOptions.forEach((options, index) => {
      flatOptions.push(...options)
      // Add separator between dropdowns (except for the last one)
      if (index < prepared.dropdownOptions!.length - 1) {
        flatOptions.push("") // Empty string as separator
      }
    })

    const { dropdownOptions, ...rest } = prepared // Destructure to exclude dropdownOptions
    return {
      ...rest,
      dropdownOptionsFlat: flatOptions, // Store as flat array
    }
  }

  // For non-dropdown questions, ensure dropdown fields are not included
  if (prepared.questionType !== "dropdown") {
    const { dropdownOptions, dropdownQuestions, ...rest } = prepared
    return rest
  }

  return prepared
}

// Helper function to reconstruct question data from Firestore
const reconstructQuestionFromFirestore = (data: any): Question => {
  const question = { ...data }

  // Reconstruct nested arrays from Firestore for dropdown questions
  if (data.dropdownOptionsFlat && data.dropdownQuestions) {
    question.dropdownOptions = reconstructDropdownOptions(data.dropdownOptionsFlat, data.dropdownQuestions)
    delete question.dropdownOptionsFlat // Remove the flat array
  }

  return question as Question
}

// Get all questions with pagination
export const getAllQuestions = async (
  page = 1,
  limit = 25,
): Promise<{ questions: Question[]; total: number; totalPages: number }> => {
  if (!isFirebaseAvailable()) {
    console.log("🔄 Using localStorage fallback for getAllQuestions")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []

    // Sort by createdAt
    allQuestions.sort((a: Question, b: Question) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedQuestions = allQuestions.slice(startIndex, endIndex)

    return {
      questions: paginatedQuestions,
      total: allQuestions.length,
      totalPages: Math.ceil(allQuestions.length / limit),
    }
  }

  try {
    console.log(`🔍 Fetching questions page ${page} from Firestore...`)
    const questionsRef = collection(db, QUESTIONS_COLLECTION)
    const querySnapshot = await getDocs(questionsRef)

    const allQuestions: Question[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const reconstructedQuestion = reconstructQuestionFromFirestore(data)
      allQuestions.push({
        id: doc.id,
        ...reconstructedQuestion,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString().split("T")[0]
            : data.createdAt || new Date().toISOString().split("T")[0],
      })
    })

    // Sort by createdAt in JavaScript
    allQuestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedQuestions = allQuestions.slice(startIndex, endIndex)

    console.log(`✅ Fetched ${paginatedQuestions.length} questions from page ${page} (${allQuestions.length} total)`)

    return {
      questions: paginatedQuestions,
      total: allQuestions.length,
      totalPages: Math.ceil(allQuestions.length / limit),
    }
  } catch (error) {
    console.error("❌ Error fetching questions from Firestore:", error)
    console.log("🔄 Falling back to localStorage...")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []

    allQuestions.sort((a: Question, b: Question) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedQuestions = allQuestions.slice(startIndex, endIndex)

    return {
      questions: paginatedQuestions,
      total: allQuestions.length,
      totalPages: Math.ceil(allQuestions.length / limit),
    }
  }
}

// Get questions by certification with limit and random selection
export const getQuestionsByCertification = async (certification: string): Promise<Question[]> => {
  const questionLimit = CERTIFICATION_LIMITS[certification as keyof typeof CERTIFICATION_LIMITS] || 50

  if (!isFirebaseAvailable()) {
    console.log("🔄 Using localStorage fallback for getQuestionsByCertification")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    let filteredQuestions = allQuestions.filter(
      (q: Question) => q.certification === certification && q.isActive !== false,
    )

    // Auto-initialize if no questions found
    if (filteredQuestions.length === 0 && allQuestions.length === 0) {
      console.log("🚀 Auto-initializing sample questions...")
      await initializeSampleQuestions()
      const updatedSaved = localStorage.getItem(FALLBACK_STORAGE_KEY)
      const updatedQuestions = updatedSaved ? JSON.parse(updatedSaved) : []
      filteredQuestions = updatedQuestions.filter(
        (q: Question) => q.certification === certification && q.isActive !== false,
      )
    }

    // Handle question limit and random selection
    if (filteredQuestions.length > questionLimit) {
      // Shuffle and select random questions
      const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, questionLimit)
    }

    return filteredQuestions
  }

  try {
    console.log(`🔍 Fetching questions for certification: ${certification}`)
    const questionsRef = collection(db, QUESTIONS_COLLECTION)

    // Use ONLY certification filter to avoid composite index requirement
    const q = query(questionsRef, where("certification", "==", certification))

    const querySnapshot = await getDocs(q)

    const questions: Question[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const reconstructedQuestion = reconstructQuestionFromFirestore(data)
      const question = {
        id: doc.id,
        ...reconstructedQuestion,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString().split("T")[0]
            : data.createdAt || new Date().toISOString().split("T")[0],
      }

      // Filter active questions in JavaScript instead of Firestore query
      if (question.isActive !== false) {
        questions.push(question)
      }
    })

    // Auto-initialize if no questions found for this certification
    if (questions.length === 0) {
      console.log(`🚀 No questions found for ${certification}, auto-initializing sample questions...`)
      await initializeSampleQuestions()

      // Re-fetch after initialization
      const retrySnapshot = await getDocs(q)
      const retryQuestions: Question[] = []
      retrySnapshot.forEach((doc) => {
        const data = doc.data()
        const reconstructedQuestion = reconstructQuestionFromFirestore(data)
        const question = {
          id: doc.id,
          ...reconstructedQuestion,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString().split("T")[0]
              : data.createdAt || new Date().toISOString().split("T")[0],
        }

        if (question.isActive !== false) {
          retryQuestions.push(question)
        }
      })

      // Handle question limit and random selection for retry
      if (retryQuestions.length > questionLimit) {
        const shuffled = [...retryQuestions].sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, questionLimit)
        console.log(
          `✅ Auto-initialized and selected ${selected.length} random questions from ${retryQuestions.length} total for ${certification}`,
        )
        return selected
      }

      console.log(`✅ Auto-initialized and fetched ${retryQuestions.length} questions for ${certification}`)
      return retryQuestions
    }

    // Handle question limit and random selection
    if (questions.length > questionLimit) {
      // Shuffle and select random questions
      const shuffled = [...questions].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, questionLimit)
      console.log(`✅ Selected ${selected.length} random questions from ${questions.length} total for ${certification}`)
      return selected
    }

    // Check if we have enough questions
    if (questions.length < questionLimit) {
      console.warn(`⚠️ Only ${questions.length} questions available for ${certification}, but ${questionLimit} required`)
    }

    console.log(`✅ Fetched ${questions.length} active questions for ${certification}`)
    return questions
  } catch (error) {
    console.error(`❌ Error fetching questions for ${certification}:`, error)
    console.log("🔄 Falling back to localStorage...")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const filteredQuestions = allQuestions.filter(
      (q: Question) => q.certification === certification && q.isActive !== false,
    )

    // Handle question limit for localStorage fallback
    if (filteredQuestions.length > questionLimit) {
      const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, questionLimit)
    }

    return filteredQuestions
  }
}

// Add a new question
export const addQuestion = async (questionData: Omit<Question, "id">): Promise<string> => {
  if (!isFirebaseAvailable()) {
    console.log("🔄 Using localStorage fallback for addQuestion")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const newQuestion = {
      ...questionData,
      id: Date.now().toString(),
      createdAt: questionData.createdAt || new Date().toISOString().split("T")[0],
    }
    allQuestions.push(newQuestion)
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(allQuestions))
    return newQuestion.id
  }

  try {
    console.log("➕ Adding new question to Firestore...")
    const questionsRef = collection(db, QUESTIONS_COLLECTION)

    // Prepare data for Firestore (flatten nested arrays and remove undefined values)
    const preparedData = prepareQuestionForFirestore({
      ...questionData,
      createdAt: questionData.createdAt || new Date().toISOString().split("T")[0],
    })

    console.log("📝 Prepared data for Firestore:", preparedData)

    const docRef = await addDoc(questionsRef, preparedData)

    console.log(`✅ Question added with ID: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    console.error("❌ Error adding question to Firestore:", error)
    console.log("🔄 Falling back to localStorage...")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const newQuestion = {
      ...questionData,
      id: Date.now().toString(),
      createdAt: questionData.createdAt || new Date().toISOString().split("T")[0],
    }
    allQuestions.push(newQuestion)
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(allQuestions))
    return newQuestion.id
  }
}

// Update an existing question
export const updateQuestion = async (questionId: string, questionData: Partial<Question>): Promise<void> => {
  if (!isFirebaseAvailable()) {
    console.log("🔄 Using localStorage fallback for updateQuestion")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const index = allQuestions.findIndex((q: Question) => q.id === questionId)
    if (index !== -1) {
      allQuestions[index] = { ...allQuestions[index], ...questionData }
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(allQuestions))
    }
    return
  }

  try {
    console.log(`📝 Updating question ${questionId}...`)
    const questionRef = doc(db, QUESTIONS_COLLECTION, questionId)

    // Prepare data for Firestore (flatten nested arrays and remove undefined values)
    const preparedData = prepareQuestionForFirestore(questionData as Omit<Question, "id">)

    await updateDoc(questionRef, preparedData)
    console.log(`✅ Question ${questionId} updated successfully`)
  } catch (error) {
    console.error(`❌ Error updating question ${questionId}:`, error)
    console.log("🔄 Falling back to localStorage...")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const index = allQuestions.findIndex((q: Question) => q.id === questionId)
    if (index !== -1) {
      allQuestions[index] = { ...allQuestions[index], ...questionData }
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(allQuestions))
    }
  }
}

// Delete a question
export const deleteQuestion = async (questionId: string): Promise<void> => {
  if (!isFirebaseAvailable()) {
    console.log("🔄 Using localStorage fallback for deleteQuestion")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const filtered = allQuestions.filter((q: Question) => q.id !== questionId)
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(filtered))
    return
  }

  try {
    console.log(`🗑️ Deleting question ${questionId}...`)
    const questionRef = doc(db, QUESTIONS_COLLECTION, questionId)
    await deleteDoc(questionRef)
    console.log(`✅ Question ${questionId} deleted successfully`)
  } catch (error) {
    console.error(`❌ Error deleting question ${questionId}:`, error)
    console.log("🔄 Falling back to localStorage...")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const filtered = allQuestions.filter((q: Question) => q.id !== questionId)
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(filtered))
  }
}

// Bulk add questions (for import functionality)
export const bulkAddQuestions = async (questions: Omit<Question, "id">[]): Promise<void> => {
  if (!isFirebaseAvailable()) {
    console.log("🔄 Using localStorage fallback for bulkAddQuestions")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const newQuestions = questions.map((q, index) => ({
      ...q,
      id: (Date.now() + index).toString(),
      createdAt: q.createdAt || new Date().toISOString().split("T")[0],
    }))
    allQuestions.push(...newQuestions)
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(allQuestions))
    return
  }

  try {
    console.log(`📦 Bulk adding ${questions.length} questions...`)
    const batch = writeBatch(db)
    const questionsRef = collection(db, QUESTIONS_COLLECTION)

    questions.forEach((questionData) => {
      const docRef = doc(questionsRef)

      // Prepare data for Firestore (flatten nested arrays and remove undefined values)
      const preparedData = prepareQuestionForFirestore({
        ...questionData,
        createdAt: questionData.createdAt || new Date().toISOString().split("T")[0],
      })

      batch.set(docRef, preparedData)
    })

    await batch.commit()
    console.log(`✅ Successfully bulk added ${questions.length} questions`)
  } catch (error) {
    console.error("❌ Error bulk adding questions to Firestore:", error)
    console.log("🔄 Falling back to localStorage...")
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    const allQuestions = saved ? JSON.parse(saved) : []
    const newQuestions = questions.map((q, index) => ({
      ...q,
      id: (Date.now() + index).toString(),
      createdAt: q.createdAt || new Date().toISOString().split("T")[0],
    }))
    allQuestions.push(...newQuestions)
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(allQuestions))
  }
}

// Get question statistics
export const getQuestionStats = async () => {
  try {
    // Get all questions without pagination for stats
    const saved = localStorage.getItem(FALLBACK_STORAGE_KEY)
    let questions: Question[] = []

    if (!isFirebaseAvailable()) {
      questions = saved ? JSON.parse(saved) : []
    } else {
      const questionsRef = collection(db, QUESTIONS_COLLECTION)
      const querySnapshot = await getDocs(questionsRef)
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const reconstructedQuestion = reconstructQuestionFromFirestore(data)
        questions.push({
          id: doc.id,
          ...reconstructedQuestion,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString().split("T")[0]
              : data.createdAt || new Date().toISOString().split("T")[0],
        })
      })
    }

    const stats = {
      total: questions.length,
      active: questions.filter((q) => q.isActive).length,
      inactive: questions.filter((q) => !q.isActive).length,
      byDifficulty: {
        Easy: questions.filter((q) => q.difficulty === "Easy").length,
        Medium: questions.filter((q) => q.difficulty === "Medium").length,
        Hard: questions.filter((q) => q.difficulty === "Hard").length,
      },
      byCertification: {} as Record<string, number>,
      aiGenerated: questions.filter((q) => q.isAiGenerated).length,
      multipleChoice: questions.filter((q) => q.questionType === "multiple").length,
      yesNoQuestions: questions.filter((q) => q.questionType === "yesno").length,
      dropdownQuestions: questions.filter((q) => q.questionType === "dropdown").length,
      withImages: questions.filter((q) => q.imageUrl || (q.images && q.images.length > 0)).length,
      withEmbeddedContent: questions.filter((q) => q.hasEmbeddedContent).length,
      withCodeSnippets: questions.filter((q) => q.hasCodeSnippet && q.codeSnippet).length,
    }

    // Count by certification
    questions.forEach((q) => {
      stats.byCertification[q.certification] = (stats.byCertification[q.certification] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error("❌ Error getting question stats:", error)
    throw new Error("Failed to get question statistics")
  }
}

// Initialize sample data (for first-time setup)
export const initializeSampleQuestions = async (): Promise<void> => {
  try {
    console.log("🔍 Initializing sample questions...")

    console.log("📦 Adding sample questions...")
    const sampleQuestions: Omit<Question, "id">[] = [
      {
        question: "What is the primary purpose of Azure Data Factory?",
        options: [
          "To store large amounts of unstructured data",
          "To orchestrate and automate data movement and transformation",
          "To provide real-time analytics dashboards",
          "To manage user authentication and authorization",
        ],
        correctAnswer: 1,
        explanation:
          "Azure Data Factory is a cloud-based data integration service that allows you to create data-driven workflows for orchestrating and automating data movement and data transformation.",
        topic: "Azure Data Services",
        difficulty: "Medium",
        certification: "dp-700",
        sourceUrl: "https://docs.microsoft.com/en-us/azure/data-factory/",
        isActive: true,
        isAiGenerated: false,
        createdAt: new Date().toISOString().split("T")[0],
        questionType: "single",
      },
      {
        question: "Which of the following are characteristics of NoSQL databases? (Select all that apply)",
        options: [
          "Schema flexibility",
          "ACID compliance is always guaranteed",
          "Horizontal scalability",
          "Support for complex queries with joins",
        ],
        correctAnswer: [0, 2],
        explanation:
          "NoSQL databases typically offer schema flexibility and horizontal scalability. ACID compliance and complex joins are more characteristic of relational databases.",
        topic: "Data Concepts",
        difficulty: "Hard",
        certification: "dp-700",
        sourceUrl: "https://docs.microsoft.com/en-us/azure/cosmos-db/",
        isActive: true,
        isAiGenerated: true,
        createdAt: new Date().toISOString().split("T")[0],
        questionType: "multiple",
      },
      // Add a Yes/No question example
      {
        question: "Deployment Pipeline Scenario",
        scenario: `You create a deployment pipeline named Pipeline1 to move items from Workspace1_DEV to a new workspace named Workspace1_TEST.

You deploy all the items from Workspace1_DEV to Workspace1_TEST.

The workspace contains:
• Four notebooks
• Three lakehouses  
• Two data pipelines
• Two Dataflow Gen1 dataflows
• Three Dataflow Gen2 dataflows
• Five semantic models that each has a scheduled refresh policy

For each of the following statements, select Yes if the statement is true. Otherwise, select No.

NOTE: Each correct selection is worth one point.`,
        options: [], // Empty for Yes/No questions
        statements: [
          "Data from the semantic models will be deployed to the target stage.",
          "The Dataflow Gen1 dataflows will be deployed to the target stage.",
          "The scheduled refresh policies will be deployed to the target stage.",
        ],
        correctAnswer: [false, true, false], // N Y N
        explanation:
          "In deployment pipelines: Data from semantic models is NOT deployed (only metadata), Dataflow Gen1 dataflows ARE deployed, and scheduled refresh policies are NOT deployed to target stages.",
        topic: "Power BI Deployment",
        difficulty: "Hard",
        certification: "dp-700",
        sourceUrl: "https://docs.microsoft.com/en-us/power-bi/create-reports/deployment-pipelines-overview",
        isActive: true,
        isAiGenerated: false,
        createdAt: new Date().toISOString().split("T")[0],
        questionType: "yesno",
      },
      // Add a question with embedded image/table
      {
        question:
          "You have a Google Cloud Storage (GCS) container named storage1 that contains the files shown in the following table. You have a Fabric workspace named Workspace1 that has the cache for shortcuts enabled. Workspace1 contains a lakehouse named Lakehouse1. Lakehouse1 has the shortcuts shown in the following table. You need to read data from all the shortcuts. Which shortcuts will retrieve data from the cache?",
        scenario: `You have a Google Cloud Storage (GCS) container named storage1 that contains the files shown in the following table.

You have a Fabric workspace named Workspace1 that has the cache for shortcuts enabled. Workspace1 contains a lakehouse named Lakehouse1. Lakehouse1 has the shortcuts shown in the following table.

You need to read data from all the shortcuts.`,
        options: [
          "Stores only",
          "Products only",
          "Stores and Products only",
          "Products, Stores, and Trips",
          "Trips only",
          "Products and Trips only",
        ],
        correctAnswer: 2, // C. Stores and Products only
        explanation:
          "Shortcuts retrieve data from cache when they have been accessed within the cache retention period. Products (12 hours ago) and Stores (4 hours ago) are within the typical cache period, while Trips (48 hours ago) would likely need to retrieve from the original source.",
        topic: "Microsoft Fabric",
        difficulty: "Hard",
        certification: "dp-700",
        imageUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-MVhQSlVlNWtvpFNIpT8wlhCYliJOse.png",
        hasEmbeddedContent: true,
        images: [
          {
            url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-MVhQSlVlNWtvpFNIpT8wlhCYliJOse.png",
            alt: "Tables showing GCS container files and lakehouse shortcuts with access times",
            caption: "File storage and shortcut access information",
            position: "middle",
          },
        ],
        isActive: true,
        isAiGenerated: false,
        createdAt: new Date().toISOString().split("T")[0],
        questionType: "single",
      },
      // Add a dropdown question example with flexible options
      {
        question:
          "You have a Fabric workspace that contains an eventstream named EventStream1. You discover that an EventStream1 transformation fails. You need to find the following error information: The error details, including the occurrence time. The total number of errors. What should you use? To answer, select the appropriate options in the answer area. NOTE: Each correct selection is worth one point.",
        scenario: `You have a Fabric workspace that contains an eventstream named EventStream1.
You discover that an EventStream1 transformation fails.
You need to find the following error information:
- The error details, including the occurrence time
- The total number of errors

What should you use? To answer, select the appropriate options in the answer area.
NOTE: Each correct selection is worth one point.`,
        options: [], // Empty for dropdown questions
        dropdownQuestions: ["To find the error details:", "To find the total number of errors:"],
        dropdownOptions: [
          ["Data insights", "Data preview", "Details", "Runtime logs"], // 4 options
          ["Data insights", "Details", "Runtime logs"], // 3 options
        ],
        correctAnswer: ["Runtime logs", "Details"], // Correct answers for each dropdown
        explanation:
          "To find error details including occurrence time, you should use Runtime logs which provide detailed error information with timestamps. To find the total number of errors, you should use Details which shows error counts and summaries.",
        topic: "Microsoft Fabric",
        difficulty: "Hard",
        certification: "dp-700",
        imageUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FNOhhVLiBVzrRBB1lKYUk1ESDeMclI.png",
        hasEmbeddedContent: true,
        images: [
          {
            url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FNOhhVLiBVzrRBB1lKYUk1ESDeMclI.png",
            alt: "Dropdown question showing error information options",
            caption: "EventStream error information selection",
            position: "middle",
          },
        ],
        isActive: true,
        isAiGenerated: false,
        createdAt: new Date().toISOString().split("T")[0],
        questionType: "dropdown",
      },
      // Add a coding question example
      {
        question: "What will be the output of the following Python code?",
        options: ["[1, 2, 3, 4, 5]", "[5, 4, 3, 2, 1]", "[1, 3, 5, 2, 4]", "Error"],
        correctAnswer: 1,
        explanation:
          "The reverse() method modifies the list in-place and returns None. The list is reversed from [1, 2, 3, 4, 5] to [5, 4, 3, 2, 1].",
        topic: "Python Programming",
        difficulty: "Easy",
        certification: "dp-700",
        isActive: true,
        isAiGenerated: false,
        createdAt: new Date().toISOString().split("T")[0],
        questionType: "single",
        hasCodeSnippet: true,
        codeSnippet: `numbers = [1, 2, 3, 4, 5]
numbers.reverse()
print(numbers)`,
        codeLanguage: "python",
      },
      {
        question: "What is the main difference between structured and unstructured data?",
        options: [
          "Structured data is always larger than unstructured data",
          "Structured data follows a predefined schema, while unstructured data does not",
          "Unstructured data is always stored in databases",
          "Structured data cannot be queried",
        ],
        correctAnswer: 1,
        explanation:
          "Structured data follows a predefined schema with organized rows and columns (like SQL databases), while unstructured data has no predefined format (like text files, images, videos).",
        topic: "Data Concepts",
        difficulty: "Easy",
        certification: "dp-700",
        sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/data-guide/",
        isActive: true,
        isAiGenerated: false,
        createdAt: new Date().toISOString().split("T")[0],
        questionType: "single",
      },
      // Add more questions to reach 50+ for testing random selection
      ...Array.from({ length: 43 }, (_, i) => ({
        question: `Sample DP-700 Question ${i + 8}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `This is a sample explanation for question ${i + 8}.`,
        topic: "Sample Topic",
        difficulty: "Medium" as const,
        certification: "dp-700",
        isActive: true,
        isAiGenerated: true,
        createdAt: new Date().toISOString().split("T")[0],
        questionType: "single" as const,
      })),
    ]

    await bulkAddQuestions(sampleQuestions)
    console.log("✅ Sample questions initialized successfully")
  } catch (error) {
    console.error("❌ Error initializing sample questions:", error)
    throw new Error("Failed to initialize sample questions")
  }
}

// Get certification question limit
export const getCertificationLimit = (certification: string): number => {
  return CERTIFICATION_LIMITS[certification as keyof typeof CERTIFICATION_LIMITS] || 50
}
