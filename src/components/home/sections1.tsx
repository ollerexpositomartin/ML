/**
 * Home — Landing SINAPSIS (home.md S1–S8).
 * S1 Hero (Three.js) · S2 marquee · S3 El Camino (GSAP pinned) · S4 pilares ·
 * S5 demo GD en vivo · S6 método · S7 grid currículo · S8 CTA final.
 */

import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { CAMINO_NODES } from '@/data/modules'
import { preloadPyodide } from '@/lib/pyodide'
import LevelBadge from '@/components/LevelBadge'
import { cn } from '@/lib/utils'

const NeuralField = lazy(() => import('@/components/home/NeuralField'))

gsap.registerPlugin(ScrollTrigger)

/* ============================== S1 · HERO ============================== */

function splitChars(text: string) {
  return text.split('').map((ch, i) => (
    <span key={i} className="inline-block overflow-hidden align-bottom">
      <span className="hero-char inline-block will-change-transform">
        {ch === ' ' ? ' ' : ch}
      </span>
    </span>
  ))
}

const HERO_STATS = [
  { value: 7, suffix: '', label: 'NIVELES' },
  { value: 40, suffix: '+', label: 'DEMOS INTERACTIVAS' },
  { value: 50, suffix: '', label: 'EJERCICIOS AUTOCORREGIDOS' },
  { value: 100, suffix: '%', label: 'EN TU NAVEGADOR' },
]

function Hero() {
  const scope = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.fromTo('.hero-kicker', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(
          '.hero-char',
          { yPercent: 110, rotateX: -40 },
          { yPercent: 0, rotateX: 0, duration: 1, stagger: 0.022 },
          0.2,
        )
        .fromTo(
          '.hero-rise',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
          0.9,
        )
      // count-up de stats
      gsap.utils.toArray<HTMLElement>('.hero-stat-num').forEach((el) => {
        const target = Number(el.dataset.value)
        gsap.fromTo(
          el,
          { innerText: 0 },
          {
            innerText: target,
            duration: 1.6,
            delay: 1.2,
            snap: { innerText: 1 },
            ease: 'power2.out',
          },
        )
      })
    },
    { scope },
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={scope} className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      {/* Fallback gradiente + campo de partículas */}
      <div className="absolute inset-0 ambient-glow" aria-hidden />
      <Suspense fallback={null}>
        <div className="absolute inset-0" aria-hidden>
          <NeuralField />
        </div>
      </Suspense>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-0" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[960px] px-4 text-center md:px-6">
        <div className="hero-kicker mb-6 inline-block rounded-full border border-cyan/40 bg-cyan/10 px-4 py-1.5 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan opacity-0">
          {'// ACADEMIA INTERACTIVA · PYTHON REAL EN TU NAVEGADOR'}
        </div>

        <h1 className="font-display text-[clamp(3.2rem,7.5vw,6.8rem)] font-bold leading-[0.98] tracking-[-0.03em] text-ink [perspective:800px]">
          <span className="block">{splitChars('DE LA REGRESIÓN LINEAL')}</span>
          <span className="block text-gradient-brand">{splitChars('A LOS TRANSFORMERS.')}</span>
        </h1>

        <p className="hero-rise mx-auto mt-7 max-w-[640px] text-base leading-[1.75] text-muted opacity-0 md:text-lg">
          Domina machine learning y deep learning desde cero: cada concepto explicado con sus
          fórmulas, demos que puedes manipular y ejercicios de código corregidos al instante —
          como un Colab que te enseña.
        </p>

        <div className="hero-rise mt-9 flex flex-wrap items-center justify-center gap-4 opacity-0">
          <Link
            to="/modulos/fundamentos"
            onMouseEnter={preloadPyodide}
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-6 py-3.5 font-mono text-sm font-bold text-white shadow-glow-violet transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            Empezar desde cero
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
          <Link
            to="/ruta"
            className="rounded-lg border border-line bg-panel px-6 py-3.5 font-mono text-sm font-semibold text-ink transition-all hover:scale-[1.03] hover:border-violet/60 active:scale-[0.97]"
          >
            Ver la ruta completa
          </Link>
          <Link
            to="/laboratorio"
            className="font-mono text-sm text-muted underline decoration-faint underline-offset-4 transition-colors hover:text-cyan"
          >
            Abrir el laboratorio
          </Link>
        </div>

        {/* Stats strip */}
        <div className="hero-rise mx-auto mt-14 grid max-w-[820px] grid-cols-2 divide-line opacity-0 md:grid-cols-4 md:divide-x">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="px-4 py-3">
              <div className="font-mono text-2xl font-bold text-ink md:text-3xl">
                <span className="hero-stat-num" data-value={s.value}>
                  0
                </span>
                <span className="text-gradient-brand">{s.suffix}</span>
              </div>
              <div className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-faint">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className={cn(
          'absolute bottom-8 left-1/2 z-10 -translate-x-1/2 transition-opacity duration-500',
          scrolled ? 'opacity-0' : 'opacity-100',
        )}
        aria-hidden
      >
        <div className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-faint">SCROLL</div>
        <div className="mx-auto mt-2 h-10 w-px overflow-hidden bg-line">
          <motion.div
            className="h-4 w-px bg-cyan"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </section>
  )
}

/* ============================== S2 · MARQUEE ============================== */

