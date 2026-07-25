/**
 * ExerciseCenter — S2 del Laboratorio: centro de ejercicios filtrable.
 * Barra de filtros sticky (nivel multi-chip, dificultad, estado, búsqueda),
 * grid de tarjetas con layout FLIP, y drawer de corrección split-view 60/40:
 * enunciado KaTeX + pistas + lista de tests (nombres) | CodeCell + Corregir +
 * resultados. Consume el registro global allExercises() (rellenado por los
 * módulos cuando el agente principal añada el import agregador).
 */

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  X,
  Check,
  Circle,
  Lightbulb,
  FlaskConical,
  Loader2,
  Zap,
  ChevronDown,
  ListChecks,
} from 'lucide-react'
import type { Exercise, ExerciseDifficulty } from '@/lib/exercises'
import { gradeExercise, type GradingResult } from '@/lib/grading'
import { useProgress, HINT_COST } from '@/lib/progress'
import { TeXParagraphs } from '@/lib/katex-content'
import CodeCell, { type CodeCellHandle } from '@/components/CodeCell'
import { fireConfetti, toastXP } from '@/components/feedback'
import { exerciseMeta, LEVEL_ORDER, LEVEL_COLORS } from './exerciseMeta'
import { cn } from '@/lib/utils'

const DIFF_STYLE: Record<ExerciseDifficulty, string> = {
  BASICO: 'text-cyan border-cyan/40 bg-cyan/10',
  INTERMEDIO: 'text-violet border-violet/40 bg-violet/10',
  AVANZADO: 'text-amber border-amber/40 bg-amber/10',
}

type EstadoFilter = 'todos' | 'pendientes' | 'superados'

/** Extrae los nombres de los tests del harness (solo vista previa). */
function testNames(testCode: string): string[] {
  const names: string[] = []
  const re = /check\(\s*"((?:[^"\\]|\\.)*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(testCode)) !== null) names.push(m[1])
  return names
}

/* ================= Drawer split-view ================= */

