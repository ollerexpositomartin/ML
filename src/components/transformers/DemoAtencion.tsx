/**
 * DemoAtencion — self-attention Q/K/V sobre una frase con ambigüedad referencial.
 * "el premio no entró en la maleta porque era demasiado grande"
 * Hover sobre un token → beams (ancho ∝ peso) + heatmap sincronizado.
 * 3 cabezas conmutables: sintáctica, posicional, referencial (pesos precomputados).
 * Momento docente: ¿a qué se refiere "era"? → premio / maleta.
 */
import { Fragment, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const TOKENS = ['el', 'premio', 'no', 'entró', 'en', 'la', 'maleta', 'porque', 'era', 'demasiado', 'grande']
const IDX_ERA = 8
const IDX_PREMIO = 1
const IDX_MALETA = 6

const HEADS = [
  { id: 'sintactica', label: 'cabeza 0 · sintáctica' },
  { id: 'posicional', label: 'cabeza 1 · posicional' },
  { id: 'referencial', label: 'cabeza 2 · referencial' },
] as const

function buildWeights(head: number): number[][] {
  const n = TOKENS.length
  const Wm: number[][] = Array.from({ length: n }, () => new Array(n).fill(0.02))
  if (head === 0) {
    // sintáctica: determinante→nombre, adverbio→verbo, adjetivo→nombre
    const links: [number, number, number][] = [
      [0, 1, 0.8], [1, 0, 0.3], [2, 3, 0.75], [3, 2, 0.3], [4, 6, 0.5], [5, 6, 0.8],
      [6, 5, 0.3], [7, 8, 0.6], [9, 10, 0.6], [10, 9, 0.3], [10, 6, 0.25], [3, 1, 0.2],
    ]
    for (const [i, j, w] of links) Wm[i][j] += w
  } else if (head === 1) {
    // posicional: ventana local ±2
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const d = Math.abs(i - j)
        if (d <= 2) Wm[i][j] += [0.7, 0.45, 0.15][d]
      }
    }
  } else {
    // referencial: "era" y "grande" resuelven su referente
    Wm[IDX_ERA][IDX_PREMIO] += 0.55
    Wm[IDX_ERA][IDX_MALETA] += 0.38
    Wm[10][IDX_MALETA] += 0.6
    Wm[10][IDX_ERA] += 0.2
    Wm[IDX_MALETA][IDX_PREMIO] += 0.15
    Wm[9][10] += 0.5
    Wm[7][3] += 0.3
  }
  // normalizar filas
  return Wm.map((row) => {
    const s = row.reduce((a, b) => a + b, 0)
    return row.map((v) => v / s)
  })
}

const WEIGHTS = [buildWeights(0), buildWeights(1), buildWeights(2)]

interface Beam { j: number; d: string; w: number; highlight: boolean }

