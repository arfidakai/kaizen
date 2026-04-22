"use client"

import { THEMES } from "@/lib/themes"
import { useTheme } from "@/context/ThemeContext"
import { Check } from "lucide-react"

export default function ThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
      {THEMES.map(t => {
        const active = theme.id === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              padding: "0.75rem 0.5rem",
              borderRadius: "0.875rem",
              border: `2px solid ${active ? t.accent : "#2e2e2e"}`,
              background: active ? t.accentDim : "#1c1c1c",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            {active && (
              <div style={{
                position: "absolute", top: 6, right: 6,
                width: 16, height: 16, borderRadius: "50%",
                background: t.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={9} color="#0f0f0f" strokeWidth={3.5} />
              </div>
            )}
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: t.accent,
              boxShadow: active ? `0 0 12px ${t.accentBorder}` : "none",
              transition: "box-shadow 0.2s",
            }} />
            <span style={{
              fontSize: "0.65rem",
              fontFamily: "'Space Mono', monospace",
              color: active ? t.accent : "#888",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}>
              {t.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
