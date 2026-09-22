import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="text-left">
        <h1 className="text-xl font-semibold m-0">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--accent)] text-white hover:opacity-90 shadow-sm shadow-indigo-500/20',
    secondary:
      'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)]',
    ghost: 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="text-center py-10 px-4 text-[var(--text-muted)]">
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
          {icon}
        </div>
      )}
      <p className="font-medium text-[var(--text)]">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${props.className ?? ''}`}
    />
  )
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${props.className ?? ''}`}
    />
  )
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${props.className ?? ''}`}
    />
  )
}
