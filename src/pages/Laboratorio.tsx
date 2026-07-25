/**
 * Página /laboratorio — El corazón Colab de SINAPSIS.
 * Notebook libre (S1) + centro de ejercicios filtrable con corrección
 * split-view (S2) + Boss Final de 5 puertas secuenciales (S3) + logros (S4).
 *
 * CONTRATO DEL REGISTRO: el centro de ejercicios consume `allExercises()` de
 * `@/lib/exercises`. El registro lo rellenan los archivos `src/data/exercises/`
 * de cada módulo (este archivo NO los importa, salvo `boss.ts` que es propio);
 * el agente principal añadirá el import agregador. Para re-renderizar cuando
 * el registro crezca, `useExerciseRegistry()` sondea el conteo cada segundo.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import { Map, RotateCcw, Zap } from 'lucide-react'
import Notebook from '@/components/lab/Notebook'
import ExerciseCenter from '@/components/lab/ExerciseCenter'
import BossFinal from '@/components/lab/BossFinal'
import Logros from '@/components/lab/Logros'
import { allExercises, type Exercise } from '@/lib/exercises'
import { preloadPyodide, usePyodideStatus } from '@/lib/pyodide'
import { cn } from '@/lib/utils'
import '@/data/exercises/boss'

/** Devuelve la lista de ejercicios del registro y se actualiza si este crece. */
function useExerciseRegistry(): Exercise[] {
  const [snapshot, setSnapshot] = useState<Exercise[]>(() => allExercises())
  useEffect(() => {
    const id = setInterval(() => {
      setSnapshot((prev) => {
        const now = allExercises()
        return now.length !== prev.length ? now : prev
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return snapshot
}

const STATUS_UI: Record<string, { text: string; dot: string; textColor: string }> = {
  idle: { text: 'Cargando runtime…', dot: 'bg-amber animate-pulse', textColor: 'text-amber' },
  cargando: { text: 'Cargando runtime…', dot: 'bg-amber animate-pulse', textColor: 'text-amber' },
  listo: { text: 'runtime listo (Python 3.12 · numpy · matplotlib)', dot: 'bg-lime', textColor: 'text-lime' },
  error: { text: 'runtime: error de carga', dot: 'bg-rose', textColor: 'text-rose' },
}

function SectionShell({
  id,
  kicker,
  title,
  accent = '#22D3EE',
  children,
}: {
  id: string
  kicker: string
  title: string
  accent?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <span
          className="mb-4 inline-block rounded-full border px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em]"
          style={{ color: accent, borderColor: `${accent}44`, background: `${accent}11` }}
        >
          {kicker}
        </span>
        <h2 className="mb-8 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink">
          {title}
        </h2>
        {children}
      </motion.div>
    </section>
  )
}

export default function Laboratorio() {
  const status = usePyodideStatus((s) => s.status)
  const exercises = useExerciseRegistry()
  const location = useLocation()
  const st = STATUS_UI[status]

  // Warm-up del runtime nada más entrar
  useEffect(() => {
    preloadPyodide()
  }, [])

  // Ancla #boss (Layout hace scroll-to-top al cambiar de ruta)
  useEffect(() => {
    if (location.hash === '#boss') {
      const id = setTimeout(() => {
        document.getElementById('boss')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
      return () => clearTimeout(id)
    }
  }, [location.hash])

  return (
    <div>
      {/* ---------- S0 · Hero ---------- */}
      <header className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 70% 20%, rgba(34,211,238,0.14), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:px-6 md:py-24">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 flex flex-wrap items-center gap-3"
            >
              <span className="rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
                // PYTHON REAL · CERO INSTALACIÓN
              </span>
              {/* Chip de estado del runtime */}
              <span className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 font-mono text-[11px]">
                <span className={cn('h-2 w-2 rounded-full', st.dot)} aria-hidden />
                <span className={st.textColor}>{st.text}</span>
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-[clamp(2.6rem,5vw,4.2rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink"
            >
              El Laboratorio
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 max-w-[640px] text-base leading-[1.75] text-muted"
            >
              Todo el poder de un notebook — NumPy, gráficas, datasets — corriendo en tu navegador gracias a
              Pyodide. Programa, ejecuta, y deja que los tests te corrijan.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, rotate: 4, scale: 0.94 }}
            animate={{ opacity: 1, rotate: 3, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative hidden md:block"
          >
            <img
              src="/art-lab.png"
              alt="Artwork del Laboratorio: un notebook holográfico flotando en el espacio"
              className="w-full rounded-2xl border border-line object-cover"
              style={{ boxShadow: '0 0 70px rgba(34,211,238,0.18)' }}
              loading="eager"
            />
          </motion.div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* ---------- S1 · Notebook ---------- */}
        <SectionShell id="notebook" kicker="// 01 · NOTEBOOK LIBRE" title="Tu notebook en el navegador" accent="#22D3EE">
          <Notebook />
        </SectionShell>

        {/* ---------- S2 · Centro de ejercicios ---------- */}
        <div className="border-t border-line">
          <SectionShell id="ejercicios" kicker="// 02 · CENTRO DE EJERCICIOS" title="Todos los ejercicios, un solo lugar" accent="#8B5CF6">
            <ExerciseCenter exercises={exercises} />
          </SectionShell>
        </div>

        {/* ---------- S3 · Boss Final ---------- */}
        <div id="boss" className="scroll-mt-20 border-t border-line">
          <div
            className="-mx-4 px-4 py-16 md:-mx-6 md:px-6 md:py-20"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(251,191,36,0.07), transparent 70%)' }}
          >
            <BossFinal />
          </div>
        </div>

        {/* ---------- S4 · Logros ---------- */}
        <div className="border-t border-line">
          <SectionShell id="logros" kicker="// 04 · TU PROGRESO" title="Logros e insignias" accent="#A3E635">
            <Logros exercises={exercises} />
          </SectionShell>
        </div>

        {/* ---------- S5 · CTA final ---------- */}
        <div className="border-t border-line py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Zap className="mx-auto mb-4 h-6 w-6 text-amber" aria-hidden />
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold tracking-[-0.03em] text-ink">
              ¿Te has atascado? Vuelve a la ruta.
            </h2>
            <p className="mx-auto mt-3 max-w-[480px] text-sm leading-relaxed text-muted">
              El Laboratorio siempre estará aquí. A veces la respuesta está tres niveles atrás.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/ruta"
                className="flex items-center gap-2 rounded-lg bg-gradient-brand px-6 py-3 font-mono text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
              >
                <Map className="h-4 w-4" aria-hidden />
                Volver a la Ruta
              </Link>
              <Link
                to="/modulos/fundamentos"
                className="flex items-center gap-2 rounded-lg border border-line px-6 py-3 font-mono text-sm text-muted transition-colors hover:border-violet/50 hover:text-ink"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Repetir un módulo
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
