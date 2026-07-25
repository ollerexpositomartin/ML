/**
 * Logros — S4 del Laboratorio: resumen de XP + muro de insignias.
 * Izquierda: XP total, mini-barras por nivel, contador de ejercicios.
 * Derecha: muro de hexágonos N0…N6 + BOSS + RACHA; desbloqueadas con glow
 * del nivel, bloqueadas en gris con la línea del requisito.
 */

import { motion } from 'framer-motion'
import { Zap, Flame } from 'lucide-react'
import LevelBadge from '@/components/LevelBadge'
import { useProgress, formatXP, LEVELS } from '@/lib/progress'
import type { Exercise } from '@/lib/exercises'
import { exerciseMeta } from './exerciseMeta'
import { cn } from '@/lib/utils'

interface LevelStats {
  level: string
  color: string
  total: number
  done: number
  xpTotal: number
  xpDone: number
}

function computeStats(exercises: Exercise[], completed: Record<string, { xp: number }>): LevelStats[] {
  const byLevel = new Map<string, LevelStats>()
  for (const ex of exercises) {
    const meta = exerciseMeta(ex.id)
    let s = byLevel.get(meta.level)
    if (!s) {
      s = { level: meta.level, color: meta.color, total: 0, done: 0, xpTotal: 0, xpDone: 0 }
      byLevel.set(meta.level, s)
    }
    s.total++
    s.xpTotal += ex.xp
    if (completed[ex.id]) {
      s.done++
      s.xpDone += completed[ex.id].xp
    }
  }
  const order = ['N0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'BOSS']
  return [...byLevel.values()].sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))
}

export default function Logros({ exercises }: { exercises: Exercise[] }) {
  const xp = useProgress((s) => s.xp)
  const completed = useProgress((s) => s.completed)
  const stats = computeStats(exercises, completed)
  const totalDone = stats.reduce((acc, s) => acc + s.done, 0)
  const totalEx = stats.reduce((acc, s) => acc + s.total, 0)

  const badgeOf = (levelId: string) => {
    const s = stats.find((x) => x.level === levelId)
    return {
      unlocked: Boolean(s && s.total > 0 && s.done === s.total),
      requirement: s
        ? s.total > 0
          ? `Supera los ${s.total} ejercicios de ${s.level} (${s.done}/${s.total})`
          : 'Aún no hay ejercicios de este nivel'
        : 'Aún no hay ejercicios de este nivel',
    }
  }
  const racha = { unlocked: totalDone >= 5, requirement: `Supera 5 ejercicios (${Math.min(totalDone, 5)}/5)` }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      {/* Resumen de XP */}
      <div className="rounded-xl border border-line bg-panel p-6">
        <div className="mb-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-faint">// Resumen</div>
        <div className="flex items-end gap-2">
          <span className="font-mono text-4xl font-bold text-amber">{formatXP(xp)}</span>
          <span className="mb-1 flex items-center gap-1 font-mono text-sm text-muted">
            <Zap className="h-4 w-4 text-amber" aria-hidden /> XP
          </span>
        </div>
        <div className="mt-1 font-mono text-xs text-faint">
          {totalDone}/{totalEx} ejercicios superados
        </div>

        <div className="mt-6 space-y-3">
          {stats.map((s, i) => (
            <div key={s.level}>
              <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
                <span style={{ color: s.color }}>{s.level}</span>
                <span className="text-faint">
                  {s.done}/{s.total} · {formatXP(s.xpDone)} XP
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.xpTotal > 0 ? (s.xpDone / s.xpTotal) * 100 : 0}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: s.color }}
                />
              </div>
            </div>
          ))}
          {stats.length === 0 && (
            <div className="font-mono text-xs text-faint">El registro de ejercicios aún se está cargando…</div>
          )}
        </div>
      </div>

      {/* Muro de insignias */}
      <div className="rounded-xl border border-line bg-panel p-6">
        <div className="mb-5 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-faint">
          // Muro de insignias
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {LEVELS.map((lvl, i) => {
            const b = badgeOf(lvl.id)
            return (
              <motion.div
                key={lvl.id}
                initial={{ opacity: 0, rotateY: -60 }}
                whileInView={{ opacity: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 220, damping: 18, delay: i * 0.07 }}
                whileHover={b.unlocked ? undefined : { x: [0, -4, 4, 0], transition: { duration: 0.3 } }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 text-center',
                  b.unlocked ? 'border-line bg-panel-2' : 'border-line/60 bg-panel',
                )}
                style={b.unlocked ? { boxShadow: `0 0 24px ${lvl.color}22` } : undefined}
                title={b.requirement}
              >
                <LevelBadge level={lvl.id} unlocked={b.unlocked} size="md" />
                <span className={cn('font-mono text-[11px] font-bold', b.unlocked ? 'text-ink' : 'text-faint')}>
                  {lvl.id}
                </span>
                <span className="font-mono text-[9px] leading-snug text-faint">{lvl.name}</span>
                {!b.unlocked && (
                  <span className="font-mono text-[9px] leading-snug text-faint/70">{b.requirement}</span>
                )}
              </motion.div>
            )
          })}

          {/* RACHA */}
          <motion.div
            initial={{ opacity: 0, rotateY: -60 }}
            whileInView={{ opacity: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: LEVELS.length * 0.07 }}
            whileHover={racha.unlocked ? undefined : { x: [0, -4, 4, 0], transition: { duration: 0.3 } }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 text-center',
              racha.unlocked ? 'border-lime/40 bg-panel-2' : 'border-line/60 bg-panel',
            )}
            style={racha.unlocked ? { boxShadow: '0 0 24px rgba(163,230,53,0.15)' } : undefined}
            title={racha.requirement}
          >
            <span
              className={cn(
                'flex h-14 w-14 items-center justify-center',
                !racha.unlocked && 'opacity-40 grayscale',
              )}
            >
              <Flame className="h-10 w-10 text-lime" aria-hidden />
            </span>
            <span className={cn('font-mono text-[11px] font-bold', racha.unlocked ? 'text-lime' : 'text-faint')}>
              RACHA
            </span>
            <span className="font-mono text-[9px] leading-snug text-faint">5 ejercicios superados</span>
            {!racha.unlocked && (
              <span className="font-mono text-[9px] leading-snug text-faint/70">{racha.requirement}</span>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
