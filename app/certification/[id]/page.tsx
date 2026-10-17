"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Target,
  BookOpen,
  Users,
  Timer,
  ArrowLeft,
  CheckCircle,
  Award,
  FileText,
  Globe,
  Zap,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { AuthNav } from "@/components/auth-nav"

interface Certification {
  id: string
  title: string
  subtitle: string
  description: string
  provider: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  estimatedTime: string
  topics: string[]
  passingScore: number
  totalQuestions: number
  category: string
  studentsCount?: number
  examGuide?: {
    overview: string
    prerequisites: string[]
    examFormat: string
    duration: string
    cost: string
    validityPeriod: string
    renewalRequirements: string
    officialResources: Array<{
      title: string
      url: string
      type: "documentation" | "training" | "practice" | "community"
    }>
  }
}

// Provider logo components
const MicrosoftLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h11v11H0V0z" fill="#f25022" />
    <path d="M12 0h11v11H12V0z" fill="#7fba00" />
    <path d="M0 12h11v11H0V12z" fill="#00a4ef" />
    <path d="M12 12h11v11H12V12z" fill="#ffb900" />
  </svg>
)

const DatabricksLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#FF3621" />
    <path d="M7 9l5-3 5 3v6l-5 3-5-3V9z" fill="white" />
    <path d="M12 6l3 1.8v3.6L12 13l-3-1.6V7.8L12 6z" fill="#FF3621" />
  </svg>
)

// CertPro Logo Component
const CertProLogo = ({ className = "text-2xl" }: { className?: string }) => (
  <div className={`font-bold gradient-text ${className}`}>CertPro</div>
)