export default function DemoAtencion() {
  const [head, setHead] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const [beams, setBeams] = useState<Beam[]>([])
  const zoneRef = useRef<HTMLDivElement>(null)
  const tokenRefs = useRef<(HTMLSpanElement | null)[]>([])

  const W = WEIGHTS[head]

  // Medir posiciones de tokens y construir beams (solo en handlers de evento)
  const updateHover = (i: number | null) => {
    setHover(i)
    if (i === null) {
      setBeams([])
      return
    }
    const zone = zoneRef.current
    const a = tokenRefs.current[i]
    if (!zone || !a) {
      setBeams([])
      return
    }
    const weights = W
    const zr = zone.getBoundingClientRect()
    const ar = a.getBoundingClientRect()
    const x1 = ar.left + ar.width / 2 - zr.left
    const y1 = ar.top - zr.top
    const next: Beam[] = []
    TOKENS.forEach((_, j) => {
      const wgt = weights[i][j]
      if (j === i || wgt < 0.03) return
      const b = tokenRefs.current[j]
      if (!b) return
      const br = b.getBoundingClientRect()
      const x2 = br.left + br.width / 2 - zr.left
      const y2 = br.bottom - zr.top
      next.push({
        j,
        d: `M ${x1} ${y1} C ${x1} ${y1 - 70}, ${x2} ${y2 - 90}, ${x2} ${y2}`,
        w: wgt,
        highlight: head === 2 && i === IDX_ERA && (j === IDX_PREMIO || j === IDX_MALETA),
      })
    })
    setBeams(next)
  }

  return (
    <DemoFrame
      title="self_attention_qkv.py"
      controls={
        <>
          <span className="font-mono text-xs text-faint">cabeza:</span>
          {HEADS.map((h, i) => (
            <button
              key={h.id}
              onClick={() => setHead(i)}
              className={cn(
                'rounded-md border px-3 py-1.5 font-mono text-xs transition-all',
                head === i
                  ? 'border-violet/60 bg-violet/15 text-violet'
                  : 'border-line bg-bg-1 text-muted hover:text-ink',
              )}
            >
              {h.label}
            </button>
          ))}
          {hover === IDX_ERA && head === 2 && (
            <span className="ml-auto rounded-md border border-amber/50 bg-amber/10 px-2.5 py-1 font-mono text-xs text-amber">
              ¿premio o maleta? la cabeza referencial duda
            </span>
          )}
        </>
      }
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_240px]">
        <div ref={zoneRef} className="relative">
          {/* SVG de beams (por encima de los tokens) */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <AnimatePresence>
              {beams.map((b) => (
                <motion.path
                  key={`${head}-${hover}-${b.j}`}
                  d={b.d}
                  fill="none"
                  stroke={b.highlight ? '#FBBF24' : '#22D3EE'}
                  strokeWidth={0.8 + b.w * 9}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: Math.min(0.95, 0.15 + b.w * 1.6) }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              ))}
            </AnimatePresence>
          </svg>

          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // pasa el cursor sobre un token (query)
          </div>
          <div className="flex flex-wrap gap-x-1.5 gap-y-24">
            {TOKENS.map((t, i) => (
              <span
                key={i}
                ref={(el) => {
                  tokenRefs.current[i] = el
                }}
                onMouseEnter={() => updateHover(i)}
                onMouseLeave={() => updateHover(null)}
                className={cn(
                  'cursor-pointer rounded-lg border px-3 py-2 font-mono text-sm transition-all duration-200',
                  hover === i
                    ? 'border-cyan/70 bg-cyan/15 text-cyan shadow-[0_0_14px_rgba(34,211,238,0.3)]'
                    : hover !== null && W[hover][i] > 0.12
                      ? 'border-violet/60 bg-violet/15 text-violet'
                      : 'border-line bg-panel-2 text-muted hover:text-ink',
                )}
              >
                {t}
              </span>
            ))}
          </div>

          {/* heatmap sincronizado */}
          <div className="mt-8">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              // matriz de atención A<sub>ij</sub> (fila = query, columna = key)
            </div>
            <div
              className="grid w-fit"
              style={{ gridTemplateColumns: `repeat(${TOKENS.length}, 1.5rem)` }}
            >
              {W.map((row, i) => (
                <Fragment key={i}>
                  {row.map((v, j) => (
                    <button
                      key={j}
                      onMouseEnter={() => updateHover(i)}
                      onMouseLeave={() => updateHover(null)}
                      aria-label={`atención de ${TOKENS[i]} a ${TOKENS[j]}: ${v.toFixed(2)}`}
                      className={cn(
                        'm-[1px] h-6 w-6 rounded-[3px] transition-transform',
                        hover === i && 'ring-1 ring-lime',
                        hover === i && j === hover && 'ring-2 ring-lime',
                      )}
                      style={{ backgroundColor: `rgba(139,92,246,${0.06 + v * 0.94})` }}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
            <div className="mt-1 flex w-fit font-mono text-[8px] text-faint" style={{ width: TOKENS.length * 26 }}>
              {TOKENS.map((t, i) => (
                <span key={i} className={cn('w-6 truncate text-center', hover !== null && W[hover][i] > 0.12 && 'text-violet')}>
                  {t.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* panel lateral */}
        <aside className="rounded-xl border border-line bg-panel p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // lectura
          </div>
          {hover !== null ? (
            <>
              <div className="mb-3 font-mono text-sm text-ink">
                «<span className="text-cyan">{TOKENS[hover]}</span>» mira a:
              </div>
              <ul className="space-y-1.5">
                {TOKENS.map((t, j) => ({ t, w: W[hover][j] }))
                  .filter((x) => x.w > 0.04)
                  .sort((a, b) => b.w - a.w)
                  .slice(0, 5)
                  .map((x) => (
                    <li key={x.t} className="flex items-center gap-2 font-mono text-xs">
                      <span className={cn('w-16 truncate', x.w > 0.3 ? 'text-violet' : 'text-muted')}>{x.t}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                        <motion.span
                          className="block h-full bg-gradient-brand"
                          animate={{ width: `${x.w * 100}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </span>
                      <span className="w-9 text-right text-faint">{(x.w * 100).toFixed(0)}%</span>
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              Cada token proyecta su <span className="font-mono text-violet">Q</span> contra las{' '}
              <span className="font-mono text-cyan">K</span> de todos y mezcla sus{' '}
              <span className="font-mono text-lime">V</span>. Cambia de cabeza: cada una aprende un
              patrón distinto (sintaxis, posición, correferencia) en paralelo.
            </p>
          )}
        </aside>
      </div>
    </DemoFrame>
  )
}
