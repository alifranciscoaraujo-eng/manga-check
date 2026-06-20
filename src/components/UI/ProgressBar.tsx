import clsx from 'clsx'

export default function ProgressBar({
  value,
  className,
  tone = 'emerald',
}: {
  value: number
  className?: string
  tone?: 'emerald' | 'amber' | 'red' | 'slate'
}) {
  const v = Math.max(0, Math.min(100, value))
  const bar = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    slate: 'bg-slate-400',
  }[tone]
  return (
    <div className={clsx('w-full h-2 rounded-full bg-slate-100 overflow-hidden', className)}>
      <div className={clsx('h-full rounded-full transition-all duration-500', bar)} style={{ width: `${v}%` }} />
    </div>
  )
}
