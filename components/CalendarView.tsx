"use client"

import { useMemo, useState } from "react"

type Habit = {
  id: string
  title: string
  color?: string
}

export default function CalendarView({ habits = [] as Habit[] }: { habits?: Habit[] }) {
  const [current, setCurrent] = useState(() => new Date())
  const [scheduled, setScheduled] = useState<Record<string, Habit[]>>({})
  
  // State baru untuk mode "Tap-to-Assign" di Mobile
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)

  const month = useMemo(() => {
    const first = new Date(current.getFullYear(), current.getMonth(), 1)
    const days: Date[] = []
    const startDay = first.getDay()
    
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(first)
      d.setDate(first.getDate() - (i + 1))
      days.push(d)
    }
    
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(current.getFullYear(), current.getMonth(), d))
    }
    
    while (days.length % 7 !== 0) {
      const last = new Date(days[days.length - 1])
      last.setDate(last.getDate() + 1)
      days.push(last)
    }
    return days
  }, [current])

  function formatDateKey(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  // Fungsi untuk toggle (tambah/hapus) habit pada hari tertentu (Mendukung Tap & Drop)
  function toggleHabitOnDay(habit: Habit, day: Date) {
    const key = formatDateKey(day)
    setScheduled(prev => {
      const dayHabits = prev[key] || []
      const exists = dayHabits.some(h => h.id === habit.id)
      
      if (exists) {
        // Hapus jika sudah ada (mencegah duplikat dan memungkinkan undo)
        return { ...prev, [key]: dayHabits.filter(h => h.id !== habit.id) }
      } else {
        // Tambahkan jika belum ada
        return { ...prev, [key]: [...dayHabits, habit] }
      }
    })
  }

  // --- Desktop Drag & Drop Handlers ---
  function onDragStart(e: React.DragEvent, habit: Habit) {
    e.dataTransfer.setData('application/json', JSON.stringify(habit))
    setSelectedHabit(habit) // Visual feedback saat di-drag
  }

  function onDrop(e: React.DragEvent, day: Date) {
    e.preventDefault()
    try {
      const json = e.dataTransfer.getData('application/json')
      const habit: Habit = JSON.parse(json)
      toggleHabitOnDay(habit, day)
      setSelectedHabit(null)
    } catch (err) {
      // ignore
    }
  }

  return (
    // Berubah menjadi flex-col di mobile, flex-row di layar besar (lg)
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-7xl mx-auto p-2 sm:p-4">
      
      {/* --- Section Habits --- */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <h3 className="text-lg font-semibold mb-2 lg:mb-4">Habits</h3>
        
        {/* Helper text untuk mobile */}
        <p className="text-xs text-slate-400 mb-3 block lg:hidden">
          Ketuk habit, lalu ketuk tanggal di kalender.
        </p>

        {habits.length === 0 && (
          <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-lg">
            No habits — add some first.
          </div>
        )}

        {/* Horizontal scroll di mobile, Vertical stack di Desktop */}
        <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0 snap-x">
          {habits.map(h => {
            const isSelected = selectedHabit?.id === h.id
            return (
              <div
                key={h.id}
                draggable
                onDragStart={(e) => onDragStart(e, h)}
                onClick={() => setSelectedHabit(isSelected ? null : h)}
                className={`
                  flex-shrink-0 min-w-[140px] lg:min-w-0 h-12 lg:h-14 flex items-center px-4 rounded-lg shadow-sm cursor-pointer transition-all snap-center select-none
                  ${isSelected 
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 border-transparent' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                  }
                `}
                aria-label={`Habit ${h.title}`}
              >
                <div className="font-medium truncate text-sm lg:text-base">{h.title}</div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* --- Section Calendar --- */}
      <main className="flex-1 w-full bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="font-bold text-base sm:text-xl capitalize">
            {current.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
          </div>
          <div className="flex gap-2">
            <button 
              className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm hover:bg-slate-700 active:scale-95 transition-transform" 
              onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            >
              Prev
            </button>
            <button 
              className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm hover:bg-slate-700 active:scale-95 transition-transform" 
              onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
            <div key={d} className="text-center py-2 text-xs sm:text-sm font-semibold text-slate-400">
              {d}
            </div>
          ))}

          {month.map(day => {
            const key = formatDateKey(day)
            const items = scheduled[key] || []
            const isCurrentMonth = day.getMonth() === current.getMonth()
            
            return (
              <div 
                key={key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, day)}
                onClick={() => {
                  if (selectedHabit) toggleHabitOnDay(selectedHabit, day)
                }}
                className={`
                  min-h-[70px] sm:min-h-[96px] p-1 sm:p-2 rounded-lg border transition-colors flex flex-col
                  ${isCurrentMonth ? 'bg-slate-900 border-slate-800' : 'bg-transparent opacity-40 border-transparent'}
                  ${selectedHabit ? 'hover:border-indigo-500 cursor-pointer hover:bg-slate-800/80' : ''}
                `}
              >
                <div className={`text-xs sm:text-sm text-right font-medium ${isCurrentMonth ? 'text-slate-300' : 'text-slate-500'}`}>
                  {day.getDate()}
                </div>
                
                <div className="mt-1 flex-1 flex flex-col gap-1 overflow-hidden">
                  {items.map(it => (
                    <div 
                      key={it.id} 
                      className="text-[10px] sm:text-xs px-1.5 py-0.5 sm:py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded truncate"
                      title={it.title}
                    >
                      {it.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}