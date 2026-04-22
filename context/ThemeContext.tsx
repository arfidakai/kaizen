"use client"

import {
  createContext, useContext, useState,
  useEffect, useLayoutEffect, useCallback,
} from "react"
import { ThemeConfig, getThemeById, DEFAULT_THEME_ID } from "@/lib/themes"
import { createClient, isSupabaseConfigured } from "@/lib/supabase"

interface ThemeContextValue {
  theme: ThemeConfig
  setTheme: (id: string) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getThemeById(DEFAULT_THEME_ID),
  setTheme: async () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function applyThemeCssVars(t: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty("--accent", t.accent)
  root.style.setProperty("--accent-hover", t.accentHover)
  root.style.setProperty("--accent-dim", t.accentDim)
  root.style.setProperty("--accent-soft", t.accentSoft)
  root.style.setProperty("--accent-border", t.accentBorder)
  root.style.setProperty("--accent-glow", t.accentGlow)
  root.style.setProperty("--accent-bar-mid", t.accentBarMid)
  root.style.setProperty("--accent-bar-low", t.accentBarLow)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(getThemeById(DEFAULT_THEME_ID))

  // Apply from localStorage synchronously before first paint
  useLayoutEffect(() => {
    const saved = localStorage.getItem("1pct-theme")
    if (saved) {
      const t = getThemeById(saved)
      setThemeState(t)
      applyThemeCssVars(t)
    }
  }, [])

  // Sync from Supabase after mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("users")
        .select("theme")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.theme) {
            const t = getThemeById(data.theme)
            setThemeState(t)
            applyThemeCssVars(t)
            localStorage.setItem("1pct-theme", data.theme)
          }
        })
    })
  }, [])

  const setTheme = useCallback(async (id: string) => {
    const t = getThemeById(id)
    setThemeState(t)
    applyThemeCssVars(t)
    localStorage.setItem("1pct-theme", id)

    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("users").update({ theme: id }).eq("id", user.id)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
