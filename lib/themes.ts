export type ThemeName = "Aurora" | "Ember" | "Frost" | "Rose" | "Gold"
export type Mode = "dark" | "light"

export const themes: Record<ThemeName, {
  accent: string
  accentLight: string
  accentMid: string
  text: string
}> = {
  Aurora: { accent: "#9b7fe8", accentLight: "#ede9fb", accentMid: "#c4b2f5", text: "#5b3fc4" },
  Ember:  { accent: "#f07040", accentLight: "#fdeee8", accentMid: "#f7b89e", text: "#c04010" },
  Frost:  { accent: "#3b9edd", accentLight: "#e6f4fd", accentMid: "#93cef0", text: "#1b6fa8" },
  Rose:   { accent: "#e8608a", accentLight: "#fdeef3", accentMid: "#f3a8c0", text: "#b83060" },
  Gold:   { accent: "#e8a020", accentLight: "#fdf4e0", accentMid: "#f5cf80", text: "#a86010" },
}

export const modeTokens: Record<Mode, {
  bg: string
  card: string
  border: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  navBg: string
  navBorder: string
  inputBg: string
}> = {
  dark: {
    bg: "#0a0a12",
    card: "#13131f",
    border: "#1e1e30",
    textPrimary: "#ffffff",
    textSecondary: "#888888",
    textMuted: "#444444",
    navBg: "#0d0d17",
    navBorder: "#1a1a2a",
    inputBg: "#0d0d17",
  },
  light: {
    bg: "#f5f5f7",
    card: "#ffffff",
    border: "#f0f0f0",
    textPrimary: "#111111",
    textSecondary: "#888888",
    textMuted: "#cccccc",
    navBg: "#ffffff",
    navBorder: "#f0f0f0",
    inputBg: "#f9f9f9",
  },
}

export type MergedTheme = typeof themes[ThemeName] & typeof modeTokens[Mode]
