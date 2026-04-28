// /**
//  * Creator dashboard server actions.
//  *
//  * Covers two feature areas:
//  *
//  * 1. **XP / Levelling** — reads and writes the creator's experience-point
//  *    state (xp, level, xpForNext, rankName) stored in Clerk `publicMetadata`.
//  *    A `LEVEL_UP` in-app notification is fired whenever the creator crosses a
//  *    level boundary.
//  *
//  * 2. **Calendar task management** — CRUD operations for per-day tasks stored
//  *    as a `creatorCalendarTasks` map in Clerk `publicMetadata`. Keys are
//  *    ISO date strings (YYYY-MM-DD); values are arrays of `CalendarTask`.
//  *    Tasks are identified by a UUID generated with `crypto.randomUUID()`.
//  *
//  * 3. **Content planner notes** — per-tab freeform text stored as
//  *    `creatorContentPlannerNotes` in Clerk `publicMetadata`.
//  *
//  * All writes revalidate `/creator` to keep the dashboard in sync.
//  *
//  * External services: Clerk (auth + publicMetadata reads/writes).
//  *
//  * Gotcha: All state lives in Clerk `publicMetadata`, not the database.
//  * This means there is no backup or audit trail for XP or task changes,
//  * and the Clerk API is called on every read/write (no local caching).
//  */
// 'use server'

// import { auth, clerkClient } from '@clerk/nextjs/server'
// import { revalidatePath } from 'next/cache'
// import {
//   createInitialXpState,
//   addXpToState,
//   getXpForNextLevel,
//   getRankName,
//   type CreatorXpState,
// } from '@/lib/creator-xp'
// import { createNotification } from '@/lib/notifications'
// import { NOTIFICATION_TYPES } from '@/lib/notification-types'

// /**
//  * Parses raw Clerk `publicMetadata` into a typed `CreatorXpState`.
//  * Defaults to level 1 / 0 XP when fields are absent or non-numeric.
//  */
// function parseXpState(meta: Record<string, unknown> | null): CreatorXpState {
//   const xp = Number(meta?.creatorXp) || 0
//   const level = Math.max(1, Number(meta?.creatorLevel) || 1)
//   const xpForNext = Number(meta?.creatorXpForNext) || getXpForNextLevel(level)
//   return {
//     xp,
//     level,
//     xpForNext,
//     rankName: getRankName(level),
//   }
// }

// /**
//  * Returns the current XP state for the authenticated creator by reading
//  * Clerk `publicMetadata`. Returns an initial state for unauthenticated users.
//  */
// export async function getCreatorXp(): Promise<CreatorXpState> {
//   const { userId } = await auth()
//   if (!userId) return createInitialXpState()

//   const client = await clerkClient()
//   const user = await client.users.getUser(userId)
//   const meta = (user.publicMetadata || {}) as Record<string, unknown>
//   return parseXpState(meta)
// }

// /**
//  * Awards `amount` XP to the creator and persists the updated state in Clerk
//  * `publicMetadata`. Fires a `LEVEL_UP` notification when the creator crosses
//  * a new level boundary.
//  *
//  * @param amount - Positive integer number of XP to award (must be >= 1).
//  */
// export async function addCreatorXp(amount: number): Promise<{ error?: string }> {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }
//   if (amount < 1) return { error: 'Amount must be positive' }

//   try {
//     const client = await clerkClient()
//     const user = await client.users.getUser(userId)
//     const existing = (user.publicMetadata || {}) as Record<string, unknown>
//     const current = parseXpState(existing)
//     const next = addXpToState(current, amount)
//     const leveledUp = next.level > current.level

//     await client.users.updateUser(userId, {
//       publicMetadata: {
//         ...existing,
//         creatorXp: next.xp,
//         creatorLevel: next.level,
//         creatorXpForNext: next.xpForNext,
//       },
//     })

//     if (leveledUp) {
//       await createNotification({
//         userId,
//         role: 'creator',
//         type: NOTIFICATION_TYPES.LEVEL_UP,
//         title: `Level ${next.level}`,
//         message: `Rank updated to ${next.rankName}.`,
//         link: '/creator',
//       })
//     }

//     revalidatePath('/creator')
//     return {}
//   } catch {
//     return { error: 'Failed to add XP' }
//   }
// }

// /** A single task on the creator's daily content calendar. */
// export type CalendarTask = {
//   /** UUID generated via `crypto.randomUUID()` at creation time. */
//   id: string
//   text: string
//   done: boolean
// }

