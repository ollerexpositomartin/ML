/**
 * DemoPosicional — laboratorio de codificación posicional.
 * Curvas sinusoidales de varias dimensiones sobre posiciones 0–100, slider que
 * barre una línea vertical con lectura, heatmap de la matriz PE, y el momento
 * "aja": toggle con/sin PE sobre 4 tokens — sin PE, barajar el orden produce
 * salidas IDÉNTICAS (la atención es ciega al orden).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const MAX_POS = 100
const D = 32
const DIMS_SHOWN = [0, 1, 4, 5, 10, 11]
const DIM_COLORS = ['#22D3EE', '#8B5CF6', '#A3E635', '#FB7185', '#FBBF24', '#EDF1FA']

function peValue(pos: number, col: number): number {
  const i = Math.floor(col / 2)
  const ang = pos / Math.pow(10000, (2 * i) / D)
  return col % 2 === 0 ? Math.sin(ang) : Math.cos(ang)
}

/* --- mini-ejemplo 4 tokens con/sin PE --- */
const DEMO_TOKENS = ['el', 'gato', 'persigue', 'ratones']
const X_BASE = DEMO_TOKENS.map((_, i) =>
  Array.from({ length: 8 }, (_, k) => Math.sin((i + 1) * (k + 2) * 1.31) * 0.8),
)

function attentionNorms(order: number[], withPE: boolean): number[] {
  // X permutada (+ PE si toca) → Q=K=V=X → norma de cada fila de salida
  const X = order.map((tokIdx, pos) =>
    X_BASE[tokIdx].map((v, k) => (withPE ? v + peValue(pos, k) : v)),
  )
  const n = X.length
  const scores = X.map((a) => X.map((b) => a.reduce((s, v, k) => s + v * b[k], 0) / Math.sqrt(8)))
  const out = scores.map((row, i) => {
    const m = Math.max(...row)
    const e = row.map((v) => Math.exp(v - m))
    const s = e.reduce((a, b) => a + b, 0)
    const w = e.map((v) => v / s)
    const o = Array.from({ length: 8 }, (_, k) => w.reduce((acc, wj, j) => acc + wj * X[j][k], 0))
    void i
    return Math.hypot(...o)
  })
  void n
  return out
}

const WAVES_W = 560
const WAVES_H = 180

