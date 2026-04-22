import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/context/ThemeContext"

export const metadata: Metadata = {
  title: "1% Daily",
  description: "Tumbuh 1% setiap hari. Self-development tracker harian.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "1% Daily",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f0f0f",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="app-container">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
