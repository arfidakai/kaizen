"use client"

import { useMemo } from "react"
import { format, subWeeks, startOfWeek, addDays, parseISO } from "date-fns"
import { id } from "date-fns/locale"

interface ContributionGraphProps {
  completedDates: string[] 
  totalHabits: number      // ← Memastikan properti ini terdaftar di TypeScript
  weeks?: number
}

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

export default function ContributionGraph({ completedDates, totalHabits, weeks = 11 }: ContributionGraphProps) {
  const grid = useMemo(() => {
    const today = new Date()
    const startDate = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 })
    
    const dateCounts: Record<string, number> = {}
    for (const dateStr of completedDates) {
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1
    }

    const result: { date: string; level: number; count: number }[][] = []

    for (let w = 0; w < weeks; w++) {
      const week: { date: string; level: number; count: number }[] = []
      for (let d = 0; d < 7; d++) {
        const date = addDays(startDate, w * 7 + d)
        const dateStr = format(date, "yyyy-MM-dd")
        const isFuture = date > today
        
        const count = dateCounts[dateStr] || 0
        let level = 0

        if (isFuture) {
          level = -1
        } else if (count === 0 || totalHabits === 0) {
          level = 0 
        } else {
          const ratio = count / totalHabits 

          if (ratio <= 0.25) {
            level = 1       
          } else if (ratio <= 0.5) {
            level = 2       
          } else if (ratio <= 0.75) {
            level = 3       
          } else {
            level = 4       
          }
        }

        week.push({ date: dateStr, level, count })
      }
      result.push(week)
    }
    return result
  }, [completedDates, totalHabits, weeks])

  const cellSize = 13
  const gap = 3

  const getCellBackground = (level: number) => {
    switch (level) {
      case -1: return "transparent"
      case 1: return "#2e1f47" 
      case 2: return "#4c3275" 
      case 3: return "#7047a8" 
      case 4: return "#9061de" 
      default: return "#1e1e1e" 
    }
  }

  return (
    <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
      <div style={{ display: "flex", gap: gap, minWidth: "fit-content" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: gap, paddingTop: 18 }}>
          {DAYS.map((day, i) => (
            <div key={i} style={{
              height: cellSize,
              display: "flex",
              alignItems: "center",
              fontSize: "0.55rem",
              fontFamily: "'Space Mono', monospace",
              color: "#555",
              width: 22,
              lineHeight: 1,
            }}>
              {i % 2 === 0 ? day : ""}
            </div>
          ))}
        </div>

        {grid.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap }}>
            <div style={{
              height: 14,
              fontSize: "0.55rem",
              fontFamily: "'Space Mono', monospace",
              color: "#555",
              whiteSpace: "nowrap",
            }}>
              {week[0] && (() => {
                const d = parseISO(week[0].date)
                return d.getDate() <= 7 ? format(d, "MMM", { locale: id }) : ""
              })()}
            </div>

            {week.map((cell, di) => (
              <div
                key={di}
                title={cell.level >= 0 ? `${cell.date}: ${cell.count}/${totalHabits} Habit Selesai` : ""}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 3,
                  background: getCellBackground(cell.level),
                  border: cell.level === 0 ? "1px solid #2a2a2a" : "none",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.75rem", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.65rem", color: "#555", fontFamily: "'Space Mono', monospace" }}>Less</span>
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "#1e1e1e", border: "1px solid #2a2a2a" }} />
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "#2e1f47" }} />
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "#4c3275" }} />
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "#7047a8" }} />
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "#9061de" }} />
        <span style={{ fontSize: "0.65rem", color: "#555", fontFamily: "'Space Mono', monospace" }}>More</span>
      </div>
    </div>
  )
}