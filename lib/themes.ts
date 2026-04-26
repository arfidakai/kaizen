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
  cardShadow: string
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
    cardShadow: "none",
  },
  light: {
    bg: "#f2f2f7",
    card: "#ffffff",
    border: "#e8e8ee",
    textPrimary: "#0f0f0f",
    textSecondary: "#6b6b6b",
    textMuted: "#aaaaaa",
    navBg: "#ffffff",
    navBorder: "#ececec",
    inputBg: "#f7f7fa",
    cardShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
  },
}

export type MergedTheme = typeof themes[ThemeName] & typeof modeTokens[Mode]
