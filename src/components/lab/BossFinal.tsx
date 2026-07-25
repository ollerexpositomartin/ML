/**
 * BossFinal — S3 del Laboratorio: proyecto capstone con 5 puertas secuenciales.
 * Cada puerta es un ejercicio autocorregido (boss-exploracion … boss-informe)
 * que se desbloquea al superar la anterior. Al completar las cinco: takeover
 * de celebración con confetti, XP total, insignia DE 0 A EXPERTO y reset.
 */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Check, Share2, RotateCcw, Trophy } from 'lucide-react'
import confetti from 'canvas-confetti'
import LevelBadge from '@/components/LevelBadge'
import ExerciseCard from '@/components/ExerciseCard'
import { BRAND_CONFETTI_COLORS } from '@/components/feedback'
import { useProgress, formatXP } from '@/lib/progress'
import { BOSS_EXERCISES } from '@/data/exercises/boss'

function useCountUp(target: number, duration = 1.6): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const started = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / (duration * 1000))
      setValue(Math.round(target * (1 - (1 - t) ** 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function CompletionTakeover({ onClose }: { onClose: () => void }) {
  const xp = useProgress((s) => s.xp)
  const resetProgress = useProgress((s) => s.resetProgress)
  const shown = useCountUp(xp)
  const [copied, setCopied] = useState(false)

  // Tormenta de confetti ~2s
  useEffect(() => {
    const end = Date.now() + 2000
    const id = setInterval(() => {
      confetti({
        particleCount: 60,
        spread: 100,
        startVelocity: 42,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        colors: BRAND_CONFETTI_COLORS,
        disableForReducedMotion: true,
      })
      if (Date.now() > end) clearInterval(id)
    }, 220)
    return () => clearInterval(id)
  }, [])

  const share = async () => {
    const text = `⚡ ¡SINAPSIS COMPLETADO! De la regresión lineal a los Transformers — y el Boss Final superado con ${formatXP(xp)} XP. De 0 a experto en ML/DL, todo en el navegador.`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-bg-0/95 p-4 backdrop-blur-md"
      role="dialog"
      aria-label="Sinapsis completado"
    >
      <div className="relative w-full max-w-[560px] rounded-2xl bg-gradient-brand p-[2px]">
        <div className="rounded-2xl bg-panel px-8 py-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
            className="mx-auto mb-5 flex justify-center"
          >
            <LevelBadge level="BOSS" unlocked size="lg" />
          </motion.div>
          <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">
            ⚡ SINAPSIS COMPLETADO
          </div>
          <h3 className="font-display text-3xl font-bold tracking-[-0.03em] text-gradient-brand">
            DE 0 A EXPERTO
          </h3>
          <p className="mx-auto mt-3 max-w-[420px] text-sm leading-relaxed text-muted">
            Has superado las cinco puertas del Boss Final: exploración, preprocesado sin fugas, un MLP con
            backprop a mano, el umbral de accuracy y el informe. El pipeline completo, tuyo.
          </p>
          <div className="mt-6 font-mono text-4xl font-bold text-amber">
            {formatXP(shown)} <span className="text-base text-muted">XP totales</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => void share()}
              className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 font-mono text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {copied ? '¡Copiado!' : 'Compartir logro'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-line px-5 py-2.5 font-mono text-sm text-muted transition-colors hover:text-ink"
            >
              Seguir explorando
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Reiniciar TODO el progreso (XP, ejercicios, pistas)?')) {
                  resetProgress()
                  onClose()
                }
              }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 font-mono text-xs text-faint transition-colors hover:text-rose"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reiniciar progreso
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function BossFinal() {
  const completed = useProgress((s) => s.completed)
  const [dismissed, setDismissed] = useState(false)

  const doneCount = BOSS_EXERCISES.filter((ex) => completed[ex.id]).length
  const allDone = doneCount === BOSS_EXERCISES.length
  // El takeover aparece automáticamente al completar las 5 puertas (sin efecto)
  const takeover = allDone && !dismissed

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-8 flex flex-wrap items-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
          className="shrink-0"
        >
          <LevelBadge level="BOSS" unlocked={allDone} size="lg" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-amber">
            // PROYECTO CAPSTONE
          </div>
          <h2 className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold tracking-[-0.03em] text-ink">
            Proyecto: diagnóstico con redes neuronales
          </h2>
          <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-muted">
            Dataset médico sintético generado en-runtime: 8 variables clínicas, 2 clases, 2.000 filas
            (determinista, mismo para todo el mundo). Cinco puertas secuenciales: cada una se desbloquea al
            superar la anterior. Tu progreso queda guardado.
          </p>
        </div>
        <div className="font-mono text-xs text-faint">
          <span className="text-2xl font-bold text-amber">{doneCount}</span> / {BOSS_EXERCISES.length} puertas
        </div>
      </div>

      {/* Puertas */}
      <div className="space-y-5">
        {BOSS_EXERCISES.map((ex, i) => {
          const done = Boolean(completed[ex.id])
          const unlocked = i === 0 || Boolean(completed[BOSS_EXERCISES[i - 1].id])
          if (!unlocked) {
            return (
              <div
                key={ex.id}
                className="flex items-center gap-4 rounded-xl border border-dashed border-line bg-panel/50 px-6 py-5 opacity-70"
              >
                <Lock className="h-5 w-5 shrink-0 text-faint" aria-hidden />
                <div>
                  <div className="font-display text-base font-semibold text-faint">{ex.title}</div>
                  <div className="font-mono text-xs text-faint/70">
                    bloqueada · supera primero «{BOSS_EXERCISES[i - 1].title}»
                  </div>
                </div>
              </div>
            )
          }
          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {done && (
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  className="absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-lime text-bg-0 shadow-glow-lime"
                  aria-label="Puerta superada"
                >
                  <Check className="h-4 w-4" aria-hidden />
                </motion.span>
              )}
              <ExerciseCard exercise={ex} />
            </motion.div>
          )
        })}
      </div>

      {allDone && dismissed && (
        <button
          onClick={() => setDismissed(false)}
          className="mx-auto mt-8 flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber to-rose px-6 py-3 font-mono text-sm font-bold text-bg-0 transition-transform hover:scale-[1.03]"
        >
          <Trophy className="h-4 w-4" aria-hidden />
          Ver tu certificado DE 0 A EXPERTO
        </button>
      )}

      <AnimatePresence>{takeover && <CompletionTakeover onClose={() => setDismissed(true)} />}</AnimatePresence>
    </div>
  )
}
