/**
 * ExerciseCard — Ejercicio autocorregido.
 * Chip de dificultad, XP, enunciado con KaTeX, CodeCell con starter code,
 * botón "Corregir" (harness de tests ocultos en Pyodide), panel de resultados
 * ✓/✗ por test, pistas progresivas (−5 XP), confetti + toast al superarlo.
 * Estado persistido vía progress store.
 *
 * Uso: <ExerciseCard exercise={getExercise('fundamentos-reg-lineal')!} />
 *      o <ExerciseCard exercise={{ …Exercise }} />
 */

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, Lightbulb, FlaskConical, CheckCircle2, Loader2, Zap } from 'lucide-react'
import type { Exercise, ExerciseDifficulty } from '@/lib/exercises'
import { gradeExercise, type GradingResult } from '@/lib/grading'
import { useProgress, HINT_COST } from '@/lib/progress'
import { TeXParagraphs } from '@/lib/katex-content'
import CodeCell, { type CodeCellHandle } from './CodeCell'
import { fireConfetti, toastXP } from './feedback'
import { cn } from '@/lib/utils'

const DIFF_STYLE: Record<ExerciseDifficulty, { color: string; border: string; bg: string }> = {
  BASICO: { color: 'text-cyan', border: 'border-cyan/40', bg: 'bg-cyan/10' },
  INTERMEDIO: { color: 'text-violet', border: 'border-violet/40', bg: 'bg-violet/10' },
  AVANZADO: { color: 'text-amber', border: 'border-amber/40', bg: 'bg-amber/10' },
}

export default function ExerciseCard({
  exercise,
  className,
}: {
  exercise: Exercise
  className?: string
}) {
  const cellRef = useRef<CodeCellHandle>(null)
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradingResult | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [shake, setShake] = useState(0)

  const completed = useProgress((s) => Boolean(s.completed[exercise.id]))
  const hintsRevealed = useProgress((s) => s.hintsUsed[exercise.id] ?? 0)
  const completeExercise = useProgress((s) => s.completeExercise)
  const useHint = useProgress((s) => s.useHint)

  const diff = DIFF_STYLE[exercise.difficulty]

  const handleGrade = async () => {
    const code = cellRef.current?.getCode()
    if (code == null || grading) return
    setGrading(true)
    setResult(null)
    const res = await gradeExercise(exercise, code)
    setGrading(false)
    setResult(res)
    if (res.allPassed) {
      if (!completed) {
        completeExercise(exercise.id, res.xpAwarded, res.score)
        toastXP(res.xpAwarded, `Ejercicio superado: ${exercise.title}`)
        fireConfetti()
      }
    } else {
      setFailedAttempts((n) => n + 1)
      setShake((n) => n + 1)
    }
  }

  const revealHint = () => {
    if (hintsRevealed >= exercise.hints.length) return
    useHint(exercise.id, HINT_COST)
    toastXP(-HINT_COST, 'Pista revelada')
  }

  return (
    <motion.section
      key={shake}
      animate={shake ? { x: [0, -6, 6, 0] } : undefined}
      transition={{ duration: 0.3 }}
      className={cn('overflow-hidden rounded-xl border border-line bg-panel', className)}
      aria-label={`Ejercicio: ${exercise.title}`}
    >
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
        <FlaskConical className="h-4 w-4 text-violet" aria-hidden />
        <h3 className="font-display text-lg font-semibold text-ink">{exercise.title}</h3>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
            diff.color, diff.border, diff.bg,
          )}
        >
          {exercise.difficulty}
        </span>
        <span className="flex items-center gap-1 font-mono text-xs font-bold text-amber">
          <Zap className="h-3.5 w-3.5" aria-hidden />
          {exercise.xp} XP
        </span>
        {completed && (
          <span className="ml-auto flex items-center gap-1.5 font-mono text-xs text-lime">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Completado
          </span>
        )}
      </div>

      {/* Enunciado */}
      <div className="border-b border-line px-6 py-5">
        <TeXParagraphs content={exercise.statement} className="text-sm leading-relaxed text-muted" />
      </div>

      {/* Editor */}
      <div className="p-4">
        <CodeCell
          ref={cellRef}
          initialCode={exercise.starter_code}
          solutionCode={exercise.solution_code}
        />
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-6 py-4">
        <button
          onClick={() => void handleGrade()}
          disabled={grading}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 font-mono text-sm font-bold text-white',
            'transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50',
          )}
        >
          {grading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FlaskConical className="h-4 w-4" aria-hidden />}
          {grading ? 'Corrigiendo…' : 'Corregir'}
        </button>

        {exercise.hints.length > 0 && hintsRevealed < exercise.hints.length && (
          <button
            onClick={revealHint}
            className="flex items-center gap-1.5 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 font-mono text-xs text-amber transition-colors hover:bg-amber/20"
          >
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            Pista {hintsRevealed + 1}/{exercise.hints.length} (−{HINT_COST} XP)
          </button>
        )}

        {failedAttempts > 0 && result && !result.allPassed && (
          <span className="font-mono text-xs text-faint">
            Intentos: {failedAttempts}
          </span>
        )}
      </div>

      {/* Pistas reveladas */}
      {hintsRevealed > 0 && (
        <div className="space-y-2 border-t border-line bg-amber/5 px-6 py-4">
          {exercise.hints.slice(0, hintsRevealed).map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber/90">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <TeXParagraphs content={h} />
            </div>
          ))}
        </div>
      )}

      {/* Resultados */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-line"
          >
            <div className="px-6 py-5">
              {result.fatalError ? (
                <div className="rounded-lg border border-rose/40 bg-rose/10 px-4 py-3">
                  <div className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-rose">
                    Error en tu código
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-rose/90">{result.fatalError}</pre>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className={cn(
                        'font-mono text-sm font-bold',
                        result.allPassed ? 'text-lime' : 'text-rose',
                      )}
                    >
                      {result.passed}/{result.total} tests superados
                    </span>
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                      <span
                        className={cn('block h-full transition-all', result.allPassed ? 'bg-lime' : 'bg-gradient-loss')}
                        style={{ width: `${result.score * 100}%` }}
                      />
                    </span>
                  </div>
                  <ul className="space-y-2 font-mono text-xs">
                    {result.results.map((t, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        {t.passed ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" aria-hidden />
                        ) : (
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" aria-hidden />
                        )}
                        <span className={t.passed ? 'text-muted' : 'text-ink'}>
                          {t.name}
                          {!t.passed && t.message && (
                            <span className="block pl-0.5 pt-0.5 text-rose/80">{t.message}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {result.allPassed && (
                    <div className="mt-4 rounded-lg border border-lime/40 bg-lime/10 px-4 py-3 font-mono text-xs text-lime">
                      ✓ ¡Todos los tests en verde! +{result.xpAwarded} XP
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
