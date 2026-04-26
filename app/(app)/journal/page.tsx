"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { todayISO, formatDate, getDailyPrompt, type Mood, MOOD_LABELS } from "@/lib/utils"
import MoodPicker from "@/components/MoodPicker"
import { Loader2, BookOpen, ChevronDown, ChevronUp, Sparkles } from "lucide-react"

interface JournalEntry {
  id: string
  date: string
  mood: string
  content: string
  prompt: string
}

export default function JournalPage() {
  const supabase = createClient()
  const today = todayISO()
  const prompt = getDailyPrompt()

  const [userId, setUserId] = useState("")
  const [mood, setMood] = useState<Mood | "">("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null)

  const fetchEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from("journal_entries")
      .select("id, date, mood, content, prompt")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30)

    const all = data || []
    setEntries(all)

    const todayEnt = all.find(e => e.date === today)
    if (todayEnt) {
      setTodayEntry(todayEnt)
      setMood(todayEnt.mood as Mood)
      setContent(todayEnt.content)
      setSaved(true)
    }
    setLoading(false)
  }, [today])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !userId) return
    setSaving(true)

    const payload = { user_id: userId, date: today, mood: mood || null, content: content.trim(), prompt }

    if (todayEntry) {
      await supabase.from("journal_entries").update(payload).eq("id", todayEntry.id)
    } else {
      await supabase.from("journal_entries").insert(payload)
    }

    setSaved(true)
    setSaving(false)
    await fetchEntries()
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={32} style={{ color: "var(--accent)" }} className="animate-spin" />
      </div>
    )
  }

  const pastEntries = entries.filter(e => e.date !== today)

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Daily Journal</h1>
        <p style={{ color: "#888", fontSize: "0.8rem", fontFamily: "'Space Mono', monospace" }}>
          {formatDate(today, "EEEE, d MMMM yyyy")}
        </p>
      </div>

      {/* Write form */}
      <form onSubmit={handleSave} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{
          background: "var(--accent-dim)",
          border: "1px solid var(--accent-soft)",
          borderRadius: "0.75rem", padding: "0.75rem",
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.35rem" }}>
            <Sparkles size={13} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em" }}>
              REFLEKSI HARI INI
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>{prompt}</p>
        </div>

        <div>
          <label className="section-title">PERASAANMU HARI INI</label>
          <MoodPicker value={mood} onChange={setMood} />
        </div>

        <div>
          <label className="section-title">TULISANMU</label>
          <textarea
            className="input-field"
            rows={6}
            placeholder="Tulis apa saja yang kamu rasakan, pikirkan, atau pelajari hari ini..."
            value={content}
            onChange={e => { setContent(e.target.value); setSaved(false) }}
            style={{ resize: "none", lineHeight: 1.7 }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "0.7rem", color: "#555", fontFamily: "'Space Mono', monospace" }}>
              {content.length} karakter
            </span>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving || !content.trim()}>
          {saving
            ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: "0.5rem" }} />Menyimpan...</>
            : saved
            ? "✓ Tersimpan — Update"
            : "Simpan Journal"
          }
        </button>
      </form>

      {/* Past Entries */}
      {pastEntries.length > 0 && (
        <div>
          <p className="section-title">ENTRI SEBELUMNYA</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pastEntries.map(entry => {
              const isOpen = expandedId === entry.id
              return (
                <div
                  key={entry.id}
                  className="card"
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => setExpandedId(isOpen ? null : entry.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {entry.mood && <span style={{ fontSize: "1.2rem" }}>{entry.mood}</span>}
                      <div>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {formatDate(entry.date, "EEEE, d MMM")}
                        </p>
                        {entry.mood && (
                          <p style={{ fontSize: "0.7rem", color: "#888", fontFamily: "'Space Mono', monospace" }}>
                            {MOOD_LABELS[entry.mood as Mood] || entry.mood}
                          </p>
                        )}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
                  </div>

                  {!isOpen && (
                    <p style={{
                      color: "#666", fontSize: "0.8rem", marginTop: "0.5rem",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {entry.content}
                    </p>
                  )}

                  {isOpen && (
                    <div style={{ marginTop: "0.75rem", borderTop: "1px solid #2e2e2e", paddingTop: "0.75rem" }}>
                      {entry.prompt && (
                        <p style={{ fontSize: "0.75rem", color: "#555", fontStyle: "italic", marginBottom: "0.5rem" }}>
                          ✨ {entry.prompt}
                        </p>
                      )}
                      <p style={{ fontSize: "0.875rem", color: "#ccc", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {entry.content}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pastEntries.length === 0 && entries.filter(e => e.date === today).length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <BookOpen size={32} color="#555" style={{ margin: "0 auto 0.75rem" }} />
          <p style={{ color: "#888", fontSize: "0.875rem" }}>Belum ada journal. Mulai tulis hari ini!</p>
        </div>
      )}
    </div>
  )
}