// /**
//  * Map of ISO date strings (YYYY-MM-DD) to the list of tasks for that day.
//  * Stored under `creatorCalendarTasks` in Clerk `publicMetadata`.
//  */
// export type CalendarTasksMap = Record<string, CalendarTask[]>

// /** Converts a `Date` to a YYYY-MM-DD string used as the calendar map key. */
// function toDateKey(d: Date): string {
//   return d.toISOString().slice(0, 10)
// }

// /**
//  * Fetches the full calendar tasks map for the authenticated creator from
//  * Clerk `publicMetadata`. Returns an empty object for unauthenticated users.
//  */
// export async function getCreatorCalendarTasks(): Promise<CalendarTasksMap> {
//   const { userId } = await auth()
//   if (!userId) return {}

//   const client = await clerkClient()
//   const user = await client.users.getUser(userId)
//   const map = user.publicMetadata?.creatorCalendarTasks as CalendarTasksMap | undefined
//   return map && typeof map === 'object' ? map : {}
// }

// /**
//  * Internal helper that reads the current calendar tasks map from Clerk,
//  * applies `updater` to produce the next state, and writes it back.
//  * All public calendar action functions delegate to this helper.
//  */
// async function updateCalendarTasks(
//   updater: (map: CalendarTasksMap) => CalendarTasksMap
// ): Promise<{ error?: string }> {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   try {
//     const client = await clerkClient()
//     const user = await client.users.getUser(userId)
//     const existing = (user.publicMetadata || {}) as Record<string, unknown>
//     const map = (existing.creatorCalendarTasks as CalendarTasksMap) ?? {}
//     const updated = updater(map)

//     await client.users.updateUser(userId, {
//       publicMetadata: { ...existing, creatorCalendarTasks: updated },
//     })

//     revalidatePath('/creator')
//     return {}
//   } catch {
//     return { error: 'Failed to update tasks' }
//   }
// }

// /**
//  * Adds a new task to the specified day's task list.
//  *
//  * @param dateKey - ISO date string (YYYY-MM-DD) identifying the day.
//  * @param text    - Task description; must be non-empty.
//  */
// export async function addCreatorDayTask(
//   dateKey: string,
//   text: string
// ): Promise<{ error?: string }> {
//   if (!text.trim()) return { error: 'Task text is required' }
//   return updateCalendarTasks((map) => {
//     const tasks = map[dateKey] ?? []
//     const newTask: CalendarTask = {
//       id: crypto.randomUUID(),
//       text: text.trim(),
//       done: false,
//     }
//     return { ...map, [dateKey]: [...tasks, newTask] }
//   })
// }

// /**
//  * Partially updates a task's `text` and/or `done` fields.
//  * Silently no-ops if `taskId` is not found for the given `dateKey`.
//  */
// export async function updateCreatorDayTask(
//   dateKey: string,
//   taskId: string,
//   updates: { text?: string; done?: boolean }
// ): Promise<{ error?: string }> {
//   return updateCalendarTasks((map) => {
//     const tasks = map[dateKey] ?? []
//     const updated = tasks.map((t) =>
//       t.id === taskId ? { ...t, ...updates } : t
//     )
//     return { ...map, [dateKey]: updated }
//   })
// }

// /**
//  * Removes a task from the specified day. If the day's task list becomes empty
//  * after deletion, the date key is removed from the map entirely.
//  */
// export async function deleteCreatorDayTask(
//   dateKey: string,
//   taskId: string
// ): Promise<{ error?: string }> {
//   return updateCalendarTasks((map) => {
//     const tasks = (map[dateKey] ?? []).filter((t) => t.id !== taskId)
//     if (tasks.length === 0) {
//       const { [dateKey]: _, ...rest } = map
//       return rest
//     }
//     return { ...map, [dateKey]: tasks }
//   })
// }

// /** Flips the `done` flag on the specified task. */
// export async function toggleCreatorDayTask(
//   dateKey: string,
//   taskId: string
// ): Promise<{ error?: string }> {
//   return updateCalendarTasks((map) => {
//     const tasks = map[dateKey] ?? []
//     const updated = tasks.map((t) =>
//       t.id === taskId ? { ...t, done: !t.done } : t
//     )
//     return { ...map, [dateKey]: updated }
//   })
// }


