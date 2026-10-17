"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Clock, Target, Search, ChevronRight, Users, ChevronLeft, Zap, Sparkles, Bot } from "lucide-react"
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
  isPopular?: boolean
  studentsCount?: number
}

// Provider logo components with dark theme
const MicrosoftLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h11v11H0V0z" fill="#00a4ef" />
    <path d="M12 0h11v11H12V0z" fill="#7fba00" />
    <path d="M0 12h11v11H0V12z" fill="#f25022" />
    <path d="M12 12h11v11H12V12z" fill="#ffb900" />
  </svg>
)

const AmazonLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M.045 18.02c.072-.116.187-.18.315-.18.061 0 .127.019.2.056 2.875 1.621 6.045 2.432 9.51 2.432 2.302 0 4.635-.44 6.998-1.319 2.364-.88 4.4-2.146 6.11-3.799.128-.116.26-.174.395-.174.134 0 .248.058.34.174.094.116.14.245.14.387 0 .116-.023.221-.07.315-.047.094-.117.18-.21.26-1.804 1.748-3.96 3.108-6.47 4.08-2.51.972-5.074 1.458-7.692 1.458-3.77 0-7.31-.818-10.62-2.454-.116-.07-.198-.154-.245-.252-.047-.098-.07-.2-.07-.305 0-.142.046-.271.14-.387l-.001-.002z"
      fill="#FF9900"
    />
    <path
      d="M20.954 14.85c-.234 0-.47.058-.708.174-1.804.93-3.747 1.395-5.829 1.395-1.944 0-3.817-.41-5.62-1.23-1.804-.82-3.305-1.963-4.504-3.428-.047-.07-.07-.151-.07-.245 0-.117.035-.221.105-.315.07-.094.164-.14.28-.14.094 0 .181.035.26.105 1.106 1.27 2.443 2.27 4.013 3.001 1.57.73 3.234 1.095 4.992 1.095 1.758 0 3.446-.365 5.064-1.095 1.618-.73 2.955-1.73 4.013-3.001.07-.07.157-.105.26-.105.117 0 .21.046.28.14.07.094.105.198.105.315 0 .094-.023.175-.07.245-1.199 1.465-2.7 2.608-4.504 3.428-.234.116-.47.174-.708.174l.041-.014z"
      fill="#FF9900"
    />
  </svg>
)

const DatabricksLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#FF3621" />
    <path d="M7 9l5-3 5 3v6l-5 3-5-3V9z" fill="white" />
    <path d="M12 6l3 1.8v3.6L12 13l-3-1.6V7.8L12 6z" fill="#FF3621" />
  </svg>
)

const CiscoLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="2" height="8" rx="1" fill="#00bceb" />
    <rect x="6" y="6" width="2" height="12" rx="1" fill="#00bceb" />
    <rect x="10" y="4" width="2" height="16" rx="1" fill="#00bceb" />
    <rect x="14" y="6" width="2" height="12" rx="1" fill="#00bceb" />
    <rect x="18" y="8" width="2" height="8" rx="1" fill="#00bceb" />
  </svg>
)

