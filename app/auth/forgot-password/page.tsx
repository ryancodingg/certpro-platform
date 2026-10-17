"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, ArrowLeft, AlertCircle, CheckCircle, Key } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// CertPro Logo Component
const CertProLogo = ({ className = "text-2xl" }: { className?: string }) => (
  <div className={`font-bold gradient-text ${className}`}>CertPro</div>
)

interface FormData {
  email: string
  mobile: string
  code: string
  newPassword: string
  confirmPassword: string
}

interface FormErrors {
  email?: string
  mobile?: string
  code?: string
  newPassword?: string
  confirmPassword?: string
  general?: string
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"request" | "verify" | "reset">("request")
  const [resetMethod, setResetMethod] = useState<"email" | "mobile">("email")
  const [formData, setFormData] = useState<FormData>({
    email: "",
    mobile: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const validateRequestForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (resetMethod === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!formData.email) {
        newErrors.email = "Email is required"
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }
    } else {
      const mobileRegex = /^[+]?[1-9][\d]{0,15}$/
      if (!formData.mobile) {
        newErrors.mobile = "Mobile number is required"
      } else if (!mobileRegex.test(formData.mobile.replace(/[\s\-$$$$]/g, ""))) {
        newErrors.mobile = "Please enter a valid mobile number"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateVerifyForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.code) {
      newErrors.code = "Verification code is required"
    } else if (formData.code.length !== 6) {
      newErrors.code = "Please enter a 6-digit code"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateResetForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRequestForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Check if user exists
      const existingUsers = JSON.parse(localStorage.getItem("certpro-users") || "[]")
      const identifier = resetMethod === "email" ? formData.email : formData.mobile
      const field = resetMethod === "email" ? "email" : "mobile"

      const user = existingUsers.find((u: any) => u[field] === identifier)

      if (!user) {
        setErrors({
          [resetMethod]: `No account found with this ${resetMethod === "email" ? "email address" : "mobile number"}`,
        })
        setIsLoading(false)
        return
      }

      setSuccess(`Verification code sent to your ${resetMethod === "email" ? "email" : "mobile number"}`)
      setStep("verify")
    } catch (error) {
      setErrors({ general: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateVerifyForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In production, verify the code with backend
      if (formData.code !== "123456") {
        setErrors({ code: "Invalid verification code" })
        setIsLoading(false)
        return
      }

      setSuccess("Code verified successfully!")
      setStep("reset")
    } catch (error) {
      setErrors({ general: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateResetForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess("Password reset successfully! Redirecting to login...")

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error) {
      setErrors({ general: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccess(`New verification code sent to your ${resetMethod === "email" ? "email" : "mobile number"}`)
    } catch (error) {
      setErrors({ general: "Failed to resend code. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <CertProLogo className="text-3xl mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === "request" && "Reset Your Password"}
            {step === "verify" && "Verify Your Identity"}
            {step === "reset" && "Create New Password"}
          </h1>
          <p className="text-gray-400 font-light">
            {step === "request" && "Choose how you'd like to receive your reset code"}
            {step === "verify" && `Enter the 6-digit code sent to your ${resetMethod}`}
            {step === "reset" && "Enter your new password below"}
          </p>
        </div>

        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm glow-border">
          <CardContent className="p-8">
            {/* Success Message */}
            {success && (
              <Alert className="mb-6 bg-green-500/10 border-green-500/30 text-green-300">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {errors.general && (
              <Alert className="mb-6 bg-red-500/10 border-red-500/30 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Request Reset */}
            {step === "request" && (
              <div>
                <Tabs
                  value={resetMethod}
                  onValueChange={(value) => setResetMethod(value as "email" | "mobile")}
                  className="mb-6"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                    <TabsTrigger
                      value="email"
                      className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger
                      value="mobile"
                      className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Mobile
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email">
                    <form onSubmit={handleRequestReset} className="space-y-6">
                      <div>
                        <Label htmlFor="email" className="text-gray-300 font-medium">
                          Email Address
                        </Label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className={`pl-10 h-12 bg-gray-800/50 border-gray-700 text-white font-light ${
                              errors.email ? "border-red-500/50" : "focus:border-blue-500"
                            }`}
                            placeholder="Enter your email address"
                          />
                        </div>
                        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium glow-effect"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Sending Code...
                          </>
                        ) : (
                          <>
                            <Mail className="h-5 w-5 mr-2" />
                            Send Reset Code
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="mobile">
                    <form onSubmit={handleRequestReset} className="space-y-6">
                      <div>
                        <Label htmlFor="mobile" className="text-gray-300 font-medium">
                          Mobile Number
                        </Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                          <Input
                            id="mobile"
                            type="tel"
                            value={formData.mobile}
                            onChange={(e) => handleInputChange("mobile", e.target.value)}
                            className={`pl-10 h-12 bg-gray-800/50 border-gray-700 text-white font-light ${
                              errors.mobile ? "border-red-500/50" : "focus:border-blue-500"
                            }`}
                            placeholder="Enter your mobile number"
                          />
                        </div>
                        {errors.mobile && <p className="mt-1 text-sm text-red-400">{errors.mobile}</p>}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium glow-effect"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Sending Code...
                          </>
                        ) : (
                          <>
                            <Phone className="h-5 w-5 mr-2" />
                            Send Reset Code
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Step 2: Verify Code */}
            {step === "verify" && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <Label htmlFor="code" className="text-gray-300 font-medium">
                    Verification Code
                  </Label>
                  <div className="relative mt-2">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      value={formData.code}
                      onChange={(e) => handleInputChange("code", e.target.value.replace(/\D/g, ""))}
                      className={`pl-10 h-12 bg-gray-800/50 border-gray-700 text-white font-light text-center text-lg tracking-widest ${
                        errors.code ? "border-red-500/50" : "focus:border-blue-500"
                      }`}
                      placeholder="000000"
                    />
                  </div>
                  {errors.code && <p className="mt-1 text-sm text-red-400">{errors.code}</p>}
                  <p className="mt-2 text-sm text-gray-500">
                    For demo purposes, use code: <span className="font-mono text-blue-400">123456</span>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium glow-effect"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Verify Code
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={isLoading}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium hover:underline"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <Label htmlFor="newPassword" className="text-gray-300 font-medium">
                    New Password
                  </Label>
                  <div className="relative mt-2">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange("newPassword", e.target.value)}
                      className={`pl-10 h-12 bg-gray-800/50 border-gray-700 text-white font-light ${
                        errors.newPassword ? "border-red-500/50" : "focus:border-blue-500"
                      }`}
                      placeholder="Enter your new password"
                    />
                  </div>
                  {errors.newPassword && <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative mt-2">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={`pl-10 h-12 bg-gray-800/50 border-gray-700 text-white font-light ${
                        errors.confirmPassword ? "border-red-500/50" : "focus:border-blue-500"
                      }`}
                      placeholder="Confirm your new password"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium glow-effect"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Key className="h-5 w-5 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 font-light">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 font-medium">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