// /**
//  * Map of tab-scoped note keys to freeform note text.
//  * Keys follow the pattern `planner-<tabName>` (e.g. `planner-Active`).
//  * Stored under `creatorContentPlannerNotes` in Clerk `publicMetadata`.
//  */
// export type ContentPlannerNotes = Record<string, string>

// /**
//  * Fetches the content planner notes for the authenticated creator from Clerk
//  * `publicMetadata`. Returns an empty object for unauthenticated users.
//  */
// export async function getContentPlannerNotes(): Promise<ContentPlannerNotes> {
//   const { userId } = await auth()
//   if (!userId) return {}

//   const client = await clerkClient()
//   const user = await client.users.getUser(userId)
//   const notes = user.publicMetadata?.creatorContentPlannerNotes as ContentPlannerNotes | undefined
//   return notes && typeof notes === 'object' ? notes : {}
// }

// /**
//  * Overwrites the full content planner notes map in Clerk `publicMetadata`.
//  * Called automatically 500ms after the user stops typing (debounced in the UI).
//  */
// export async function updateContentPlannerNotes(notes: ContentPlannerNotes): Promise<{ error?: string }> {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   try {
//     const client = await clerkClient()
//     const user = await client.users.getUser(userId)
//     const existing = (user.publicMetadata || {}) as Record<string, unknown>

//     await client.users.updateUser(userId, {
//       publicMetadata: { ...existing, creatorContentPlannerNotes: notes },
//     })

//     revalidatePath('/creator')
//     return {}
//   } catch {
//     return { error: 'Failed to save notes' }
//   }
// }













/**
 * Creator dashboard server actions.
 *
 * Covers two feature areas:
 *
 * 1. **XP / Levelling** — reads and writes the creator's experience-point
 *    state (xp, level, xpForNext, rankName) stored in Clerk `publicMetadata`.
 *    A `LEVEL_UP` in-app notification is fired whenever the creator crosses a
 *    level boundary.
 *
 * 2. **Calendar task management** — CRUD operations for per-day tasks stored
 *    as a `creatorCalendarTasks` map in Clerk `publicMetadata`. Keys are
 *    ISO date strings (YYYY-MM-DD); values are arrays of `CalendarTask`.
 *    Tasks are identified by a UUID generated with `crypto.randomUUID()`.
 *
 * 3. **Content planner notes** — per-tab freeform text stored as
 *    `creatorContentPlannerNotes` in Clerk `publicMetadata`.
 *
 * 4. **Campaign date map** — read-only computed map of accepted campaign
 *    start/end dates, used by the dashboard calendar to show visual
 *    indicators on the days a creator has campaigns running.
 *
 * All writes revalidate `/creator` to keep the dashboard in sync.
 *
 * External services: Clerk (auth + publicMetadata reads/writes),
 * Prisma/PostgreSQL (campaign date lookup).
 *
 * Gotcha: All non-campaign state lives in Clerk `publicMetadata`, not the
 * database. This means there is no backup or audit trail for XP or task
 * changes, and the Clerk API is called on every read/write (no local caching).
 */
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

/**
 * Parses raw Clerk `publicMetadata` into a typed `CreatorXpState`.
 * Defaults to level 1 / 0 XP when fields are absent or non-numeric.
 */
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

/**
 * Returns the current XP state for the authenticated creator by reading
 * Clerk `publicMetadata`. Returns an initial state for unauthenticated users.
 */
export async function getCreatorXp(): Promise<CreatorXpState> {
  const { userId } = await auth()
  if (!userId) return createInitialXpState()

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = (user.publicMetadata || {}) as Record<string, unknown>
  return parseXpState(meta)
}

/**
 * Awards `amount` XP to the creator and persists the updated state in Clerk
 * `publicMetadata`. Fires a `LEVEL_UP` notification when the creator crosses
 * a new level boundary.
 *
 * @param amount - Positive integer number of XP to award (must be >= 1).
 */
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

/** A single task on the creator's daily content calendar. */
export type CalendarTask = {
  /** UUID generated via `crypto.randomUUID()` at creation time. */
  id: string
  text: string
  done: boolean
}

/**
 * Map of ISO date strings (YYYY-MM-DD) to the list of tasks for that day.
 * Stored under `creatorCalendarTasks` in Clerk `publicMetadata`.
 */
export type CalendarTasksMap = Record<string, CalendarTask[]>

