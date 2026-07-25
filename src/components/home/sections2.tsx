/**
 * Home — secciones S4–S8: pilares, demo en vivo, método, grid de currículo, CTA final.
 */

import { useRef } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Sigma, SlidersHorizontal, FlaskConical, ArrowRight, Zap, type LucideIcon } from 'lucide-react'
import { CAMINO_NODES } from '@/data/modules'
import GDDemo from '@/components/home/GDDemo'

gsap.registerPlugin(ScrollTrigger)

const ART_BY_LEVEL: Record<string, string> = {
  N0: '/art-fundamentos.png',
  N1: '/art-clasico.png',
  N2: '/art-redes.png',
  N3: '/art-cnn.png',
  N4: '/art-secuencias.png',
  N5: '/art-transformers.png',
  N6: '/art-generativos.png',
  BOSS: '/art-lab.png',
}

/* ============================== S4 · PILARES ============================== */

const PILLARS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Sigma,
    title: 'FÓRMULAS VIVAS',
    body: 'Cada concepto con su matemática completa: desglose símbolo a símbolo, sin cajas negras.',
  },
  {
    icon: SlidersHorizontal,
    title: 'DEMOS MANIPULABLES',
    body: 'Mueve la tasa de aprendizaje, arrastra la frontera de decisión, mira la atención. La intuición se entrena.',
  },
  {
    icon: FlaskConical,
    title: 'CORRECCIÓN REAL',
    body: 'Escribes Python de verdad; tests ocultos evalúan tu código y te dicen exactamente qué falla. Estilo Colab, sin instalar nada.',
  },
]

function TiltCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useTransform(my, [0, 1], [6, -6])
  const rotateY = useTransform(mx, [0, 1], [-6, 6])

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        mx.set((e.clientX - r.left) / r.width)
        my.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => {
        mx.set(0.5)
        my.set(0.5)
      }}
      whileHover={{ y: -6 }}
      className="pillar-card group relative rounded-xl border border-line bg-panel p-7 transition-colors hover:border-violet/60"
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.05))' }}
        aria-hidden
      />
      <div className="relative">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-panel-2 transition-colors group-hover:border-cyan/50">
          <Icon className="h-5 w-5 text-cyan" aria-hidden />
        </span>
        <h3 className="mt-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-ink">{title}</h3>
        <p className="mt-3 text-sm leading-[1.75] text-muted">{body}</p>
      </div>
    </motion.div>
  )
}

function Pilares() {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo(
        '.pillar-card',
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: scope.current, start: 'top 80%' },
        },
      )
    },
    { scope },
  )
  return (
    <section ref={scope} className="mx-auto max-w-[1200px] px-4 py-28 md:px-6 md:py-36">
      <div className="mb-12 text-center">
        <div className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
          {'// APRENDE HACIENDO'}
        </div>
        <h2 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink">
          Tres pilares, cero relleno
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {PILLARS.map((p) => (
          <TiltCard key={p.title} {...p} />
        ))}
      </div>
    </section>
  )
}

/* ============================== S5 · DEMO EN VIVO ============================== */

function LiveDemo() {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo(
        '.demo-frame-wrap',
        { scale: 0.94, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: scope.current, start: 'top 78%' },
        },
      )
    },
    { scope },
  )
  return (
    <section ref={scope} className="border-y border-line bg-bg-1">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-28 md:grid-cols-[40%_60%] md:px-6 md:py-36">
        <div>
          <div className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
            {'// DEMO EN VIVO'}
          </div>
          <h2 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink">
            No lo leas. <span className="text-gradient-brand">Tócalo.</span>
          </h2>
          <p className="mt-4 text-sm leading-[1.75] text-muted">
            Cada página de SINAPSIS incrusta interactivos como este: una superficie de coste
            convexa donde controlas el punto de partida y la tasa de aprendizaje η. Demasiado
            grande y diverge; demasiado pequeña y tarda una eternidad. Esa intuición no se
            aprende leyendo.
          </p>
          <Link
            to="/modulos/fundamentos"
            className="mt-6 inline-flex items-center gap-2 font-mono text-sm font-semibold text-cyan transition-colors hover:text-ink"
          >
            Ver las 40+ demos
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="demo-frame-wrap">
          <GDDemo />
        </div>
      </div>
    </section>
  )
}

/* ============================== S6 · MÉTODO ============================== */

const STEPS = [
  { n: '01', verb: 'LEER', what: 'la teoría', body: 'Explicaciones profundas con cada fórmula desglosada.' },
  { n: '02', verb: 'VISUALIZAR', what: 'la demo', body: 'Manipula los hiperparámetros y observa qué cambia.' },
  { n: '03', verb: 'PROGRAMAR', what: 'la solución', body: 'Python real en la celda, numpy incluido.' },
  { n: '04', verb: 'SER CORREGIDO', what: 'y subir de nivel', body: 'Tests ocultos, feedback exacto, XP y insignias.' },
]

