"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase"
import { todayISO, formatDate } from "@/lib/utils"
import { Calendar, CheckCircle2, Loader2, Plus, Sparkles, Target, Trash2 } from "lucide-react"

type Priority = "low" | "medium" | "high"

interface Milestone {
  id: string
  goal_id: string
  title: string
  order_index: number
  completed_at: string | null
}

interface Goal {
  id: string
  title: string
  icon: string
  priority: Priority
  target_date: string | null
  created_at: string
  milestones: Milestone[]
}

interface GoalCard extends Goal {
  totalMilestones: number
  completedMilestones: number
  progress: number
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

function priorityTone(priority: Priority) {
  if (priority === "high") return { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)", text: "#fca5a5" }
  if (priority === "medium") return { bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.28)", text: "#93c5fd" }
  return { bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.24)", text: "#86efac" }
}

export default function GoalsPage() {
  const supabase = createClient()
  const today = todayISO()

  const [userId, setUserId] = useState("")
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalTitle, setGoalTitle] = useState("")
  const [goalIcon, setGoalIcon] = useState("🎯")
  const [goalPriority, setGoalPriority] = useState<Priority>("medium")
  const [goalTargetDate, setGoalTargetDate] = useState("")
  const [savingGoal, setSavingGoal] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [milestoneTitle, setMilestoneTitle] = useState("")
  const [savingMilestone, setSavingMilestone] = useState(false)

