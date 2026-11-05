import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import {PageReveals} from "@/components/page-reveals"
import { AuthProvider } from "@/hooks/use-auth"

export const metadata: Metadata = {
  title: "CertPro - Certification Practice and Mock Exams",
  description:
    "Study published certification question banks with immediate practice explanations and timed mock exams.",
  icons: {
    icon: [{ url: '/favicon-c.png', sizes: '32x32', type: 'image/png' }],
    shortcut: '/favicon-c.ico',
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
        <AuthProvider><PageReveals>{children}</PageReveals></AuthProvider>
      </body>
    </html>
  )
}
