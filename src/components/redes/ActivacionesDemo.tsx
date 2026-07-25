/**
 * Demo S2 · Funciones de activación — galería interactiva.
 * Hover: un cursor barre x: −5→5 y el punto de salida lo sigue (1.2 s en bucle).
 * Toggle "ver derivada": superpone la derivada en rose discontinuo.
 * Clic: fija la card para comparar (hasta 2 fijadas, borde lime).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

interface ActDef {
  id: string
  name: string
  formula: string
  f: (x: number) => number
  df: (x: number) => number
  ymin: number
  ymax: number
}

const erfApprox = (x: number) => Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))
const normCdf = (x: number) => 0.5 * (1 + erfApprox(x / Math.SQRT2))
const normPdf = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
const sig = (x: number) => 1 / (1 + Math.exp(-x))

const ACTS: ActDef[] = [
  { id: 'step', name: 'Escalón', formula: 'a = 𝟙[z > 0]', f: (x) => (x > 0 ? 1 : 0), df: (x) => (Math.abs(x) < 0.08 ? 6 : 0), ymin: -0.2, ymax: 1.2 },
  { id: 'sigmoid', name: 'Sigmoide', formula: 'σ(z) = 1/(1+e⁻ᙆ)', f: sig, df: (x) => sig(x) * (1 - sig(x)), ymin: -0.2, ymax: 1.2 },
  { id: 'tanh', name: 'Tanh', formula: 'tanh(z)', f: Math.tanh, df: (x) => 1 - Math.tanh(x) ** 2, ymin: -1.3, ymax: 1.3 },
  { id: 'relu', name: 'ReLU', formula: 'max(0, z)', f: (x) => Math.max(0, x), df: (x) => (x > 0 ? 1 : 0), ymin: -0.6, ymax: 3 },
  { id: 'leaky', name: 'Leaky ReLU', formula: 'max(0.1z, z)', f: (x) => Math.max(0.1 * x, x), df: (x) => (x > 0 ? 1 : 0.1), ymin: -0.8, ymax: 3 },
  { id: 'gelu', name: 'GELU', formula: 'z·Φ(z)', f: (x) => x * normCdf(x), df: (x) => normCdf(x) + x * normPdf(x), ymin: -0.6, ymax: 3 },
  { id: 'swish', name: 'Swish', formula: 'z·σ(z)', f: (x) => x * sig(x), df: (x) => sig(x) + x * sig(x) * (1 - sig(x)), ymin: -0.6, ymax: 3 },
]

const W = 220
const H = 130
const XMIN = -5
const XMAX = 5

function toSvg(x: number, y: number, def: ActDef): [number, number] {
  const sx = ((x - XMIN) / (XMAX - XMIN)) * W
  const sy = H - ((y - def.ymin) / (def.ymax - def.ymin)) * H
  return [sx, sy]
}

function pathOf(fn: (x: number) => number, def: ActDef): string {
  const N = 120
  let d = ''
  for (let i = 0; i <= N; i++) {
    const x = XMIN + ((XMAX - XMIN) * i) / N
    const [sx, sy] = toSvg(x, fn(x), def)
    d += (i === 0 ? 'M' : 'L') + `${sx.toFixed(1)},${sy.toFixed(1)}`
  }
  return d
}

function ActCard({
  def,
  showDeriv,
  pinned,
  onTogglePin,
}: {
  def: ActDef
  showDeriv: boolean
  pinned: boolean
  onTogglePin: () => void
}) {
  const [hover, setHover] = useState(false)
  const [cursor, setCursor] = useState(0) // 0..1
  const rafRef = useRef(0)

  useEffect(() => {
    if (!hover) return
    const t0 = performance.now()
    const loop = (t: number) => {
      setCursor(((t - t0) % 1200) / 1200)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [hover])

  const dPath = useMemo(() => pathOf(def.f, def), [def])
  const dfPath = useMemo(() => pathOf(def.df, def), [def])
  const x = XMIN + (XMAX - XMIN) * cursor
  const [dotX, dotY] = toSvg(x, def.f(x), def)
  const [zeroX0, zeroY] = toSvg(0, 0, def)

  return (
    <button
      onClick={onTogglePin}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        'group rounded-lg border bg-bg-0 p-3 text-left transition-all',
        pinned ? 'border-lime/70 shadow-[0_0_18px_rgba(163,230,53,0.15)]' : 'border-line hover:border-cyan/50',
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-ink">{def.name}</span>
        <span className="font-mono text-[10px] text-faint">{def.formula}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* ejes */}
        <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke="#1C2440" strokeWidth={1} />
        <line x1={zeroX0} y1={0} x2={zeroX0} y2={H} stroke="#1C2440" strokeWidth={1} />
        {/* derivada */}
        <path
          d={dfPath}
          fill="none"
          stroke="#FB7185"
          strokeWidth={1.6}
          strokeDasharray="5 4"
          className="transition-opacity duration-250"
          opacity={showDeriv ? 0.9 : 0}
        />
        {/* función */}
        <path d={dPath} fill="none" stroke="#22D3EE" strokeWidth={2.2} />
        {/* cursor de barrido */}
        {hover && (
          <g>
            <line x1={dotX} y1={0} x2={dotX} y2={H} stroke="#55618A" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={dotX} cy={dotY} r={4.5} fill="#A3E635" stroke="#04060D" strokeWidth={1.5} />
            <text x={Math.min(W - 42, dotX + 8)} y={Math.max(12, dotY - 8)} fill="#A3E635" fontSize={10} fontFamily="JetBrains Mono, monospace">
              {def.f(x).toFixed(2)}
            </text>
          </g>
        )}
      </svg>
      <div className="mt-1 font-mono text-[10px] text-faint">
        {pinned ? '📌 fijada para comparar' : 'clic para fijar · hover para barrer'}
      </div>
    </button>
  )
}

export default function ActivacionesDemo() {
  const [showDeriv, setShowDeriv] = useState(false)
  const [pinned, setPinned] = useState<string[]>([])

  const togglePin = (id: string) =>
    setPinned((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id],
    )

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => setShowDeriv((v) => !v)}
        className={cn(
          'rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors',
          showDeriv ? 'border-rose/60 bg-rose/15 text-rose' : 'border-violet/40 bg-violet/10 text-violet hover:bg-violet/20',
        )}
      >
        {showDeriv ? 'Ocultar derivada' : 'Ver derivada'}
      </button>
      <span className="font-mono text-[11px] text-faint">
        {pinned.length > 0
          ? `comparando: ${pinned.map((p) => ACTS.find((a) => a.id === p)?.name).join(' vs ')}`
          : 'fija hasta 2 funciones para compararlas'}
      </span>
    </div>
  )

  return (
    <DemoFrame title="activaciones.py" controls={controls}>
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
        {ACTS.map((def) => (
          <ActCard
            key={def.id}
            def={def}
            showDeriv={showDeriv}
            pinned={pinned.includes(def.id)}
            onTogglePin={() => togglePin(def.id)}
          />
        ))}
      </div>
    </DemoFrame>
  )
}
