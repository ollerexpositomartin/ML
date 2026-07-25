/**
 * DemoFrontera — regresión logística en vivo sobre dos blobs gaussianos.
 * Botón Entrenar (40 épocas animadas), sombreado de probabilidad,
 * slider de umbral que mueve la frontera y actualiza la confusión.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, setupCanvas, sigmoid } from './utils'

const W = 620
const H = 420
const R = 7 // rango [0,R]×[0,R]

const { X, Y } = (() => {
  const rng = mulberry32(21)
  const X: Array<[number, number]> = []
  const Y: number[] = []
  for (let i = 0; i < 55; i++) {
    X.push([gaussian(rng, 2.1, 0.95), gaussian(rng, 2.3, 0.95)])
    Y.push(0)
  }
  for (let i = 0; i < 55; i++) {
    X.push([gaussian(rng, 4.9, 0.95), gaussian(rng, 4.7, 0.95)])
    Y.push(1)
  }
  return { X, Y }
})()

const toCanvas = (x: number, y: number) => ({ x: (x / R) * W, y: H - (y / R) * H })

export default function DemoFrontera() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [model, setModel] = useState<{ w: [number, number]; b: number }>({ w: [0, 0], b: 0 })
  const [epoch, setEpoch] = useState(0)
  const [training, setTraining] = useState(false)
  const [threshold, setThreshold] = useState(0.5)
  const intervalRef = useRef<number>(0)

  const loss = useMemo(() => {
    let s = 0
    for (let i = 0; i < X.length; i++) {
      const p = Math.min(1 - 1e-9, Math.max(1e-9, sigmoid(model.w[0] * X[i][0] + model.w[1] * X[i][1] + model.b)))
      s += -(Y[i] * Math.log(p) + (1 - Y[i]) * Math.log(1 - p))
    }
    return s / X.length
  }, [model])

  // confusión al umbral actual
  const conf = useMemo(() => {
    let tp = 0
    let fp = 0
    let tn = 0
    let fn = 0
    for (let i = 0; i < X.length; i++) {
      const p = sigmoid(model.w[0] * X[i][0] + model.w[1] * X[i][1] + model.b)
      const pred = p >= threshold ? 1 : 0
      if (pred === 1 && Y[i] === 1) tp++
      else if (pred === 1) fp++
      else if (Y[i] === 1) fn++
      else tn++
    }
    return { tp, fp, tn, fn }
  }, [model, threshold])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    // sombreado de probabilidad
    const GX = 31
    const GY = 21
    const cw = W / GX
    const ch = H / GY
    for (let i = 0; i < GX; i++) {
      for (let j = 0; j < GY; j++) {
        const x = ((i + 0.5) / GX) * R
        const y = ((j + 0.5) / GY) * R
        const p = sigmoid(model.w[0] * x + model.w[1] * y + model.b)
        ctx.fillStyle = `rgba(34, 211, 238, ${(p * 0.32).toFixed(3)})`
        ctx.fillRect(i * cw, H - (j + 1) * ch, cw + 1, ch + 1)
        ctx.fillStyle = `rgba(139, 92, 246, ${((1 - p) * 0.32).toFixed(3)})`
        ctx.fillRect(i * cw, H - (j + 1) * ch, cw + 1, ch + 1)
      }
    }

    // frontera al umbral: w·x + b = logit(t)
    const logit = Math.log(threshold / (1 - threshold))
    if (Math.abs(model.w[1]) > 1e-6) {
      const yAt = (x: number) => (logit - model.b - model.w[0] * x) / model.w[1]
      const p1 = toCanvas(0, yAt(0))
      const p2 = toCanvas(R, yAt(R))
      ctx.strokeStyle = COLORS.ink
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
    }

    // puntos
    for (let i = 0; i < X.length; i++) {
      const pc = toCanvas(X[i][0], X[i][1])
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = Y[i] === 1 ? COLORS.cyan : COLORS.violet
      ctx.fill()
      // anillo rosa si mal clasificada al umbral actual
      const p = sigmoid(model.w[0] * X[i][0] + model.w[1] * X[i][1] + model.b)
      if ((p >= threshold ? 1 : 0) !== Y[i]) {
        ctx.strokeStyle = COLORS.rose
        ctx.lineWidth = 1.8
        ctx.beginPath(); ctx.arc(pc.x, pc.y, 7.5, 0, Math.PI * 2); ctx.stroke()
      }
    }

    // ejes
    ctx.strokeStyle = COLORS.faint
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
  }, [model, threshold])

  const train = () => {
    if (training) return
    setTraining(true)
    setModel({ w: [0, 0], b: 0 })
    setEpoch(0)
    let w: [number, number] = [0, 0]
    let b = 0
    let e = 0
    const lr = 0.6
    intervalRef.current = window.setInterval(() => {
      let g0 = 0
      let g1 = 0
      let gb = 0
      for (let i = 0; i < X.length; i++) {
        const p = sigmoid(w[0] * X[i][0] + w[1] * X[i][1] + b)
        const err = p - Y[i]
        g0 += X[i][0] * err
        g1 += X[i][1] * err
        gb += err
      }
      w = [w[0] - (lr * g0) / X.length, w[1] - (lr * g1) / X.length]
      b -= (lr * gb) / X.length
      e++
      setModel({ w: [w[0], w[1]], b })
      setEpoch(e)
      if (e >= 40) {
        window.clearInterval(intervalRef.current)
        setTraining(false)
      }
    }, 60)
  }

  useEffect(() => () => window.clearInterval(intervalRef.current), [])

  return (
    <DemoFrame
      title="frontera.py — la sigmoide dibuja una probabilidad"
      controls={
        <>
          <button
            onClick={train}
            disabled={training}
            className="rounded-lg bg-gradient-brand px-4 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
          >
            {training ? `Época ${epoch}/40…` : epoch > 0 ? 'Re-entrenar' : 'Entrenar (40 épocas)'}
          </button>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            umbral
            <input
              type="range" min={0.05} max={0.95} step={0.01} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-32 accent-cyan"
            />
            <span className="w-10 text-cyan">{threshold.toFixed(2)}</span>
          </label>
          <span className="ml-auto font-mono text-[11px] text-faint">log-loss: {loss.toFixed(4)}</span>
        </>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div className="flex flex-wrap gap-2 border-t border-line bg-panel px-4 py-2.5 font-mono text-[11px]">
        <span className="rounded border border-line px-2 py-1 text-faint">
          TP <b className="text-lime">{conf.tp}</b>
        </span>
        <span className="rounded border border-line px-2 py-1 text-faint">
          FP <b className="text-rose">{conf.fp}</b>
        </span>
        <span className="rounded border border-line px-2 py-1 text-faint">
          TN <b className="text-lime">{conf.tn}</b>
        </span>
        <span className="rounded border border-line px-2 py-1 text-faint">
          FN <b className="text-rose">{conf.fn}</b>
        </span>
        <span className="ml-auto text-faint">
          accuracy <b className="text-ink">{(((conf.tp + conf.tn) / X.length) * 100).toFixed(0)} %</b>
        </span>
      </div>
    </DemoFrame>
  )
}
