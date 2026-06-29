"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { todayISO, calcStreak } from "@/lib/utils"
import { format, subDays } from "date-fns"
import HabitCard from "@/components/HabitCard"
import ContributionGraph from "@/components/ContributionGraph"
import HabitReminderModal from "@/components/HabitReminderModal"
import ReminderSettingsModal from "@/components/ReminderSettingsModal"
import { useNotification } from "@/context/NotificationContext"
import { useHabitReminders } from "@/lib/useHabitReminders"
import Link from "next/link"
import { Plus, Loader2, X } from "lucide-react"

const HABIT_ICONS = ["✅","🏃","📚","💪","🧘","🥗","💧","😴","🎯","✍️","🎵","🌿","🧠","🏋️","🚴","🧹","💊","🙏","🎨","📱"]

interface Habit {
  id: string
  name: string
  icon: string
  completedToday: boolean
  streak: number
  allCompletedDates: string[]
  reminderTime?: string | null
  reminderEnabled?: boolean
  goalId?: string | null
  goalTitle?: string | null
}

interface GoalOption {
  id: string
  title: string
  priority: string
  target_date: string | null
}

type HabitsTab = "habits" | "goals"

export default function HabitsPage() {
  const supabase = createClient()
  const today = todayISO()
  const { addNotification } = useNotification()
  useHabitReminders() // Start reminder checking

  const [userId, setUserId] = useState("")
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("✅")
  const [newGoalId, setNewGoalId] = useState("")
  const [adding, setAdding] = useState(false)
  const [allCompletedDates, setAllCompletedDates] = useState<string[]>([])
  const [reminderHabit, setReminderHabit] = useState<Habit | null>(null)
  const [showReminder, setShowReminder] = useState(false)
  const [settingsHabit, setSettingsHabit] = useState<Habit | null>(null)
  const [showReminderSettings, setShowReminderSettings] = useState(false)
  const [goals, setGoals] = useState<GoalOption[]>([])
  const [activeTab, setActiveTab] = useState<HabitsTab>("habits")

  const fetchHabits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [habitsRes, logsRes, goalsRes] = await Promise.all([
      supabase.from("habits").select("id, name, icon, reminder_time, reminder_enabled, goal_id").eq("user_id", user.id).order("created_at"),
      supabase.from("habit_logs")
        .select("habit_id, date, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("date", format(subDays(new Date(), 84), "yyyy-MM-dd")),
      supabase.from("goals").select("id, title, priority, target_date").eq("user_id", user.id).order("created_at", { ascending: false }),
    ])

    const allHabits = habitsRes.data || []
    const allLogs = logsRes.data || []
    const allGoals = goalsRes.data || []
    setGoals(allGoals)
    
    const goalLookup = new Map(allGoals.map(goal => [goal.id, goal.title]))
    const todayLogs = new Set(allLogs.filter(l => l.date === today).map(l => l.habit_id))

    const customLogs = allLogs.map(log => log.date)
    setAllCompletedDates(customLogs)

    const mapped: Habit[] = allHabits.map(h => {
      const hLogs = allLogs.filter(l => l.habit_id === h.id).map(l => l.date)
      return {
        id: h.id, name: h.name, icon: h.icon || "✅",
        completedToday: todayLogs.has(h.id),
        streak: calcStreak(hLogs),
        allCompletedDates: hLogs,
        reminderTime: h.reminder_time,
        reminderEnabled: h.reminder_enabled,
        goalId: h.goal_id,
        goalTitle: h.goal_id ? goalLookup.get(h.goal_id) || null : null,
      }
    })
    setHabits(mapped)
    setLoading(false)
  }, [today])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  async function toggleHabit(habit: Habit) {
    const next = !habit.completedToday
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completedToday: next } : h))
    if (next) {
      await supabase.from("habit_logs").upsert({
        habit_id: habit.id, user_id: userId, date: today, completed: true,
      }, { onConflict: "habit_id,date" })
      addNotification(`✓ ${habit.name} selesai!`, "success", 2000)
    } else {
      await supabase.from("habit_logs").delete().eq("habit_id", habit.id).eq("date", today)
      addNotification(`${habit.name} dibatalkan`, "info", 2000)
    }
    // Refresh log setelah klik agar grafiknya langsung responsif update warna
    fetchHabits()
  }

  function openReminderSettings(habit: Habit) {
    setSettingsHabit(habit)
    setShowReminderSettings(true)
  }

  async function completeFromReminder() {
    if (!reminderHabit) return
    await toggleHabit(reminderHabit)
    setShowReminder(false)
    setReminderHabit(null)
  }

  async function saveReminderTime(time: string) {
    if (!settingsHabit || !userId) return
    
    await supabase
      .from("habits")
      .update({ reminder_time: time, reminder_enabled: true })
      .eq("id", settingsHabit.id)
      .eq("user_id", userId)

    setHabits(prev => prev.map(h => 
      h.id === settingsHabit.id 
        ? { ...h, reminderTime: time, reminderEnabled: true }
        : h
    ))

    addNotification(`Reminder set untuk ${settingsHabit.name} at ${time}`, "success", 2000)
    setShowReminderSettings(false)
    setSettingsHabit(null)
  }

  async function deleteReminderTime() {
    if (!settingsHabit || !userId) return
    
    await supabase
      .from("habits")
      .update({ reminder_time: null, reminder_enabled: false })
      .eq("id", settingsHabit.id)
      .eq("user_id", userId)

    setHabits(prev => prev.map(h => 
      h.id === settingsHabit.id 
        ? { ...h, reminderTime: null, reminderEnabled: false }
        : h
    ))

    addNotification(`Reminder dihapus untuk ${settingsHabit.name}`, "info", 2000)
    setShowReminderSettings(false)
    setSettingsHabit(null)
  }

  async function addHabit() {
    if (!newName.trim() || !userId) return
    setAdding(true)
    const payload: Record<string, string | null> = {
      user_id: userId,
      name: newName.trim(),
      icon: newIcon,
      goal_id: newGoalId || null,
    }
    const { data } = await supabase.from("habits").insert(payload).select().single()
    if (data) {
      const goalTitle = goals.find(goal => goal.id === data.goal_id)?.title || null
      setHabits(prev => [...prev, { id: data.id, name: data.name, icon: data.icon, completedToday: false, streak: 0, allCompletedDates: [], goalId: data.goal_id, goalTitle }])
    }
    setNewName("")
    setNewIcon("✅")
    setNewGoalId("")
    setShowAdd(false)
    setAdding(false)
    fetchHabits()
  }

  async function deleteHabit(id: string) {
    if (!confirm("Hapus habit ini?")) return
    await supabase.from("habits").delete().eq("id", id)
    setHabits(prev => prev.filter(h => h.id !== id))
    fetchHabits()
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={32} style={{ color: "var(--accent)" }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.2rem" }}>Habits</h1>
          <p style={{ color: "#888", fontSize: "0.8rem", fontFamily: "'Space Mono', monospace" }}>
            {habits.length} habit aktif · {goals.length} goal
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", padding: "0.2rem", borderRadius: 999, background: "#1b1b1b", border: "1px solid #2e2e2e" }}>
            {(["habits", "goals"] as HabitsTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0.45rem 0.8rem",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === tab ? "var(--accent)" : "transparent",
                  color: activeTab === tab ? "#0f0f0f" : "var(--text-secondary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                {tab === "habits" ? "Daily Habits" : "Long-term Goals"}
              </button>
            ))}
          </div>

          {activeTab === "habits" && (
            <button
              onClick={() => setShowAdd(true)}
              className="btn-primary"
              style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <Plus size={16} /> Tambah
            </button>
          )}
        </div>
      </div>

      {activeTab === "habits" ? (
        <>
          <div className="card">
            <p className="section-title">AKTIVITAS 11 MINGGU</p>
            <ContributionGraph 
              completedDates={allCompletedDates} 
              totalHabits={habits.length} 
              weeks={11} 
            />
          </div>

          <div className="card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.9rem" }}>
              <p className="section-title" style={{ marginBottom: 0 }}>SEMUA HABIT</p>
            </div>

            {habits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎯</p>
                <p style={{ color: "#888", fontSize: "0.875rem" }}>Belum ada habit. Mulai buat satu!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {habits.map(habit => (
                  <div key={habit.id}>
                    <HabitCard
                      {...habit}
                      goalTitle={habit.goalTitle}
                      onToggle={() => toggleHabit(habit)}
                      onDelete={() => deleteHabit(habit.id)}
                      onReminderClick={() => openReminderSettings(habit)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <p className="section-title" style={{ marginBottom: "0.35rem" }}>LONG-TERM GOALS</p>
              <h2 style={{ margin: 0, fontSize: "1rem" }}>Goal dan habit sekarang digabung dalam satu ruang kerja.</h2>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                Di sini kamu bisa lihat tujuan besar, lalu pindah ke tab Habits untuk langkah harian.
              </p>
            </div>
            <Link href="/goals" style={{ color: "var(--accent)", fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.25rem" }}>
              Buka Goals
            </Link>
          </div>

          {goals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎯</p>
              <p style={{ color: "#888", fontSize: "0.875rem" }}>Belum ada goal. Tambahkan tujuan besar di halaman Goals.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {goals.map(goal => (
                <div key={goal.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.9rem 1rem", borderRadius: "0.85rem", background: "#1c1c1c", border: "1px solid #2e2e2e" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 700, fontSize: "0.92rem" }}>{goal.title}</p>
                    <p style={{ margin: "0.15rem 0 0", color: "var(--text-secondary)", fontSize: "0.72rem", fontFamily: "'Space Mono', monospace" }}>
                      {goal.priority.toUpperCase()} {goal.target_date ? `· target ${goal.target_date}` : ""}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontFamily: "'Space Mono', monospace", color: "var(--accent)" }}>GOAL</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setShowAdd(false)}>
          <div
            className="animate-fade-in"
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 390,
              background: "#1c1c1c",
              borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem",
              padding: "1.5rem",
              border: "1px solid #2e2e2e",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Habit Baru</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#888", marginBottom: "0.5rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
                  PILIH ICON
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {HABIT_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewIcon(icon)}
                      style={{
                        width: 38, height: 38, fontSize: "1.2rem",
                        borderRadius: "0.5rem", border: "none", cursor: "pointer",
                        background: newIcon === icon ? "var(--accent-soft)" : "#242424",
                        outline: newIcon === icon ? `2px solid var(--accent)` : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#888", marginBottom: "0.4rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
                  NAMA HABIT
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="cth: Olahraga 30 menit"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addHabit()}
                  autoFocus
                  maxLength={50}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#888", marginBottom: "0.4rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
                  HUBUNGKAN KE GOAL
                </label>
                <select
                  className="input-field"
                  value={newGoalId}
                  onChange={e => setNewGoalId(e.target.value)}
                >
                  <option value="">Tanpa goal</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn-primary"
                onClick={addHabit}
                disabled={!newName.trim() || adding}
              >
                {adding ? <Loader2 size={16} className="animate-spin" style={{ marginRight: "0.5rem" }} /> : null}
                {adding ? "Menyimpan..." : "Simpan Habit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Reminder Modal */}
      {reminderHabit && (
        <HabitReminderModal
          isOpen={showReminder}
          habitName={reminderHabit.name}
          habitIcon={reminderHabit.icon}
          onComplete={completeFromReminder}
          onDismiss={() => {
            setShowReminder(false)
            setReminderHabit(null)
          }}
        />
      )}

      {/* Reminder Settings Modal */}
      {settingsHabit && (
        <ReminderSettingsModal
          isOpen={showReminderSettings}
          habitName={settingsHabit.name}
          currentTime={settingsHabit.reminderTime || null}
          onSave={saveReminderTime}
          onClose={() => {
            setShowReminderSettings(false)
            setSettingsHabit(null)
          }}
          onDelete={deleteReminderTime}
        />
      )}
    </div>
  )
}