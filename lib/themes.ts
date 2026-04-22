export interface ThemeConfig {
  id: string
  name: string
  accent: string
  accentHover: string
  accentDim: string    // ~6% opacity — card backgrounds
  accentSoft: string   // ~12% opacity — active states
  accentBorder: string // ~25% opacity — borders
  accentGlow: string   // full box-shadow string
  accentBarMid: string // chart medium bar
  accentBarLow: string // chart low bar
}

export const THEMES: ThemeConfig[] = [
  {
    id: "forest", name: "Forest",
    accent: "#64dc78", accentHover: "#4ab85c",
    accentDim: "rgba(100,220,120,0.06)", accentSoft: "rgba(100,220,120,0.12)",
    accentBorder: "rgba(100,220,120,0.25)", accentGlow: "0 0 24px rgba(100,220,120,0.18)",
    accentBarMid: "#4ab85c", accentBarLow: "#2d6b38",
  },
  {
    id: "aurora", name: "Aurora",
    accent: "#a78bfa", accentHover: "#7c5bb5",
    accentDim: "rgba(167,139,250,0.06)", accentSoft: "rgba(167,139,250,0.12)",
    accentBorder: "rgba(167,139,250,0.25)", accentGlow: "0 0 24px rgba(167,139,250,0.18)",
    accentBarMid: "#7c5bb5", accentBarLow: "#4a2d8a",
  },
  {
    id: "ember", name: "Ember",
    accent: "#fb923c", accentHover: "#ea7a1e",
    accentDim: "rgba(251,146,60,0.06)", accentSoft: "rgba(251,146,60,0.12)",
    accentBorder: "rgba(251,146,60,0.25)", accentGlow: "0 0 24px rgba(251,146,60,0.18)",
    accentBarMid: "#c96a1a", accentBarLow: "#7c3d0e",
  },
  {
    id: "frost", name: "Frost",
    accent: "#38bdf8", accentHover: "#0ea5e9",
    accentDim: "rgba(56,189,248,0.06)", accentSoft: "rgba(56,189,248,0.12)",
    accentBorder: "rgba(56,189,248,0.25)", accentGlow: "0 0 24px rgba(56,189,248,0.18)",
    accentBarMid: "#0ea5e9", accentBarLow: "#0369a1",
  },
  {
    id: "rose", name: "Rose",
    accent: "#f472b6", accentHover: "#ec4899",
    accentDim: "rgba(244,114,182,0.06)", accentSoft: "rgba(244,114,182,0.12)",
    accentBorder: "rgba(244,114,182,0.25)", accentGlow: "0 0 24px rgba(244,114,182,0.18)",
    accentBarMid: "#ec4899", accentBarLow: "#9d174d",
  },
  {
    id: "gold", name: "Gold",
    accent: "#fbbf24", accentHover: "#f59e0b",
    accentDim: "rgba(251,191,36,0.06)", accentSoft: "rgba(251,191,36,0.12)",
    accentBorder: "rgba(251,191,36,0.25)", accentGlow: "0 0 24px rgba(251,191,36,0.18)",
    accentBarMid: "#d97706", accentBarLow: "#92400e",
  },
]

export const DEFAULT_THEME_ID = "forest"

export function getThemeById(id: string): ThemeConfig {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
