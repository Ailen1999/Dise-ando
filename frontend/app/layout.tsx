import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Barlow_Condensed } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["700"], style: ["italic"], variable: "--font-barlow" })

export const metadata: Metadata = {
  title: "Shaders Landing Page",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${barlow.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
