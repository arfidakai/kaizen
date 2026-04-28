import { createClient } from '@/lib/supabase'

export async function uploadProfilePhoto(file: File, userId: string): Promise<string | null> {
  const supabase = createClient()
  
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar')
  }
  
  const maxSizeInBytes = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSizeInBytes) {
    throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
  }

  // Create unique filename with timestamp
  const timestamp = Date.now()
  const ext = file.name.split('.').pop()
  const filename = `${userId}/profile_${timestamp}.${ext}`

  try {
    // Upload file to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('profile_photos')
      .upload(filename, file, { upsert: true })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile_photos')
      .getPublicUrl(filename)

    return publicUrl
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

export async function deleteProfilePhoto(photoPath: string): Promise<void> {
  const supabase = createClient()
  
  try {
    // Extract filename from URL if needed
    let filename = photoPath
    if (photoPath.includes('/storage/v1/object/public/profile_photos/')) {
      filename = photoPath.split('/storage/v1/object/public/profile_photos/')[1]
    }

    await supabase.storage
      .from('profile_photos')
      .remove([filename])
  } catch (error) {
    console.error('Delete error:', error)
    // Don't throw - silently fail for cleanup
  }
}
