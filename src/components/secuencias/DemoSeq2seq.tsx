/**
 * DemoSeq2seq — atención de Bahdanau en traducción.
 * "el gato negro duerme → the black cat sleeps". Hover sobre una palabra
 * destino → beams (ancho ∝ α) hacia las palabras fuente + heatmap de
 * alineación sincronizado. Nótese la inversión gato↔cat / negro↔black.
 */
import { Fragment, useState } from 'react'
import { motion } from 'framer-motion'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const SRC = ['el', 'gato', 'negro', 'duerme']
const TGT = ['the', 'black', 'cat', 'sleeps']

/** Pesos de atención α[i][j]: fila = palabra destino, columna = palabra fuente */
const ALPHA = [
  [0.86, 0.06, 0.05, 0.03], // the   → el
  [0.05, 0.14, 0.74, 0.07], // black → negro  (¡inversión de orden!)
  [0.04, 0.78, 0.11, 0.07], // cat   → gato
  [0.03, 0.06, 0.08, 0.83], // sleeps→ duerme
]

export default function DemoSeq2seq() {
  const [hover, setHover] = useState<number | null>(null)

  return (
    <DemoFrame title="seq2seq_atencion.py">
      <div className="grid gap-8 p-6 lg:grid-cols-[1fr_auto]">
        {/* Beams */}
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // frase fuente (encoder)
          </div>
          <div className="flex gap-3">
            {SRC.map((w, j) => (
              <span
                key={w}
                className={cn(
                  'rounded-lg border px-3.5 py-2 font-mono text-sm transition-all duration-200',
                  hover !== null && ALPHA[hover][j] > 0.3
                    ? 'border-cyan/70 bg-cyan/15 text-cyan shadow-[0_0_14px_rgba(34,211,238,0.3)]'
                    : 'border-line bg-panel-2 text-muted',
                )}
              >
                {w}
              </span>
            ))}
          </div>

          {/* zona de beams */}
          <svg viewBox="0 0 400 90" className="my-1 w-full" aria-hidden>
            {hover !== null &&
              SRC.map((_, j) => {
                const a = ALPHA[hover][j]
                if (a < 0.04) return null
                const x1 = 50 + j * 100
                const x2 = 50 + hover * 100
                return (
                  <motion.path
                    key={j}
                    d={`M ${x1} 6 C ${x1} 45, ${x2} 45, ${x2} 84`}
                    fill="none"
                    stroke={a > 0.3 ? 'url(#beam-grad)' : '#1C2440'}
                    strokeWidth={1 + a * 9}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.25 + a * 0.75 }}
                    transition={{ duration: 0.25 }}
                  />
                )
              })}
            <defs>
              <linearGradient id="beam-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#22D3EE" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>

          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // frase destino (decoder) — pasa el cursor
          </div>
          <div className="flex gap-3">
            {TGT.map((w, i) => (
              <button
                key={w}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className={cn(
                  'rounded-lg border px-3.5 py-2 font-mono text-sm transition-all duration-200',
                  hover === i
                    ? 'border-violet/70 bg-violet/15 text-violet shadow-[0_0_14px_rgba(139,92,246,0.35)]'
                    : 'border-line bg-panel-2 text-ink hover:border-violet/40',
                )}
              >
                {w}
              </button>
            ))}
          </div>

          <p className="mt-4 max-w-lg text-xs leading-relaxed text-muted">
            {hover === 1 || hover === 2 ? (
              <>
                <span className="font-mono text-amber">¡El momento clave!</span> En español el adjetivo
                va detrás (<span className="text-cyan">gato negro</span>) y en inglés delante (
                <span className="text-violet">black cat</span>). La atención aprende esa inversión sola:
                cada palabra destino <span className="text-ink">mira donde necesita</span>, no solo al
                último vector del encoder.
              </>
            ) : (
              <>
                Con un seq2seq clásico toda la frase se comprime en <span className="text-ink">un único
                vector</span> — un cuello de botella que falla en frases largas. La atención deja que el
                decoder consulte <span className="text-ink">todos</span> los estados del encoder en cada
                paso. Pasa el cursor por cada palabra destino.
              </>
            )}
          </p>
        </div>

        {/* Heatmap de alineación */}
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // matriz de alineación α
          </div>
          <div className="grid" style={{ gridTemplateColumns: `auto repeat(4, 2.6rem)` }}>
            <span />
            {SRC.map((s) => (
              <span key={s} className="pb-1 text-center font-mono text-[10px] text-faint">{s}</span>
            ))}
            {TGT.map((t, i) => (
              <Fragment key={t}>
                <span className={cn('pr-2 text-right font-mono text-[10px]', hover === i ? 'text-violet' : 'text-faint')}>
                  {t}
                </span>
                {SRC.map((_, j) => {
                  const a = ALPHA[i][j]
                  const active = hover === i
                  return (
                    <motion.div
                      key={`${i}-${j}`}
                      animate={{
                        backgroundColor: `rgba(139,92,246,${0.08 + a * 0.85})`,
                        scale: active ? 1.04 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'm-0.5 flex h-10 items-center justify-center rounded-md border font-mono text-[10px]',
                        active && a > 0.3 ? 'border-lime/70 text-lime' : 'border-line/60 text-muted',
                      )}
                    >
                      {a.toFixed(2)}
                    </motion.div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
