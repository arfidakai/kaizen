import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isYesterday, parseISO, differenceInCalendarDays } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = "d MMMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, fmt, { locale: id })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  if (isToday(d)) return "Hari ini"
  if (isYesterday(d)) return "Kemarin"
  return format(d, "d MMM", { locale: id })
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return "Selamat malam"
  if (h < 12) return "Selamat pagi"
  if (h < 15) return "Selamat siang"
  if (h < 19) return "Selamat sore"
  return "Selamat malam"
}

export function calcStreak(dates: string[]): number {
  if (!dates.length) return 0
  const sorted = [...dates].sort((a, b) => b.localeCompare(a))
  const today = todayISO()
  let streak = 0
  let expected = today

  for (const d of sorted) {
    if (d === expected) {
      streak++
      const dt = parseISO(expected)
      dt.setDate(dt.getDate() - 1)
      expected = format(dt, "yyyy-MM-dd")
    } else {
      break
    }
  }
  return streak
}

export function pct(done: number, total: number): number {
  if (!total) return 0
  return Math.round((done / total) * 100)
}

export const DAILY_PROMPTS = [
  "Apa satu hal yang membuatmu bersyukur hari ini?",
  "Hal apa yang paling menantang yang kamu hadapi hari ini?",
  "Apa satu langkah kecil yang kamu ambil menuju tujuanmu?",
  "Apa yang ingin kamu tingkatkan besok?",
  "Siapa yang membantumu hari ini, dan bagaimana kamu bisa membalas kebaikan itu?",
  "Apa pelajaran terbesar yang kamu dapat hari ini?",
  "Bagaimana kamu merawat dirimu sendiri hari ini?",
  "Apa keputusan terbaik yang kamu buat hari ini?",
]

export function getDailyPrompt(): string {
  const dayOfYear = differenceInCalendarDays(new Date(), new Date(new Date().getFullYear(), 0, 0))
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length]
}

export type Mood = "😄" | "🙂" | "😐" | "😔" | "😤"
export const MOODS: Mood[] = ["😄", "🙂", "😐", "😔", "😤"]
export const MOOD_LABELS: Record<Mood, string> = {
  "😄": "Senang",
  "🙂": "Oke",
  "😐": "Biasa",
  "😔": "Sedih",
  "😤": "Stres",
}
