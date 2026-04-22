"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { todayISO, pct } from "@/lib/utils"
import { useTheme } from "@/context/ThemeContext"
import { format, subWeeks, startOfWeek, endOfWeek, subDays } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { Loader2, Trophy, Flame, CheckSquare, Calendar, Star, Award, Zap, Target } from "lucide-react"

interface WeeklyData {
  week: string
  rate: number
}

interface BadgeInfo {
  id: string
  icon: React.ReactNode
  label: string
  desc: string
  unlocked: boolean
}

export default function StatsPage() {
  const supabase = createClient()
  const today = todayISO()
  const { theme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [totalActive, setTotalActive] = useState(0)
  const [completionRate, setCompletionRate] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [badges, setBadges] = useState<BadgeInfo[]>([])
  const [journalCount, setJournalCount] = useState(0)

  const fetchStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startDate = format(subDays(new Date(), 77), "yyyy-MM-dd")

    const [habitsRes, logsRes, streakRes, journalRes] = await Promise.all([
      supabase.from("habits").select("id").eq("user_id", user.id),
      supabase.from("habit_logs")
        .select("habit_id, date, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("date", startDate)
        .lte("date", today),
      supabase.from("streaks").select("current_streak, best_streak").eq("user_id", user.id).single(),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ])

    const habitCount = habitsRes.data?.length || 0
    const allLogs = logsRes.data || []
    const streak = streakRes.data

    setTotalCheckins(allLogs.length)
    if (streak) {
      setBestStreak(streak.best_streak)
      setCurrentStreak(streak.current_streak)
    }
    setJournalCount(journalRes.count || 0)

    const uniqueDays = new Set(allLogs.map(l => l.date))
    setTotalActive(uniqueDays.size)

    const dayRates: number[] = []
    for (const d of Array.from(uniqueDays)) {
      const dayCount = allLogs.filter(l => l.date === d).length
      dayRates.push(pct(dayCount, habitCount))
    }
    const avg = dayRates.length ? Math.round(dayRates.reduce((a, b) => a + b, 0) / dayRates.length) : 0
    setCompletionRate(avg)

    const weeks: WeeklyData[] = []
    for (let w = 7; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(new Date(), w), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const ws = format(weekStart, "yyyy-MM-dd")
      const we = format(weekEnd, "yyyy-MM-dd")
      const weekLogs = allLogs.filter(l => l.date >= ws && l.date <= we)
      const label = format(weekStart, "d MMM", { locale: idLocale })
      const rates: number[] = []
      for (const d of Array.from(new Set(weekLogs.map(l => l.date)))) {
        const cnt = weekLogs.filter(l => l.date === d).length
        rates.push(pct(cnt, habitCount))
      }
      const weekAvg = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0
      weeks.push({ week: label, rate: weekAvg })
    }
    setWeeklyData(weeks)

    const badgeList: BadgeInfo[] = [
      {
        id: "first",
        icon: <Star size={20} color="#fbbf24" />,
        label: "Langkah Pertama",
        desc: "Selesaikan 1 habit",
        unlocked: allLogs.length >= 1,
      },
      {
        id: "week",
        icon: <Flame size={20} color="#fb923c" />,
        label: "Api 7 Hari",
        desc: "Streak 7 hari berturut-turut",
        unlocked: (streak?.best_streak || 0) >= 7,
      },
      {
        id: "month",
        icon: <Trophy size={20} color="#a78bfa" />,
        label: "Konsisten 30 Hari",
        desc: "30 hari aktif",
        unlocked: uniqueDays.size >= 30,
      },
      {
        id: "century",
        icon: <Award size={20} color="#64dc78" />,
        label: "100 Check-in",
        desc: "Total 100 check-in habit",
        unlocked: allLogs.length >= 100,
      },
      {
        id: "journal",
        icon: <Zap size={20} color="#38bdf8" />,
        label: "Penulis Handal",
        desc: "Tulis 10 journal entry",
        unlocked: (journalRes.count || 0) >= 10,
      },
      {
        id: "perfect",
        icon: <Target size={20} color="#f472b6" />,
        label: "Sempurna",
        desc: "Completion rate 100% suatu hari",
        unlocked: (() => {
          const dayMap: Record<string, number> = {}
          for (const l of allLogs) dayMap[l.date] = (dayMap[l.date] || 0) + 1
          return Object.values(dayMap).some(v => v >= habitCount && habitCount > 0)
        })(),
      },
    ]
    setBadges(badgeList)
    setLoading(false)
  }, [today])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={32} style={{ color: "var(--accent)" }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Statistik</h1>
        <p style={{ color: "#888", fontSize: "0.8rem", fontFamily: "'Space Mono', monospace" }}>
          Progres pertumbuhanmu
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <BigStatCard icon={<Calendar size={18} style={{ color: "var(--accent)" }} />} label="Hari Aktif" value={totalActive} suffix="hari" accent />
        <BigStatCard icon={<Target size={18} color="#64b5f6" />} label="Completion Rate" value={completionRate} suffix="%" />
        <BigStatCard icon={<Flame size={18} color="#ff7043" />} label="Best Streak" value={bestStreak} suffix="hari" />
        <BigStatCard icon={<CheckSquare size={18} color="#a78bfa" />} label="Total Check-in" value={totalCheckins} suffix="x" />
      </div>

      {/* Current streak banner */}
      {currentStreak > 0 && (
        <div className="card glow-accent" style={{
          background: "var(--accent-dim)",
          borderColor: "var(--accent-border)",
          display: "flex", alignItems: "center", gap: "0.75rem",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--accent-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "1.5rem" }}>🔥</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              Streak <span className="text-gradient">{currentStreak} hari!</span>
            </p>
            <p style={{ fontSize: "0.75rem", color: "#888" }}>Jaga terus momentum-mu</p>
          </div>
        </div>
      )}

      {/* Weekly chart */}
      <div className="card">
        <p className="section-title">COMPLETION MINGGUAN</p>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="25%">
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#555", fontSize: 9, fontFamily: "'Space Mono', monospace" }}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#555", fontSize: 9, fontFamily: "'Space Mono', monospace" }}
                tickFormatter={v => `${v}%`}
                width={30}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div style={{
                        background: "#242424", border: "1px solid #2e2e2e",
                        borderRadius: 8, padding: "6px 12px",
                        fontSize: 12, fontFamily: "'Space Mono', monospace",
                      }}>
                        <p style={{ color: "#888", marginBottom: 2 }}>{label}</p>
                        <p style={{ color: theme.accent, fontWeight: 700 }}>{payload[0].value}%</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={28}>
                {weeklyData.map((d, i) => (
                  <Cell key={i}
                    fill={
                      d.rate >= 80 ? theme.accent :
                      d.rate >= 50 ? theme.accentBarMid :
                      d.rate > 0  ? theme.accentBarLow : "#2e2e2e"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="section-title">ACHIEVEMENT</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {badges.map(badge => (
            <div key={badge.id} className="card" style={{
              opacity: badge.unlocked ? 1 : 0.4,
              borderColor: badge.unlocked ? "var(--accent-border)" : "#2e2e2e",
              background: badge.unlocked ? "var(--accent-dim)" : "#1c1c1c",
              transition: "all 0.2s",
            }}>
              <div style={{ marginBottom: "0.4rem" }}>{badge.icon}</div>
              <p style={{ fontWeight: 600, fontSize: "0.8rem", marginBottom: "0.15rem" }}>{badge.label}</p>
              <p style={{ fontSize: "0.7rem", color: "#666", lineHeight: 1.4 }}>{badge.desc}</p>
              {badge.unlocked && (
                <div style={{ marginTop: "0.4rem" }}>
                  <span style={{
                    fontSize: "0.6rem", fontFamily: "'Space Mono', monospace",
                    color: "var(--accent)", background: "var(--accent-soft)",
                    padding: "2px 8px", borderRadius: 100,
                  }}>
                    ✓ UNLOCKED
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BigStatCard({ icon, label, value, suffix, accent = false }: {
  icon: React.ReactNode
  label: string
  value: number
  suffix: string
  accent?: boolean
}) {
  return (
    <div className="card" style={{
      background: accent ? "var(--accent-dim)" : "#1c1c1c",
      borderColor: accent ? "var(--accent-border)" : "#2e2e2e",
      display: "flex", flexDirection: "column", gap: "0.25rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
        {icon}
        <span style={{ fontSize: "0.7rem", color: "#888", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
          {label.toUpperCase()}
        </span>
      </div>
      <p style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: "1.75rem", fontWeight: 700,
        color: accent ? "var(--accent)" : "#f5f5f5",
        lineHeight: 1,
      }}>
        {value}<span style={{ fontSize: "0.9rem", color: "#888", marginLeft: "0.2rem" }}>{suffix}</span>
      </p>
    </div>
  )
}
