import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'klarblick:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    window.dispatchEvent(
      new CustomEvent('klarblick:storage', { detail: { key } }),
    )
  } catch {
    // storage unavailable (private mode / quota) – app still works in-memory for the session
  }
}

/**
 * Shared localStorage-backed state, synced across every component using the
 * same key within a single tab (no full reload needed after writes).
 */
export function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback))

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key: string } | undefined
      if (detail?.key === key) setValue(read(key, fallback))
    }
    window.addEventListener('klarblick:storage', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('klarblick:storage', handler)
      window.removeEventListener('storage', handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        write(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, update] as const
}

export function exportAllData() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX))
  const dump: Record<string, unknown> = {}
  for (const k of keys) {
    try {
      dump[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)!)
    } catch {
      // skip unreadable key
    }
  }
  return dump
}

export function importAllData(dump: Record<string, unknown>) {
  for (const [key, value] of Object.entries(dump)) {
    write(key, value)
  }
}

export function newId() {
  return crypto.randomUUID()
}
