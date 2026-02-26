'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import {
  createInitialXpState,
  addXpToState,
  getXpForNextLevel,
  getRankName,
  type CreatorXpState,
} from '@/lib/creator-xp'

function parseXpState(meta: Record<string, unknown> | null): CreatorXpState {
  const xp = Number(meta?.creatorXp) || 0
  const level = Math.max(1, Number(meta?.creatorLevel) || 1)
  const xpForNext = Number(meta?.creatorXpForNext) || getXpForNextLevel(level)
  return {
    xp,
    level,
    xpForNext,
    rankName: getRankName(level),
  }
}

export async function getCreatorXp(): Promise<CreatorXpState> {
  const { userId } = await auth()
  if (!userId) return createInitialXpState()

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = (user.publicMetadata || {}) as Record<string, unknown>
  return parseXpState(meta)
}

// Notifications (type used in addCreatorXp for level-up notifications)
export type CreatorNotification = {
  id: string
  type: 'deal' | 'mission' | 'academy' | 'level' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export async function addCreatorXp(amount: number): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }
  if (amount < 1) return { error: 'Amount must be positive' }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existing = (user.publicMetadata || {}) as Record<string, unknown>
    const current = parseXpState(existing)
    const next = addXpToState(current, amount)
    const leveledUp = next.level > current.level

    const metaUpdates: Record<string, unknown> = {
      ...existing,
      creatorXp: next.xp,
      creatorLevel: next.level,
      creatorXpForNext: next.xpForNext,
    }

    if (leveledUp) {
      const notifications = (existing.creatorNotifications as CreatorNotification[]) ?? []
      const newNotif: CreatorNotification = {
        id: crypto.randomUUID(),
        type: 'level',
        title: `Level ${next.level} reached!`,
        message: `You've ranked up to ${next.rankName}. Keep up the great work!`,
        read: false,
        createdAt: new Date().toISOString(),
        link: '/creator',
      }
      metaUpdates.creatorNotifications = [newNotif, ...notifications]
    }

    await client.users.updateUser(userId, {
      publicMetadata: metaUpdates,
    })

    revalidatePath('/creator')
    return {}
  } catch {
    return { error: 'Failed to add XP' }
  }
}

export type CalendarTask = { id: string; text: string; done: boolean }

export type CalendarTasksMap = Record<string, CalendarTask[]>

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getCreatorCalendarTasks(): Promise<CalendarTasksMap> {
  const { userId } = await auth()
  if (!userId) return {}

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const map = user.publicMetadata?.creatorCalendarTasks as CalendarTasksMap | undefined
  return map && typeof map === 'object' ? map : {}
}

async function updateCalendarTasks(
  updater: (map: CalendarTasksMap) => CalendarTasksMap
): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existing = (user.publicMetadata || {}) as Record<string, unknown>
    const map = (existing.creatorCalendarTasks as CalendarTasksMap) ?? {}
    const updated = updater(map)

    await client.users.updateUser(userId, {
      publicMetadata: { ...existing, creatorCalendarTasks: updated },
    })

    revalidatePath('/creator')
    return {}
  } catch {
    return { error: 'Failed to update tasks' }
  }
}

export async function addCreatorDayTask(
  dateKey: string,
  text: string
): Promise<{ error?: string }> {
  if (!text.trim()) return { error: 'Task text is required' }
  return updateCalendarTasks((map) => {
    const tasks = map[dateKey] ?? []
    const newTask: CalendarTask = {
      id: crypto.randomUUID(),
      text: text.trim(),
      done: false,
    }
    return { ...map, [dateKey]: [...tasks, newTask] }
  })
}

export async function updateCreatorDayTask(
  dateKey: string,
  taskId: string,
  updates: { text?: string; done?: boolean }
): Promise<{ error?: string }> {
  return updateCalendarTasks((map) => {
    const tasks = map[dateKey] ?? []
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    )
    return { ...map, [dateKey]: updated }
  })
}

export async function deleteCreatorDayTask(
  dateKey: string,
  taskId: string
): Promise<{ error?: string }> {
  return updateCalendarTasks((map) => {
    const tasks = (map[dateKey] ?? []).filter((t) => t.id !== taskId)
    if (tasks.length === 0) {
      const { [dateKey]: _, ...rest } = map
      return rest
    }
    return { ...map, [dateKey]: tasks }
  })
}

export async function toggleCreatorDayTask(
  dateKey: string,
  taskId: string
): Promise<{ error?: string }> {
  return updateCalendarTasks((map) => {
    const tasks = map[dateKey] ?? []
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    )
    return { ...map, [dateKey]: updated }
  })
}

export async function getCreatorNotifications(): Promise<CreatorNotification[]> {
  const { userId } = await auth()
  if (!userId) return []

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const items = user.publicMetadata?.creatorNotifications as CreatorNotification[] | undefined
  return Array.isArray(items) ? items : []
}

async function updateNotifications(
  updater: (items: CreatorNotification[]) => CreatorNotification[]
): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existing = (user.publicMetadata || {}) as Record<string, unknown>
    const items = (existing.creatorNotifications as CreatorNotification[]) ?? []
    const updated = updater(items)

    await client.users.updateUser(userId, {
      publicMetadata: { ...existing, creatorNotifications: updated },
    })

    revalidatePath('/creator')
    return {}
  } catch {
    return { error: 'Failed to update notifications' }
  }
}

export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  return updateNotifications((items) =>
    items.map((n) => (n.id === id ? { ...n, read: true } : n))
  )
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  return updateNotifications((items) =>
    items.map((n) => ({ ...n, read: true }))
  )
}

export async function deleteCreatorNotification(id: string): Promise<{ error?: string }> {
  return updateNotifications((items) =>
    items.filter((n) => n.id !== id)
  )
}

export async function addCreatorNotification(
  notification: Omit<CreatorNotification, 'id' | 'createdAt' | 'read'>
): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existing = (user.publicMetadata || {}) as Record<string, unknown>
    const items = (existing.creatorNotifications as CreatorNotification[]) ?? []
    const newNotif: CreatorNotification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    }

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...existing,
        creatorNotifications: [newNotif, ...items],
      },
    })

    revalidatePath('/creator')
    return {}
  } catch {
    return { error: 'Failed to add notification' }
  }
}

export type ContentPlannerNotes = Record<string, string>

export async function getContentPlannerNotes(): Promise<ContentPlannerNotes> {
  const { userId } = await auth()
  if (!userId) return {}

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const notes = user.publicMetadata?.creatorContentPlannerNotes as ContentPlannerNotes | undefined
  return notes && typeof notes === 'object' ? notes : {}
}

export async function updateContentPlannerNotes(notes: ContentPlannerNotes): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existing = (user.publicMetadata || {}) as Record<string, unknown>

    await client.users.updateUser(userId, {
      publicMetadata: { ...existing, creatorContentPlannerNotes: notes },
    })

    revalidatePath('/creator')
    return {}
  } catch {
    return { error: 'Failed to save notes' }
  }
}
