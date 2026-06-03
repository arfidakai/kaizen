"use client"

import CalendarView from "../../../components/CalendarView"

export default function CalendarPage(){
  // demo habits — later wire to real data
  const demoHabits = [
    { id: 'h1', title: 'Meditate 10m' },
    { id: 'h2', title: 'Read 20 pages' },
    { id: 'h3', title: 'Workout' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-slate-400">Drag a habit onto any date to schedule it.</p>
      </header>
      <CalendarView habits={demoHabits} />
    </div>
  )
}
