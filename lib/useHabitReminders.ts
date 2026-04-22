"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useNotification } from "@/context/NotificationContext"

interface HabitReminder {
  id: string
  name: string
  icon: string
  reminderTime: string
  completedToday: boolean
}

export function useHabitReminders() {
  const supabase = createClient()
  const { addNotification } = useNotification()

  const checkAndNotifyReminders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const today = new Date().toISOString().split("T")[0]

    // Get all habits with reminders enabled
    const { data: habits } = await supabase
      .from("habits")
      .select("id, name, icon, reminder_time, reminder_enabled")
      .eq("user_id", user.id)
      .eq("reminder_enabled", true)
      .not("reminder_time", "is", null)

    if (!habits || habits.length === 0) return

    // Get today's completed habits
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("user_id", user.id)
      .eq("date", today)
      .eq("completed", true)

    const completedIds = new Set(logs?.map(l => l.habit_id) || [])

    // Check each habit
    for (const habit of habits) {
      // Check if reminder time matches (within 1 minute window)
      const [remindHour, remindMin] = habit.reminder_time.split(":").map(Number)
      const remindTime = `${String(remindHour).padStart(2, "0")}:${String(remindMin).padStart(2, "0")}`

      if (currentTime === remindTime && !completedIds.has(habit.id)) {
        // Check if reminder was already sent today
        const { data: existingReminder } = await supabase
          .from("habit_reminders")
          .select("id")
          .eq("habit_id", habit.id)
          .eq("date", today)
          .eq("reminder_sent_at", null)
          .single()

        if (!existingReminder) {
          // Send notification
          addNotification(
            `⏰ Reminder: ${habit.name} ${habit.icon}. Yuk dikerjain sekarang!`,
            "warning",
            5000
          )

          // Log that reminder was sent
          await supabase.from("habit_reminders").upsert({
            habit_id: habit.id,
            user_id: user.id,
            date: today,
            reminder_sent_at: new Date().toISOString(),
          }, { onConflict: "habit_id,date" })
        }
      }
    }
  }, [supabase, addNotification])

  // Check reminders every minute
  useEffect(() => {
    checkAndNotifyReminders()
    const interval = setInterval(checkAndNotifyReminders, 60000) // Check setiap menit

    return () => clearInterval(interval)
  }, [checkAndNotifyReminders])

  return { checkAndNotifyReminders }
}
