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
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'

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

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...existing,
        creatorXp: next.xp,
        creatorLevel: next.level,
        creatorXpForNext: next.xpForNext,
      },
    })

    if (leveledUp) {
      await createNotification({
        userId,
        role: 'creator',
        type: NOTIFICATION_TYPES.LEVEL_UP,
        title: `Level ${next.level}`,
        message: `Rank updated to ${next.rankName}.`,
        link: '/creator',
      })
    }

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
