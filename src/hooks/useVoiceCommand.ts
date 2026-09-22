import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createSpeechRecognizer,
  parseVoiceEvent,
  type ParsedVoiceEvent,
  type SpeechRecognitionLike,
} from '../lib/voiceParser'

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error'

export function useVoiceCommand() {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState<ParsedVoiceEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recognizerRef = useRef<SpeechRecognitionLike | null>(null)

  const supported =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  const reset = useCallback(() => {
    setTranscript('')
    setParsed(null)
    setError(null)
    setStatus('idle')
  }, [])

  const start = useCallback(() => {
    if (!supported) {
      setError(
        'Spracherkennung wird von diesem Browser nicht unterstützt. Nutze Safari auf iPhone/iPad/Mac oder Chrome.',
      )
      setStatus('error')
      return
    }
    setError(null)
    setParsed(null)
    setTranscript('')

    const recognizer = createSpeechRecognizer()
    if (!recognizer) return
    recognizerRef.current = recognizer

    recognizer.onresult = (event: any) => {
      const text = event.results[0]?.[0]?.transcript ?? ''
      setTranscript(text)
      setStatus('processing')
      const result = parseVoiceEvent(text)
      if (result) {
        setParsed(result)
        setStatus('idle')
      } else {
        setError(
          'Konnte kein Datum erkennen. Versuch es z.B. mit "Termin morgen um 15 Uhr Zahnarzt".',
        )
        setStatus('error')
      }
    }

    recognizer.onerror = (event: any) => {
      setError(
        event?.error === 'not-allowed'
          ? 'Mikrofonzugriff wurde nicht erlaubt.'
          : 'Spracherkennung fehlgeschlagen. Versuch es erneut.',
      )
      setStatus('error')
    }

    recognizer.onend = () => {
      setStatus((s) => (s === 'listening' ? 'idle' : s))
    }

    setStatus('listening')
    recognizer.start()
  }, [supported])

  const stop = useCallback(() => {
    recognizerRef.current?.stop()
  }, [])

  useEffect(() => () => recognizerRef.current?.abort(), [])

  return { status, transcript, parsed, error, supported, start, stop, reset }
}
