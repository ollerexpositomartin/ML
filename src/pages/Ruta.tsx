/**
 * Ruta — /ruta · Mapa completo del currículo.
 * S1 header + tarjeta de progreso (XP, anillo %, ejercicios, nivel actual)
 * S2 camino serpenteante (RutaMap) · S3 temario detallado (accordions)
 * S4 cómo se desbloquea el progreso · S5 CTA.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { BookOpen, FlaskConical, Keyboard, SlidersHorizontal, Zap, ArrowRight, Trophy } from 'lucide-react'
import LevelBadge from '@/components/LevelBadge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import RutaMap from '@/components/ruta/RutaMap'
import { SYLLABUS } from '@/components/ruta/syllabus'
import { LEVELS, formatXP, useProgress } from '@/lib/progress'
import { allExercises } from '@/lib/exercises'
import { cn } from '@/lib/utils'

const XP_MAX = 2000 // umbral del BOSS

function ProgressRing({ value }: { value: number }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1400)
      setShown(value * (1 - Math.pow(1 - k, 2)))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  const R = 52
  const CIRC = 2 * Math.PI * R
  return (
    <div className="relative h-[128px] w-[128px]">
      <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden>
        <circle cx="64" cy="64" r={R} fill="none" stroke="#1C2440" strokeWidth="9" />
        <circle
          cx="64" cy="64" r={R} fill="none"
          stroke="url(#ruta-ring-grad)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - shown)}
          transform="rotate(-90 64 64)"
        />
        <defs>
          <linearGradient id="ruta-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold text-ink">{Math.round(shown * 100)}%</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">completado</span>
      </div>
    </div>
  )
}

export default function Ruta() {
  const xp = useProgress((s) => s.xp)
  const completed = useProgress((s) => s.completed)
  const currentLevel = useProgress((s) => s.currentLevel)()

  const { passed, total } = useMemo(() => {
    const reg = new Set(allExercises().map((e) => e.id))
    return {
      passed: Object.keys(completed).filter((id) => reg.has(id)).length,
      total: reg.size,
    }
  }, [completed])

  const pct = Math.min(1, xp / XP_MAX)

  return (
    <div className="blueprint-grid">
      {/* S1 · Header */}
      <header className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 70% 20%, rgba(139,92,246,0.12), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-[1.3fr_1fr] md:px-6 md:py-24">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-block rounded-full border border-violet/40 bg-violet/10 px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-violet"
            >
              // MAPA DEL CURSO
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-[clamp(2.6rem,5vw,4.2rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink"
            >
              La Ruta: <span className="text-gradient-brand">de 0 a experto</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 max-w-[640px] text-base leading-[1.75] text-muted"
            >
              Ocho etapas, un solo camino. Cada nodo muestra su temario completo, sus demos
              y sus ejercicios. Tu progreso se guarda en tu navegador.
            </motion.p>
          </div>

          {/* tarjeta de progreso */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-6 justify-self-start rounded-2xl border border-line bg-panel p-6 md:justify-self-end"
          >
            <ProgressRing value={pct} />
            <div className="space-y-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-faint">XP total</div>
                <div className="flex items-center gap-1.5 font-mono text-xl font-bold text-amber">
                  <Zap className="h-4 w-4" aria-hidden />
                  {formatXP(xp)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-faint">ejercicios</div>
                <div className="font-mono text-xl font-bold text-ink">
                  {passed}<span className="text-faint">/{total}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LevelBadge level={currentLevel.id} unlocked size="sm" />
                <span className="font-mono text-xs text-muted">{currentLevel.name}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* S2 · El Camino */}
      <section className="mx-auto max-w-[1200px] px-4 py-20 md:px-6 md:py-28">
        <div className="mb-14 text-center">
          <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">// EL CAMINO</span>
          <h2 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink">
            Ocho nodos hasta el Boss Final
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-sm leading-relaxed text-muted">
            Los nodos se iluminan a medida que ganas XP. Los bloqueos son solo una guía:
            todo el contenido es accesible libremente.
          </p>
        </div>
        <RutaMap />
      </section>

      {/* S3 · Temario detallado */}
      <section className="border-t border-line bg-bg-1/60">
        <div className="mx-auto max-w-[860px] px-4 py-20 md:px-6 md:py-28">
          <div className="mb-12">
            <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">// TEMARIO DETALLADO</span>
            <h2 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink">
              Qué aprenderás en cada módulo
            </h2>
          </div>

          <Accordion type="single" defaultValue="N0" collapsible className="space-y-3">
            {SYLLABUS.map((m) => (
              <AccordionItem
                key={m.level}
                value={m.level}
                className="overflow-hidden rounded-xl border border-line bg-panel px-0"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]>div>.lvl]:scale-110">
                  <div className="flex flex-wrap items-center gap-3 text-left">
                    <span className="lvl transition-transform"><LevelBadge level={m.level} unlocked size="sm" /></span>
                    <span className="font-display text-base font-semibold text-ink md:text-lg">{m.title}</span>
                    <span className="font-mono text-[11px] text-faint">{m.meta}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <ul className="divide-y divide-line/60">
                    {m.topics.map((t) => (
                      <motion.li
                        key={t.idx}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5"
                      >
                        <span className="w-9 font-mono text-xs text-faint">{t.idx}</span>
                        <span className="min-w-0 flex-1 text-sm text-ink">{t.name}</span>
                        <span className="flex items-center gap-3 font-mono text-[11px] text-faint">
                          {t.teoria ? (
                            <span className="flex items-center gap-1" title="Teoría">
                              <BookOpen className="h-3.5 w-3.5 text-violet" aria-hidden />{t.teoria}
                            </span>
                          ) : null}
                          {t.demos ? (
                            <span className="flex items-center gap-1" title="Demos">
                              <SlidersHorizontal className="h-3.5 w-3.5 text-cyan" aria-hidden />{t.demos}
                            </span>
                          ) : null}
                          {t.ejercicios ? (
                            <span className="flex items-center gap-1" title="Ejercicios">
                              <Keyboard className="h-3.5 w-3.5 text-lime" aria-hidden />{t.ejercicios}
                            </span>
                          ) : null}
                          <span className="w-14 text-right">{t.time}</span>
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  {m.prereqs.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-faint">prerequisitos:</span>
                      {m.prereqs.map((p) => (
                        <Link
                          key={p.path}
                          to={p.path}
                          className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-cyan/50 hover:text-cyan"
                        >
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* S4 · Cómo se desbloquea */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-6 md:py-28">
          <div className="mb-12 text-center">
            <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">// EL SISTEMA</span>
            <h2 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink">
              Cómo se desbloquea el progreso
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="rounded-2xl border border-line bg-panel p-6"
            >
              <Zap className="mb-3 h-6 w-6 text-amber" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink">XP por ejercicio</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Cada ejercicio suma entre <b className="text-cyan">20 XP</b> (básico) y{' '}
                <b className="text-amber">140 XP</b> (avanzado). Las pistas cuestan −5 XP;
                los quizzes conceptuales también suman.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="rounded-2xl border border-line bg-panel p-6"
            >
              <FlaskConical className="mb-3 h-6 w-6 text-violet" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink">Tests ocultos</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                La corrección es real: tu código corre en Python (Pyodide) dentro del navegador
                y se evalúa con aserciones sobre valores, formas y tolerancias numéricas.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="rounded-2xl border border-line bg-panel p-6"
            >
              <Trophy className="mb-3 h-6 w-6 text-rose" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink">Insignias de nivel</h3>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {LEVELS.map((l) => {
                  const unlocked = xp >= l.xpThreshold
                  return (
                    <div key={l.id} className="flex flex-col items-center gap-1" title={`${l.name} · ${l.xpThreshold} XP`}>
                      <LevelBadge level={l.id} unlocked={unlocked} size="sm" />
                      <span className={cn('font-mono text-[9px]', unlocked ? 'text-muted' : 'text-faint')}>
                        {l.xpThreshold}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
          <p className="mt-8 text-center font-mono text-xs text-faint">
            Todo el contenido es accesible libremente; los bloqueos son solo una guía.
          </p>
        </div>
      </section>

      {/* S5 · CTA */}
      <section className="border-t border-line bg-bg-1/60">
        <div className="mx-auto max-w-[720px] px-4 py-24 text-center md:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink"
          >
            ¿Listo para el Nivel 0?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/modulos/fundamentos"
              className="group flex items-center gap-2 rounded-xl bg-gradient-brand px-7 py-3.5 font-mono text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
            >
              Empezar con los fundamentos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link
              to="/laboratorio"
              className="rounded-xl border border-line px-7 py-3.5 font-mono text-sm text-muted transition-colors hover:border-cyan/50 hover:text-cyan"
            >
              Ir directo al Laboratorio
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
