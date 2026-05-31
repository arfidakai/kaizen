"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { getGreeting, todayISO, formatDate, pct, getDailyPrompt } from "@/lib/utils"
import { format, subDays } from "date-fns"
import { id } from "date-fns/locale"
import MiniBarChart from "@/components/MiniBarChart"
import { Flame, CheckCircle2, Target, BookOpen, Plus, Loader2, Sparkles, Snowflake, ChevronRight, Calendar } from "lucide-react"
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

interface GoalSummary {
  id: string
  title: string
  icon: string
  priority: string
  target_date: string | null
  completedMilestones: number
  totalMilestones: number
  progress: number
}

const PRIORITY_RANK: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
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
  const [goals, setGoals] = useState<GoalSummary[]>([])
  const [loading, setLoading] = useState(true)

  const sortedGoals = [...goals].sort((a, b) => {
    const priorityDiff = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
    if (priorityDiff !== 0) return priorityDiff

    const aTarget = a.target_date || "9999-12-31"
    const bTarget = b.target_date || "9999-12-31"
    const targetDiff = aTarget.localeCompare(bTarget)
    if (targetDiff !== 0) return targetDiff

    return a.progress - b.progress
  })

  const mainFocus = sortedGoals[0] || null
  const secondaryFocus = sortedGoals.slice(1, 3)

  const fetchAll = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    setUser(u)

    const [profileRes, habitsRes, logsRes, streakRes, weekLogsRes, goalsRes, milestonesRes] = await Promise.all([
      supabase.from("users").select("username").eq("id", u.id).single(),
      supabase.from("habits").select("id, name, icon").eq("user_id", u.id),
      supabase.from("habit_logs").select("habit_id").eq("user_id", u.id).eq("date", today).eq("completed", true),
      supabase.from("streaks").select("current_streak, best_streak, freeze_count, last_active").eq("user_id", u.id).single(),
      supabase.from("habit_logs").select("habit_id, date, completed").eq("user_id", u.id).gte("date", format(subDays(new Date(), 6), "yyyy-MM-dd")).lte("date", today),
      supabase.from("goals").select("id, title, icon, priority, target_date").eq("user_id", u.id).order("created_at", { ascending: false }),
      supabase.from("goal_milestones").select("goal_id, completed_at").eq("user_id", u.id),
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

    const goalsData = goalsRes.data || []
    const milestonesData = milestonesRes.data || []
    const mappedGoals: GoalSummary[] = goalsData.map(goal => {
      const milestones = milestonesData.filter(m => m.goal_id === goal.id)
      const totalMilestones = milestones.length
      const completedMilestones = milestones.filter(m => Boolean(m.completed_at)).length
      const progress = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0
      return { ...goal, completedMilestones, totalMilestones, progress }
    })
    setGoals(mappedGoals)
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

      {/* Main Focus */}
      <div className="card glow-accent" style={{ borderColor: "var(--accent-border)", background: "var(--accent-dim)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="section-title" style={{ marginBottom: "0.35rem", color: "var(--accent)" }}>MAIN FOCUS</p>
            {mainFocus ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>{mainFocus.icon}</span>
                  <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{mainFocus.title}</h2>
                </div>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  {mainFocus.progress}% selesai · {mainFocus.completedMilestones}/{mainFocus.totalMilestones} milestone
                  {mainFocus.target_date ? ` · target ${formatDate(mainFocus.target_date, "d MMM yyyy")}` : ""}
                </p>
                <div style={{ marginTop: "0.75rem", height: 7, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ width: `${mainFocus.progress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--accent), var(--accent-hover))" }} />
                </div>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>Belum ada fokus utama</h2>
                <p style={{ margin: "0.3rem 0 0", color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  Tambahkan goal pertama untuk menentukan arah utama bulan ini.
                </p>
              </>
            )}
          </div>
          <Link href="/goals" style={{ color: "var(--accent)", fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
            Goals <ChevronRight size={14} />
          </Link>
        </div>

        {secondaryFocus.length > 0 && (
          <div style={{ marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Secondary focus
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {secondaryFocus.map(goal => (
                <div key={goal.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.65rem 0.8rem", borderRadius: "0.8rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                    <span style={{ fontSize: "1rem" }}>{goal.icon}</span>
                    <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{goal.title}</span>
                  </div>
                  <span style={{ fontSize: "0.74rem", fontFamily: "'Space Mono', monospace", color: "var(--accent)" }}>{goal.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Goal Overview */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div>
            <p className="section-title" style={{ marginBottom: 0 }}>GOAL MAP</p>
            <p style={{ color: "#666", fontSize: "0.75rem", marginTop: "0.2rem" }}>Arah jangka panjang yang sedang kamu bangun</p>
          </div>
          <Link href="/goals" style={{ color: "var(--accent)", fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            Lihat semua <ChevronRight size={14} />
          </Link>
        </div>

        {goals.length === 0 ? (
          <div style={{ padding: "0.5rem 0 0.25rem" }}>
            <p style={{ color: "#888", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Belum ada goal yang terhubung. Mulai dari satu tujuan besar, lalu pecah menjadi milestone.
            </p>
            <Link href="/goals" style={{ display: "inline-block", marginTop: "0.75rem" }}>
              <button className="btn-ghost" style={{ width: "auto", padding: "0.5rem 0.9rem", fontSize: "0.8rem" }}>
                <Plus size={14} style={{ marginRight: "0.35rem" }} /> Buat goal
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {goals.slice(0, 3).map(goal => (
              <div key={goal.id} style={{ padding: "0.85rem", borderRadius: "0.9rem", border: "1px solid #2e2e2e", background: "#1c1c1c" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.55rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", minWidth: 0 }}>
                    <span style={{ fontSize: "1.05rem" }}>{goal.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600, color: "#f5f5f5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{goal.title}</p>
                      <p style={{ margin: 0, color: "#777", fontSize: "0.68rem", fontFamily: "'Space Mono', monospace" }}>
                        {goal.completedMilestones}/{goal.totalMilestones} milestones
                      </p>
                    </div>
                  </div>
                  <span style={{ color: "var(--accent)", fontSize: "0.78rem", fontFamily: "'Space Mono', monospace", minWidth: 36, textAlign: "right" }}>{goal.progress}%</span>
                </div>

                <div style={{ height: 6, background: "#2e2e2e", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${goal.progress}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-hover))" }} />
                </div>

                {goal.target_date && (
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "#7c7c7c", fontSize: "0.7rem", fontFamily: "'Space Mono', monospace" }}>
                    <Calendar size={10} /> Target {formatDate(goal.target_date, "d MMM yyyy")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
