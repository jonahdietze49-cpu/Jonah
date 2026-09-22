import { HashRouter, Route, Routes } from 'react-router-dom'
import { NavShell } from './components/NavShell'
import { useNotificationScheduler } from './hooks/useNotificationScheduler'
import Dashboard from './pages/Dashboard'
import Kalender from './pages/Kalender'
import Lernen from './pages/Lernen'
import Erinnerungen from './pages/Erinnerungen'
import Einstellungen from './pages/Einstellungen'

function AppRoutes() {
  useNotificationScheduler()

  return (
    <NavShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kalender" element={<Kalender />} />
        <Route path="/lernen" element={<Lernen />} />
        <Route path="/erinnerungen" element={<Erinnerungen />} />
        <Route path="/einstellungen" element={<Einstellungen />} />
      </Routes>
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
