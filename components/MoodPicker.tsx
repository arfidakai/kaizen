"use client"

import { MOODS, MOOD_LABELS, type Mood } from "@/lib/utils"

interface MoodPickerProps {
  value: Mood | ""
  onChange: (mood: Mood) => void
}

export default function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
      {MOODS.map(mood => (
        <button
          key={mood}
          type="button"
          onClick={() => onChange(mood)}
          title={MOOD_LABELS[mood]}
          style={{
            flex: 1,
            height: 54,
            borderRadius: "0.75rem",
            border: `2px solid ${value === mood ? "var(--accent)" : "#2e2e2e"}`,
            background: value === mood ? "var(--accent-soft)" : "#1c1c1c",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.1rem",
            transition: "all 0.2s",
            transform: value === mood ? "scale(1.05)" : "scale(1)",
          }}
        >
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{mood}</span>
          <span style={{
            fontSize: "0.5rem",
            fontFamily: "'Space Mono', monospace",
            color: value === mood ? "var(--accent)" : "#555",
            letterSpacing: "0.02em",
          }}>
            {MOOD_LABELS[mood]}
          </span>
        </button>
      ))}
    </div>
  )
}