/** Converts a `Date` to a YYYY-MM-DD string used as the calendar map key. */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Fetches the full calendar tasks map for the authenticated creator from
 * Clerk `publicMetadata`. Returns an empty object for unauthenticated users.
 */
export async function getCreatorCalendarTasks(): Promise<CalendarTasksMap> {
  const { userId } = await auth()
  if (!userId) return {}

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const map = user.publicMetadata?.creatorCalendarTasks as CalendarTasksMap | undefined
  return map && typeof map === 'object' ? map : {}
}

/**
 * Internal helper that reads the current calendar tasks map from Clerk,
 * applies `updater` to produce the next state, and writes it back.
 * All public calendar action functions delegate to this helper.
 */
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

/**
 * Adds a new task to the specified day's task list.
 *
 * @param dateKey - ISO date string (YYYY-MM-DD) identifying the day.
 * @param text    - Task description; must be non-empty.
 */
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

/**
 * Partially updates a task's `text` and/or `done` fields.
 * Silently no-ops if `taskId` is not found for the given `dateKey`.
 */
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

/**
 * Removes a task from the specified day. If the day's task list becomes empty
 * after deletion, the date key is removed from the map entirely.
 */
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

/** Flips the `done` flag on the specified task. */
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


/**
 * Map of tab-scoped note keys to freeform note text.
 * Keys follow the pattern `planner-<tabName>` (e.g. `planner-Active`).
 * Stored under `creatorContentPlannerNotes` in Clerk `publicMetadata`.
 */
export type ContentPlannerNotes = Record<string, string>

/**
 * Fetches the content planner notes for the authenticated creator from Clerk
 * `publicMetadata`. Returns an empty object for unauthenticated users.
 */
export async function getContentPlannerNotes(): Promise<ContentPlannerNotes> {
  const { userId } = await auth()
  if (!userId) return {}

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const notes = user.publicMetadata?.creatorContentPlannerNotes as ContentPlannerNotes | undefined
  return notes && typeof notes === 'object' ? notes : {}
}

/**
 * Overwrites the full content planner notes map in Clerk `publicMetadata`.
 * Called automatically 500ms after the user stops typing (debounced in the UI).
 */
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

/**
 * Map of YYYY-MM-DD date keys to whether the creator has any accepted
 * campaign active on that date. Includes both `start_date` and `end_date`,
 * plus every day in between. Used by the dashboard calendar to render
 * visual indicators on campaign days.
 */
export type CampaignDateMap = Record<string, {
  /** True if at least one campaign STARTS on this day. */
  isStart: boolean
  /** True if at least one campaign ENDS on this day. */
  isEnd: boolean
  /** Total number of campaigns active on this day. */
  count: number
}>

/**
 * Fetches accepted campaigns for the authenticated creator and returns a
 * date-keyed map describing which days have campaigns active.
 *
 * Iteration is capped at 366 days per campaign as a safety bound against
 * pathological data (e.g. campaigns spanning years). Campaigns missing both
 * start_date and end_date are skipped entirely.
 */
export async function getCreatorCampaignDates(): Promise<CampaignDateMap> {
  const { userId } = await auth()
  if (!userId) return {}

  const { prisma } = await import('@/lib/prisma')
  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!creator) return {}

  const apps = await prisma.campaign_applications.findMany({
    where: {
      creator_id: creator.id,
      status: 'accepted',
    },
    select: {
      campaign: {
        select: {
          start_date: true,
          end_date: true,
        },
      },
    },
  })

  const map: CampaignDateMap = {}
  const MAX_DAYS = 366

  for (const app of apps) {
    const c = app.campaign
    if (!c.start_date && !c.end_date) continue

    const start = c.start_date ?? c.end_date!
    const end = c.end_date ?? c.start_date!
    const startKey = start.toISOString().slice(0, 10)
    const endKey = end.toISOString().slice(0, 10)

    const cursor = new Date(start)
    cursor.setUTCHours(0, 0, 0, 0)
    const lastDay = new Date(end)
    lastDay.setUTCHours(0, 0, 0, 0)

    let dayCount = 0
    while (cursor <= lastDay && dayCount < MAX_DAYS) {
      const key = cursor.toISOString().slice(0, 10)
      if (!map[key]) {
        map[key] = { isStart: false, isEnd: false, count: 0 }
      }
      map[key].count += 1
      if (key === startKey) map[key].isStart = true
      if (key === endKey) map[key].isEnd = true
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      dayCount++
    }
  }

  return map
}