  const fetchGoals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [goalsRes, milestonesRes] = await Promise.all([
      supabase.from("goals").select("id, title, icon, priority, target_date, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("goal_milestones").select("id, goal_id, title, order_index, completed_at").eq("user_id", user.id).order("order_index", { ascending: true }),
    ])

    const goalsData = goalsRes.data || []
    const milestonesData = milestonesRes.data || []

    const goalsWithMilestones = goalsData.map(goal => ({
      ...goal,
      milestones: milestonesData.filter(m => m.goal_id === goal.id),
    }))

    setGoals(goalsWithMilestones)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const goalCards = useMemo<GoalCard[]>(() => {
    return goals.map(goal => {
      const totalMilestones = goal.milestones.length
      const completedMilestones = goal.milestones.filter(m => Boolean(m.completed_at)).length
      const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
      return { ...goal, totalMilestones, completedMilestones, progress }
    })
  }, [goals])

  const selectedGoal = goalCards.find(goal => goal.id === selectedGoalId) || null

  const activeCount = goalCards.length
  const milestoneCount = goalCards.reduce((sum, goal) => sum + goal.totalMilestones, 0)
  const completedCount = goalCards.reduce((sum, goal) => sum + goal.completedMilestones, 0)
  const averageProgress = goalCards.length ? Math.round(goalCards.reduce((sum, goal) => sum + goal.progress, 0) / goalCards.length) : 0

  async function addGoal() {
    if (!userId || !goalTitle.trim()) return
    setSavingGoal(true)

    const { data } = await supabase.from("goals").insert({
      user_id: userId,
      title: goalTitle.trim(),
      icon: goalIcon.trim() || "🎯",
      priority: goalPriority,
      target_date: goalTargetDate || null,
    }).select("id, title, icon, priority, target_date, created_at").single()

    if (data) {
      setGoals(prev => [{ ...data, milestones: [] }, ...prev])
    }

    setGoalTitle("")
    setGoalIcon("🎯")
    setGoalPriority("medium")
    setGoalTargetDate("")
    setSavingGoal(false)
    setShowGoalForm(false)
  }

  async function addMilestone() {
    if (!userId || !selectedGoalId || !milestoneTitle.trim()) return
    const currentGoal = goalCards.find(goal => goal.id === selectedGoalId)
    setSavingMilestone(true)

    const { data } = await supabase.from("goal_milestones").insert({
      user_id: userId,
      goal_id: selectedGoalId,
      title: milestoneTitle.trim(),
      order_index: currentGoal?.milestones.length || 0,
    }).select("id, goal_id, title, order_index, completed_at").single()

    if (data) {
      setGoals(prev => prev.map(goal => goal.id === selectedGoalId ? { ...goal, milestones: [...goal.milestones, data] } : goal))
    }

    setMilestoneTitle("")
    setSavingMilestone(false)
  }

  async function toggleMilestone(goalId: string, milestone: Milestone) {
    const completedAt = milestone.completed_at ? null : new Date().toISOString()
    setGoals(prev => prev.map(goal => goal.id === goalId ? {
      ...goal,
      milestones: goal.milestones.map(item => item.id === milestone.id ? { ...item, completed_at: completedAt } : item),
    } : goal))

    await supabase.from("goal_milestones").update({ completed_at: completedAt }).eq("id", milestone.id).eq("user_id", userId)
  }

  async function deleteGoal(goalId: string) {
    if (!confirm("Hapus goal ini? Semua milestone di dalamnya juga akan ikut terhapus.")) return
    await supabase.from("goals").delete().eq("id", goalId).eq("user_id", userId)
    setGoals(prev => prev.filter(goal => goal.id !== goalId))
    if (selectedGoalId === goalId) {
      setSelectedGoalId(null)
      setMilestoneTitle("")
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={32} style={{ color: "var(--accent)" }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <div>
          <p style={{ color: "#888", fontSize: "0.78rem", fontFamily: "'Space Mono', monospace", marginBottom: "0.25rem" }}>
            {formatDate(today, "EEEE, d MMMM")}
          </p>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 700, lineHeight: 1.2 }}>Goals</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Ubah tujuan besar jadi milestone yang bisa diukur.
          </p>
        </div>

        <button
          onClick={() => setShowGoalForm(true)}
          className="btn-primary"
          style={{ width: "auto", padding: "0.55rem 0.9rem", fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <Plus size={16} /> Goal
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <MetricCard icon={<Target size={16} style={{ color: "var(--accent)" }} />} label="Active Goals" value={activeCount} />
        <MetricCard icon={<CheckCircle2 size={16} color="#64b5f6" />} label="Milestones Done" value={completedCount} suffix={`/${milestoneCount}`} />
        <MetricCard icon={<Sparkles size={16} color="#fbbf24" />} label="Avg Progress" value={averageProgress} suffix="%" accent />
        <MetricCard icon={<Calendar size={16} color="#86efac" />} label="Next Target" value={goalCards.filter(goal => goal.target_date).length ? goalCards.filter(goal => goal.target_date).sort((a, b) => (a.target_date || "").localeCompare(b.target_date || ""))[0].target_date?.slice(0, 10) || "-" : "-"} compact />
      </div>

      {goalCards.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎯</p>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>Belum ada goal. Mulai dari satu tujuan besar yang paling penting.</p>
          <button onClick={() => setShowGoalForm(true)} className="btn-primary" style={{ width: "auto", marginTop: "1rem", padding: "0.55rem 1rem" }}>
            <Plus size={14} style={{ marginRight: "0.35rem" }} /> Buat goal pertama
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {goalCards.map(goal => {
            const tone = priorityTone(goal.priority)
            return (
              <div key={goal.id} className="card" style={{ padding: "1rem", borderColor: goal.progress >= 100 ? "var(--accent-border)" : "var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>{goal.icon}</span>
                      <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{goal.title}</h2>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.18rem 0.6rem", borderRadius: 999, border: `1px solid ${tone.border}`, background: tone.bg, color: tone.text, fontSize: "0.68rem", fontFamily: "'Space Mono', monospace", textTransform: "uppercase" }}>
                        {goal.priority}
                      </span>
                      {goal.target_date && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.18rem 0.6rem", borderRadius: 999, border: "1px solid var(--border-color)", background: "var(--accent-dim)", color: "var(--text-secondary)", fontSize: "0.68rem", fontFamily: "'Space Mono', monospace" }}>
                          <Calendar size={10} /> {formatDate(goal.target_date, "d MMM yyyy")}
                        </span>
                      )}
                      <span style={{ padding: "0.18rem 0.6rem", borderRadius: 999, border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontSize: "0.68rem", fontFamily: "'Space Mono', monospace" }}>
                        {goal.completedMilestones}/{goal.totalMilestones} milestones
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: 6, background: "#2e2e2e", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${goal.progress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--accent), var(--accent-hover))", transition: "width 0.3s ease" }} />
                      </div>
                      <span style={{ fontSize: "0.78rem", fontFamily: "'Space Mono', monospace", color: "var(--accent)", minWidth: 36 }}>{goal.progress}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteGoal(goal.id)}
                    style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: "0.25rem" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ marginTop: "0.9rem" }}>
                  <p className="section-title" style={{ marginBottom: "0.45rem" }}>MILESTONES</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    {goal.milestones.length === 0 ? (
                      <p style={{ color: "#666", fontSize: "0.84rem" }}>Belum ada milestone. Pecah goal ini menjadi langkah-langkah kecil.</p>
                    ) : (
                      goal.milestones.map(milestone => (
                        <button
                          key={milestone.id}
                          onClick={() => toggleMilestone(goal.id, milestone)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            textAlign: "left",
                            border: `1px solid ${milestone.completed_at ? "var(--accent-border)" : "#2e2e2e"}`,
                            background: milestone.completed_at ? "var(--accent-dim)" : "#1c1c1c",
                            borderRadius: "0.85rem",
                            padding: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${milestone.completed_at ? "var(--accent)" : "#3a3a3a"}`, background: milestone.completed_at ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {milestone.completed_at && <span style={{ fontSize: 11, fontWeight: 900, color: "#0f0f0f" }}>✓</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, color: milestone.completed_at ? "var(--accent)" : "var(--text-primary)", fontSize: "0.88rem", fontWeight: 600 }}>{milestone.title}</p>
                            <p style={{ margin: 0, color: "#777", fontSize: "0.7rem", fontFamily: "'Space Mono', monospace" }}>
                              {milestone.completed_at ? `Completed ${formatDate(milestone.completed_at, "d MMM yyyy")}` : `Step ${milestone.order_index + 1}`}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedGoalId(goal.id)}
                    className="btn-ghost"
                    style={{ width: "auto", padding: "0.55rem 0.85rem", fontSize: "0.8rem" }}
                  >
                    + Milestone
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showGoalForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowGoalForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "min(92%, 560px)", background: "#1c1c1c", borderRadius: "0.8rem", padding: "1.25rem", border: "1px solid #2e2e2e", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            <p className="section-title" style={{ marginBottom: "1rem" }}>NEW GOAL</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="Fluent English" className="input" />
              <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: "0.5rem" }}>
                <input value={goalIcon} onChange={e => setGoalIcon(e.target.value)} placeholder="🎯" className="input" />
                <input value={goalTargetDate} onChange={e => setGoalTargetDate(e.target.value)} type="date" className="input" />
              </div>
              <select value={goalPriority} onChange={e => setGoalPriority(e.target.value as Priority)} className="input">
                {PRIORITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                <button onClick={() => setShowGoalForm(false)} className="btn-ghost">Batal</button>
                <button onClick={addGoal} className="btn-primary" disabled={savingGoal}>
                  {savingGoal ? "Menyimpan..." : "Buat goal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedGoal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => { setSelectedGoalId(null); setMilestoneTitle("") }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "#1c1c1c", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.25rem", border: "1px solid #2e2e2e" }}>
            <p className="section-title" style={{ marginBottom: "0.4rem" }}>ADD MILESTONE</p>
            <h3 style={{ margin: 0, marginBottom: "1rem", fontSize: "1.05rem" }}>{selectedGoal.icon} {selectedGoal.title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} placeholder="Prompt Engineering" className="input" />
              <button onClick={addMilestone} className="btn-primary" disabled={savingMilestone}>
                {savingMilestone ? "Menyimpan..." : "Tambah milestone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, suffix, accent = false, compact = false }: { icon: React.ReactNode; label: string; value: number | string; suffix?: string; accent?: boolean; compact?: boolean }) {
  return (
    <div className={accent ? "card glow-accent" : "card"} style={{ display: "flex", flexDirection: "column", alignItems: compact ? "flex-start" : "center", gap: "0.25rem", padding: "0.85rem 0.75rem", borderColor: accent ? "var(--accent-border)" : "var(--border-color)" }}>
      {icon}
      <span style={{ fontSize: compact ? "0.95rem" : "1.15rem", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: accent ? "var(--accent)" : "var(--text-primary)" }}>
        {value}{suffix || ""}
      </span>
      <span style={{ fontSize: "0.63rem", color: "#666", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: compact ? "left" : "center" }}>
        {label}
      </span>
    </div>
  )
}