/**
 * TrainingLoopDemo — el bucle de entrenamiento en bucle (literalmente).
 * Regresión lineal y = 2x + 1 + ruido entrenada con SGD por mini-batches
 * en JS puro. Cada iteración recorre las 5 fases — batch → forward → loss
 * → backward → step — con la línea de código correspondiente iluminada,
 * el batch resaltado en cyan, los residuos en rose y la curva de pérdida
 * cayendo a la derecha. w y b convergen a 2 y 1.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, mulberry32, setupCanvas } from './utils'
import { cn } from '@/lib/utils'

const W = 660
const H = 330
const N = 24
const BATCH = 8
const TRUE_W = 2
const TRUE_B = 1

const DATA = (() => {
  const rng = mulberry32(13)
  return Array.from({ length: N }, (_, i) => {
    const x = (i / (N - 1)) * 3
    return { x, y: TRUE_W * x + TRUE_B + (rng() * 2 - 1) * 0.55 }
  })
})()

const PHASES = ['batch', 'forward', 'loss', 'backward', 'step'] as const
type Phase = (typeof PHASES)[number]

const CODE: Array<{ phase: Phase; line: string; comment: string }> = [
  { phase: 'batch', line: 'xb, yb = next(loader)', comment: 'DataLoader: shuffle + batches' },
  { phase: 'forward', line: 'pred = model(xb)', comment: 'forward: yŷ = w·x + b para el batch' },
  { phase: 'loss', line: 'loss = criterion(pred, yb)', comment: 'MSE: media de (ŷ − y)²' },
  { phase: 'backward', line: 'opt.zero_grad(); loss.backward()', comment: 'gradientes frescos en w.grad, b.grad' },
  { phase: 'step', line: 'opt.step()', comment: 'w −= η·w.grad · b −= η·b.grad' },
]

interface LoopState {
  w: number
  b: number
  perm: number[]
  batchStart: number
  phase: Phase
  history: number[]
  epoch: number
  lastGrads: { dw: number; db: number } | null
}

function freshState(): LoopState {
  const rng = mulberry32(99)
  const perm = Array.from({ length: N }, (_, i) => i)
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  return { w: 0, b: 0, perm, batchStart: 0, phase: 'batch', history: [], epoch: 1, lastGrads: null }
}

const mseAll = (w: number, b: number) =>
  DATA.reduce((a, p) => a + (w * p.x + b - p.y) ** 2, 0) / N

// geometría del panel de datos
const PX0 = 44
const PX1 = 400
const PY0 = 24
const PY1 = 296
const XMAX = 3.3
const YMAX = 8.4
const cx = (x: number) => PX0 + (x / XMAX) * (PX1 - PX0)
const cy = (y: number) => PY1 - (y / YMAX) * (PY1 - PY0)
// panel de pérdida
const LX0 = 446
const LX1 = 640

export default function TrainingLoopDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [st, setSt] = useState<LoopState>(freshState)
  const [running, setRunning] = useState(true)
  const [lr, setLr] = useState(0.08)

  const advance = useCallback(() => {
    setSt((s) => {
      const next: LoopState = { ...s, perm: [...s.perm], history: [...s.history] }
      const i = PHASES.indexOf(s.phase)
      if (i < PHASES.length - 1) {
        next.phase = PHASES[i + 1]
        if (next.phase === 'step') {
          // gradientes del batch actual (MSE)
          const idx = s.perm.slice(s.batchStart, s.batchStart + BATCH)
          let dw = 0
          let db = 0
          for (const k of idx) {
            const p = DATA[k]
            const e = s.w * p.x + s.b - p.y
            dw += (2 * e * p.x) / idx.length
            db += (2 * e) / idx.length
          }
          next.lastGrads = { dw, db }
        }
        return next
      }
      // fase 'step' completada: aplicar SGD y pasar al siguiente batch
      if (s.lastGrads) {
        next.w = s.w - lr * s.lastGrads.dw
        next.b = s.b - lr * s.lastGrads.db
      }
      next.history.push(mseAll(next.w, next.b))
      if (next.history.length > 90) next.history.shift()
      next.batchStart = s.batchStart + BATCH
      if (next.batchStart >= N) {
        next.batchStart = 0
        next.epoch = s.epoch + 1
        // re-shuffle determinista-ish
        const rng = mulberry32(99 + s.epoch)
        for (let k = N - 1; k > 0; k--) {
          const j = Math.floor(rng() * (k + 1))
          ;[next.perm[k], next.perm[j]] = [next.perm[j], next.perm[k]]
        }
      }
      next.phase = 'batch'
      return next
    })
  }, [lr])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(advance, 850)
    return () => window.clearInterval(id)
  }, [running, advance])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)
    const batch = st.perm.slice(st.batchStart, st.batchStart + BATCH)

    // ---------- panel izquierdo: datos ----------
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 1
    ctx.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0)
    // recta verdadera
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = COLORS.faint
    ctx.beginPath()
    ctx.moveTo(cx(0), cy(TRUE_B))
    ctx.lineTo(cx(XMAX), cy(TRUE_W * XMAX + TRUE_B))
    ctx.stroke()
    ctx.setLineDash([])
    // recta aprendida
    ctx.strokeStyle = COLORS.lime
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx(0), cy(st.b))
    ctx.lineTo(cx(XMAX), cy(st.w * XMAX + st.b))
    ctx.stroke()
    ctx.lineWidth = 1
    // residuos del batch en la fase loss
    if (st.phase === 'loss' || st.phase === 'backward' || st.phase === 'step') {
      ctx.strokeStyle = COLORS.rose
      for (const k of batch) {
        const p = DATA[k]
        ctx.beginPath()
        ctx.moveTo(cx(p.x), cy(p.y))
        ctx.lineTo(cx(p.x), cy(st.w * p.x + st.b))
        ctx.stroke()
      }
    }
    // puntos
    DATA.forEach((p, k) => {
      const inBatch = batch.includes(k)
      ctx.fillStyle = inBatch ? COLORS.cyan : COLORS.faint
      ctx.beginPath()
      ctx.arc(cx(p.x), cy(p.y), inBatch ? 4.5 : 3, 0, Math.PI * 2)
      ctx.fill()
      if (inBatch && st.phase === 'batch') {
        ctx.strokeStyle = COLORS.cyan
        ctx.beginPath()
        ctx.arc(cx(p.x), cy(p.y), 8, 0, Math.PI * 2)
        ctx.stroke()
      }
    })
    // anotaciones
    ctx.font = '600 11px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = COLORS.faint
    ctx.fillText('- - verdadera: y = 2x + 1', PX0 + 8, PY0 + 16)
    ctx.fillStyle = COLORS.lime
    ctx.fillText(`— aprendida: y = ${st.w.toFixed(2)}x + ${st.b.toFixed(2)}`, PX0 + 8, PY0 + 32)
    if (st.lastGrads && (st.phase === 'step')) {
      ctx.fillStyle = COLORS.rose
      ctx.fillText(`w.grad = ${st.lastGrads.dw.toFixed(3)}  ·  b.grad = ${st.lastGrads.db.toFixed(3)}`, PX0 + 8, PY1 - 10)
    }

    // ---------- panel derecho: pérdida ----------
    ctx.strokeStyle = COLORS.line
    ctx.strokeRect(LX0, PY0, LX1 - LX0, PY1 - PY0)
    ctx.font = '600 10px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    ctx.textAlign = 'left'
    ctx.fillText('PÉRDIDA (MSE sobre todo el dataset)', LX0 + 8, PY0 + 14)
    const h = st.history
    if (h.length > 1) {
      const maxL = Math.max(...h) * 1.05
      ctx.strokeStyle = COLORS.rose
      ctx.lineWidth = 1.8
      ctx.beginPath()
      h.forEach((l, i) => {
        const x = LX0 + 8 + (i / Math.max(1, 89)) * (LX1 - LX0 - 16)
        const y = PY1 - 10 - (l / maxL) * (PY1 - PY0 - 40)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.lineWidth = 1
      const lastL = h[h.length - 1]
      ctx.fillStyle = COLORS.rose
      ctx.textAlign = 'right'
      ctx.fillText(`${lastL.toFixed(3)}`, LX1 - 8, PY1 - 10 - (lastL / maxL) * (PY1 - PY0 - 40) - 6)
    }
    ctx.textAlign = 'left'
    ctx.fillStyle = COLORS.muted
    ctx.fillText(`epoch ${st.epoch} · batch ${Math.floor(st.batchStart / BATCH) + 1}/${N / BATCH}`, LX0 + 8, PY1 - 8)
  })

  const btn =
    'inline-flex items-center gap-1.5 rounded-md border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-cyan/50 hover:text-ink'

  return (
    <DemoFrame
      title="training_loop.py — 5 líneas que entrenan cualquier red"
      controls={
        <>
          <button onClick={() => setRunning((v) => !v)} className={btn}>
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? 'Pausa' : 'Seguir'}
          </button>
          <button
            onClick={() => { setSt(freshState()); setRunning(false) }}
            className={btn}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
          </button>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="text-cyan">η = {lr.toFixed(2)}</span>
            <input
              type="range" min={0.01} max={0.25} step={0.01} value={lr}
              onChange={(e) => setLr(+e.target.value)}
              className="w-24 accent-cyan"
            />
          </label>
          <span className="font-mono text-xs text-faint">
            w = {st.w.toFixed(3)} → 2 · b = {st.b.toFixed(3)} → 1
          </span>
        </>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: `${W}/${H}` }} />
      <div className="border-t border-line bg-panel px-4 py-3 font-mono text-xs">
        {CODE.map((c) => {
          const active = c.phase === st.phase
          return (
            <div
              key={c.phase}
              className={cn(
                'flex items-baseline gap-3 rounded px-2 py-1 transition-colors',
                active ? 'bg-cyan/10 text-ink' : 'text-faint',
              )}
            >
              <span className={cn('w-16 shrink-0 text-right uppercase tracking-wider', active ? 'text-cyan' : 'text-faint/60')}>
                {c.phase}
              </span>
              <code className={active ? 'text-ink' : ''}>{c.line}</code>
              <span className="hidden text-faint sm:inline"># {c.comment}</span>
            </div>
          )
        })}
      </div>
    </DemoFrame>
  )
}
