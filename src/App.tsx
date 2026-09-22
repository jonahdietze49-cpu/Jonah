import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { NavShell } from './components/NavShell'
import { RingingOverlay } from './components/RingingOverlay'
import { useAlarmScheduler } from './hooks/useAlarmScheduler'
import { useNotificationScheduler } from './hooks/useNotificationScheduler'
import { unlockAudio } from './lib/alarmSound'
import Dashboard from './pages/Dashboard'
import Kalender from './pages/Kalender'
import Wecker from './pages/Wecker'
import Lernen from './pages/Lernen'
import Erinnerungen from './pages/Erinnerungen'
import Einstellungen from './pages/Einstellungen'

function AppRoutes() {
  useNotificationScheduler()
  useAlarmScheduler()

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <NavShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kalender" element={<Kalender />} />
        <Route path="/wecker" element={<Wecker />} />
        <Route path="/lernen" element={<Lernen />} />
        <Route path="/erinnerungen" element={<Erinnerungen />} />
        <Route path="/einstellungen" element={<Einstellungen />} />
      </Routes>
      <RingingOverlay />
    </NavShell>
  )
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}

export default App
