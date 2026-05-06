import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/context/ThemeContext"
import { NotificationProvider } from "@/context/NotificationContext"
import NotificationContainer from "@/components/NotificationContainer"

export const metadata: Metadata = {
  title: "1% Daily - Kaizen",
  description: "Tumbuh 1% setiap hari. Self-development tracker harian.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "1% Daily",
  },
  manifest: "/manifest.json",
  applicationName: "1% Daily",
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
          <NotificationProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
            <NotificationContainer />
          </NotificationProvider>
        </div>
      </body>
    </html>
  )
}
