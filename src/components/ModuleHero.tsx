/**
 * ModuleHero — Cabecera compartida de las páginas de módulo:
 * kicker chip, h1, abstract de 2 líneas, fila meta (duración, nº demos,
 * nº ejercicios, XP total), glow ambiental del color del nivel y
 * artwork generado a la derecha.
 *
 * Uso:
 *   <ModuleHero
 *     level="N0"
 *     kicker="// NIVEL 00 · FUNDAMENTOS"
 *     title="Fundamentos matemáticos"
 *     abstract="El álgebra lineal, el cálculo y la probabilidad que sostienen todo el ML…"
 *     meta={{ duration: '3 h', demos: 8, exercises: 8, xp: 400 }}
 *     art="/art-fundamentos.png"
 *     color="#22D3EE"
 *   />
 */

import { motion } from 'framer-motion'
import { Clock, MonitorPlay, FlaskConical, Zap } from 'lucide-react'
import LevelBadge from './LevelBadge'
import { cn } from '@/lib/utils'

export interface ModuleMeta {
  duration: string
  demos: number
  exercises: number
  xp: number
}

export default function ModuleHero({
  level,
  kicker,
  title,
  abstract,
  meta,
  art,
  color,
  className,
}: {
  level: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'N8' | 'N9' | 'N10' | 'BOSS'
  kicker: string
  title: string
  abstract: string
  meta: ModuleMeta
  art?: string
  color: string
  className?: string
}) {
  const metaItems = [
    { icon: Clock, label: meta.duration },
    { icon: MonitorPlay, label: `${meta.demos} demos` },
    { icon: FlaskConical, label: `${meta.exercises} ejercicios` },
    { icon: Zap, label: `${meta.xp} XP` },
  ]

  return (
    <header className={cn('relative overflow-hidden border-b border-line', className)}>
      {/* Glow ambiental del nivel */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 60% 80% at 70% 20%, ${color}1f, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:px-6 md:py-24">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-3"
          >
            <LevelBadge level={level} unlocked size="sm" />
            <span
              className="rounded-full border px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em]"
              style={{ color, borderColor: `${color}44`, background: `${color}11` }}
            >
              {kicker}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-[clamp(2.6rem,5vw,4.2rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-[640px] text-base leading-[1.75] text-muted"
          >
            {abstract}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-7 flex flex-wrap gap-2.5"
          >
            {metaItems.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-xs text-muted"
              >
                <m.icon className="h-3.5 w-3.5" style={{ color }} aria-hidden />
                {m.label}
              </span>
            ))}
          </motion.div>
        </div>

        {art && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative hidden md:block"
          >
            <img
              src={art}
              alt={`Artwork del nivel ${level}`}
              className="w-full rounded-2xl border border-line object-cover shadow-2xl"
              style={{ boxShadow: `0 0 60px ${color}22` }}
              loading="eager"
            />
          </motion.div>
        )}
      </div>
    </header>
  )
}
