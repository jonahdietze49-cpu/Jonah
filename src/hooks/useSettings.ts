import { useStoredState } from '../lib/storage'
import type { AppSettings } from '../lib/types'

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  notificationsEnabled: false,
  reminderLeadMinutes: 10,
  googleClientId: '',
  microsoftClientId: '',
}

export function useSettings() {
  const [stored, setSettings] = useStoredState<AppSettings>(
    'settings',
    DEFAULT_SETTINGS,
  )
  // merge in case a settings object was saved before newer fields existed
  const settings: AppSettings = { ...DEFAULT_SETTINGS, ...stored }

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...patch }))
  }

  return { settings, updateSettings }
}
