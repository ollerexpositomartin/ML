/**
 * DemoGradiente — demo estrella: descenso del gradiente sobre el cuenco del MSE.
 * Izquierda: mapa de calor de L(w,b) con la trayectoria; derecha: pérdida/iteración.
 * Controles: η (log), SGD/batch, momentum, punto de inicio arrastrable.
 * Si η es demasiado grande, la trayectoria diverge (aviso rosa).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, pointerPos, setupCanvas } from './utils'

const W = 400
const H = 340
const WMIN = -1.5
const WMAX = 4
const BMIN = -3
const BMAX = 3.5
const MAX_STEPS = 140

const DATA: Array<{ x: number; y: number }> = (() => {
  const rng = mulberry32(12)
  return Array.from({ length: 25 }, (_, i) => {
    const x = -2 + (i / 24) * 4
    return { x, y: 1.5 * x + 0.5 + gaussian(rng, 0, 0.35) }
  })
})()

function mseOf(w: number, b: number) {
  return DATA.reduce((a, p) => a + (p.y - (w * p.x + b)) ** 2, 0) / DATA.length
}
function gradOf(w: number, b: number) {
  let dw = 0
  let db = 0
  for (const p of DATA) {
    const e = w * p.x + b - p.y
    dw += (2 / DATA.length) * p.x * e
    db += (2 / DATA.length) * e
  }
  return { dw, db }
}
function gradOne(w: number, b: number, i: number) {
  const p = DATA[i]
  const e = w * p.x + b - p.y
  return { dw: 2 * p.x * e, db: 2 * e }
}

const toCanvas = (w: number, b: number) => ({
  x: ((w - WMIN) / (WMAX - WMIN)) * W,
  y: H - ((b - BMIN) / (BMAX - BMIN)) * H,
})
const toParams = (px: number, py: number) => ({
  w: WMIN + (px / W) * (WMAX - WMIN),
  b: BMIN + (1 - py / H) * (BMAX - BMIN),
})

/** Paleta: azul profundo → violeta → rosa (log loss). */
function lossColor(t: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [10, 14, 26]],
    [0.35, [64, 40, 130]],
    [0.7, [139, 92, 246]],
    [1, [251, 113, 133]],
  ]
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]
      const [t1, c1] = stops[i]
      const k = (t - t0) / (t1 - t0)
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * k),
        Math.round(c0[1] + (c1[1] - c0[1]) * k),
        Math.round(c0[2] + (c1[2] - c0[2]) * k),
      ]
    }
  }
  return stops[stops.length - 1][1]
}

interface SimState {
  w: number
  b: number
  vw: number
  vb: number
  path: Array<{ w: number; b: number }>
  losses: number[]
  diverged: boolean
  done: boolean
}

