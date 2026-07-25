/**
 * ChapterNav — rail izquierdo sticky para páginas de módulo.
 * Lista mono de anchors con scrollspy (punto cyan + texto ink) y
 * anillo de progreso de lectura al final.
 *
 * Uso:
 *   <ChapterNav sections={[{ id: 'regresion', label: '3.1 Regresión lineal' }, …]} />
 * Las secciones deben existir en el documento como elementos con ese id.
 */

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface ChapterSection {
  id: string
  label: string
}

export default function ChapterNav({ sections, className }: { sections: ChapterSection[]; className?: string }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')
  const [progress, setProgress] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Scrollspy
  useEffect(() => {
    observerRef.current?.disconnect()
    const visible = new Map<string, number>()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible.set(e.target.id, e.intersectionRatio)
        }
        let best = ''
        let bestRatio = 0
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            best = id
            bestRatio = ratio
          }
        }
        if (best) setActiveId(best)
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observerRef.current.observe(el)
    }
    return () => observerRef.current?.disconnect()
  }, [sections])

  // Progreso de lectura de la página
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const R = 15
  const CIRC = 2 * Math.PI * R

  return (
    <nav
      className={cn(
        'sticky top-24 hidden w-60 shrink-0 flex-col gap-1 self-start lg:flex',
        className,
      )}
      aria-label="Índice del capítulo"
    >
      <div className="mb-3 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-faint">
        // En esta página
      </div>
      {sections.map((s) => {
        const active = s.id === activeId
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              'group flex items-center gap-2.5 rounded-md px-2 py-1.5 font-mono text-xs transition-colors',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full transition-all',
                active ? 'bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-line group-hover:bg-faint',
              )}
              aria-hidden
            />
            {s.label}
          </a>
        )
      })}

      {/* Anillo de progreso */}
      <div className="mt-6 flex items-center gap-3 px-2">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r={R} fill="none" stroke="#1C2440" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r={R}
            fill="none"
            stroke="url(#chapter-progress-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            transform="rotate(-90 20 20)"
            style={{ transition: 'stroke-dashoffset 120ms linear' }}
          />
          <defs>
            <linearGradient id="chapter-progress-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-mono text-xs text-muted">{Math.round(progress * 100)}%</span>
      </div>
    </nav>
  )
}
