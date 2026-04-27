# Fitur Notifikasi Habit Reminder

## Ringkas
Menambahkan sistem notifikasi lengkap untuk reminder habit di aplikasi. Terdapat dua tipe notifikasi:
1. **Toast Notifications** - Muncul otomatis ketika habit dicomlete
2. **Modal Dialog** - Popup reminder yang bisa triggered manual per habit

## File yang Ditambahkan

### 1. `context/NotificationContext.tsx`
- Context provider untuk state notifikasi global
- Hook `useNotification()` untuk mengakses notifikasi di component manapun
- Dukungan 4 tipe notifikasi: success, error, warning, info
- Auto-dismiss setelah durasi yang ditentukan

### 2. `components/NotificationContainer.tsx`
- Container yang menampilkan toast notifications
- Auto-positioned di bottom-right
- Styling dengan warna berbeda per tipe notifikasi
- Animasi slide-in otomatis

### 3. `components/HabitReminderModal.tsx`
- Modal dialog untuk reminder habit
- Menampilkan nama habit dan icon
- 2 action buttons: "Later" dan "Complete Now"
- Smooth animations (fade & slide)

## File yang Di-update

### `app/layout.tsx`
- Wrap app dengan `NotificationProvider`
- Mount `NotificationContainer` untuk menampilkan toasts

### `app/(app)/habits/page.tsx`
- Import `HabitReminderModal` dan `useNotification` hook
- Tambah state: `reminderHabit`, `showReminder`
- Tambah fungsi reminder: `showHabitReminder()`, `completeFromReminder()`
- Toast notification ketika habit completed/canceled
- Bell icon button (🔔) di setiap habit yang belum selesai
- Modal reminder popup

## Cara Menggunakan

### Toggle Habit
Ketika user klik checkbox habit:
- Jika dicomple → toast "✓ [Habit Name] selesai!"
- Jika dibatalkan → toast "[Habit Name] dibatalkan"

### Reminder Modal
1. Klik tombol 🔔 di samping habit yang belum selesai
2. Modal akan muncul dengan detail habit
3. Pilih "Complete Now" untuk mark selesai
4. Atau "Later" untuk tutup modal

## Styling
- Mengikuti design theme existing (dark mode, accent colors)
- Toast colors: 
  - Success: green (#1a5f3f)
  - Error: red (#5f1a1a)
  - Warning: orange (#5f4a1a)
  - Info: blue (#1a3f5f)
- Modal dengan backdrop blur effect

## Next Steps (Optional)
- Scheduled notifications menggunakan Web Notification API
- Sound alerts
- Streak milestones celebration
- Custom reminder times per habit
