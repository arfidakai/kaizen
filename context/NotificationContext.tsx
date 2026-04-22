"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

export type NotificationType = "success" | "error" | "warning" | "info"

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (message: string, type: NotificationType, duration?: number) => string
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback(
    (message: string, type: NotificationType = "info", duration = 3000) => {
      const id = Math.random().toString(36).substring(2, 9)
      setNotifications(prev => [...prev, { id, message, type, duration }])

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id)
        }, duration)
      }

      return id
    },
    []
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider")
  }
  return context
}
