/**
 * ScrollStoryArquitectura — sección pinned con GSAP ScrollTrigger (~200vh).
 * El scroll recorre el flujo de datos del Transformer paso a paso:
 * el bloque activo se agranda con anillo de glow, el resto se atenúa al 30%,
 * y un panel lateral sincronizado muestra la fórmula + explicación llana.
 * GSAP aislado en ESTE componente (nada de Framer Motion dentro del árbol pinneado).
 */
import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { BlockMath } from 'react-katex'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface Step {
  id: string
  label: string
  formula: string
  plain: string
}

const STEPS: Step[] = [
  {
    id: 'embeddings',
    label: '1 · Embeddings',
    formula: 'x_i = E[\\,\\mathrm{token}_i\\,], \\quad E \\in \\mathbb{R}^{V \\times d}',
    plain: 'Cada token se convierte en un vector denso: la tabla de embeddings aprendida durante el entrenamiento. El texto ya es geometría.',
  },
  {
    id: 'pe',
    label: '2 · + Positional Encoding',
    formula: 'x_i \\leftarrow x_i + PE_i',
    plain: 'Se suma la firma sinusoidal de la posición. Sin ella, la atención no sabría qué palabra va primero.',
  },
  {
    id: 'qkv',
    label: '3 · Proyecciones Q, K, V',
    formula: 'Q = XW^Q, \\quad K = XW^K, \\quad V = XW^V',
    plain: 'Tres proyecciones lineales aprendidas crean la consulta (qué busco), la clave (qué ofrezco) y el valor (qué digo) de cada token.',
  },
  {
    id: 'attention',
    label: '4 · Multi-Head Attention',
    formula: '\\mathrm{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right) V',
    plain: 'Cada token mezcla la información de los demás según la afinidad Q·K. h cabezas en paralelo miran patrones distintos.',
  },
  {
    id: 'addnorm',
    label: '5 · Add & Norm',
    formula: '\\mathrm{LayerNorm}\\big(x + \\mathrm{Sublayer}(x)\\big)',
    plain: 'La conexión residual deja circular el gradiente por decenas de capas; LayerNorm mantiene las activaciones a escala sana.',
  },
  {
    id: 'ffn',
    label: '6 · Feed-Forward',
    formula: '\\mathrm{FFN}(x) = \\max(0, xW_1 + b_1)\\,W_2 + b_2',
    plain: 'Una MLP por posición (expande ~4× y proyecta de vuelta). Aquí vive buena parte de la «memoria» del modelo.',
  },
  {
    id: 'stack',
    label: '7 · Apilar ×N',
    formula: '\\mathrm{bloque} \\times N, \\quad N = 6, 12, 96\\dots',
    plain: 'El mismo bloque se repite: cada capa refina la representación de la anterior. GPT-3 apila 96.',
  },
  {
    id: 'decoder',
    label: '8 · Decoder: máscara + cross-attention',
    formula: '\\mathrm{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}} + M_{\\text{causal}}\\right) V',
    plain: 'El decoder añade una máscara causal (no mirar el futuro) y cross-attention hacia la salida del encoder. Es la variante de GPT y de la traducción.',
  },
]

const PULSE_COLOR = '#22D3EE'

export default function ScrollStoryArquitectura() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top+=64', // bajo el navbar fijo (h-16)
        end: '+=200%', // pin ~200vh
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const idx = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))
          setActive(idx)
        },
      })
    },
    { scope: sectionRef },
  )

  const step = STEPS[active]

  return (
    <section ref={sectionRef} aria-label="La arquitectura completa del Transformer, paso a paso">
      <div className="flex min-h-[calc(100dvh-64px)] items-center py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Diagrama */}
          <div className="relative flex flex-col items-stretch gap-2">
            {STEPS.map((s, i) => {
              const isActive = i === active
              const isDecoder = s.id === 'decoder'
              return (
                <div key={s.id} className="flex flex-col items-stretch">
                  {i > 0 && !isDecoder && (
                    <div className="relative mx-auto flex h-5 items-center justify-center" aria-hidden>
                      <span className={cn('h-full w-px', isActive || active > i ? 'bg-cyan/60' : 'bg-line')} />
                      {isActive && (
                        <span
                          className="absolute h-2 w-2 animate-pulse-soft rounded-full"
                          style={{ background: PULSE_COLOR, boxShadow: `0 0 8px ${PULSE_COLOR}` }}
                        />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-xl border px-4 py-3 transition-all duration-500',
                      isActive
                        ? 'scale-[1.06] border-cyan/70 bg-panel-2 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                        : 'border-line bg-panel opacity-30',
                      isDecoder && !isActive && 'border-dashed',
                      isDecoder && isActive && 'border-amber/70 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn('font-mono text-xs font-bold', isActive ? 'text-ink' : 'text-muted')}>
                        {s.label}
                      </span>
                      {isActive && (
                        <span
                          className="h-1.5 w-1.5 animate-pulse-soft rounded-full"
                          style={{ background: PULSE_COLOR }}
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Panel sincronizado */}
          <div className="flex flex-col justify-center">
            <div key={step.id} className="rounded-xl border border-line bg-panel p-6" style={{ animation: 'story-panel-in 0.35s ease-out' }}>
              <div className="mb-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
                // paso {active + 1} / {STEPS.length}
              </div>
              <h3 className="mb-4 font-display text-xl font-semibold text-ink">{step.label.split('· ')[1]}</h3>
              <div className="overflow-x-auto rounded-lg border border-line bg-bg-1 px-4 py-3">
                <BlockMath math={step.formula} />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{step.plain}</p>
              <div className="mt-5 flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-300',
                      i <= active ? 'bg-gradient-brand' : 'bg-line',
                    )}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              sigue bajando para recorrer el flujo ↓
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes story-panel-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </section>
  )
}
