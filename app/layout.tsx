import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"

export const metadata: Metadata = {
  title: "CertPro - Certification Practice and Mock Exams",
  description:
    "Study published certification question banks with immediate practice explanations and timed mock exams.",
    icons: {
    icon: [
      { url: "/brand/certpro-fox-c-v1.ico", sizes: "32x32", type: "image/x-icon" },
      { url: '/brand/certpro-fox-c-v1-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/certpro-fox-c-v1-256.png', sizes: '256x256', type: 'image/png' },
    ],
    shortcut: '/brand/certpro-fox-c-v1.ico',
    apple: [{ url: '/brand/certpro-fox-c-v1-180.png', sizes: '180x180', type: 'image/png' }],
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
