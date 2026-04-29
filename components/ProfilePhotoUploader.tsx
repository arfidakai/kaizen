"use client"

import { useState, useRef } from "react"
import { Upload, Loader2, X } from "lucide-react"

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string
  onUploadSuccess?: (url: string) => void
  onError?: (error: string) => void
}

export default function ProfilePhotoUploader({
  currentPhotoUrl,
  onUploadSuccess,
  onError,
}: ProfilePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      const err = "File harus berupa gambar"
      onError?.(err)
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const err = "Ukuran file terlalu besar (maksimal 5MB)"
      onError?.(err)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-profile-photo", {
        method: "POST",
        body: formData,
        credentials: 'same-origin',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Upload gagal")
      }

      const data = await response.json()
      // Debug: log server response for troubleshooting
      console.log("Profile upload response:", data)
      setPreview(null)
      onUploadSuccess?.(data.url)
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Upload gagal"
      console.log("Profile upload error:", error)
      onError?.(errorMsg)
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const displayUrl = preview || currentPhotoUrl
  const hasPhoto = displayUrl && !uploading

  return (
    <div>
      <label className="section-title">FOTO PROFILE</label>

      {/* Photo Preview */}
      {displayUrl && (
        <div
          style={{
            width: "100%",
            aspectRatio: "1",
            borderRadius: "0.875rem",
            overflow: "hidden",
            marginBottom: "0.75rem",
            background: "var(--accent-soft)",
            border: "2px solid var(--accent-border)",
            position: "relative",
          }}
        >
          <img
            src={displayUrl}
            alt="Profile preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: uploading ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          />
          {uploading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              <Loader2 size={32} className="animate-spin" color="white" />
            </div>
          )}
        </div>
      )}

      {/* Upload Area - Show only if no photo */}
      {!hasPhoto && (
        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          disabled={uploading}
          style={{
            width: "100%",
            padding: "1.5rem 1rem",
            borderRadius: "0.875rem",
            border: "2px dashed var(--accent-border)",
            background: "var(--accent-dim)",
            cursor: uploading ? "not-allowed" : "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            opacity: uploading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.borderColor = "var(--accent)"
              e.currentTarget.style.background = "var(--accent-soft)"
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)"
            e.currentTarget.style.background = "var(--accent-dim)"
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin" color="var(--accent)" />
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                Mengupload...
              </span>
            </>
          ) : (
            <>
              <Upload size={24} color="var(--accent)" />
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                }}
              >
                Klik atau drag foto di sini
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                }}
              >
                PNG, JPG, GIF (maks 5MB)
              </span>
            </>
          )}
        </button>
      )}

      {/* Change/Remove Button - Show only if photo exists */}
      {hasPhoto && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "0.875rem",
              border: "1px solid var(--accent-border)",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: "0.85rem",
              transition: "all 0.2s",
              opacity: uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!uploading) e.currentTarget.style.background = "var(--accent)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent-soft)"
            }}
          >
            Ganti Foto
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: "none" }}
        disabled={uploading}
      />
    </div>
  )
}
