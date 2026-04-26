"use client"

import {
  createContext, useContext, useState,
  useEffect, useLayoutEffect, useCallback, useRef,
} from "react"
import { ThemeName, Mode, MergedTheme, themes, modeTokens } from "@/lib/themes"
import { createClient, isSupabaseConfigured } from "@/lib/supabase"

const DEFAULT_THEME: ThemeName = "Rose"
const DEFAULT_MODE: Mode = "dark"

interface ThemeContextValue {
  theme: MergedTheme
  mode: Mode
  themeName: ThemeName
  setTheme: (name: ThemeName) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: { ...themes[DEFAULT_THEME], ...modeTokens[DEFAULT_MODE] },
  mode: DEFAULT_MODE,
  themeName: DEFAULT_THEME,
  setTheme: () => {},
  toggleMode: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getMerged(name: ThemeName, m: Mode): MergedTheme {
  return { ...themes[name], ...modeTokens[m] }
}

function applyThemeCssVars(merged: MergedTheme) {
  const root = document.documentElement

  // Accent
  root.style.setProperty("--accent", merged.accent)
  root.style.setProperty("--accent-hover", merged.text)
  root.style.setProperty("--accent-mid", merged.accentMid)
  root.style.setProperty("--accent-light", merged.accentLight)
  // Derived opacity variants (used by existing components)
  root.style.setProperty("--accent-dim", hexToRgba(merged.accent, 0.06))
  root.style.setProperty("--accent-soft", hexToRgba(merged.accent, 0.12))
  root.style.setProperty("--accent-border", hexToRgba(merged.accent, 0.25))
  root.style.setProperty("--accent-glow", `0 0 24px ${hexToRgba(merged.accent, 0.18)}`)
  root.style.setProperty("--accent-bar-mid", merged.accentMid)
  root.style.setProperty("--accent-bar-low", merged.text)

  // Mode / surface tokens
  root.style.setProperty("--bg", merged.bg)
  root.style.setProperty("--card", merged.card)
  root.style.setProperty("--border-color", merged.border)
  root.style.setProperty("--text-primary", merged.textPrimary)
  root.style.setProperty("--text-secondary", merged.textSecondary)
  root.style.setProperty("--text-muted", merged.textMuted)
  root.style.setProperty("--nav-bg", merged.navBg)
  root.style.setProperty("--nav-border", merged.navBorder)
  root.style.setProperty("--input-bg", merged.inputBg)
  root.style.setProperty("--card-shadow", merged.cardShadow)

  // Legacy aliases (for globals.css / tailwind compat)
  root.style.setProperty("--background", merged.bg)
  root.style.setProperty("--foreground", merged.textPrimary)
  root.style.setProperty("--card-background", merged.card)
  root.style.setProperty("--card-border", merged.border)
  root.style.setProperty("--input-background", merged.inputBg)
  root.style.setProperty("--input-border", merged.border)
  root.style.setProperty("--border", merged.border)
  root.style.setProperty("--muted", merged.border)
  root.style.setProperty("--muted-foreground", merged.textSecondary)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeNameRef = useRef<ThemeName>(DEFAULT_THEME)
  const modeRef = useRef<Mode>(DEFAULT_MODE)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME)
  const [mode, setModeState] = useState<Mode>(DEFAULT_MODE)
  const [theme, setThemeState] = useState<MergedTheme>(getMerged(DEFAULT_THEME, DEFAULT_MODE))

  // Apply from localStorage synchronously before first paint
  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("kaizen-theme") as ThemeName | null
    const savedMode = localStorage.getItem("kaizen-mode") as Mode | null
    const name = (savedTheme && themes[savedTheme]) ? savedTheme : DEFAULT_THEME
    const m = (savedMode === "dark" || savedMode === "light") ? savedMode : DEFAULT_MODE
    const merged = getMerged(name, m)
    themeNameRef.current = name
    modeRef.current = m
    setThemeNameState(name)
    setModeState(m)
    setThemeState(merged)
    applyThemeCssVars(merged)
  }, [])

  // Sync from Supabase after mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("users")
        .select("theme, mode")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (!data) return
          const name = (data.theme && themes[data.theme as ThemeName]) ? data.theme as ThemeName : DEFAULT_THEME
          const m = (data.mode === "dark" || data.mode === "light") ? data.mode as Mode : DEFAULT_MODE
          const merged = getMerged(name, m)
          themeNameRef.current = name
          modeRef.current = m
          setThemeNameState(name)
          setModeState(m)
          setThemeState(merged)
          applyThemeCssVars(merged)
          localStorage.setItem("kaizen-theme", name)
          localStorage.setItem("kaizen-mode", m)
        })
    })
  }, [])

  const scheduleSupabaseSave = useCallback((name: ThemeName, m: Mode) => {
    if (!isSupabaseConfigured()) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("users").update({ theme: name, mode: m }).eq("id", user.id)
      }
    }, 500)
  }, [])

  const setTheme = useCallback((name: ThemeName) => {
    const m = modeRef.current
    const merged = getMerged(name, m)
    themeNameRef.current = name
    setThemeNameState(name)
    setThemeState(merged)
    applyThemeCssVars(merged)
    localStorage.setItem("kaizen-theme", name)
    scheduleSupabaseSave(name, m)
  }, [scheduleSupabaseSave])

  const toggleMode = useCallback(() => {
    const newMode: Mode = modeRef.current === "dark" ? "light" : "dark"
    const merged = getMerged(themeNameRef.current, newMode)
    modeRef.current = newMode
    setModeState(newMode)
    setThemeState(merged)
    applyThemeCssVars(merged)
    localStorage.setItem("kaizen-mode", newMode)
    scheduleSupabaseSave(themeNameRef.current, newMode)
  }, [scheduleSupabaseSave])

  return (
    <ThemeContext.Provider value={{ theme, mode, themeName, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
