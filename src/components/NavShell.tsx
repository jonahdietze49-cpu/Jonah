import {
  AlarmClock,
  CalendarDays,
  Home,
  ListChecks,
  type LucideIcon,
  Settings,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS: {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
}[] = [
  { to: '/', label: 'Übersicht', shortLabel: 'Start', icon: Home },
  { to: '/kalender', label: 'Kalender', icon: CalendarDays },
  { to: '/wecker', label: 'Wecker', icon: AlarmClock },
  { to: '/lernen', label: 'Lernen', icon: Sparkles },
  {
    to: '/erinnerungen',
    label: 'Erinnerungen',
    shortLabel: 'Aufgaben',
    icon: ListChecks,
  },
  {
    to: '/einstellungen',
    label: 'Einstellungen',
    shortLabel: 'Mehr',
    icon: Settings,
  },
]

export function NavShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col md:flex-row bg-[var(--bg)] text-[var(--text)]">
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r border-[var(--border)] p-5 gap-1 safe-top">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-white font-bold">
            K
          </div>
          <div>
            <div className="font-semibold leading-tight">Klar</div>
            <div className="text-xs text-[var(--text-muted)]">
              Dein Alltags-Cockpit
            </div>
          </div>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] safe-top">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <div className="font-semibold">Klar</div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur safe-bottom z-20">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium flex-1 min-w-0 ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`
              }
            >
              <item.icon size={18} />
              <span className="truncate w-full text-center">
                {item.shortLabel ?? item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
