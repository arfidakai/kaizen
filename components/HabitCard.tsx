"use client"

import { Flame, Trash2 } from "lucide-react"

interface HabitCardProps {
  id: string
  name: string
  icon: string
  streak: number
  completedToday: boolean
  onToggle: () => void
  onDelete: () => void
}

export default function HabitCard({ name, icon, streak, completedToday, onToggle, onDelete }: HabitCardProps) {
  return (
    <div style={{
      background: completedToday ? "var(--accent-dim)" : "#1c1c1c",
      border: `1px solid ${completedToday ? "var(--accent-border)" : "#2e2e2e"}`,
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
          border: `2px solid ${completedToday ? "var(--accent)" : "#3e3e3e"}`,
          background: completedToday ? "var(--accent)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s",
        }}
      >
        {completedToday && <span style={{ fontSize: 14, color: "#0f0f0f", fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </button>

      {/* Icon + Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "1.1rem" }}>{icon}</span>
          <span style={{
            fontSize: "0.9rem",
            fontWeight: 500,
            color: completedToday ? "var(--accent)" : "#f5f5f5",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem" }}>
          <Flame size={11} color={streak > 0 ? "#ff7043" : "#444"} />
          <span style={{ fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", color: streak > 0 ? "#ff7043" : "#555" }}>
            {streak}d streak
          </span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#444", padding: "0.25rem",
          transition: "color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={e => (e.currentTarget.style.color = "#444")}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