export default function CertificationDetailPage({ params }: { params: { id: string } }) {
  const [certification, setCertification] = useState<Certification | null>(null)
  const [loading, setLoading] = useState(true)

  const getProviderLogo = (provider: string, className = "w-8 h-8") => {
    switch (provider) {
      case "Microsoft":
        return <MicrosoftLogo className={className} />
      case "Databricks":
        return <DatabricksLogo className={className} />
      default:
        return (
          <div
            className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs`}
          >
            {provider.charAt(0)}
          </div>
        )
    }
  }

  useEffect(() => {
    // Load certification data
    const loadCertificationData = () => {
      const certifications: Certification[] = [
        {
          id: "dp-700",
          title: "DP-700",
          subtitle: "Azure Data Fundamentals",
          description: "Perfect starting point for data professionals. Learn Azure data services fundamentals.",
          provider: "Microsoft",
          difficulty: "Beginner",
          estimatedTime: "2-3 hours",
          topics: ["Data Concepts", "Azure Data Services", "Data Analytics", "Data Visualization"],
          passingScore: 70,
          totalQuestions: 40,
          category: "Data & Analytics",
          studentsCount: 15420,
          examGuide: {
            overview:
              "The DP-700 certification validates foundational knowledge of core data concepts and how they are implemented using Microsoft Azure data services. This exam is designed for candidates beginning to work with data in the cloud.",
            prerequisites: [
              "Basic understanding of data concepts",
              "Familiarity with cloud computing concepts",
              "No prior Azure experience required",
            ],
            examFormat: "Multiple choice and multiple select questions",
            duration: "60 minutes",
            cost: "$99 USD",
            validityPeriod: "3 years",
            renewalRequirements: "Complete renewal assessment 6 months before expiration",
            officialResources: [
              {
                title: "Official Microsoft Learning Path",
                url: "https://docs.microsoft.com/en-us/learn/paths/azure-data-fundamentals-explore-core-data-concepts/",
                type: "training",
              },
              {
                title: "Azure Data Services Documentation",
                url: "https://docs.microsoft.com/en-us/azure/data-factory/",
                type: "documentation",
              },
              {
                title: "Microsoft Learn Community",
                url: "https://techcommunity.microsoft.com/t5/microsoft-learn/ct-p/MicrosoftLearn",
                type: "community",
              },
            ],
          },
        },
        {
          id: "databricks-certified-data-engineer-associate",
          title: "Data Engineer Associate",
          subtitle: "Databricks Certified Data Engineer Associate",
          description: "Design and implement data engineering solutions on the Databricks Lakehouse Platform.",
          provider: "Databricks",
          difficulty: "Intermediate",
          estimatedTime: "4-5 hours",
          topics: ["Lakehouse Architecture", "Delta Lake", "Data Pipelines", "Performance Optimization"],
          passingScore: 70,
          totalQuestions: 60,
          category: "Data Engineering",
          studentsCount: 8930,
          examGuide: {
            overview:
              "This certification validates skills in implementing and managing data engineering workloads on the Databricks Lakehouse Platform using Delta Lake and Apache Spark.",
            prerequisites: [
              "1+ years of experience with Apache Spark",
              "Experience with Delta Lake",
              "Understanding of data engineering principles",
              "Proficiency in Python or Scala",
            ],
            examFormat: "Multiple choice, multiple select, and hands-on scenarios",
            duration: "120 minutes",
            cost: "$200 USD",
            validityPeriod: "2 years",
            renewalRequirements: "Retake the exam or complete continuing education",
            officialResources: [
              {
                title: "Data Engineer Learning Path",
                url: "https://academy.databricks.com/learning-path/data-engineer",
                type: "training",
              },
              {
                title: "Delta Lake Documentation",
                url: "https://docs.delta.io/",
                type: "documentation",
              },
            ],
          },
        },
      ]

      const foundCert = certifications.find((cert) => cert.id === params.id)
      setCertification(foundCert || null)
      setLoading(false)
    }

    loadCertificationData()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black grid-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400 font-light">Loading certification details...</p>
        </div>
      </div>
    )
  }

  if (!certification) {
    return (
      <div className="min-h-screen bg-black grid-pattern flex items-center justify-center">
        <Card className="max-w-md bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Certification Not Found</h2>
            <p className="text-gray-400 mb-6 font-light">The requested certification could not be found.</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black grid-pattern">
      {/* Header Navigation - Removed sticky positioning */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/">
                <CertProLogo />
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-gray-300 hover:text-white transition-colors font-medium">
                  Home
                </Link>
                <Link href="/certifications" className="text-gray-300 hover:text-white transition-colors font-medium">
                  Certifications
                </Link>
                <Link href="/practice" className="text-gray-300 hover:text-white transition-colors font-medium">
                  Practice
                </Link>
              </nav>
            </div>

            {/* Login/Signup Section */}
            <AuthNav />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getProviderLogo(certification.provider, "w-10 h-10")}
            <div>
              <h1 className="text-3xl font-bold text-white">{certification.title}</h1>
              <p className="text-xl text-gray-400 font-light">{certification.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Certification Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-6 font-light">{certification.description}</p>

                {certification.examGuide && (
                  <div className="space-y-4">
                    <p className="text-gray-300 font-light">{certification.examGuide.overview}</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-300 mb-2">Exam Details</h4>
                        <ul className="text-sm text-blue-200 space-y-1 font-light">
                          <li>
                            <strong>Duration:</strong> {certification.examGuide.duration}
                          </li>
                          <li>
                            <strong>Cost:</strong> {certification.examGuide.cost}
                          </li>
                          <li>
                            <strong>Format:</strong> {certification.examGuide.examFormat}
                          </li>
                          <li>
                            <strong>Passing Score:</strong> {certification.passingScore}%
                          </li>
                        </ul>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-300 mb-2">Certification Info</h4>
                        <ul className="text-sm text-green-200 space-y-1 font-light">
                          <li>
                            <strong>Valid for:</strong> {certification.examGuide.validityPeriod}
                          </li>
                          <li>
                            <strong>Questions:</strong> ~{certification.totalQuestions}
                          </li>
                          <li>
                            <strong>Level:</strong> {certification.difficulty}
                          </li>
                          <li>
                            <strong>Study Time:</strong> {certification.estimatedTime}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prerequisites */}
            {certification.examGuide?.prerequisites && (
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Prerequisites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {certification.examGuide.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 font-light">{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Topics Covered */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                  Topics Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {certification.topics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                      <span className="font-medium text-gray-200">{topic}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Official Resources */}
            {certification.examGuide?.officialResources && (
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Globe className="h-5 w-5 text-cyan-400" />
                    Official Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {certification.examGuide.officialResources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors"
                      >
                        <div
                          className={`p-2 rounded ${
                            resource.type === "training"
                              ? "bg-blue-500/20 text-blue-400"
                              : resource.type === "documentation"
                                ? "bg-green-500/20 text-green-400"
                                : resource.type === "community"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {resource.type === "training" && <Zap className="h-4 w-4" />}
                          {resource.type === "documentation" && <FileText className="h-4 w-4" />}
                          {resource.type === "community" && <Users className="h-4 w-4" />}
                          {resource.type === "practice" && <Target className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{resource.title}</h4>
                          <p className="text-sm text-gray-400 capitalize font-light">{resource.type}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-light">Difficulty</span>
                  <Badge
                    className={`font-medium ${
                      certification.difficulty === "Beginner"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : certification.difficulty === "Intermediate"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                    }`}
                  >
                    {certification.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-light">Study Time</span>
                  <div className="flex items-center gap-1 text-white">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{certification.estimatedTime}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-light">Questions</span>
                  <div className="flex items-center gap-1 text-white">
                    <BookOpen className="h-4 w-4 text-purple-400" />
                    <span className="font-medium">~{certification.totalQuestions}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-light">Passing Score</span>
                  <div className="flex items-center gap-1 text-white">
                    <Target className="h-4 w-4 text-green-400" />
                    <span className="font-medium">{certification.passingScore}%</span>
                  </div>
                </div>

                {certification.studentsCount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-light">Students</span>
                    <div className="flex items-center gap-1 text-white">
                      <Users className="h-4 w-4 text-cyan-400" />
                      <span className="font-mono">{certification.studentsCount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="h-5 w-5 text-yellow-400" />
                  Start Your Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/quiz/${certification.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 glow-effect font-medium">
                    Start Practice Mode
                  </Button>
                </Link>

                <Link href={`/quiz/${certification.id}?mode=exam`}>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-orange-500/30 text-orange-300 hover:bg-orange-500/10 bg-transparent font-medium"
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Take Mock Exam
                  </Button>
                </Link>

                <div className="pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-500 text-center font-light">
                    Practice Mode: Unlimited time with AI explanations
                    <br />
                    Mock Exam: Timed simulation of real exam
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm text-white">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-light">Questions Practiced</span>
                    <span className="text-white font-mono">0/{certification.totalQuestions}</span>
                  </div>
                  <Progress value={0} className="h-2 bg-gray-800" />
                  <p className="text-xs text-gray-500 font-light">Start practicing to track your progress</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