export default function DemoPosicional() {
  const [pos, setPos] = useState(24)
  const [withPE, setWithPE] = useState(true)
  const [order, setOrder] = useState<number[]>([0, 1, 2, 3])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heatRef = useRef<HTMLCanvasElement>(null)

  const norms = useMemo(() => attentionNorms(order, withPE), [order, withPE])
  const normsBase = useMemo(() => attentionNorms([0, 1, 2, 3], withPE), [withPE])
  const shuffled = order.join() !== '0,1,2,3'
  // Comparar POR TOKEN (no por posición): sin PE, la salida de un token no
  // depende de dónde esté colocado → idéntica tras barajar.
  const identicalToBase = useMemo(
    () => order.every((tokIdx, position) => Math.abs(norms[position] - normsBase[tokIdx]) < 1e-9),
    [order, norms, normsBase],
  )

  /* curvas de PE */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = WAVES_W * dpr
    canvas.height = WAVES_H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, WAVES_W, WAVES_H)

    const toX = (p: number) => 10 + (p / MAX_POS) * (WAVES_W - 20)
    const toY = (v: number) => WAVES_H / 2 - v * (WAVES_H / 2 - 14)

    ctx.strokeStyle = '#1C2440'
    ctx.beginPath()
    ctx.moveTo(0, toY(0))
    ctx.lineTo(WAVES_W, toY(0))
    ctx.stroke()

    DIMS_SHOWN.forEach((dim, di) => {
      ctx.strokeStyle = DIM_COLORS[di]
      ctx.lineWidth = 1.6
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      for (let p = 0; p <= MAX_POS; p++) {
        const x = toX(p)
        const y = toY(peValue(p, dim))
        if (p === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    })

    // línea del scrubber
    ctx.strokeStyle = '#FBBF24'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(toX(pos), 0)
    ctx.lineTo(toX(pos), WAVES_H)
    ctx.stroke()
    ctx.setLineDash([])
    DIMS_SHOWN.forEach((dim, di) => {
      ctx.fillStyle = DIM_COLORS[di]
      ctx.beginPath()
      ctx.arc(toX(pos), toY(peValue(pos, dim)), 3.2, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [pos])

  /* heatmap de la matriz PE */
  useEffect(() => {
    const canvas = heatRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const hw = 300
    const hh = 110
    canvas.width = hw * dpr
    canvas.height = hh * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (let p = 0; p < 50; p++) {
      for (let c = 0; c < D; c++) {
        const v = peValue(p, c)
        ctx.fillStyle = v >= 0 ? `rgba(34,211,238,${v * 0.9})` : `rgba(139,92,246,${-v * 0.9})`
        ctx.fillRect((c / D) * hw, (p / 50) * hh, hw / D + 0.5, hh / 50 + 0.5)
      }
    }
    // fila del scrubber
    const rowY = (Math.min(49, Math.floor(pos / 2)) / 50) * hh
    ctx.strokeStyle = '#FBBF24'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, rowY, hw, hh / 50)
  }, [pos])

  const shuffle = () => {
    setOrder((prev) => {
      const next = [...prev]
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
      return next
    })
  }

  return (
    <DemoFrame
      title="positional_encoding_lab.py"
      controls={
        <>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            pos = <span className="w-8 text-amber">{pos}</span>
            <input
              type="range"
              min={0}
              max={MAX_POS}
              value={pos}
              onChange={(e) => setPos(parseInt(e.target.value))}
              className="w-44 accent-amber"
              aria-label="Posición"
            />
          </label>
          <button
            onClick={() => setWithPE((v) => !v)}
            className={cn(
              'rounded-md border px-3 py-1.5 font-mono text-xs transition-colors',
              withPE ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-rose/50 bg-rose/10 text-rose',
            )}
          >
            {withPE ? 'con PE' : 'sin PE'}
          </button>
          <button
            onClick={shuffle}
            className="flex items-center gap-1.5 rounded-md border border-violet/40 bg-violet/10 px-3 py-1.5 font-mono text-xs text-violet transition-colors hover:bg-violet/20"
          >
            <Shuffle className="h-3.5 w-3.5" /> Barajar orden
          </button>
        </>
      }
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-faint">
            {DIMS_SHOWN.map((d, i) => (
              <span key={d} style={{ color: DIM_COLORS[i] }}>
                — dim {d} (λ ≈ {(2 * Math.PI * Math.pow(10000, (2 * Math.floor(d / 2)) / D)).toFixed(0)})
              </span>
            ))}
          </div>
          <canvas ref={canvasRef} style={{ width: '100%', maxWidth: WAVES_W, height: 'auto', display: 'block' }} />

          {/* ejemplo con/sin PE */}
          <div className="mt-6 rounded-xl border border-line bg-panel p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              // la atención ¿ve el orden?
            </div>
            <div className="flex flex-wrap gap-2">
              {order.map((tokIdx, position) => (
                <motion.div
                  key={tokIdx}
                  layout
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-center"
                >
                  <div className="font-mono text-sm text-ink">{DEMO_TOKENS[tokIdx]}</div>
                  <div className="font-mono text-[9px] text-faint">pos {position}</div>
                  <div className="font-mono text-[10px] text-cyan">‖out‖ {norms[position].toFixed(3)}</div>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              {shuffled && !withPE && identicalToBase && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-md border border-amber/50 bg-amber/10 px-2.5 py-1 font-mono text-xs font-bold text-amber"
                >
                  idéntico ✓ — el orden no cambió nada
                </motion.span>
              )}
              {shuffled && withPE && !identicalToBase && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-md border border-lime/50 bg-lime/10 px-2.5 py-1 font-mono text-xs font-bold text-lime"
                >
                  distinto ✓ — la PE delata el nuevo orden
                </motion.span>
              )}
              <p className="text-[11px] leading-relaxed text-muted">
                {withPE
                  ? 'Con PE, cada posición suma su firma sinusoidal: barajar cambia las salidas.'
                  : 'Sin PE, baraja los tokens: las salidas no se enteran. La atención pura es ciega al orden.'}
              </p>
            </div>
          </div>
        </div>

        <aside>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // matriz PE (posición × dim)
          </div>
          <canvas ref={heatRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Cada fila es la firma única de una posición. Las dimensiones bajas oscilan rápido
            (cyan/violet alternando) y las altas casi no cambian: longitudes de onda de ~2π hasta
            ~2π·10000. Como es una función fija, no hay nada que aprender.
          </p>
        </aside>
      </div>
    </DemoFrame>
  )
}
