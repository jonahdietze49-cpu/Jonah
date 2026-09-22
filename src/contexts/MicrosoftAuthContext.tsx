import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { PublicClientApplication } from '@azure/msal-browser'
import { useSettings } from '../hooks/useSettings'

const SCOPES = ['Mail.Read', 'Calendars.Read']

interface MicrosoftAuthState {
  connected: boolean
  connecting: boolean
  error: string | null
  accessToken: string | null
  connect: () => void
  disconnect: () => void
}

const MicrosoftAuthContext = createContext<MicrosoftAuthState | null>(null)

export function MicrosoftAuthProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const msalRef = useRef<PublicClientApplication | null>(null)
  const clientId = settings.microsoftClientId.trim()

  const getMsal = useCallback(async () => {
    if (msalRef.current) return msalRef.current
    const { PublicClientApplication } = await import('@azure/msal-browser')
    const instance = new PublicClientApplication({
      auth: {
        clientId,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin + window.location.pathname,
      },
      cache: { cacheLocation: 'sessionStorage' },
    })
    await instance.initialize()
    msalRef.current = instance
    return instance
  }, [clientId])

  // Versucht beim Laden lautlos wieder anzumelden, falls MSAL noch ein
  // gültiges Konto im sessionStorage-Cache von einer früheren Sitzung hat.
  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    ;(async () => {
      try {
        const instance = await getMsal()
        const accounts = instance.getAllAccounts()
        if (accounts.length === 0) return
        const result = await instance.acquireTokenSilent({
          scopes: SCOPES,
          account: accounts[0],
        })
        if (!cancelled) setAccessToken(result.accessToken)
      } catch {
        // stille Wiederanmeldung fehlgeschlagen – Nutzer kann "Verbinden" erneut klicken
      }
    })()
    return () => {
      cancelled = true
    }
  }, [clientId, getMsal])

  const connect = useCallback(async () => {
    setError(null)
    if (!clientId) {
      setError(
        'Bitte zuerst eine Microsoft-Anwendungs-ID unten eintragen und speichern.',
      )
      return
    }
    setConnecting(true)
    try {
      const instance = await getMsal()
      const result = await instance.loginPopup({ scopes: SCOPES })
      setAccessToken(result.accessToken)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Anmeldung fehlgeschlagen oder abgebrochen.',
      )
    } finally {
      setConnecting(false)
    }
  }, [clientId, getMsal])

  const disconnect = useCallback(async () => {
    try {
      const instance = msalRef.current
      if (instance) {
        for (const account of instance.getAllAccounts()) {
          await instance.logoutPopup({ account }).catch(() => {})
        }
      }
    } finally {
      setAccessToken(null)
    }
  }, [])

  return (
    <MicrosoftAuthContext.Provider
      value={{
        connected: !!accessToken,
        connecting,
        error,
        accessToken,
        connect,
        disconnect,
      }}
    >
      {children}
    </MicrosoftAuthContext.Provider>
  )
}

export function useMicrosoftAuth() {
  const ctx = useContext(MicrosoftAuthContext)
  if (!ctx) {
    throw new Error(
      'useMicrosoftAuth must be used within MicrosoftAuthProvider',
    )
  }
  return ctx
}
