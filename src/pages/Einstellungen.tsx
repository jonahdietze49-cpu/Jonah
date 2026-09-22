import {
  Bell,
  Download,
  Laptop,
  Smartphone,
  Tablet,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Card, Input, SectionTitle } from '../components/ui'
import { useSettings } from '../hooks/useSettings'
import { exportAllData, importAllData } from '../lib/storage'

export default function Einstellungen() {
  const { settings, updateSettings } = useSettings()
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEnableNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setNotifStatus('unsupported')
      return
    }
    const permission = await Notification.requestPermission()
    setNotifStatus(permission)
    updateSettings({ notificationsEnabled: permission === 'granted' })
  }

  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `luma-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      importAllData(data)
      window.location.reload()
    } catch {
      alert('Datei konnte nicht gelesen werden.')
    }
    e.target.value = ''
  }

  const handleReset = () => {
    if (!confirm('Wirklich alle Daten in Luma löschen? Das kann nicht rückgängig gemacht werden.'))
      return
    Object.keys(localStorage)
      .filter((k) => k.startsWith('klarblick:'))
      .forEach((k) => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Einstellungen" subtitle="Luma nach deinen Wünschen" />

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-base m-0">Profil</h2>
        <label className="text-xs font-medium text-[var(--text-muted)] block">
          Dein Name
        </label>
        <Input
          value={settings.userName}
          onChange={(e) => updateSettings({ userName: e.target.value })}
          placeholder="z.B. Jonah"
        />
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-base m-0">Benachrichtigungen</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Luma erinnert dich an fällige Aufgaben und anstehende Termine,
          solange die App geöffnet ist – als Tab oder als installierte App auf
          dem Homescreen.
        </p>
        {notifStatus === 'unsupported' && (
          <p className="text-sm text-[var(--warning)]">
            Dieser Browser unterstützt keine Benachrichtigungen.
          </p>
        )}
        {notifStatus === 'granted' ? (
          <div className="flex items-center gap-2 text-sm text-[var(--success)] font-medium">
            <Bell size={16} /> Benachrichtigungen aktiviert
          </div>
        ) : (
          notifStatus !== 'unsupported' && (
            <Button variant="primary" onClick={handleEnableNotifications}>
              Benachrichtigungen aktivieren
            </Button>
          )
        )}
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
            Vorlaufzeit (Minuten vor Fälligkeit)
          </label>
          <Input
            type="number"
            min={0}
            max={180}
            value={settings.reminderLeadMinutes}
            onChange={(e) =>
              updateSettings({ reminderLeadMinutes: Number(e.target.value) })
            }
            className="max-w-32"
          />
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="font-semibold text-base m-0">
          Zum Homescreen hinzufügen
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Luma läuft als installierbare Web-App (PWA) – ein Icon auf
          deinem Homescreen, Vollbild, auch offline nutzbar.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <InstallStep
            icon={<Tablet size={18} />}
            device="iPad"
            steps={['Safari öffnen', 'Teilen-Symbol antippen', '„Zum Home-Bildschirm"']}
          />
          <InstallStep
            icon={<Smartphone size={18} />}
            device="iPhone"
            steps={['Safari öffnen', 'Teilen-Symbol antippen', '„Zum Home-Bildschirm"']}
          />
          <InstallStep
            icon={<Laptop size={18} />}
            device="MacBook"
            steps={['Safari/Chrome öffnen', 'Menü öffnen', '„Zum Dock hinzufügen" / App installieren']}
          />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-base m-0">Daten</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Alle Daten bleiben lokal auf diesem Gerät gespeichert. Exportiere
          regelmäßig ein Backup, um sie auf ein anderes Gerät zu übertragen.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} />
            Backup exportieren
          </Button>
          <Button variant="secondary" onClick={handleImportClick}>
            <Upload size={16} />
            Backup importieren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="danger" onClick={handleReset}>
            <Trash2 size={16} />
            Alle Daten löschen
          </Button>
        </div>
      </Card>
    </div>
  )
}

function InstallStep({
  icon,
  device,
  steps,
}: {
  icon: React.ReactNode
  device: string
  steps: string[]
}) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3">
      <div className="flex items-center gap-2 font-medium mb-2">
        {icon}
        {device}
      </div>
      <ol className="list-decimal list-inside space-y-0.5 text-[var(--text-muted)]">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  )
}
