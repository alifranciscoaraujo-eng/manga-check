import { Check, AlertTriangle, Loader2 } from 'lucide-react'
import type { StatusExecucao } from '../../types'

/** Ícone circular de status (estilo app: check verde, alerta âmbar/vermelho, vazio cinza). */
export default function StatusDot({ status, size = 24 }: { status: StatusExecucao; size?: number }) {
  const box = { width: size, height: size }
  const icon = Math.round(size * 0.55)

  if (status === 'finalizado')
    return (
      <span className="rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0" style={box}>
        <Check size={icon} strokeWidth={3} />
      </span>
    )
  if (status === 'em_andamento')
    return (
      <span className="rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0" style={box}>
        <Loader2 size={icon} strokeWidth={3} />
      </span>
    )
  if (status === 'atrasado')
    return (
      <span className="rounded-full bg-red-500 text-white flex items-center justify-center shrink-0" style={box}>
        <AlertTriangle size={icon} strokeWidth={2.5} />
      </span>
    )
  return <span className="rounded-full border-2 border-slate-200 shrink-0" style={box} />
}
