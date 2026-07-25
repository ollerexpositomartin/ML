/**
 * RutaMap — camino serpenteante del currículo (S2 de /ruta).
 * SVG con raíl base + raíl de progreso en gradiente; 8 nodos (N0–BOSS)
 * alternando izquierda/derecha con tarjeta de contenido. Estado por nodo:
 * completado (lima + check) · en curso (pulso cyan) · disponible (violet)
 * · bloqueado (gris + candado; la navegación sigue siendo libre).
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Lock, Trophy } from 'lucide-react'
import LevelBadge from '@/components/LevelBadge'
import { LEVELS, useProgress } from '@/lib/progress'
import { CAMINO_NODES } from '@/data/modules'
import { SYLLABUS } from './syllabus'
import { cn } from '@/lib/utils'

type NodeState = 'completado' | 'en-curso' | 'disponible' | 'bloqueado'

const STATE_STYLE: Record<NodeState, { chip: string; label: string }> = {
  completado: { chip: 'border-lime/50 bg-lime/10 text-lime', label: '✓ completado' },
  'en-curso': { chip: 'border-cyan/50 bg-cyan/10 text-cyan', label: '● en curso' },
  disponible: { chip: 'border-violet/50 bg-violet/10 text-violet', label: 'disponible' },
  bloqueado: { chip: 'border-line bg-panel text-faint', label: 'bloqueado' },
}

const ROW_H = 210
const VW = 1000 // viewBox width
const NODE_X = [220, 780] // columnas alternas

export default function RutaMap() {
  const navigate = useNavigate()
  const xp = useProgress((s) => s.xp)
  const [consejo, setConsejo] = useState(false)

  const nodes = useMemo(() => {
    const current = (() => {
      let cur = LEVELS[0]
      for (const l of LEVELS) if (xp >= l.xpThreshold) cur = l
      return cur
    })()
    return CAMINO_NODES.map((n, i) => {
      const levelDef = LEVELS.find((l) => l.id === n.level)!
      const next = LEVELS[i + 1]
      const unlocked = xp >= levelDef.xpThreshold
      const completed = next ? xp >= next.xpThreshold : false
      const state: NodeState = !unlocked
        ? 'bloqueado'
        : completed
          ? 'completado'
          : current.id === n.level
            ? 'en-curso'
            : 'disponible'
      const syllabus = SYLLABUS.find((s) => s.level === n.level)
      return {
        ...n,
        state,
        threshold: levelDef.xpThreshold,
        topics: syllabus?.topics.length ?? 0,
        xpLeft: Math.max(0, levelDef.xpThreshold - xp),
        x: NODE_X[i % 2],
        y: ROW_H / 2 + i * ROW_H,
        left: i % 2 === 0,
      }
    })
  }, [xp])

  const height = nodes.length * ROW_H

  const railPath = useMemo(() => {
    if (nodes.length === 0) return ''
    let d = `M ${nodes[0].x} ${nodes[0].y}`
    for (let i = 1; i < nodes.length; i++) {
      const a = nodes[i - 1]
      const b = nodes[i]
      const midY = (a.y + b.y) / 2
      d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`
    }
    return d
  }, [nodes])

  const unlockedPath = useMemo(() => {
    const unlocked = nodes.filter((n) => n.state !== 'bloqueado')
    if (unlocked.length < 2) return ''
    let d = `M ${unlocked[0].x} ${unlocked[0].y}`
    for (let i = 1; i < unlocked.length; i++) {
      const a = unlocked[i - 1]
      const b = unlocked[i]
      const midY = (a.y + b.y) / 2
      d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`
    }
    return d
  }, [nodes])

  const handleLocked = (path: string) => {
    setConsejo(true)
    window.setTimeout(() => setConsejo(false), 2600)
    navigate(path)
  }

  return (
    <div className="relative mx-auto w-full max-w-[1100px]">
      {/* aviso consejo */}
      <AnimatePresence>
        {consejo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-amber/50 bg-panel-2 px-5 py-3 font-mono text-xs text-amber shadow-glow-violet"
          >
            Consejo: el camino está pensado en orden — empieza por N0. (Todo el contenido es accesible libremente.)
          </motion.div>
        )}
      </AnimatePresence>

      {/* raíl SVG (desktop) */}
      <svg
        viewBox={`0 0 ${VW} ${height}`}
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="ruta-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <path d={railPath} fill="none" stroke="#1C2440" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {unlockedPath && (
          <motion.path
            d={unlockedPath}
            fill="none"
            stroke="url(#ruta-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
        )}
      </svg>

      {/* filas de nodos */}
      <div className="relative flex flex-col gap-12 lg:gap-0">
        {nodes.map((n, i) => {
          const locked = n.state === 'bloqueado'
          return (
            <div
              key={n.level}
              className="relative flex flex-col items-center gap-4 lg:block lg:h-[210px]"
            >
              {/* nodo sobre el raíl */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 * (i % 3) }}
                className={cn(
                  'relative z-10 flex shrink-0 flex-col items-center gap-2',
                  'lg:absolute lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2',
                  n.left ? 'lg:left-[22%]' : 'lg:left-[78%]',
                )}
              >
                <div className="relative">
                  {n.state === 'en-curso' && (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-cyan"
                      animate={{ scale: [1, 1.55], opacity: [0.8, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                      aria-hidden
                    />
                  )}
                  {n.level === 'BOSS' ? (
                    <span
                      className={cn(
                        'flex h-16 w-16 items-center justify-center rounded-full border-2',
                        locked ? 'border-line bg-panel' : 'border-rose bg-panel shadow-glow-violet',
                      )}
                    >
                      <Trophy className={cn('h-7 w-7', locked ? 'text-faint' : 'text-rose')} aria-hidden />
                    </span>
                  ) : (
                    <LevelBadge level={n.level} unlocked={!locked} size="lg" />
                  )}
                  {n.state === 'completado' && (
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-lime bg-bg-0">
                      <Check className="h-3.5 w-3.5 text-lime" aria-hidden />
                    </span>
                  )}
                  {locked && (
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg-0">
                      <Lock className="h-3 w-3 text-faint" aria-hidden />
                    </span>
                  )}
                </div>
              </motion.div>

              {/* tarjeta */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className={cn(
                  'w-full max-w-[520px] lg:absolute lg:top-1/2 lg:w-[420px] lg:-translate-y-1/2',
                  n.left ? 'lg:left-[32%]' : 'lg:right-[32%]',
                )}
              >
                <Link
                  to={n.path}
                  onClick={(e) => {
                    if (locked) {
                      e.preventDefault()
                      handleLocked(n.path)
                    }
                  }}
                  className={cn(
                    'group block rounded-2xl border bg-panel p-5 transition-all hover:-translate-y-1.5',
                    locked
                      ? 'border-line opacity-70 hover:opacity-100'
                      : 'border-line hover:border-violet/60 hover:shadow-glow-violet',
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-faint">
                      // NIVEL {n.level}
                    </span>
                    <span className={cn('rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase', STATE_STYLE[n.state].chip)}>
                      {STATE_STYLE[n.state].label}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-ink transition-colors group-hover:text-cyan">
                    {n.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{n.outcome}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-faint">
                    <span>{n.topics} temas</span>
                    <span>{n.meta}</span>
                    {locked && n.threshold > 0 && (
                      <span className="text-amber">faltan {n.xpLeft} XP</span>
                    )}
                  </div>
                </Link>
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
