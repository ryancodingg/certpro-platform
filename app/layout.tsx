import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "./hallmark.css"
import "./hallmark-learning.css"
import { AuthProvider } from "@/hooks/use-auth"

export const metadata: Metadata = {
  title: "CertPro - Certification Practice and Mock Exams",
  description:
    "Study published certification question banks with immediate practice explanations and timed mock exams.",
    icons: {
    icon: [
      { url: "/brand/certpro-fox-b-v2.ico", sizes: "32x32", type: "image/x-icon" },
      { url: '/brand/certpro-fox-b-32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/brand/certpro-fox-b-256.png?v=2', sizes: '256x256', type: 'image/png' },
    ],
    shortcut: '/brand/certpro-fox-b-v2.ico',
    apple: [{ url: '/brand/certpro-fox-b-180.png?v=2', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