export default function DemoGradiente() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lossCanvasRef = useRef<HTMLCanvasElement>(null)
  const heatmapRef = useRef<HTMLCanvasElement | null>(null)
  const [start, setStart] = useState({ w: -0.6, b: 2.8 })
  const [lrLog, setLrLog] = useState(-0.7) // 10^v
  const [sgd, setSgd] = useState(false)
  const [momentum, setMomentum] = useState(false)
  const [running, setRunning] = useState(false)
  const [sim, setSim] = useState<SimState | null>(null)
  const simRef = useRef<SimState | null>(null)
  const intervalRef = useRef<number>(0)
  const rngRef = useRef(mulberry32(99))
  const dragRef = useRef(false)

  const lr = Math.pow(10, lrLog)

  // Pre-render del heatmap (una vez)
  useMemo(() => {
    const off = document.createElement('canvas')
    const cw = 100
    const ch = 85
    off.width = cw
    off.height = ch
    const octx = off.getContext('2d')!
    const img = octx.createImageData(cw, ch)
    let lmin = Infinity
    let lmax = -Infinity
    const grid: number[] = []
    for (let j = 0; j < ch; j++) {
      for (let i = 0; i < cw; i++) {
        const w = WMIN + (i / (cw - 1)) * (WMAX - WMIN)
        const b = BMAX - (j / (ch - 1)) * (BMAX - BMIN)
        const l = Math.log10(mseOf(w, b) + 1e-6)
        grid.push(l)
        if (l < lmin) lmin = l
        if (l > lmax) lmax = l
      }
    }
    for (let k = 0; k < grid.length; k++) {
      const t = (grid[k] - lmin) / (lmax - lmin)
      const [r, g, bch] = lossColor(Math.pow(t, 0.8))
      img.data[k * 4] = r
      img.data[k * 4 + 1] = g
      img.data[k * 4 + 2] = bch
      img.data[k * 4 + 3] = 255
    }
    octx.putImageData(img, 0, 0)
    heatmapRef.current = off
  }, [])

  // Dibujo principal
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !heatmapRef.current) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(heatmapRef.current, 0, 0, W, H)

    // estrella en el óptimo
    const mx = DATA.reduce((a, p) => a + p.x, 0) / DATA.length
    const my = DATA.reduce((a, p) => a + p.y, 0) / DATA.length
    const wOpt = DATA.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / DATA.reduce((a, p) => a + (p.x - mx) ** 2, 0)
    const bOpt = my - wOpt * mx
    const oc = toCanvas(wOpt, bOpt)
    ctx.font = '14px serif'
    ctx.fillStyle = COLORS.lime
    ctx.fillText('★', oc.x - 7, oc.y + 5)

    // trayectoria
    const path = sim ? sim.path : [start]
    if (path.length > 1) {
      for (let i = 1; i < path.length; i++) {
        const a = toCanvas(path[i - 1].w, path[i - 1].b)
        const c = toCanvas(path[i].w, path[i].b)
        ctx.strokeStyle = sim?.diverged ? COLORS.rose : COLORS.lime
        ctx.globalAlpha = 0.25 + 0.75 * (i / path.length)
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    // punto actual / inicio
    const cur = sim ? sim.path[sim.path.length - 1] : start
    const cc = toCanvas(cur.w, cur.b)
    ctx.beginPath(); ctx.arc(cc.x, cc.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = sim?.diverged ? COLORS.rose : COLORS.ink
    ctx.fill()
    ctx.strokeStyle = COLORS.cyan
    ctx.lineWidth = 2
    ctx.stroke()

    // aviso de divergencia
    if (sim?.diverged) {
      ctx.fillStyle = 'rgba(251, 113, 133, 0.14)'
      ctx.fillRect(0, 0, W, H)
      ctx.font = 'bold 13px "JetBrains Mono", monospace'
      ctx.fillStyle = COLORS.rose
      ctx.fillText('⚠ η demasiado grande: diverge', 16, 28)
    }

    // etiquetas de ejes
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.muted
    ctx.fillText('w →', W - 30, H - 8)
    ctx.fillText('b →', 8, 14)
  }, [sim, start])

  // Curva de pérdida
  useEffect(() => {
    const canvas = lossCanvasRef.current
    if (!canvas) return
    const LW = 240
    const LH = 340
    const ctx = setupCanvas(canvas, LW, LH)
    ctx.clearRect(0, 0, LW, LH)
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    ctx.fillText('log₁₀ MSE', 8, 14)

    const losses = sim?.losses ?? []
    if (losses.length < 2) {
      ctx.fillStyle = COLORS.faint
      ctx.fillText('pulsa Ejecutar', 8, LH / 2)
      return
    }
    const logs = losses.map((l) => Math.log10(Math.max(l, 1e-8)))
    const lmin = Math.min(...logs)
    const lmax = Math.max(...logs)
    const pad = 0.08 * (lmax - lmin + 1e-9)
    const xTo = (i: number) => 10 + (i / (MAX_STEPS - 1)) * (LW - 20)
    const yTo = (l: number) => LH - 24 - ((l - lmin + pad) / (lmax - lmin + 2 * pad)) * (LH - 48)

    ctx.strokeStyle = COLORS.rose
    ctx.lineWidth = 2
    ctx.beginPath()
    logs.forEach((l, i) => {
      if (i === 0) ctx.moveTo(xTo(i), yTo(l))
      else ctx.lineTo(xTo(i), yTo(l))
    })
    ctx.stroke()
    const li = logs.length - 1
    ctx.beginPath(); ctx.arc(xTo(li), yTo(logs[li]), 4, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.rose; ctx.fill()
    ctx.fillStyle = COLORS.muted
    ctx.fillText(`it ${losses.length - 1}`, 8, LH - 8)
    ctx.fillText(`L=${losses[li].toExponential(2)}`, LW - 88, LH - 8)
  }, [sim])

  const stopLoop = () => {
    window.clearInterval(intervalRef.current)
    setRunning(false)
  }

  const run = () => {
    if (running) return
    const init: SimState = {
      w: start.w, b: start.b, vw: 0, vb: 0,
      path: [{ ...start }],
      losses: [mseOf(start.w, start.b)],
      diverged: false, done: false,
    }
    simRef.current = init
    setSim({ ...init, path: [...init.path], losses: [...init.losses] })
    setRunning(true)
    const beta = 0.9
    intervalRef.current = window.setInterval(() => {
      const s = simRef.current
      if (!s) return
      const g = sgd ? gradOne(s.w, s.b, Math.floor(rngRef.current() * DATA.length)) : gradOf(s.w, s.b)
      if (momentum) {
        s.vw = beta * s.vw + g.dw
        s.vb = beta * s.vb + g.db
        s.w -= lr * s.vw
        s.b -= lr * s.vb
      } else {
        s.w -= lr * g.dw
        s.b -= lr * g.db
      }
      const loss = mseOf(s.w, s.b)
      s.path.push({ w: s.w, b: s.b })
      s.losses.push(loss)
      const out = s.w < WMIN - 1 || s.w > WMAX + 1 || s.b < BMIN - 1 || s.b > BMAX + 1 || !Number.isFinite(loss)
      const exploded = loss > 50 || (s.losses.length > 6 && loss > 8 * s.losses[1])
      if (out || exploded) s.diverged = true
      if (s.diverged || s.losses.length >= MAX_STEPS) {
        s.done = true
        setSim({ ...s, path: [...s.path], losses: [...s.losses] })
        stopLoop()
        return
      }
      setSim({ ...s, path: [...s.path], losses: [...s.losses] })
    }, 90)
  }

  const reset = () => {
    stopLoop()
    simRef.current = null
    setSim(null)
  }

  useEffect(() => () => window.clearInterval(intervalRef.current), [])

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (running) return
    dragRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    reset()
    const p = pointerPos(e, W, H)
    setStart(toParams(p.x, p.y))
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || running) return
    const p = pointerPos(e, W, H)
    const prm = toParams(p.x, p.y)
    setStart({
      w: Math.max(WMIN, Math.min(WMAX, prm.w)),
      b: Math.max(BMIN, Math.min(BMAX, prm.b)),
    })
  }
  const onUp = () => { dragRef.current = false }

  const currentLoss = sim ? sim.losses[sim.losses.length - 1] : mseOf(start.w, start.b)

  return (
    <DemoFrame
      title="gradiente_descendente.py — elige tu punto de inicio y una η"
      controls={
        <>
          <button
            onClick={run}
            disabled={running}
            className="rounded-lg bg-gradient-brand px-4 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
          >
            ▶ Ejecutar
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            Reiniciar
          </button>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            η
            <input
              type="range" min={-2} max={0.08} step={0.02} value={lrLog}
              onChange={(e) => setLrLog(Number(e.target.value))}
              className="w-28 accent-cyan"
            />
            <span className={`w-12 ${lr > 0.5 ? 'text-rose' : 'text-cyan'}`}>{lr.toFixed(2)}</span>
          </label>
          <button
            onClick={() => setSgd((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
              sgd ? 'border-violet/60 bg-violet/15 text-violet' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {sgd ? 'SGD (1 muestra/paso)' : 'batch completo'}
          </button>
          <button
            onClick={() => setMomentum((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
              momentum ? 'border-violet/60 bg-violet/15 text-violet' : 'border-line text-muted hover:text-ink'
            }`}
          >
            momentum β=0.9 {momentum ? 'ON' : 'OFF'}
          </button>
        </>
      }
    >
      <div className="grid md:grid-cols-[400px_1fr]">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', maxWidth: 400, height: 'auto', display: 'block', touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
        <div className="flex flex-col border-t border-line md:border-l md:border-t-0">
          <canvas ref={lossCanvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          <div className="flex gap-2 border-t border-line p-3">
            <div className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-xs">
              <span className="text-faint">MSE actual </span>
              <span className={sim?.diverged ? 'text-rose' : 'text-lime'}>{currentLoss.toExponential(2)}</span>
            </div>
            {sim?.diverged && (
              <div className="rounded-lg border border-rose/50 bg-rose/10 px-3 py-1.5 font-mono text-xs text-rose">
                diverge: baja η
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
