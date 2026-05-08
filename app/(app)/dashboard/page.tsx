"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { getGreeting, todayISO, formatDate, pct, getDailyPrompt } from "@/lib/utils"
import { format, subDays } from "date-fns"
import { id } from "date-fns/locale"
import MiniBarChart from "@/components/MiniBarChart"
import { Flame, CheckCircle2, Target, BookOpen, Plus, Loader2, Sparkles, Snowflake } from "lucide-react"
import Link from "next/link"

interface Habit {
  id: string
  name: string
  icon: string
  completed: boolean
}

interface StreakData {
  current_streak: number
  best_streak: number
  freeze_count: number
  last_active: string | null
}

interface WeekData {
  day: string
  rate: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const today = todayISO()

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [username, setUsername] = useState("")
  const [habits, setHabits] = useState<Habit[]>([])
  const [streak, setStreak] = useState<StreakData>({ current_streak: 0, best_streak: 0, freeze_count: 0, last_active: null })
  const [streakAtRisk, setStreakAtRisk] = useState(false)
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [todayRate, setTodayRate] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    setUser(u)

    const [profileRes, habitsRes, logsRes, streakRes, weekLogsRes] = await Promise.all([
      supabase.from("users").select("username").eq("id", u.id).single(),
      supabase.from("habits").select("id, name, icon").eq("user_id", u.id),
      supabase.from("habit_logs").select("habit_id").eq("user_id", u.id).eq("date", today).eq("completed", true),
      supabase.from("streaks").select("current_streak, best_streak, freeze_count, last_active").eq("user_id", u.id).single(),
      supabase.from("habit_logs").select("habit_id, date, completed").eq("user_id", u.id).gte("date", format(subDays(new Date(), 6), "yyyy-MM-dd")).lte("date", today),
    ])

    if (profileRes.data) setUsername(profileRes.data.username || u.email?.split("@")[0] || "")
    if (streakRes.data) {
      const s = streakRes.data
      setStreak({ ...s, freeze_count: s.freeze_count ?? 1 })
      const twoDaysAgo = format(subDays(new Date(), 2), "yyyy-MM-dd")
      if (s.last_active === twoDaysAgo && (s.freeze_count ?? 1) > 0 && s.current_streak > 0) {
        setStreakAtRisk(true)
      }
    }

    const allHabits = habitsRes.data || []
    const completedIds = new Set((logsRes.data || []).map(l => l.habit_id))

    setHabits(allHabits.map(h => ({ ...h, icon: h.icon || "✅", completed: completedIds.has(h.id) })))
    setTodayRate(pct(completedIds.size, allHabits.length))

