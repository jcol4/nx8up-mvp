'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteCreatorNotification,
  type CreatorNotification,
} from './_actions'
import { useClickOutside } from '@/hooks/useClickOutside'
import { formatRelativeTime } from '@/lib/utils'

const TYPE_LABELS: Record<CreatorNotification['type'], string> = {
  deal: 'Deal',
  mission: 'Mission',
  academy: 'Academy',
  level: 'Level up',
  system: 'System',
}

type Props = {
  notifications: CreatorNotification[]
}

export default function CreatorNotifications({ notifications }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useClickOutside(panelRef, () => setOpen(false), open)

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    router.refresh()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    router.refresh()
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    await deleteCreatorNotification(id)
    router.refresh()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg cr-text-muted hover:text-[#c8dff0] hover:bg-white/5 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-[#00c8ff] text-[10px] font-bold text-black flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-30 w-80 max-h-[400px] overflow-hidden rounded-xl cr-panel shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b cr-border">
            <span className="text-sm font-semibold cr-text-bright">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs cr-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm cr-text-muted text-center">No notifications yet</p>
            ) : (
              <ul className="divide-y cr-border divide-opacity-50">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <div
                      className={`flex items-start gap-2 p-3 hover:bg-white/5 transition-colors ${!n.read ? 'bg-[#00c8ff]/5' : ''}`}
                    >
                      <Link
                        href={n.link ?? '#'}
                        onClick={() => {
                          if (!n.read) handleMarkRead(n.id)
                          setOpen(false)
                        }}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs cr-accent font-medium">
                              {TYPE_LABELS[n.type]}
                            </p>
                            <p className="text-sm cr-text-bright font-medium mt-0.5">
                              {n.title}
                            </p>
                            <p className="text-xs cr-text-muted mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                          <span className="text-[10px] cr-text-muted shrink-0">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, n.id)}
                        className="p-1.5 rounded cr-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        aria-label="Delete notification"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