function Metodo() {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo(
        '.metodo-step',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: { trigger: scope.current, start: 'top 78%' },
        },
      )
      gsap.fromTo(
        '.metodo-connector',
        { strokeDashoffset: 240 },
        {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: scope.current, start: 'top 78%' },
        },
      )
    },
    { scope },
  )
  return (
    <section ref={scope} className="mx-auto max-w-[1200px] px-4 py-28 md:px-6 md:py-36">
      <div className="mb-14 text-center">
        <div className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
          {'// EL MÉTODO'}
        </div>
        <h2 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink">
          El bucle de aprendizaje
        </h2>
      </div>

      <div className="relative">
        {/* conector SVG */}
        <svg
          className="absolute left-0 top-6 hidden h-2 w-full md:block"
          viewBox="0 0 1200 8"
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            className="metodo-connector"
            x1="0"
            y1="4"
            x2="1200"
            y2="4"
            stroke="url(#metodo-grad)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          <defs>
            <linearGradient id="metodo-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
        </svg>

        <div className="grid gap-8 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="metodo-step relative">
              <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-xs font-bold text-cyan">
                {s.n}
              </span>
              <h3 className="mt-4 font-mono text-base font-bold text-ink">
                {s.verb} <span className="font-normal text-muted">{s.what}</span>
              </h3>
              <p className="mt-2 text-sm leading-[1.75] text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* XP preview */}
      <div className="mt-14 flex justify-center">
        <motion.div
          className="inline-flex items-center gap-3 rounded-xl border border-amber/30 bg-amber/5 px-5 py-3"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Zap className="h-4 w-4 text-amber" aria-hidden />
          <span className="font-mono text-sm text-amber">
            Gana XP, desbloquea insignias, llega al Boss Final
          </span>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================== S7 · GRID CURRÍCULO ============================== */

function Curriculum() {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo(
        '.module-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: scope.current, start: 'top 78%' },
        },
      )
    },
    { scope },
  )
  return (
    <section ref={scope} className="border-y border-line bg-bg-1">
      <div className="mx-auto max-w-[1200px] px-4 py-28 md:px-6 md:py-36">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
              {'// CURRÍCULO COMPLETO'}
            </div>
            <h2 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-ink">
              Ocho destinos, un camino
            </h2>
          </div>
          <Link to="/ruta" className="font-mono text-sm text-muted transition-colors hover:text-cyan">
            Ver la ruta con tu progreso →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CAMINO_NODES.map((node) => {
            const isBoss = node.level === 'BOSS'
            return (
              <Link
                key={node.level}
                to={node.path}
                className={`module-card group relative overflow-hidden rounded-xl border bg-panel transition-all duration-300 hover:-translate-y-1.5 ${
                  isBoss ? 'border-amber/60 ring-1 ring-amber/40' : 'border-line hover:border-[color:var(--node-color)]'
                }`}
                style={{ ['--node-color' as string]: node.color }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={ART_BY_LEVEL[node.level]}
                    alt={`Artwork de ${node.name}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" aria-hidden />
                  <span className="absolute right-3 top-3 rounded border border-line bg-bg-0/80 px-1.5 py-0.5 font-mono text-[10px] font-bold backdrop-blur"
                    style={{ color: node.color }}
                  >
                    {node.level}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center bg-bg-0/40 font-mono text-sm font-bold text-ink opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                    Entrar →
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base font-semibold text-ink">{node.name}</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-faint">{node.meta}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ============================== S8 · CTA FINAL ============================== */

function FinalCTA() {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo(
        '.cta-word',
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.06,
          scrollTrigger: { trigger: scope.current, start: 'top 78%' },
        },
      )
      gsap.to('.cta-glow', {
        opacity: 0.8,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    },
    { scope },
  )

  const words = 'Tu primera neurona te está esperando.'.split(' ')

  return (
    <section ref={scope} className="relative overflow-hidden">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div
        className="cta-glow pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[860px] -translate-x-1/2 -translate-y-1/2 opacity-50"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.14), transparent 70%)' }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[820px] px-4 py-32 text-center md:py-40">
        <h2 className="font-display text-[clamp(2rem,3.6vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-ink">
          {words.map((w, i) => (
            <span key={i} className="cta-word mr-[0.28em] inline-block">
              {w}
            </span>
          ))}
        </h2>
        <p className="mt-5 text-base leading-[1.75] text-muted">
          Empieza por la regresión lineal. Termina construyendo Transformers.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/modulos/fundamentos"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-6 py-3.5 font-mono text-sm font-bold text-white shadow-glow-violet transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            Comenzar Nivel 0
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
          <Link
            to="/laboratorio"
            className="rounded-lg border border-line bg-panel px-6 py-3.5 font-mono text-sm font-semibold text-ink transition-all hover:scale-[1.03] hover:border-cyan/60 active:scale-[0.97]"
          >
            Explorar el laboratorio
          </Link>
        </div>
      </div>
    </section>
  )
}

export { Pilares, LiveDemo, Metodo, Curriculum, FinalCTA }