    const allLogs = weekLogsRes.data || []
    const days: WeekData[] = []
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd")
      const dayLabel = format(subDays(new Date(), i), "EEE", { locale: id }).substring(0, 3)
      const dayLogs = allLogs.filter(l => l.date === d && l.completed)
      const rate = allHabits.length ? pct(dayLogs.length, allHabits.length) : 0
      days.push({ day: dayLabel, rate })
    }
    setWeekData(days)
    setLoading(false)
  }, [today])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function useFreeze() {
    if (!user || !streakAtRisk || streak.freeze_count <= 0) return
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd")
    await supabase.from("streaks").update({
      last_active: yesterday,
      freeze_count: streak.freeze_count - 1,
      freeze_used_at: today,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id)
    setStreak(prev => ({ ...prev, freeze_count: prev.freeze_count - 1, last_active: yesterday }))
    setStreakAtRisk(false)
  }

  async function toggleHabit(habit: Habit) {
    if (!user) return
    const optimistic = habits.map(h => h.id === habit.id ? { ...h, completed: !h.completed } : h)
    setHabits(optimistic)
    const done = optimistic.find(h => h.id === habit.id)!.completed
    setTodayRate(pct(optimistic.filter(h => h.completed).length, optimistic.length))

    if (done) {
      await supabase.from("habit_logs").upsert({
        habit_id: habit.id, user_id: user.id, date: today, completed: true,
      }, { onConflict: "habit_id,date" })
    } else {
      await supabase.from("habit_logs").delete().eq("habit_id", habit.id).eq("date", today)
    }

    const completedCount = optimistic.filter(h => h.completed).length
    if (completedCount === optimistic.length && optimistic.length > 0) {
      const { data: s } = await supabase.from("streaks").select("current_streak, best_streak, last_active, freeze_count").eq("user_id", user.id).single()
      if (s) {
        const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd")
        const newCurrent = s.last_active === yesterday || s.last_active === today ? s.current_streak + (s.last_active === today ? 0 : 1) : 1
        const newBest = Math.max(newCurrent, s.best_streak)
        const earnedFreeze = newCurrent % 7 === 0 && newCurrent > 0
        const newFreezeCount = earnedFreeze ? Math.min((s.freeze_count ?? 1) + 1, 3) : (s.freeze_count ?? 1)
        await supabase.from("streaks").update({
          current_streak: newCurrent, best_streak: newBest,
          last_active: today, freeze_count: newFreezeCount,
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id)
        setStreak(prev => ({ ...prev, current_streak: newCurrent, best_streak: newBest, freeze_count: newFreezeCount, last_active: today }))
      }
    }
  }

  const prompt = getDailyPrompt()

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
        <p style={{ color: "#888", fontSize: "0.8rem", fontFamily: "'Space Mono', monospace" }}>
          {formatDate(today, "EEEE, d MMMM")}
        </p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.2rem", lineHeight: 1.2 }}>
          {getGreeting()},<br />
          <span className="text-gradient">{username || "Kamu"} 👋</span>
        </h1>
      </div>

      {/* Score Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
        <StatCard icon={<Flame size={16} color="#ff7043" />} label="Streak" value={`${streak.current_streak}d`} sub={streak.freeze_count > 0 ? `🧊 ×${streak.freeze_count}` : undefined} />
        <StatCard icon={<Target size={16} style={{ color: "var(--accent)" }} />} label="Hari ini" value={`${todayRate}%`} highlight />
        <StatCard icon={<CheckCircle2 size={16} color="#64b5f6" />} label="Best" value={`${streak.best_streak}d`} />
      </div>

      {/* Streak at risk banner */}
      {streakAtRisk && streak.freeze_count > 0 && (
        <div className="card" style={{ borderColor: "#3b82f6", background: "rgba(59,130,246,0.08)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Snowflake size={22} color="#60a5fa" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#93c5fd" }}>Streak kamu hampir putus!</p>
            <p style={{ fontSize: "0.72rem", color: "#666", marginTop: "0.1rem" }}>Pakai streak freeze untuk menjaga streak {streak.current_streak} hari-mu</p>
          </div>
          <button
            onClick={useFreeze}
            style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: "0.6rem", padding: "0.5rem 0.875rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
          >
            Pakai 🧊
          </button>
        </div>
      )}

      {/* Today's habits */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <p className="section-title" style={{ marginBottom: 0 }}>HABIT HARI INI</p>
          <Link href="/habits" style={{ color: "var(--accent)", fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", textDecoration: "none" }}>
            + Tambah
          </Link>
        </div>

        {habits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <p style={{ color: "#555", fontSize: "0.875rem", marginBottom: "0.75rem" }}>Belum ada habit</p>
            <Link href="/habits">
              <button className="btn-primary" style={{ width: "auto", padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>
                <Plus size={14} style={{ marginRight: "0.35rem" }} /> Buat habit pertama
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {habits.map(habit => (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: habit.completed ? "var(--accent-dim)" : "#242424",
                  border: `1px solid ${habit.completed ? "var(--accent-border)" : "#2e2e2e"}`,
                  borderRadius: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: `2px solid ${habit.completed ? "var(--accent)" : "#2e2e2e"}`,
                  background: habit.completed ? "var(--accent)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.2s",
                }}>
                  {habit.completed && <span style={{ fontSize: 12, color: "#0f0f0f", fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: "0.9rem", color: habit.completed ? "var(--accent)" : "#f5f5f5" }}>
                  {habit.icon} {habit.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {habits.length > 0 && (
          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ flex: 1, height: 4, background: "#2e2e2e", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${todayRate}%`,
                background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                borderRadius: 2,
                transition: "width 0.5s ease",
              }} />
            </div>
            <span style={{ fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", color: "var(--accent)", minWidth: 32 }}>
              {todayRate}%
            </span>
          </div>
        )}
      </div>

      {/* Daily Prompt */}
      <div className="card" style={{ background: "var(--accent-dim)", borderColor: "var(--accent-border)" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Sparkles size={14} style={{ color: "var(--accent)" }} />
          <p className="section-title" style={{ marginBottom: 0, color: "var(--accent)" }}>PROMPT HARIAN</p>
        </div>
        <p style={{ color: "#ccc", fontSize: "0.875rem", lineHeight: 1.6 }}>{prompt}</p>
        <Link href="/journal" style={{ display: "block", marginTop: "0.75rem" }}>
          <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
            <BookOpen size={14} style={{ marginRight: "0.35rem" }} /> Tulis Journal
          </button>
        </Link>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="card">
        <p className="section-title">COMPLETION 7 HARI</p>
        <MiniBarChart data={weekData} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, highlight = false, sub }: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
  sub?: string
}) {
  return (
    <div className={highlight ? "card glow-accent" : "card"} style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "0.3rem", padding: "0.75rem 0.5rem",
      borderColor: highlight ? "var(--accent-border)" : "#2e2e2e",
      background: highlight ? "var(--accent-dim)" : "#1c1c1c",
    }}>
      {icon}
      <span style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: highlight ? "var(--accent)" : "#f5f5f5" }}>
        {value}
      </span>
      <span style={{ fontSize: "0.65rem", color: "#666", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      {sub && (
        <span style={{ fontSize: "0.6rem", color: "#60a5fa", fontFamily: "'Space Mono', monospace" }}>
          {sub}
        </span>
      )}
    </div>
  )
}
