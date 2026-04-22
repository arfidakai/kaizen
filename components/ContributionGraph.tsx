"use client"

import { useMemo } from "react"
import { format, subWeeks, startOfWeek, addDays, parseISO } from "date-fns"
import { id } from "date-fns/locale"

interface ContributionGraphProps {
  completedDates: string[]
  weeks?: number
}

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

export default function ContributionGraph({ completedDates, weeks = 11 }: ContributionGraphProps) {
  const grid = useMemo(() => {
    const today = new Date()
    const startDate = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 })
    const completedSet = new Set(completedDates)
    const result: { date: string; level: number }[][] = []

    for (let w = 0; w < weeks; w++) {
      const week: { date: string; level: number }[] = []
      for (let d = 0; d < 7; d++) {
        const date = addDays(startDate, w * 7 + d)
        const dateStr = format(date, "yyyy-MM-dd")
        const isFuture = date > today
        week.push({
          date: dateStr,
          level: isFuture ? -1 : completedSet.has(dateStr) ? 1 : 0,
        })
      }
      result.push(week)
    }
    return result
  }, [completedDates, weeks])

  const cellSize = 13
  const gap = 3

  return (
    <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
      <div style={{ display: "flex", gap: gap, minWidth: "fit-content" }}>
        {/* Day labels */}
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

        {/* Grid */}
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap }}>
            {/* Month label */}
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
                title={cell.level >= 0 ? `${cell.date}: ${cell.level ? "✓ Selesai" : "✗ Belum"}` : ""}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 3,
                  background: cell.level === -1
                    ? "transparent"
                    : cell.level === 1
                    ? "var(--accent)"
                    : "#1e1e1e",
                  border: cell.level === 0 ? "1px solid #2a2a2a" : "none",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.75rem", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.65rem", color: "#555", fontFamily: "'Space Mono', monospace" }}>Less</span>
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "#1e1e1e", border: "1px solid #2a2a2a" }} />
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "var(--accent-dim)" }} />
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "var(--accent-soft)" }} />
        <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: "var(--accent)" }} />
        <span style={{ fontSize: "0.65rem", color: "#555", fontFamily: "'Space Mono', monospace" }}>More</span>
      </div>
    </div>
  )
}
