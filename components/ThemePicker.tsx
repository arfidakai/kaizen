"use client"

import { themes, ThemeName } from "@/lib/themes"
import { useTheme } from "@/context/ThemeContext"

const THEME_NAMES = Object.keys(themes) as ThemeName[]

export default function ThemePicker() {
  const { theme, mode, themeName, setTheme, toggleMode } = useTheme()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>

      {/* A) Mode toggle */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {(["dark", "light"] as const).map(m => (
          <button
            key={m}
            onClick={() => { if (mode !== m) toggleMode() }}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor: "pointer",
              background: mode === m ? theme.accent : theme.card,
              color: mode === m ? "#ffffff" : theme.textMuted,
              fontSize: "0.85rem",
              fontFamily: "'Space Mono', monospace",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            {m === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        ))}
      </div>

      {/* B) Color circles */}
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        {THEME_NAMES.map(name => {
          const active = themeName === name
          const t = themes[name]
          return (
            <div
              key={name}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}
            >
              <button
                onClick={() => setTheme(name)}
                aria-label={name}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: t.accent,
                  border: active ? "3px solid #ffffff" : "3px solid transparent",
                  outline: active ? `3px solid ${t.accent}` : "none",
                  outlineOffset: 2,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  padding: 0,
                }}
              />
              {active && (
                <span style={{
                  fontSize: "0.6rem",
                  fontFamily: "'Space Mono', monospace",
                  color: t.accent,
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                }}>
                  {name}
                </span>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
