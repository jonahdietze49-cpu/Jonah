import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, Card, Input } from './ui'

interface ProviderConnectCardProps {
  icon: ReactNode
  title: string
  description: string
  instructionsSummary: string
  instructions: ReactNode
  clientId: string
  onClientIdChange: (value: string) => void
  clientIdLabel: string
  clientIdPlaceholder: string
  connected: boolean
  connecting: boolean
  error: string | null
  onConnect: () => void
  onDisconnect: () => void
}

export function ProviderConnectCard({
  icon,
  title,
  description,
  instructionsSummary,
  instructions,
  clientId,
  onClientIdChange,
  clientIdLabel,
  clientIdPlaceholder,
  connected,
  connecting,
  error,
  onConnect,
  onDisconnect,
}: ProviderConnectCardProps) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-base m-0">{title}</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)]">{description}</p>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-[var(--accent)]">
          {instructionsSummary}
        </summary>
        <div className="mt-2">{instructions}</div>
      </details>

      <div>
        <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
          {clientIdLabel}
        </label>
        <Input
          value={clientId}
          onChange={(e) => onClientIdChange(e.target.value)}
          placeholder={clientIdPlaceholder}
        />
      </div>

      {error && (
        <div className="flex gap-2 text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-xl p-3">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {connected ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--success)] font-medium">
            Verbunden
          </span>
          <Button variant="secondary" onClick={onDisconnect}>
            Trennen
          </Button>
        </div>
      ) : (
        <Button variant="primary" onClick={onConnect} disabled={connecting}>
          {connecting ? 'Verbinde…' : `Mit ${title.replace('-Konto', '')} verbinden`}
        </Button>
      )}
    </Card>
  )
}
