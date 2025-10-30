export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

export class NotificationService {
  private listeners: Set<(notification: Notification) => void> = new Set()

  subscribe(callback: (notification: Notification) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify(notification: Omit<Notification, 'id'>): void {
    const fullNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      ...notification
    }
    console.log(`[NotificationService] Notify:`, fullNotification)
    this.listeners.forEach(listener => listener(fullNotification))
  }

  info(title: string, message?: string): void {
    this.notify({ type: 'info', title, message })
  }

  success(title: string, message?: string): void {
    this.notify({ type: 'success', title, message })
  }

  warning(title: string, message?: string): void {
    this.notify({ type: 'warning', title, message })
  }

  error(title: string, message?: string): void {
    this.notify({ type: 'error', title, message })
  }
}

export const notificationService = new NotificationService()
