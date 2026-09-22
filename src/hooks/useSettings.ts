import { useStoredState } from '../lib/storage'
import type { AppSettings } from '../lib/types'

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  notificationsEnabled: false,
  reminderLeadMinutes: 10,
}

export function useSettings() {
  const [settings, setSettings] = useStoredState<AppSettings>(
    'settings',
    DEFAULT_SETTINGS,
  )

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  return { settings, updateSettings }
}