function GradingDrawer({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const cellRef = useRef<CodeCellHandle>(null)
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradingResult | null>(null)
  const [hintsOpen, setHintsOpen] = useState(false)

  const completed = useProgress((s) => Boolean(s.completed[exercise.id]))
  const hintsRevealed = useProgress((s) => s.hintsUsed[exercise.id] ?? 0)
  const completeExercise = useProgress((s) => s.completeExercise)
  const spendHint = useProgress((s) => s.useHint)
  const meta = exerciseMeta(exercise.id)
  const names = useMemo(() => testNames(exercise.test_code), [exercise.test_code])

  const handleGrade = async () => {
    const code = cellRef.current?.getCode()
    if (code == null || grading) return
    setGrading(true)
    setResult(null)
    const res = await gradeExercise(exercise, code)
    setGrading(false)
    setResult(res)
    if (res.allPassed && !completed) {
      completeExercise(exercise.id, res.xpAwarded, res.score)
      toastXP(res.xpAwarded, `Ejercicio superado: ${exercise.title}`)
      fireConfetti()
    }
  }

  const revealHint = () => {
    if (hintsRevealed >= exercise.hints.length) return
    spendHint(exercise.id, HINT_COST)
    toastXP(-HINT_COST, 'Pista revelada')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-bg-0/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[86dvh] w-full max-w-[1200px] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-line bg-panel shadow-2xl"
        role="dialog"
        aria-label={`Corrección del ejercicio ${exercise.title}`}
      >
        {/* Cabecera del drawer */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-panel-2 px-5 py-3">
          <span className="font-mono text-xs text-faint">{exercise.id}</span>
          <h3 className="font-display text-lg font-semibold text-ink">{exercise.title}</h3>
          <span className={cn('rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider', DIFF_STYLE[exercise.difficulty])}>
            {exercise.difficulty}
          </span>
          <span className="flex items-center gap-1 font-mono text-xs font-bold text-amber">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            {exercise.xp} XP
          </span>
          <span
            className="rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
            style={{ color: meta.color, borderColor: `${meta.color}55` }}
          >
            {meta.level} · {meta.label}
          </span>
          {completed && (
            <span className="flex items-center gap-1 font-mono text-xs text-lime">
              <Check className="h-4 w-4" aria-hidden /> Superado
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 text-muted transition-colors hover:bg-panel hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Split view 60/40 */}
        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[3fr_2fr] md:overflow-hidden">
          {/* Izquierda: enunciado + pistas + tests */}
          <div className="min-w-0 space-y-5 border-b border-line px-6 py-5 md:overflow-y-auto md:border-b-0 md:border-r">
            <TeXParagraphs content={exercise.statement} className="text-sm leading-relaxed text-muted" />

            {/* Pistas */}
            <div className="rounded-lg border border-line bg-bg-1">
              <button
                onClick={() => setHintsOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-4 py-3 font-mono text-xs text-amber"
                aria-expanded={hintsOpen}
              >
                <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                Pistas ({hintsRevealed}/{exercise.hints.length} reveladas)
                <ChevronDown className={cn('ml-auto h-3.5 w-3.5 transition-transform', hintsOpen && 'rotate-180')} aria-hidden />
              </button>
              <AnimatePresence initial={false}>
                {hintsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 px-4 pb-4">
                      {exercise.hints.slice(0, hintsRevealed).map((h, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-md bg-amber/5 px-3 py-2 text-sm text-amber/90">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <TeXParagraphs content={h} />
                        </div>
                      ))}
                      {hintsRevealed < exercise.hints.length && (
                        <button
                          onClick={revealHint}
                          className="rounded-md border border-amber/40 bg-amber/10 px-3 py-1.5 font-mono text-xs text-amber transition-colors hover:bg-amber/20"
                        >
                          Revelar pista {hintsRevealed + 1} (−{HINT_COST} XP)
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tests ocultos: solo nombres */}
            <div className="rounded-lg border border-line bg-bg-1 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 font-mono text-xs text-faint">
                <ListChecks className="h-3.5 w-3.5" aria-hidden />
                Tests ocultos ({names.length}) — se evalúan al corregir
              </div>
              <ul className="space-y-1.5 font-mono text-xs text-muted">
                {names.map((n, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-faint">{String(i + 1).padStart(2, '0')}</span> {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Derecha: editor + corregir + resultados */}
          <div className="flex min-w-0 flex-col gap-3 px-4 py-4 md:overflow-y-auto">
            <CodeCell
              ref={cellRef}
              initialCode={exercise.starter_code}
              solutionCode={exercise.solution_code}
              maxHeight={300}
            />
            <button
              onClick={() => void handleGrade()}
              disabled={grading}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 font-mono text-sm font-bold text-white',
                'transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50',
              )}
            >
              {grading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FlaskConical className="h-4 w-4" aria-hidden />}
              {grading ? 'Corrigiendo…' : 'Corregir'}
            </button>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-line bg-bg-1 px-4 py-3"
                >
                  {result.fatalError ? (
                    <>
                      <div className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-rose">
                        Error en tu código
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-rose/90">{result.fatalError}</pre>
                    </>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center gap-3">
                        <span className={cn('font-mono text-sm font-bold', result.allPassed ? 'text-lime' : 'text-rose')}>
                          {result.passed}/{result.total} tests
                        </span>
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: `${result.score * 100}%` }}
                            className={cn('block h-full', result.allPassed ? 'bg-lime' : 'bg-gradient-loss')}
                          />
                        </span>
                      </div>
                      <ul className="space-y-1.5 font-mono text-xs">
                        {result.results.map((t, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-2"
                          >
                            {t.passed ? (
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" aria-hidden />
                            ) : (
                              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" aria-hidden />
                            )}
                            <span className={t.passed ? 'text-muted' : 'text-ink'}>
                              {t.name}
                              {!t.passed && t.message && (
                                <span className="block text-rose/80">{t.message}</span>
                              )}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ================= Centro de ejercicios ================= */

export default function ExerciseCenter({ exercises }: { exercises: Exercise[] }) {
  const [niveles, setNiveles] = useState<string[]>([])
  const [dificultad, setDificultad] = useState<ExerciseDifficulty | null>(null)
  const [estado, setEstado] = useState<EstadoFilter>('todos')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const completedMap = useProgress((s) => s.completed)

  const nivelesPresentes = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) set.add(exerciseMeta(ex.id).level)
    return LEVEL_ORDER.filter((l) => set.has(l))
  }, [exercises])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return exercises.filter((ex) => {
      const meta = exerciseMeta(ex.id)
      if (niveles.length > 0 && !niveles.includes(meta.level)) return false
      if (dificultad && ex.difficulty !== dificultad) return false
      if (estado === 'superados' && !completedMap[ex.id]) return false
      if (estado === 'pendientes' && completedMap[ex.id]) return false
      if (q && !`${ex.id} ${ex.title} ${meta.label}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [exercises, niveles, dificultad, estado, search, completedMap])

  const toggleNivel = (l: string) =>
    setNiveles((ns) => (ns.includes(l) ? ns.filter((x) => x !== l) : [...ns, l]))

  const doneCount = exercises.filter((ex) => completedMap[ex.id]).length

  return (
    <div>
      {/* Barra de filtros sticky bajo el navbar */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-line bg-bg-0/90 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {nivelesPresentes.map((l) => {
              const active = niveles.includes(l)
              const color = LEVEL_COLORS[l] ?? '#8E9AB8'
              return (
                <button
                  key={l}
                  onClick={() => toggleNivel(l)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold transition-colors',
                    active ? 'text-bg-0' : 'text-muted hover:text-ink',
                  )}
                  style={
                    active
                      ? { background: color, borderColor: color }
                      : { borderColor: `${color}55` }
                  }
                  aria-pressed={active}
                >
                  {l}
                </button>
              )
            })}
          </div>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <div className="flex items-center gap-1.5">
            {(['BASICO', 'INTERMEDIO', 'AVANZADO'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDificultad(dificultad === d ? null : d)}
                className={cn(
                  'rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase transition-colors',
                  dificultad === d ? DIFF_STYLE[d] : 'border-line text-faint hover:text-muted',
                )}
                aria-pressed={dificultad === d}
              >
                {d === 'BASICO' ? 'Básico' : d === 'INTERMEDIO' ? 'Intermedio' : 'Avanzado'}
              </button>
            ))}
          </div>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <div className="flex items-center gap-1.5">
            {(['todos', 'pendientes', 'superados'] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEstado(e)}
                className={cn(
                  'rounded-full border px-2.5 py-1 font-mono text-[11px] capitalize transition-colors',
                  estado === e ? 'border-lime/50 bg-lime/10 text-lime' : 'border-line text-faint hover:text-muted',
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ejercicio…"
              className="w-48 rounded-md border border-line bg-panel py-1.5 pl-8 pr-3 font-mono text-xs text-ink placeholder:text-faint focus:border-cyan/50 focus:outline-none"
              aria-label="Buscar ejercicio"
            />
          </div>
        </div>
      </div>

      <div className="mb-4 font-mono text-xs text-faint">
        {filtered.length} de {exercises.length} ejercicios · {doneCount} superados
      </div>

      {/* Grid con FLIP */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {filtered.map((ex) => {
            const meta = exerciseMeta(ex.id)
            const done = Boolean(completedMap[ex.id])
            return (
              <motion.button
                key={ex.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                onClick={() => setSelected(ex)}
                className="group rounded-xl border border-line bg-panel p-4 text-left transition-all hover:-translate-y-1 hover:border-violet/60 hover:shadow-glow-violet"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-faint">{ex.id}</span>
                  {done ? (
                    <Check className="h-4 w-4 text-lime" aria-label="Superado" />
                  ) : (
                    <Circle className="h-4 w-4 text-faint/50" aria-label="Pendiente" />
                  )}
                </div>
                <div className="mb-3 line-clamp-2 font-display text-sm font-semibold leading-snug text-ink group-hover:text-white">
                  {ex.title}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider', DIFF_STYLE[ex.difficulty])}>
                    {ex.difficulty}
                  </span>
                  <span className="flex items-center gap-0.5 font-mono text-[10px] font-bold text-amber">
                    <Zap className="h-3 w-3" aria-hidden />
                    {ex.xp}
                  </span>
                  <span
                    className="ml-auto rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                    style={{ color: meta.color, borderColor: `${meta.color}55` }}
                  >
                    {meta.level}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center font-mono text-sm text-faint">
          Ningún ejercicio coincide con los filtros.
          {exercises.length === 0 && ' El registro aún se está cargando…'}
        </div>
      )}

      {/* Drawer de corrección */}
      <AnimatePresence>
        {selected && <GradingDrawer exercise={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