const TOKENS: Array<[string, string]> = [
  ['REGRESIÓN LINEAL', 'ajustar y = wx + b minimizando el error cuadrático'],
  ['MSE', 'media de los errores al cuadrado — la función de coste clásica'],
  ['GRADIENTE DESCENDENTE', 'bajar por la superficie de coste en dirección −∇J'],
  ['LOG LOSS', 'entropía cruzada para clasificación probabilística'],
  ['BACKPROPAGATION', 'propagar el error hacia atrás con la regla de la cadena'],
  ['RELU', 'f(x) = max(0, x) — la activación que desbloqueó el deep learning'],
  ['CONVOLUCIÓN', 'deslizar un kernel para detectar patrones locales'],
  ['POOLING', 'reducir resolución conservando lo esencial'],
  ['RESNET', 'conexiones residuales que permiten redes de 100+ capas'],
  ['LSTM', 'memoria a largo plazo con puertas de olvido, entrada y salida'],
  ['EMBEDDINGS', 'palabras como vectores densos en un espacio semántico'],
  ['ATENCIÓN', 'ponderar qué tokens importan para cada predicción'],
  ['MULTI-HEAD', 'varias cabezas de atención en paralelo, distintas relaciones'],
  ['BERT', 'encoder bidireccional pre-entrenado por enmascaramiento'],
  ['GPT', 'decoder autoregresivo: predecir el siguiente token'],
  ['VAE', 'autoencoder probabilista con espacio latente continuo'],
  ['GAN', 'generador vs. discriminador en un juego minimax'],
  ['DIFUSIÓN', 'aprender a des-noise paso a paso hasta crear imágenes'],
]

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const items = [...TOKENS, ...TOKENS]
  return (
    <div className="group flex overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div
        className={cn(
          'flex shrink-0 items-center gap-8 pr-8 group-hover:[animation-play-state:paused]',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee',
        )}
      >
        {items.map(([token, def], i) => (
          <span key={i} className="group/token relative flex items-center gap-8">
            <span className="cursor-default whitespace-nowrap font-mono text-sm uppercase tracking-wider text-faint transition-colors hover:text-cyan">
              {token}
              <span className="pointer-events-none absolute -top-9 left-1/2 z-10 w-64 -translate-x-1/2 whitespace-normal rounded-lg border border-line bg-panel-2 px-3 py-2 font-sans text-xs normal-case tracking-normal text-muted opacity-0 shadow-xl transition-opacity group-hover/token:opacity-100">
                {def}
              </span>
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-brand" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  )
}

function ConceptMarquee() {
  return (
    <section className="border-y border-line bg-bg-1" aria-label="Conceptos que dominarás">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.9 }}
        transition={{ duration: 0.8 }}
      >
        <MarqueeRow />
        <MarqueeRow reverse />
      </motion.div>
    </section>
  )
}

/* ============================== S3 · EL CAMINO ============================== */

function Camino() {
  const scope = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: scope.current,
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: 1,
        onUpdate: (self) => setProgress(self.progress),
      })
    },
    { scope },
  )

  const activeIdx = Math.min(CAMINO_NODES.length - 1, Math.floor(progress * CAMINO_NODES.length))

  return (
    <section ref={scope} className="relative overflow-hidden bg-bg-0">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-[1200px] gap-12 px-4 py-24 md:grid-cols-[40%_60%] md:px-6">
        {/* Columna izquierda sticky */}
        <div className="flex flex-col justify-center">
          <div className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
            {'// EL CAMINO'}
          </div>
          <h2 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-ink">
            DE 0 A EXPERTO
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-[1.75] text-muted">
            Ocho niveles. Cada uno con su teoría, sus demos y sus ejercicios corregidos
            automáticamente. Sin saltos, sin lagunas, sin instalar nada.
          </p>
          {/* Barra de progreso */}
          <div className="mt-8 max-w-sm">
            <div className="mb-2 flex justify-between font-mono text-xs text-faint">
              <span>N0</span>
              <span className="text-ink">{CAMINO_NODES[activeIdx].name}</span>
              <span>BOSS</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-gradient-brand transition-[width] duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Columna derecha: línea + nodos */}
        <div className="relative flex items-center">
          <div className="absolute bottom-16 left-[27px] top-16 w-px bg-line" aria-hidden />
          <div
            className="absolute left-[27px] top-16 w-px bg-gradient-brand"
            style={{ height: `calc((100% - 8rem) * ${progress})` }}
            aria-hidden
          />
          <div className="w-full space-y-4">
            {CAMINO_NODES.map((node, i) => {
              const active = i === activeIdx
              const passed = i < activeIdx
              return (
                <Link
                  key={node.level}
                  to={node.path}
                  className={cn(
                    'relative block rounded-xl border bg-panel pl-16 pr-5 transition-all duration-500',
                    active
                      ? 'scale-100 border-violet/70 py-5 shadow-glow-violet'
                      : 'scale-95 border-line py-3.5 opacity-70 hover:opacity-100',
                  )}
                  style={passed ? { borderColor: `${node.color}55` } : undefined}
                >
                  <span
                    className="absolute left-[7px] top-1/2 -translate-y-1/2"
                    aria-hidden
                  >
                    <span
                      className={cn(
                        'block h-[14px] w-[14px] rounded-full border-2 transition-all',
                        active ? 'border-violet bg-violet shadow-glow-violet' : passed ? 'border-cyan bg-cyan/40' : 'border-line bg-bg-0',
                      )}
                    />
                  </span>
                  <div className="flex items-center gap-3">
                    <LevelBadge level={node.level as 'N0'} unlocked={active || passed} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-mono text-xs font-bold" style={{ color: node.color }}>
                          {node.level}
                        </span>
                        <span className="font-display text-base font-semibold text-ink">{node.name}</span>
                      </div>
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-500',
                          active ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0',
                        )}
                      >
                        <p className="pt-1 text-sm text-muted">{node.outcome}</p>
                      </div>
                    </div>
                    <span className="ml-auto hidden shrink-0 font-mono text-[10px] text-faint sm:block">
                      {node.meta}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero, ConceptMarquee, Camino }
