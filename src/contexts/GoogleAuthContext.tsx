import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useSettings } from '../hooks/useSettings'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SCOPES =
  'https://www.googleapis.com/auth/gmail.metadata https://www.googleapis.com/auth/calendar.readonly'
const SESSION_KEY = 'luma:google-token'

interface StoredToken {
  token: string
  expiresAt: number
}

interface GoogleAuthState {
  scriptReady: boolean
  connected: boolean
  connecting: boolean
  error: string | null
  accessToken: string | null
  connect: () => void
  disconnect: () => void
}

const GoogleAuthContext = createContext<GoogleAuthState | null>(null)

function readStoredToken(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { token, expiresAt } = JSON.parse(raw) as StoredToken
    if (Date.now() >= expiresAt) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return token
  } catch {
    return null
  }
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [scriptReady, setScriptReady] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    readStoredToken(),
  )

  useEffect(() => {
    if (document.getElementById('google-gis-script')) {
      setScriptReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.id = 'google-gis-script'
    script.async = true
    script.defer = true
    script.onload = () => setScriptReady(true)
    script.onerror = () =>
      setError('Google-Skript konnte nicht geladen werden (Netzwerk?).')
    document.head.appendChild(script)
  }, [])

  const connect = useCallback(() => {
    setError(null)
    if (!settings.googleClientId.trim()) {
      setError(
        'Bitte zuerst eine Google Client-ID unten eintragen und speichern.',
      )
      return
    }
    const g = (window as any).google
    if (!scriptReady || !g?.accounts?.oauth2) {
      setError('Google-Skript ist noch nicht bereit – kurz warten und erneut versuchen.')
      return
    }
    setConnecting(true)
    const client = g.accounts.oauth2.initTokenClient({
      client_id: settings.googleClientId.trim(),
      scope: SCOPES,
      callback: (resp: any) => {
        setConnecting(false)
        if (resp.error) {
          setError(
            resp.error === 'access_denied'
              ? 'Zugriff wurde abgelehnt.'
              : 'Verbindung fehlgeschlagen: ' + resp.error,
          )
          return
        }
        const expiresAt = Date.now() + (Number(resp.expires_in) || 3600) * 1000
        try {
          sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ token: resp.access_token, expiresAt }),
          )
        } catch {
          // session storage unavailable – token still works for this page load
        }
        setAccessToken(resp.access_token)
      },
      error_callback: () => {
        setConnecting(false)
        setError('Anmeldefenster wurde geschlossen oder blockiert.')
      },
    })
    client.requestAccessToken()
  }, [scriptReady, settings.googleClientId])

  const disconnect = useCallback(() => {
    const g = (window as any).google
    if (accessToken && g?.accounts?.oauth2?.revoke) {
      g.accounts.oauth2.revoke(accessToken, () => {})
    }
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
    setAccessToken(null)
  }, [accessToken])

  return (
    <GoogleAuthContext.Provider
      value={{
        scriptReady,
        connected: !!accessToken,
        connecting,
        error,
        accessToken,
        connect,
        disconnect,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  )
}

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext)
  if (!ctx) {
    throw new Error('useGoogleAuth must be used within GoogleAuthProvider')
  }
  return ctx
}
