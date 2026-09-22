let audioCtx: AudioContext | null = null
let loopTimer: ReturnType<typeof setInterval> | null = null

/**
 * iOS/Safari only allow starting audio from a real user gesture. Call this
 * once on any tap/click early in the app's lifetime so the AudioContext is
 * already running by the time a scheduled alarm needs to make noise.
 */
export function unlockAudio() {
  if (audioCtx) return
  const Ctx = window.AudioContext || (window as any).webkitAudioContext
  if (!Ctx) return
  audioCtx = new Ctx()
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
}

function beep(freq: number, durationMs: number) {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.value = 0.15
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + durationMs / 1000)
}

export function playAlarmSound() {
  stopAlarmSound()
  if (!audioCtx) unlockAudio()
  if (!audioCtx) return
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})

  const pattern = () => {
    beep(880, 180)
    setTimeout(() => beep(880, 180), 260)
  }
  pattern()
  loopTimer = setInterval(pattern, 900)
}

export function stopAlarmSound() {
  if (loopTimer) {
    clearInterval(loopTimer)
    loopTimer = null
  }
}
