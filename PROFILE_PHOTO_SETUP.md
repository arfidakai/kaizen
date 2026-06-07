# Fitur Upload Foto Profile

Fitur ini memungkinkan user untuk upload foto profile mereka ke aplikasi 1% Daily.

## Setup

### 1. Jalankan Migration SQL

Di Supabase Dashboard, buka SQL Editor dan jalankan file `supabase/storage-setup.sql`:

```sql
-- Create storage bucket for profile photos
insert into storage.buckets (id, name, public)
values ('profile_photos', 'profile_photos', true)
on conflict (id) do nothing;

-- Set up RLS policies...
```

Ini akan membuat:
- Storage bucket `profile_photos` untuk menyimpan foto
- RLS policies untuk keamanan (hanya user sendiri yang bisa upload/delete, semua orang bisa lihat)

### 2. Restart Development Server

```bash
npm run dev
```

## Cara Kerja

### Frontend Flow

1. **Component: `ProfilePhotoUploader`** (`components/ProfilePhotoUploader.tsx`)
   - Tampilkan preview foto
   - Support drag & drop atau click to select
   - Validasi file (hanya image, max 5MB)
   - Realtime upload progress

2. **API Endpoint: `upload-profile-photo`** (`app/api/upload-profile-photo/route.ts`)
   - POST request dengan FormData
   - Validasi file di server
   - Upload ke Supabase Storage
   - Update user profile di database
   - Return public URL

3. **Profile Page Integration** (`app/(app)/profile/page.tsx`)
   - Display foto profile di header
   - Edit modal dengan photo uploader
   - Error handling & feedback

### Database

Photo URLs disimpan di column `avatar_url` di table `users`:
- Emoji avatar (contoh: 🧑) tetap support
- Photo URLs (HTTPS) juga support
- Logic detect apakah itu emoji atau URL

### Storage

Struktur folder di Supabase Storage:
```
profile_photos/
  └── {user_id}/
      ├── profile_1714233600000.jpg
      ├── profile_1714233700000.png
      └── ...
```

- Setiap user punya folder sendiri
- Filename auto-generated dengan timestamp
- Upsert=true → replace foto lama, jadi cuma 1 foto per user (atau bisa multiple jika mau)

## Validasi

- **File Type**: Hanya image/* (jpg, png, gif, webp, dll)
- **File Size**: Maksimal 5MB
- **User Auth**: Hanya user yang login bisa upload

## Error Handling

- `File harus berupa gambar` - jika file bukan image
- `Ukuran file terlalu besar (maksimal 5MB)` - jika file > 5MB
- `Upload gagal` - jika ada error saat upload
- Toast/modal alert untuk feedback user

## Testing

1. Login ke app
2. Buka halaman Profile (atau edit profile)
3. Lihat section "FOTO PROFILE"
4. Click atau drag foto ke area upload
5. Lihat preview, tunggu upload selesai
6. Profile picture update otomatis

## File yang Ditambah/Diubah

### Dibuat Baru:
- `supabase/storage-setup.sql` - SQL untuk setup storage bucket
- `lib/uploadProfilePhoto.ts` - Utility functions (optional, belum digunakan)
- `app/api/upload-profile-photo/route.ts` - API endpoint
- `components/ProfilePhotoUploader.tsx` - React component
- `PROFILE_PHOTO_SETUP.md` - Dokumentasi ini

### Dimodifikasi:
- `app/(app)/profile/page.tsx` - Integrated photo uploader

## Notes

- Foto disimpan public di Supabase Storage (user bisa lihat URL foto orang lain)
- Jika mau private, ubah bucket settings dan RLS policies
- Bisa extend untuk hapus foto lama saat upload baru
- Bisa add image optimization/compression di frontend sebelum upload
