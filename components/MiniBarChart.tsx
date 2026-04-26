"use client"

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useTheme } from "@/context/ThemeContext"

interface DayData {
  day: string
  rate: number
}

interface MiniBarChartProps {
  data: DayData[]
}

export default function MiniBarChart({ data }: MiniBarChartProps) {
  const { theme } = useTheme()

  return (
    <div style={{ width: "100%", height: 100 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#555", fontSize: 10, fontFamily: "'Space Mono', monospace" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            content={({ active, payload }) => {
              if (active && payload?.length) {
                return (
                  <div style={{
                    background: "#242424",
                    border: "1px solid #2e2e2e",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontFamily: "'Space Mono', monospace",
                    color: theme.accent,
                  }}>
                    {payload[0].value}%
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.rate >= 80 ? theme.accent :
                  entry.rate >= 50 ? theme.accentMid :
                  entry.rate > 0  ? theme.text : "var(--border-color)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
