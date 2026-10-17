"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Home,
  AlertTriangle,
  Loader2,
  Brain,
  Target,
  Trophy,
  BookOpen,
  ImageIcon,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getQuestionsByCertification, getCertificationLimit, type Question } from "@/lib/firestore"

// CertPro Logo Component
const CertProLogo = ({ className = "text-2xl" }: { className?: string }) => (
  <div className={`font-bold gradient-text ${className}`}>CertPro</div>
)

interface QuizState {
  questions: Question[]
  currentQuestionIndex: number
  answers: (number | number[] | boolean[] | string[])[]
  timeRemaining: number
  isCompleted: boolean
  showResults: boolean
  score: number
  correctAnswers: number
  startTime: Date
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const certification = params.certification as string
  const questionLimit = getCertificationLimit(certification)

  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    timeRemaining: 90 * 60, // 90 minutes in seconds
    isCompleted: false,
    showResults: false,
    score: 0,
    correctAnswers: 0,
    startTime: new Date(),
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<number[] | boolean[] | string[]>([])

  useEffect(() => {
    loadQuestions()
  }, [certification])

  useEffect(() => {
    if (quizState.questions.length > 0 && !quizState.isCompleted) {
      const timer = setInterval(() => {
        setQuizState((prev) => {
          if (prev.timeRemaining <= 1) {
            clearInterval(timer)
            return { ...prev, timeRemaining: 0, isCompleted: true, showResults: true }
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quizState.questions.length, quizState.isCompleted])

  const loadQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const questions = await getQuestionsByCertification(certification)

      if (questions.length === 0) {
        setError(
          `No questions found for ${certification.toUpperCase()}. Please contact the administrator to add questions for this certification.`,
        )
        return
      }

      if (questions.length < questionLimit) {
        setError(
          `Only ${questions.length} questions available for ${certification.toUpperCase()}, but ${questionLimit} questions are required for a complete exam. The quiz will proceed with available questions.`,
        )
      }

      // Shuffle questions and answers (except for dropdown questions)
      const shuffledQuestions = questions.map((question) => {
        if (question.questionType === "yesno" || question.questionType === "dropdown") {
          // Don't shuffle Yes/No or dropdown questions - keep statements/dropdowns in order
          return question
        }

        // Shuffle options for other question types
        const optionsWithIndex = question.options.map((option, index) => ({ option, originalIndex: index }))
        const shuffledOptions = optionsWithIndex.sort(() => Math.random() - 0.5)

        const newOptions = shuffledOptions.map((item) => item.option)

        // Update correct answer indices based on new positions
        let newCorrectAnswer: number | number[]
        if (Array.isArray(question.correctAnswer)) {
          newCorrectAnswer = question.correctAnswer.map((originalIndex) =>
            shuffledOptions.findIndex((item) => item.originalIndex === originalIndex),
          )
        } else {
          newCorrectAnswer = shuffledOptions.findIndex((item) => item.originalIndex === question.correctAnswer)
        }

        return {
          ...question,
          options: newOptions,
          correctAnswer: newCorrectAnswer,
        }
      })

      setQuizState((prev) => ({
        ...prev,
        questions: shuffledQuestions,
        answers: new Array(shuffledQuestions.length).fill(null),
        startTime: new Date(),
      }))
    } catch (error) {
      console.error("Error loading questions:", error)
      setError("Failed to load questions. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number | boolean | string, statementIndex?: number) => {
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex]

    if (currentQuestion.questionType === "yesno" && statementIndex !== undefined) {
      const newAnswers = [...(selectedAnswers as boolean[])]
      newAnswers[statementIndex] = answerIndex as boolean
      setSelectedAnswers(newAnswers)
    } else if (currentQuestion.questionType === "dropdown" && statementIndex !== undefined) {
      const newAnswers = [...(selectedAnswers as string[])]
      newAnswers[statementIndex] = answerIndex as string
      setSelectedAnswers(newAnswers)
    } else if (currentQuestion.questionType === "multiple") {
      const currentAnswers = [...(selectedAnswers as number[])]
      const index = currentAnswers.indexOf(answerIndex as number)

      if (index > -1) {
        currentAnswers.splice(index, 1)
      } else {
        currentAnswers.push(answerIndex as number)
      }

      setSelectedAnswers(currentAnswers)
    } else {
      setSelectedAnswers([answerIndex as number])
    }
  }

  const handleNextQuestion = () => {
    const newAnswers = [...quizState.answers]
    newAnswers[quizState.currentQuestionIndex] = selectedAnswers

    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      const nextIndex = quizState.currentQuestionIndex + 1
      const nextQuestion = quizState.questions[nextIndex]

      // Set selected answers for next question if already answered
      const existingAnswer = newAnswers[nextIndex]
      if (existingAnswer !== null && existingAnswer !== undefined) {
        if (nextQuestion.questionType === "yesno") {
          setSelectedAnswers(existingAnswer as boolean[])
        } else if (nextQuestion.questionType === "dropdown") {
          setSelectedAnswers(existingAnswer as string[])
        } else if (nextQuestion.questionType === "multiple") {
          setSelectedAnswers(existingAnswer as number[])
        } else {
          setSelectedAnswers([existingAnswer as number])
        }
      } else {
        if (nextQuestion.questionType === "yesno") {
          setSelectedAnswers(new Array(nextQuestion.statements?.length || 0).fill(false))
        } else if (nextQuestion.questionType === "dropdown") {
          setSelectedAnswers(new Array(nextQuestion.dropdownQuestions?.length || 0).fill(""))
        } else {
          setSelectedAnswers([])
        }
      }

      setQuizState((prev) => ({
        ...prev,
        answers: newAnswers,
        currentQuestionIndex: nextIndex,
      }))
    } else {
      // Quiz completed
      const finalAnswers = newAnswers
      finalAnswers[quizState.currentQuestionIndex] = selectedAnswers

      const { score, correctAnswers } = calculateScore(finalAnswers)

      setQuizState((prev) => ({
        ...prev,
        answers: finalAnswers,
        isCompleted: true,
        showResults: true,
        score,
        correctAnswers,
      }))
    }
  }

  const handlePreviousQuestion = () => {
    if (quizState.currentQuestionIndex > 0) {
      const newAnswers = [...quizState.answers]
      newAnswers[quizState.currentQuestionIndex] = selectedAnswers

      const prevIndex = quizState.currentQuestionIndex - 1
      const prevQuestion = quizState.questions[prevIndex]

      // Set selected answers for previous question
      const existingAnswer = newAnswers[prevIndex]
      if (existingAnswer !== null && existingAnswer !== undefined) {
        if (prevQuestion.questionType === "yesno") {
          setSelectedAnswers(existingAnswer as boolean[])
        } else if (prevQuestion.questionType === "dropdown") {
          setSelectedAnswers(existingAnswer as string[])
        } else if (prevQuestion.questionType === "multiple") {
          setSelectedAnswers(existingAnswer as number[])
        } else {
          setSelectedAnswers([existingAnswer as number])
        }
      } else {
        if (prevQuestion.questionType === "yesno") {
          setSelectedAnswers(new Array(prevQuestion.statements?.length || 0).fill(false))
        } else if (prevQuestion.questionType === "dropdown") {
          setSelectedAnswers(new Array(prevQuestion.dropdownQuestions?.length || 0).fill(""))
        } else {
          setSelectedAnswers([])
        }
      }

      setQuizState((prev) => ({
        ...prev,
        answers: newAnswers,
        currentQuestionIndex: prevIndex,
      }))
    }
  }

  const calculateScore = (answers: (number | number[] | boolean[] | string[])[]) => {
    let correctAnswers = 0

    quizState.questions.forEach((question, index) => {
      const userAnswer = answers[index]
      const correctAnswer = question.correctAnswer

      if (question.questionType === "yesno") {
        const userBooleans = userAnswer as boolean[]
        const correctBooleans = correctAnswer as boolean[]

        if (
          userBooleans &&
          correctBooleans &&
          userBooleans.length === correctBooleans.length &&
          userBooleans.every((val, i) => val === correctBooleans[i])
        ) {
          correctAnswers++
        }
      } else if (question.questionType === "dropdown") {
        const userStrings = userAnswer as string[]
        const correctStrings = correctAnswer as string[]

        if (
          userStrings &&
          correctStrings &&
          userStrings.length === correctStrings.length &&
          userStrings.every((val, i) => val === correctStrings[i])
        ) {
          correctAnswers++
        }
      } else if (question.questionType === "multiple") {
        const userNumbers = userAnswer as number[]
        const correctNumbers = correctAnswer as number[]

        if (
          userNumbers &&
          correctNumbers &&
          userNumbers.length === correctNumbers.length &&
          userNumbers.sort().every((val, i) => val === correctNumbers.sort()[i])
        ) {
          correctAnswers++
        }
      } else {
        if (userAnswer === correctAnswer) {
          correctAnswers++
        }
      }
    })

    const score = Math.round((correctAnswers / quizState.questions.length) * 100)
    return { score, correctAnswers }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const restartQuiz = () => {
    setQuizState({
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      timeRemaining: 90 * 60,
      isCompleted: false,
      showResults: false,
      score: 0,
      correctAnswers: 0,
      startTime: new Date(),
    })
    setSelectedAnswers([])
    setError(null)
    loadQuestions()
  }

  const isAnswerSelected = () => {
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex]

    if (currentQuestion.questionType === "yesno") {
      return (selectedAnswers as boolean[]).length > 0
    } else if (currentQuestion.questionType === "dropdown") {
      return (selectedAnswers as string[]).every((answer) => answer !== "")
    } else if (currentQuestion.questionType === "multiple") {
      return (selectedAnswers as number[]).length > 0
    } else {
      return (selectedAnswers as number[]).length > 0
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black grid-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <BookOpen className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-gray-400 font-light text-lg">Loading {certification.toUpperCase()} questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black grid-pattern flex items-center justify-center p-4">
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Quiz Error</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={restartQuiz}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Link href="/">
                <Button variant="outline" className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizState.showResults) {
    const timeTaken = Math.floor((new Date().getTime() - quizState.startTime.getTime()) / 1000)
    const isPassing = quizState.score >= 70

    return (
      <div className="min-h-screen bg-black grid-pattern p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <CertProLogo />
            <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-blue-300">
              {certification.toUpperCase()} Results
            </Badge>
          </div>

          {/* Results Summary */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className={`h-6 w-6 ${isPassing ? "text-green-400" : "text-red-400"}`} />
                Quiz Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${isPassing ? "text-green-400" : "text-red-400"}`}>
                    {quizState.score}%
                  </div>
                  <p className="text-gray-400 text-sm">Final Score</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {quizState.correctAnswers}/{quizState.questions.length}
                  </div>
                  <p className="text-gray-400 text-sm">Correct Answers</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">{formatTime(timeTaken)}</div>
                  <p className="text-gray-400 text-sm">Time Taken</p>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${isPassing ? "text-green-400" : "text-red-400"}`}>
                    {isPassing ? "PASS" : "FAIL"}
                  </div>
                  <p className="text-gray-400 text-sm">Result</p>
                </div>
              </div>

              <Alert
                className={`${isPassing ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}`}
              >
                <AlertDescription className={isPassing ? "text-green-300" : "text-red-300"}>
                  {isPassing
                    ? `Congratulations! You passed the ${certification.toUpperCase()} exam with a score of ${quizState.score}%.`
                    : `You need 70% to pass. You scored ${quizState.score}%. Keep studying and try again!`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="space-y-4 mb-8">
            {quizState.questions.map((question, index) => {
              const userAnswer = quizState.answers[index]
              const isCorrect = (() => {
                if (question.questionType === "yesno") {
                  const userBooleans = userAnswer as boolean[]
                  const correctBooleans = question.correctAnswer as boolean[]
                  return (
                    userBooleans &&
                    correctBooleans &&
                    userBooleans.length === correctBooleans.length &&
                    userBooleans.every((val, i) => val === correctBooleans[i])
                  )
                } else if (question.questionType === "dropdown") {
                  const userStrings = userAnswer as string[]
                  const correctStrings = question.correctAnswer as string[]
                  return (
                    userStrings &&
                    correctStrings &&
                    userStrings.length === correctStrings.length &&
                    userStrings.every((val, i) => val === correctStrings[i])
                  )
                } else if (question.questionType === "multiple") {
                  const userNumbers = userAnswer as number[]
                  const correctNumbers = question.correctAnswer as number[]
                  return (
                    userNumbers &&
                    correctNumbers &&
                    userNumbers.length === correctNumbers.length &&
                    userNumbers.sort().every((val, i) => val === correctNumbers.sort()[i])
                  )
                } else {
                  return userAnswer === question.correctAnswer
                }
              })()

              return (
                <Card key={question.id} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCorrect ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <XCircle className="h-5 w-5 text-white" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-400 text-sm">Question {index + 1}</span>
                          <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50 text-purple-300">
                            {question.topic}
                          </Badge>
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
                        </div>

                        <h3 className="text-white font-semibold mb-3">{question.question}</h3>

                        {question.scenario && (
                          <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-100 text-sm leading-relaxed">{question.scenario}</p>
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
                            {question.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="space-y-2">
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
                          <div className="space-y-3 mb-4">
                            {question.dropdownQuestions?.map((dropdownQuestion, dropdownIndex) => {
                              const userChoice = (userAnswer as string[])?.[dropdownIndex]
                              const correctChoice = (question.correctAnswer as string[])[dropdownIndex]
                              const isDropdownCorrect = userChoice === correctChoice

                              return (
                                <div
                                  key={dropdownIndex}
                                  className={`p-3 rounded-lg border ${
                                    isDropdownCorrect
                                      ? "bg-green-500/10 border-green-500/30"
                                      : "bg-red-500/10 border-red-500/30"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-white text-sm font-medium">{dropdownQuestion}</span>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Your answer:</span>
                                        <span
                                          className={`text-sm font-medium px-2 py-1 rounded ${
                                            isDropdownCorrect
                                              ? "bg-green-600/20 text-green-300"
                                              : "bg-red-600/20 text-red-300"
                                          }`}
                                        >
                                          {userChoice || "Not answered"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Correct:</span>
                                        <span className="text-sm font-medium px-2 py-1 rounded bg-green-600/20 text-green-300">
                                          {correctChoice}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : question.questionType === "yesno" ? (
                          <div className="space-y-2 mb-4">
                            {question.statements?.map((statement, stmtIndex) => {
                              const userChoice = (userAnswer as boolean[])?.[stmtIndex]
                              const correctChoice = (question.correctAnswer as boolean[])[stmtIndex]
                              const isStatementCorrect = userChoice === correctChoice

                              return (
                                <div
                                  key={stmtIndex}
                                  className={`p-3 rounded-lg border ${
                                    isStatementCorrect
                                      ? "bg-green-500/10 border-green-500/30"
                                      : "bg-red-500/10 border-red-500/30"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-white text-sm">{statement}</span>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-sm font-medium ${
                                          userChoice === true
                                            ? "text-green-300"
                                            : userChoice === false
                                              ? "text-red-300"
                                              : "text-gray-400"
                                        }`}
                                      >
                                        Your:{" "}
                                        {userChoice === true ? "YES" : userChoice === false ? "NO" : "Not answered"}
                                      </span>
                                      <span
                                        className={`text-sm font-medium ${
                                          correctChoice ? "text-green-300" : "text-red-300"
                                        }`}
                                      >
                                        Correct: {correctChoice ? "YES" : "NO"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2 mb-4">
                            {question.options.map((option, optIndex) => {
                              const isUserAnswer = Array.isArray(userAnswer)
                                ? (userAnswer as number[]).includes(optIndex)
                                : userAnswer === optIndex
                              const isCorrectAnswer = Array.isArray(question.correctAnswer)
                                ? (question.correctAnswer as number[]).includes(optIndex)
                                : question.correctAnswer === optIndex

                              return (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded-lg border ${
                                    isCorrectAnswer
                                      ? "bg-green-500/10 border-green-500/30"
                                      : isUserAnswer
                                        ? "bg-red-500/10 border-red-500/30"
                                        : "bg-gray-800/30 border-gray-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-400" />}
                                      {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-400" />}
                                    </div>
                                    <span className="text-white text-sm">{option}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-blue-400" />
                            Explanation
                          </h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={restartQuiz}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
            <Link href="/">
              <Button variant="outline" className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex]
  const progress = ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100

  return (
    <div className="min-h-screen bg-black grid-pattern p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <CertProLogo />
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-blue-300">
              {certification.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(quizState.timeRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">
              Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
            </span>
            <span className="text-gray-400 text-sm">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50 text-purple-300">
                {currentQuestion.topic}
              </Badge>
              <Badge
                variant="outline"
                className={`${
                  currentQuestion.difficulty === "Easy"
                    ? "bg-green-500/20 border-green-500/50 text-green-300"
                    : currentQuestion.difficulty === "Medium"
                      ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                      : "bg-red-500/20 border-red-500/50 text-red-300"
                }`}
              >
                {currentQuestion.difficulty}
              </Badge>
              {currentQuestion.questionType === "yesno" && (
                <Badge variant="outline" className="bg-cyan-500/20 border-cyan-500/50 text-cyan-300">
                  Yes/No
                </Badge>
              )}
              {currentQuestion.questionType === "multiple" && (
                <Badge variant="outline" className="bg-orange-500/20 border-orange-500/50 text-orange-300">
                  Multiple Choice
                </Badge>
              )}
              {currentQuestion.questionType === "dropdown" && (
                <Badge variant="outline" className="bg-teal-500/20 border-teal-500/50 text-teal-300">
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Dropdown
                </Badge>
              )}
              {(currentQuestion.imageUrl || (currentQuestion.images && currentQuestion.images.length > 0)) && (
                <Badge variant="outline" className="bg-pink-500/20 border-pink-500/50 text-pink-300">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Images
                </Badge>
              )}
            </div>
            <CardTitle className="text-white text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.scenario && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-100 leading-relaxed">{currentQuestion.scenario}</p>
              </div>
            )}

            {/* Display Images */}
            {currentQuestion.imageUrl && (
              <div className="mb-6">
                <Image
                  src={currentQuestion.imageUrl || "/placeholder.svg"}
                  alt="Question image"
                  width={800}
                  height={600}
                  className="rounded-lg border border-gray-700 w-full"
                />
              </div>
            )}

            {currentQuestion.images && currentQuestion.images.length > 0 && (
              <div className="mb-6 space-y-4">
                {currentQuestion.images.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <Image
                      src={image.url || "/placeholder.svg"}
                      alt={image.alt}
                      width={800}
                      height={600}
                      className="rounded-lg border border-gray-700 w-full"
                    />
                    {image.caption && <p className="text-gray-400 text-sm italic text-center">{image.caption}</p>}
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.questionType === "dropdown" ? (
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">Select the appropriate options from the dropdowns below:</p>
                {currentQuestion.dropdownQuestions?.map((dropdownQuestion, index) => (
                  <div key={index} className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                    <p className="text-white mb-3 font-medium">{dropdownQuestion}</p>
                    <Select
                      value={(selectedAnswers as string[])[index] || ""}
                      onValueChange={(value) => handleAnswerSelect(value, index)}
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue placeholder="Select an option..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {currentQuestion.dropdownOptions?.[index]
                          ?.filter((option) => option.trim() !== "") // Filter out empty options
                          .map((option, optionIndex) => (
                            <SelectItem key={optionIndex} value={option} className="text-white hover:bg-gray-700">
                              {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            ) : currentQuestion.questionType === "yesno" ? (
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">
                  For each statement, select <strong>Yes</strong> if true or <strong>No</strong> if false:
                </p>
                {currentQuestion.statements?.map((statement, index) => (
                  <div key={index} className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                    <p className="text-white mb-3">{statement}</p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAnswerSelect(true, index)}
                        variant={(selectedAnswers as boolean[])[index] === true ? "default" : "outline"}
                        className={
                          (selectedAnswers as boolean[])[index] === true
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                        }
                      >
                        Yes
                      </Button>
                      <Button
                        onClick={() => handleAnswerSelect(false, index)}
                        variant={(selectedAnswers as boolean[])[index] === false ? "default" : "outline"}
                        className={
                          (selectedAnswers as boolean[])[index] === false
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                        }
                      >
                        No
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-300 mb-4">
                  {currentQuestion.questionType === "multiple"
                    ? "Select all correct answers:"
                    : "Select the correct answer:"}
                </p>
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    variant="outline"
                    className={`w-full text-left justify-start p-4 h-auto ${
                      currentQuestion.questionType === "multiple"
                        ? (selectedAnswers as number[]).includes(index)
                          ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                          : "bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                        : (selectedAnswers as number[])[0] === index
                          ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                          : "bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          currentQuestion.questionType === "multiple"
                            ? (selectedAnswers as number[]).includes(index)
                              ? "border-white bg-white"
                              : "border-gray-400"
                            : (selectedAnswers as number[])[0] === index
                              ? "border-white bg-white"
                              : "border-gray-400"
                        }`}
                      >
                        {((currentQuestion.questionType === "multiple" &&
                          (selectedAnswers as number[]).includes(index)) ||
                          (currentQuestion.questionType === "single" &&
                            (selectedAnswers as number[])[0] === index)) && (
                          <CheckCircle className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                      <span className="leading-relaxed">{option}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePreviousQuestion}
            disabled={quizState.currentQuestionIndex === 0}
            variant="outline"
            className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400 text-sm">
              {quizState.answers.filter((answer) => answer !== null && answer !== undefined).length} answered
            </span>
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={!isAnswerSelected()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {quizState.currentQuestionIndex === quizState.questions.length - 1 ? "Finish Quiz" : "Next"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
