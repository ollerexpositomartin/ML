/**
 * DemoPolinomio — overfitting en directo: slider de grado (1–12) y de λ (ridge).
 * MSE de entrenamiento (cyan) vs validación (rosa) + curva en U al lado.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, setupCanvas, solveLinear } from './utils'

const W = 560
const H = 380
const XMIN = -2.6
const XMAX = 2.6
const YMIN = -2.2
const YMAX = 2.6

const ftrue = (x: number) => Math.sin(1.4 * x) + 0.15 * x

const { TRAIN, VAL } = (() => {
  const rngT = mulberry32(17)
  const rngV = mulberry32(18)
  const train = Array.from({ length: 9 }, (_, i) => {
    const x = -2.2 + (i / 8) * 4.4
    return { x, y: ftrue(x) + gaussian(rngT, 0, 0.28) }
  })
  const val = Array.from({ length: 8 }, () => {
    const x = -2.2 + rngV() * 4.4
    return { x, y: ftrue(x) + gaussian(rngV, 0, 0.28) }
  })
  return { TRAIN: train, VAL: val }
})()

function fitRidge(degree: number, lam: number): number[] {
  const d = degree + 1
  const A: number[][] = Array.from({ length: d }, () => Array(d).fill(0))
  const bv: number[] = Array(d).fill(0)
  for (const p of TRAIN) {
    const powers = Array.from({ length: d }, (_, k) => Math.pow(p.x, k))
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) A[i][j] += powers[i] * powers[j]
      bv[i] += powers[i] * p.y
    }
  }
  for (let i = 1; i < d; i++) A[i][i] += lam // no regulariza el intercepto
  return solveLinear(A, bv)
}

const mseOn = (w: number[], data: Array<{ x: number; y: number }>) =>
  data.reduce((a, p) => {
    let yh = 0
    for (let k = 0; k < w.length; k++) yh += w[k] * Math.pow(p.x, k)
    return a + (p.y - yh) ** 2
  }, 0) / data.length

const toCanvas = (x: number, y: number) => ({
  x: ((x - XMIN) / (XMAX - XMIN)) * W,
  y: H - ((y - YMIN) / (YMAX - YMIN)) * H,
})

export default function DemoPolinomio() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const curveRef = useRef<HTMLCanvasElement>(null)
  const [degree, setDegree] = useState(3)
  const [lam, setLam] = useState(0)

  const w = useMemo(() => fitRidge(degree, lam), [degree, lam])
  const trainMse = mseOn(w, TRAIN)
  const valMse = mseOn(w, VAL)

  // curva val-MSE vs grado para la λ actual
  const curve = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const ww = fitRidge(i + 1, lam)
        return { deg: i + 1, train: mseOn(ww, TRAIN), val: mseOn(ww, VAL) }
      }),
    [lam],
  )

  const overfit = valMse > Math.max(0.15, trainMse * 2.5)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    // ejes
    ctx.strokeStyle = COLORS.faint
    ctx.lineWidth = 1
    const o = toCanvas(0, 0)
    ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(W, o.y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, H); ctx.stroke()

    // curva ajustada
    ctx.strokeStyle = overfit ? COLORS.rose : COLORS.violet
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let px = 0; px <= W; px++) {
      const x = XMIN + (px / W) * (XMAX - XMIN)
      let y = 0
      for (let k = 0; k < w.length; k++) y += w[k] * Math.pow(x, k)
      y = Math.max(YMIN - 1, Math.min(YMAX + 1, y))
      const p = toCanvas(x, y)
      if (px === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()

    // puntos
    for (const p of TRAIN) {
      const pc = toCanvas(p.x, p.y)
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.cyan; ctx.fill()
    }
    for (const p of VAL) {
      const pc = toCanvas(p.x, p.y)
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 5, 0, Math.PI * 2)
      ctx.strokeStyle = COLORS.rose; ctx.lineWidth = 2; ctx.stroke()
    }

    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.cyan
    ctx.fillText('● entrenamiento', 12, 20)
    ctx.fillStyle = COLORS.rose
    ctx.fillText('○ validación', 12, 36)
    if (overfit) {
      ctx.font = 'bold 12px "JetBrains Mono", monospace'
      ctx.fillStyle = COLORS.rose
      ctx.fillText('⚠ OVERFITTING: memoriza el ruido', W - 250, 20)
    }
  }, [w, overfit])

  // mini-curva train/val vs grado
  useEffect(() => {
    const canvas = curveRef.current
    if (!canvas) return
    const CW = 200
    const CH = 160
    const ctx = setupCanvas(canvas, CW, CH)
    ctx.clearRect(0, 0, CW, CH)
    const maxV = Math.max(...curve.map((c) => Math.min(c.val, 2.5)), 0.6)
    const xTo = (deg: number) => 26 + ((deg - 1) / 11) * (CW - 36)
    const yTo = (v: number) => CH - 22 - (Math.min(v, maxV) / maxV) * (CH - 36)

    for (const [key, color] of [['train', COLORS.cyan], ['val', COLORS.rose]] as const) {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      curve.forEach((c, i) => {
        const px = xTo(c.deg)
        const py = yTo(c[key])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()
    }
    // punto del grado actual
    const cur = curve[degree - 1]
    ctx.beginPath(); ctx.arc(xTo(cur.deg), yTo(cur.val), 5, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.rose; ctx.fill()
    ctx.font = '9px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    ctx.fillText('grado →', CW / 2 - 20, CH - 8)
    ctx.fillText('MSE', 4, 12)
  }, [curve, degree])

  return (
    <DemoFrame
      title="polinomio.py — sube el grado hasta que la curva rosa se dispare"
      controls={
        <>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            grado
            <input
              type="range" min={1} max={12} step={1} value={degree}
              onChange={(e) => setDegree(Number(e.target.value))}
              className="w-28 accent-cyan"
            />
            <span className="w-6 text-cyan">{degree}</span>
          </label>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            λ (ridge)
            <input
              type="range" min={0} max={5} step={0.1} value={lam}
              onChange={(e) => setLam(Number(e.target.value))}
              className="w-28 accent-cyan"
            />
            <span className="w-10 text-violet">{lam.toFixed(1)}</span>
          </label>
          <span className="ml-auto font-mono text-[11px] text-faint">
            λ grande suaviza el ajuste de grado alto
          </span>
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_210px]">
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        <div className="flex flex-col gap-2 border-t border-line p-3 md:border-l md:border-t-0">
          <canvas ref={curveRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">MSE train</div>
            <div className="font-mono text-sm font-bold text-cyan">{trainMse.toFixed(3)}</div>
          </div>
          <div className={`rounded-lg border px-3 py-2 ${overfit ? 'border-rose/50 bg-rose/10' : 'border-line bg-panel'}`}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">MSE validación</div>
            <div className="font-mono text-sm font-bold text-rose">{valMse.toFixed(3)}</div>
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-faint">
            El MSE de train siempre baja con el grado; el de validación sube cuando el modelo memoriza.
          </p>
        </div>
      </div>
    </DemoFrame>
  )
}
