"use client"

import { useTheme } from "@/context/ThemeContext"
import { Flame, Trash2, Clock } from "lucide-react"

interface HabitCardProps {
  id: string
  name: string
  icon: string
  streak: number
  completedToday: boolean
  reminderTime?: string | null
  onToggle: () => void
  onDelete: () => void
  onReminderClick?: () => void
}

export default function HabitCard({ name, icon, streak, completedToday, reminderTime, onToggle, onDelete, onReminderClick }: HabitCardProps) {
  const { mode } = useTheme()
  const isLight = mode === "light"

  const cardBg = completedToday 
    ? isLight ? "linear-gradient(135deg, #fdeef3 0%, #fdeef3 100%)" : "var(--accent-dim)"
    : isLight ? "#f7f7fa" : "#1c1c1c"
  
  const cardBorder = completedToday
    ? isLight ? "1px solid #f3a8c0" : "1px solid var(--accent-border)"
    : isLight ? "1px solid #e8e8ee" : "1px solid #2e2e2e"

  const checkboxBorder = completedToday
    ? "var(--accent)"
    : isLight ? "#d0d0d6" : "#3e3e3e"

  const nameColor = completedToday
    ? isLight ? "#b83060" : "var(--accent)"
    : isLight ? "#0f0f0f" : "#f5f5f5"

  const streakColor = streak > 0 ? "#ff7043" : isLight ? "#aaaaaa" : "#555"

  return (
    <div style={{
      background: cardBg,
      border: cardBorder,
      borderRadius: "1rem",
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      transition: "all 0.2s",
    }}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          border: `2px solid ${checkboxBorder}`,
          background: completedToday ? "var(--accent)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s",
        }}
      >
        {completedToday && <span style={{ fontSize: 14, color: isLight ? "#fff" : "#0f0f0f", fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </button>

      {/* Icon + Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "1.1rem" }}>{icon}</span>
          <span style={{
            fontSize: "0.9rem",
            fontWeight: 500,
            color: nameColor,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem" }}>
          <Flame size={11} color={streakColor} />
          <span style={{ fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", color: streakColor }}>
            {streak}d streak
          </span>
          {reminderTime && (
            <>
              <span style={{ color: isLight ? "#d0d0d6" : "#444", margin: "0 0.25rem" }}>•</span>
              <Clock size={11} color="#60a5fa" />
              <span style={{ fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", color: "#60a5fa" }}>
                {reminderTime}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Reminder + Delete */}
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {onReminderClick && (
          <button
            onClick={onReminderClick}
            title={reminderTime ? `Reminder at ${reminderTime}` : "Set reminder"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: reminderTime ? "#60a5fa" : isLight ? "#aaaaaa" : "#444", padding: "0.25rem",
              transition: "color 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#60a5fa")}
            onMouseLeave={e => (e.currentTarget.style.color = reminderTime ? "#60a5fa" : isLight ? "#aaaaaa" : "#444")}
          >
            <Clock size={15} />
          </button>
        )}
        <button
          onClick={onDelete}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: isLight ? "#aaaaaa" : "#444", padding: "0.25rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = isLight ? "#aaaaaa" : "#444")}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
