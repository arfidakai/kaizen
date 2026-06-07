# Setup Scheduled Reminders - Quick Start

## Step 1: Run Database Migration
Copy SQL dari `supabase/add_reminders.sql` dan jalankan di Supabase SQL Editor:

```sql
-- Add reminder_time column to habits table
alter table public.habits add column if not exists reminder_time text default null;

-- Add reminder_enabled column to habits table  
alter table public.habits add column if not exists reminder_enabled boolean default false;

-- Create habit_reminders table to track notification status
create table if not exists public.habit_reminders (
  id         uuid primary key default uuid_generate_v4(),
  habit_id   uuid not null references public.habits(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  date       date not null default current_date,
  reminder_sent_at timestamptz,
  created_at timestamptz default now(),
  unique(habit_id, date)
);

alter table public.habit_reminders enable row level security;

create policy "Users can manage own habit reminders"
  on public.habit_reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_habit_reminders_user_date on public.habit_reminders(user_id, date);
create index if not exists idx_habit_reminders_sent on public.habit_reminders(reminder_sent_at);
```

## Step 2: Code sudah terintegrasi!
Semua component dan logic sudah ditambahkan. Tidak ada yang perlu di-setup lagi di frontend.

## Step 3: Test Fitur
1. Go ke `/habits` page
2. Klik clock icon (⏰) di samping habit card
3. Set reminder time (misal: 09:00)
4. Klik "Simpan Reminder"
5. Lihat clock icon berubah warna biru
6. Tunggu sampai jam tersebut untuk melihat notification

## Fitur yang tersedia:

### 1. Set Reminder
- Klik clock icon di habit card
- Pilih waktu dengan time picker
- Simpan reminder

### 2. View Reminder
- Reminder time ditampilkan di bawah streak info (format: HH:MM)
- Clock icon berwarna biru jika reminder aktif

### 3. Delete Reminder
- Buka modal reminder settings
- Klik "Hapus Reminder"

### 4. Automatic Notifications
- Setiap menit system check apakah ada reminder yang harus dikirim
- Jika habit belum completed dan waktu sudah tiba → toast notification muncul
- Notification hanya dikirim 1x per hari per habit

## Notifikasi Teks
```
⏰ Reminder: [Habit Name] [Icon]. Yuk dikerjain sekarang!
```

Example:
```
⏰ Reminder: Olahraga 30 menit 🏃. Yuk dikerjain sekarang!
```

## Architecture

```
useHabitReminders Hook (di HabitsPage)
    ↓
Check setiap 60 detik
    ↓
Query habits dengan reminder_enabled = true
    ↓
Check current time vs reminder_time
    ↓
Jika match & habit belum completed & belum notified
    ↓
Send notification + log ke habit_reminders table
```

## Files Modified/Created
- ✅ `supabase/add_reminders.sql` - Database migration
- ✅ `components/ReminderSettingsModal.tsx` - Modal untuk set reminder
- ✅ `lib/useHabitReminders.ts` - Hook untuk handle reminders
- ✅ `components/HabitCard.tsx` - Updated dengan reminder display
- ✅ `app/(app)/habits/page.tsx` - Integrated reminder functionality

## Troubleshooting

### Notifikasi tidak muncul
1. Check database schema ada kolom `reminder_time` & `reminder_enabled`
2. Pastikan habit sudah di-set reminder time
3. Pastikan reminder_enabled = true di database
4. Check browser console untuk error

### Time picker tidak work
- Time input menggunakan native HTML time input
- Format: HH:MM (24-hour format)
- Browser support ada di semua modern browsers

### Reminder dikirim berkali-kali
- Check unique constraint pada habit_reminders table
- `unique(habit_id, date)` harus ada
