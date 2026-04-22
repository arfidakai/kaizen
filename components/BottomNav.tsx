"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CheckSquare, BookOpen, BarChart2, User } from "lucide-react"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/habits", icon: CheckSquare, label: "Habits" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/stats", icon: BarChart2, label: "Stats" },
  { href: "/profile", icon: User, label: "Profil" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 390,
      background: "rgba(20,20,20,0.95)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid #2e2e2e",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      padding: "0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom, 0px))",
      zIndex: 50,
    }}>
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.2rem",
              padding: "0.4rem 0.75rem",
              borderRadius: "0.75rem",
              transition: "all 0.2s",
              textDecoration: "none",
              minWidth: 56,
            }}
          >
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {active && (
                <div style={{
                  position: "absolute",
                  inset: "-6px",
                  background: "var(--accent-soft)",
                  borderRadius: "0.6rem",
                }} />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                style={{
                  position: "relative",
                  transition: "all 0.2s",
                  color: active ? "var(--accent)" : "#555",
                }}
              />
            </div>
            <span style={{
              fontSize: "0.6rem",
              fontFamily: "'Space Mono', monospace",
              color: active ? "var(--accent)" : "#555",
              fontWeight: active ? 700 : 400,
              letterSpacing: "0.05em",
              transition: "color 0.2s",
            }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
