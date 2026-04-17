'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useClickOutside } from '@/hooks/useClickOutside'
import { formatRelativeTime } from '@/lib/utils'
import { NOTIFICATION_LABELS } from '@/lib/notification-types'
import type { NotificationType } from '@/lib/notification-types'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function NotificationBell() {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUnread(data.unread ?? 0)
      }
    } catch {
      // non-fatal
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setLoaded(true)
      }
    } catch {
      // non-fatal
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 60_000)
    window.addEventListener('focus', fetchCount)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', fetchCount)
    }
  }, [fetchCount])

  useEffect(() => {
    if (open && !loaded) {
      fetchNotifications()
    }
    if (open && loaded) {
      fetchNotifications()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useClickOutside(panelRef, () => setOpen(false), open)

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnread((c) => Math.max(0, c - 1))
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    const deleted = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (deleted && !deleted.read) setUnread((c) => Math.max(0, c - 1))
  }

  const handleClearRead = async () => {
    await fetch('/api/notifications', { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => !n.read))
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) await handleMarkRead(n.id)
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  const todayItems = notifications.filter((n) => isToday(n.createdAt))
  const earlierItems = notifications.filter((n) => !isToday(n.createdAt))
  const hasRead = notifications.some((n) => n.read)

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg dash-text-muted hover:text-[#c8dff0] hover:bg-white/5 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-[#00c8ff] text-[10px] font-bold text-black flex items-center justify-center px-1 pointer-events-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-h-[480px] rounded-xl shadow-xl z-50 flex flex-col"
          style={{
            background: 'rgba(10,18,35,0.97)',
            border: '1px solid rgba(0,200,255,0.15)',
            overflow: 'hidden',
          }}
        >
          <div className="flex items-center justify-between p-3 border-b dash-border flex-shrink-0">
            <span className="text-sm font-semibold dash-text-bright">Notifications</span>
            <div className="flex items-center gap-3">
              {hasRead && (
                <button
                  type="button"
                  onClick={handleClearRead}
                  className="text-xs dash-text-muted hover:text-red-400 transition-colors"
                >
                  Clear read
                </button>
              )}
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs dash-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <svg className="w-10 h-10 dash-text-muted mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm dash-text-muted">You&apos;re all caught up</p>
                <p className="text-xs dash-text-muted opacity-60 mt-1">No notifications yet</p>
              </div>
            ) : (
              <>
                {todayItems.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold dash-text-muted uppercase tracking-wider">Today</p>
                    <NotificationList
                      items={todayItems}
                      onDelete={handleDelete}
                      onNotificationClick={handleNotificationClick}
                    />
                  </div>
                )}
                {earlierItems.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold dash-text-muted uppercase tracking-wider">Earlier</p>
                    <NotificationList
                      items={earlierItems}
                      onDelete={handleDelete}
                      onNotificationClick={handleNotificationClick}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationList({
  items,
  onDelete,
  onNotificationClick,
}: {
  items: Notification[]
  onDelete: (e: React.MouseEvent, id: string) => void
  onNotificationClick: (n: Notification) => void
}) {
  return (
    <ul className="divide-y dash-border divide-opacity-50">
      {items.map((n) => {
        const label = NOTIFICATION_LABELS[n.type as NotificationType] ?? 'Notification'
        return (
          <li key={n.id}>
            <div
              className={`flex items-start gap-2 p-3 hover:bg-white/5 transition-colors ${!n.read ? 'bg-[#00c8ff]/5' : ''}`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onNotificationClick(n)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs dash-accent font-medium">{label}</p>
                    <p className="text-sm dash-text-bright font-medium mt-0.5">{n.title}</p>
                    <p className="text-xs dash-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  <span className="text-[10px] dash-text-muted shrink-0 mt-0.5">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => onDelete(e, n.id)}
                className="p-1.5 rounded dash-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                aria-label="Delete notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
