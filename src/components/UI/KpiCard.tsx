import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

type Tone = 'emerald' | 'amber' | 'red' | 'blue' | 'slate' | 'dark'

const tones: Record<Tone, { bg: string; icon: string; num: string; border: string }> = {
  dark:    { bg: 'bg-gradient-to-br from-slate-900 to-slate-800', icon: 'text-slate-400', num: 'text-white', border: 'border-transparent' },
  emerald: { bg: 'bg-emerald-50',  icon: 'text-emerald-600', num: 'text-emerald-700', border: 'border-emerald-100' },
  amber:   { bg: 'bg-amber-50',    icon: 'text-amber-500',   num: 'text-amber-700',   border: 'border-amber-100' },
  red:     { bg: 'bg-red-50',      icon: 'text-red-500',     num: 'text-red-700',     border: 'border-red-100' },
  blue:    { bg: 'bg-blue-50',     icon: 'text-blue-500',    num: 'text-blue-700',    border: 'border-blue-100' },
  slate:   { bg: 'bg-white',       icon: 'text-slate-400',   num: 'text-slate-800',   border: '' },
}

export default function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = 'slate',
  className,
}: {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  tone?: Tone
  className?: string
}) {
  const t = tones[tone]
  return (
    <div className={clsx('card p-4 flex flex-col gap-2', t.bg, t.border && `border ${t.border}`, className)}>
      <div className="flex items-center justify-between gap-2">
        <p className={clsx('text-[11px] font-semibold uppercase tracking-wider leading-tight', tone === 'dark' ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
        {Icon && <Icon size={17} className={t.icon} />}
      </div>
      <p className={clsx('text-2xl sm:text-3xl font-extrabold tracking-tight leading-none', t.num)}>{value}</p>
      {subtitle && <p className={clsx('text-xs', tone === 'dark' ? 'text-slate-400' : 'text-slate-500')}>{subtitle}</p>}
    </div>
  )
}
