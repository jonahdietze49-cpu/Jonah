export interface CalendarEvent {
  id: string
  title: string
  /** ISO datetime string */
  start: string
  /** ISO datetime string, optional for all-day/point events */
  end?: string
  location?: string
  notes?: string
  createdVia: 'manual' | 'voice' | 'fussball'
  createdAt: string
}

export type ReminderPriority = 'low' | 'normal' | 'high'

export interface Reminder {
  id: string
  title: string
  /** ISO datetime string, optional (no due date = someday list) */
  due?: string
  done: boolean
  priority: ReminderPriority
  notifiedAt?: string
  createdAt: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
  /** simple SM-2-ish scheduling */
  interval: number
  ease: number
  dueDate: string
  reviews: number
}

export interface Deck {
  id: string
  name: string
  color: string
  cards: Flashcard[]
  createdAt: string
}

export interface Alarm {
  id: string
  /** 24h "HH:MM" */
  time: string
  label: string
  /** 0=Montag..6=Sonntag; leer = einmalig (deaktiviert sich nach dem Klingeln) */
  days: number[]
  enabled: boolean
  /** ISO datetime – gesetzt, während der Alarm geschlummert wird */
  snoozedUntil?: string
  createdAt: string
}

export interface AppSettings {
  userName: string
  notificationsEnabled: boolean
  reminderLeadMinutes: number
  /** Eigene Google OAuth Client-ID (aus der Google Cloud Console) */
  googleClientId: string
}

export interface FussballMatch {
  /** stabile ID zum Deduplizieren, z.B. ISO-Datum + Gegner */
  id: string
  /** ISO datetime string */
  date: string
  opponent: string
  home: boolean
  competition?: string
  venue?: string
}