// CertPro Logo Component
const CertProLogo = ({ className = "text-2xl" }: { className?: string }) => (
  <div className={`font-bold gradient-text ${className}`}>CertPro</div>
)

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [popularStartIndex, setPopularStartIndex] = useState(0)
  const [providerStartIndex, setProviderStartIndex] = useState(0)

  const certifications: Certification[] = [
    {
      id: "dp-700",
      title: "DP-700",
      subtitle: "Azure Data Fundamentals",
      description: "Master Azure data services with AI-powered practice questions and real-time explanations.",
      provider: "Microsoft",
      difficulty: "Beginner",
      estimatedTime: "2-3 hours",
      topics: ["Data Concepts", "Azure Data Services", "Data Analytics", "Data Visualization"],
      passingScore: 70,
      totalQuestions: 40,
      category: "Data & Analytics",
      isPopular: true,
      studentsCount: 15420,
    },
    {
      id: "az-900",
      title: "AZ-900",
      subtitle: "Azure Fundamentals",
      description: "Start your cloud journey with intelligent learning paths and adaptive questioning.",
      provider: "Microsoft",
      difficulty: "Beginner",
      estimatedTime: "3-4 hours",
      topics: ["Cloud Concepts", "Azure Services", "Security", "Pricing & Support"],
      passingScore: 70,
      totalQuestions: 50,
      category: "Cloud Fundamentals",
      isPopular: true,
      studentsCount: 28750,
    },
    {
      id: "databricks-certified-data-engineer-associate",
      title: "Data Engineer Associate",
      subtitle: "Databricks Certified Data Engineer Associate",
      description: "Advanced lakehouse architecture with AI-driven performance optimization insights.",
      provider: "Databricks",
      difficulty: "Intermediate",
      estimatedTime: "4-5 hours",
      topics: ["Lakehouse Architecture", "Delta Lake", "Data Pipelines", "Performance Optimization"],
      passingScore: 70,
      totalQuestions: 60,
      category: "Data Engineering",
      isPopular: true,
      studentsCount: 8930,
    },
    {
      id: "aws-clf-c02",
      title: "CLF-C02",
      subtitle: "AWS Cloud Practitioner",
      description: "Essential AWS knowledge enhanced with intelligent study recommendations.",
      provider: "Amazon",
      difficulty: "Beginner",
      estimatedTime: "2-3 hours",
      topics: ["Cloud Concepts", "AWS Services", "Security", "Billing & Pricing"],
      passingScore: 70,
      totalQuestions: 65,
      category: "Cloud Fundamentals",
      isPopular: true,
      studentsCount: 22100,
    },
    {
      id: "databricks-certified-machine-learning-associate",
      title: "ML Associate",
      subtitle: "Databricks Certified Machine Learning Associate",
      description: "Next-gen ML workflows with AI-powered model deployment strategies.",
      provider: "Databricks",
      difficulty: "Advanced",
      estimatedTime: "4-6 hours",
      topics: ["MLflow", "Model Training", "Feature Engineering", "Model Deployment"],
      passingScore: 70,
      totalQuestions: 50,
      category: "Machine Learning",
      isPopular: true,
      studentsCount: 6750,
    },
    {
      id: "aws-saa-c03",
      title: "SAA-C03",
      subtitle: "AWS Solutions Architect Associate",
      description: "Design resilient cloud architectures with intelligent pattern recognition.",
      provider: "Amazon",
      difficulty: "Intermediate",
      estimatedTime: "4-5 hours",
      topics: ["Design Solutions", "High Availability", "Cost Optimization", "Security"],
      passingScore: 72,
      totalQuestions: 65,
      category: "Cloud Architecture",
      isPopular: true,
      studentsCount: 18650,
    },
  ]

  const providers = [
    {
      name: "Microsoft",
      count: certifications.filter((c) => c.provider === "Microsoft").length,
      color: "from-blue-500 to-cyan-400",
      description: "Azure & Cloud Intelligence",
      logo: MicrosoftLogo,
    },
    {
      name: "Amazon",
      count: certifications.filter((c) => c.provider === "Amazon").length,
      color: "from-orange-500 to-yellow-400",
      description: "AWS Cloud Mastery",
      logo: AmazonLogo,
    },
    {
      name: "Databricks",
      count: certifications.filter((c) => c.provider === "Databricks").length,
      color: "from-red-500 to-pink-400",
      description: "Data & AI Excellence",
      logo: DatabricksLogo,
    },
    {
      name: "Cisco",
      count: certifications.filter((c) => c.provider === "Cisco").length,
      color: "from-cyan-500 to-blue-400",
      description: "Network Intelligence",
      logo: CiscoLogo,
    },
  ]

  const getProviderLogo = (provider: string, className = "w-6 h-6") => {
    switch (provider) {
      case "Microsoft":
        return <MicrosoftLogo className={className} />
      case "Amazon":
        return <AmazonLogo className={className} />
      case "Cisco":
        return <CiscoLogo className={className} />
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

  const filteredCertifications = certifications.filter((cert) => {
    const matchesSearch =
      searchTerm === "" ||
      cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.provider.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProvider = !selectedProvider || cert.provider === selectedProvider

    return matchesSearch && matchesProvider
  })

  const popularCertifications = certifications.filter((cert) => cert.isPopular)
  const visiblePopularCerts = popularCertifications.slice(popularStartIndex, popularStartIndex + 3)
  const visibleProviders = providers.slice(providerStartIndex, providerStartIndex + 4)

  const handlePopularNext = () => {
    if (popularStartIndex + 3 < popularCertifications.length) {
      setPopularStartIndex(popularStartIndex + 1)
    }
  }

  const handlePopularPrev = () => {
    if (popularStartIndex > 0) {
      setPopularStartIndex(popularStartIndex - 1)
    }
  }

  const handleProviderNext = () => {
    if (providerStartIndex + 4 < providers.length) {
      setProviderStartIndex(providerStartIndex + 1)
    }
  }

  const handleProviderPrev = () => {
    if (providerStartIndex > 0) {
      setProviderStartIndex(providerStartIndex - 1)
    }
  }

  return (
    <div className="min-h-screen bg-black grid-pattern">
      {/* Header Navigation - Removed sticky positioning */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <CertProLogo />
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

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="mb-8">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 glow-border">
              <Sparkles className="h-3 w-3 mr-1" />
              Introducing CertPro AI
            </Badge>
          </div>

          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Master Your Next
            <span className="gradient-text block mt-2">Certification</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Experience the future of certification prep with AI-powered questions, intelligent explanations, and
            adaptive learning paths.
          </p>

          {/* AI Features Highlight */}
          <div className="flex justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-blue-400">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-medium">AI Explanations</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-medium">Smart Learning</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Instant Feedback</span>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              <Input
                placeholder="Search certifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg bg-gray-900/50 border-gray-700 focus:border-blue-500 rounded-xl glow-border backdrop-blur-sm font-light"
              />
            </div>
          </div>
        </div>

        {/* Popular Certifications */}
        {!searchTerm && !selectedProvider && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  Most Popular
                </h2>
                <p className="text-gray-400 font-light">AI-enhanced learning paths for trending certifications</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePopularPrev}
                  disabled={popularStartIndex === 0}
                  className="h-10 w-10 p-0 bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-blue-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 px-3 font-mono">
                  {popularStartIndex + 1}-{Math.min(popularStartIndex + 3, popularCertifications.length)} of{" "}
                  {popularCertifications.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePopularNext}
                  disabled={popularStartIndex + 3 >= popularCertifications.length}
                  className="h-10 w-10 p-0 bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-blue-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {visiblePopularCerts.map((cert, index) => (
                <Card
                  key={cert.id}
                  className="bg-gray-900/50 border-gray-800 card-hover backdrop-blur-sm floating-animation flex flex-col h-full"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getProviderLogo(cert.provider, "w-8 h-8")}
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-medium">
                          {cert.provider}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="h-4 w-4" />
                        <span className="status-indicator status-active pl-3 font-mono">
                          {cert.studentsCount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-2xl text-white group-hover:text-blue-400 transition-colors">
                      {cert.title}
                    </CardTitle>
                    <CardDescription className="text-lg font-medium text-gray-300">{cert.subtitle}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-gray-400 mb-6 leading-relaxed font-light flex-1">{cert.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="font-medium">{cert.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-400" />
                        <span className="font-medium">{cert.difficulty}</span>
                      </div>
                    </div>

                    <Link href={`/certification/${cert.id}`}>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-white font-medium glow-effect">
                        Start Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Browse by Provider */}
        {!searchTerm && !selectedProvider && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                  Browse by Provider
                </h2>
                <p className="text-gray-400 font-light">Choose your certification ecosystem</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProviderPrev}
                  disabled={providerStartIndex === 0}
                  className="h-10 w-10 p-0 bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-purple-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 px-3 font-mono">
                  {providerStartIndex + 1}-{Math.min(providerStartIndex + 4, providers.length)} of {providers.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProviderNext}
                  disabled={providerStartIndex + 4 >= providers.length}
                  className="h-10 w-10 p-0 bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-purple-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {visibleProviders.map((provider, index) => {
                const LogoComponent = provider.logo
                return (
                  <Card
                    key={provider.name}
                    className="bg-gray-900/50 border-gray-800 card-hover cursor-pointer backdrop-blur-sm scan-line"
                    onClick={() => setSelectedProvider(provider.name)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <LogoComponent className="w-12 h-12" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {provider.name}
                      </h3>
                      <p className="text-gray-400 mb-4 font-light">{provider.description}</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${provider.color}`}></div>
                        <span className="font-medium">{provider.count} certifications</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Filtered Results */}
        {(searchTerm || selectedProvider) && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                {selectedProvider && getProviderLogo(selectedProvider, "w-10 h-10")}
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedProvider ? `${selectedProvider} Certifications` : "Search Results"}
                  </h2>
                  <p className="text-gray-400 font-light">
                    {filteredCertifications.length} certification{filteredCertifications.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>
              {selectedProvider && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedProvider(null)}
                  className="bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white font-medium"
                >
                  ← Back to All Providers
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertifications.map((cert, index) => (
                <Card
                  key={cert.id}
                  className="bg-gray-900/50 border-gray-800 card-hover backdrop-blur-sm flex flex-col h-full"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getProviderLogo(cert.provider)}
                        <Badge className="bg-gray-800 text-gray-300 border-gray-700 font-medium">{cert.provider}</Badge>
                      </div>
                      <Badge
                        className={`font-medium ${
                          cert.difficulty === "Beginner"
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : cert.difficulty === "Intermediate"
                              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                              : "bg-red-500/20 text-red-300 border-red-500/30"
                        }`}
                      >
                        {cert.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-white">{cert.title}</CardTitle>
                    <CardDescription className="font-medium text-gray-300">{cert.subtitle}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-gray-400 mb-4 font-light flex-1">{cert.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{cert.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span className="font-medium">{cert.totalQuestions} questions</span>
                      </div>
                    </div>

                    <Link href={`/certification/${cert.id}`}>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 font-medium glow-effect">
                        Start Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCertifications.length === 0 && (
              <Card className="text-center py-16 bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardContent>
                  <div className="text-gray-400">
                    <Search className="h-16 w-16 mx-auto mb-6 opacity-50" />
                    <h3 className="text-xl font-semibold mb-3 text-white">No certifications found</h3>
                    <p className="mb-6 font-light">Try a different search term or explore our popular certifications</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedProvider(null)
                      }}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white font-medium"
                    >
                      Clear Search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Admin Link */}
        <div className="text-center mt-20">
          <Link href="/admin">
            <Button variant="ghost" className="text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 font-medium">
              <Bot className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
