/**
 * DemoFrame — Chrome de ventana titulada (● ● ● + título mono) envolviendo
 * una demo interactiva (canvas / D3 / TF.js) + barra de controles opcional.
 *
 * Uso:
 *   <DemoFrame title="gradiente_descendente.py" controls={<…sliders…>}>
 *     <canvas … />
 *   </DemoFrame>
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export default function DemoFrame({
  title,
  children,
  controls,
  className,
  bodyClassName,
}: {
  /** Título mono, p.ej. 'demo: gradiente_descendente.py' */
  title: string
  children: ReactNode
  /** Barra de controles (sliders cyan, toggles violet) */
  controls?: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-panel shadow-2xl shadow-black/40', className)}>
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-panel-2 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-rose/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime/70" />
        </span>
        <span className="truncate font-mono text-xs text-muted">demo: {title}</span>
        <span className="ml-auto hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-faint sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-lime" aria-hidden />
          interactiva
        </span>
      </div>

      {/* Cuerpo de la demo */}
      <div className={cn('relative bg-bg-1', bodyClassName)}>{children}</div>

      {/* Barra de controles */}
      {controls && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line bg-panel px-4 py-3">
          {controls}
        </div>
      )}
    </div>
  )
}
