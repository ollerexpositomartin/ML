/**
 * QuizCard — Chequeo conceptual tipo test. Las opciones son cards;
 * al hacer clic → flip de 200ms, correcta lime / incorrecta rose con
 * acordeón de explicación.
 *
 * Uso:
 *   <QuizCard
 *     question="¿Qué mide la función MSE?"
 *     options={[
 *       { text: 'El error absoluto medio', correct: false, explanation: 'Eso sería el MAE…' },
 *       { text: 'La media de los errores al cuadrado', correct: true, explanation: '¡Exacto! …' },
 *     ]}
 *     xp={10}  // opcional: otorga XP al acertar la primera vez
 *     quizId="fundamentos-quiz-1" // requerido si xp>0 (persistencia)
 *   />
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, ChevronDown, BrainCircuit } from 'lucide-react'
import { TeXParagraphs } from '@/lib/katex-content'
import { useProgress } from '@/lib/progress'
import { toastXP } from './feedback'
import { cn } from '@/lib/utils'

export interface QuizOption {
  text: string
  correct: boolean
  explanation: string
}

export default function QuizCard({
  question,
  options,
  xp = 0,
  quizId,
  className,
}: {
  question: string
  options: QuizOption[]
  xp?: number
  quizId?: string
  className?: string
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const id = quizId ? `quiz:${quizId}` : undefined
  const alreadyDone = useProgress((s) => (id ? Boolean(s.completed[id]) : false))
  const completeExercise = useProgress((s) => s.completeExercise)

  const pick = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    setExplanationOpen(true)
    if (options[i].correct && xp > 0 && id && !alreadyDone) {
      completeExercise(id, xp, 1)
      toastXP(xp, 'Respuesta correcta')
    }
  }

  return (
    <div className={cn('rounded-xl border border-line bg-panel p-6', className)}>
      <div className="mb-4 flex items-start gap-3">
        <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden />
        <TeXParagraphs content={question} className="font-medium leading-relaxed text-ink" />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const revealed = selected !== null
          return (
            <motion.button
              key={i}
              onClick={() => pick(i)}
              disabled={revealed}
              whileTap={revealed ? undefined : { scale: 0.97 }}
              animate={isSelected ? { rotateY: [0, 90, 0] } : undefined}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-start gap-2.5 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                !revealed && 'border-line bg-panel-2 text-muted hover:border-violet/60 hover:text-ink',
                revealed && opt.correct && 'border-lime/60 bg-lime/10 text-lime',
                revealed && isSelected && !opt.correct && 'border-rose/60 bg-rose/10 text-rose',
                revealed && !isSelected && !opt.correct && 'border-line bg-panel text-faint',
              )}
            >
              {revealed && opt.correct && <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
              {revealed && isSelected && !opt.correct && <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
              <TeXParagraphs content={opt.text} />
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <button
              onClick={() => setExplanationOpen((v) => !v)}
              className="mt-4 flex items-center gap-1.5 font-mono text-xs text-cyan"
              aria-expanded={explanationOpen}
            >
              Explicación
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', explanationOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {explanationOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-lg border border-line bg-bg-1 px-4 py-3 text-sm leading-relaxed text-muted">
                    <TeXParagraphs content={options[selected].explanation} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
