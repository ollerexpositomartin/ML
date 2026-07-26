/**
 * Demo · Cuantización — slider de bits (2–16) sobre una "señal de pesos".
 * Canvas 2D: señal original (cyan), versión cuantizada en escalones (violet)
 * y error punto a punto (rose). Panel con RMSE y ahorro de memoria vs float32.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'

const N = 220
const W = 860
const H = 300

/** Señal tipo "pesos de una capa": mezcla de sinusoides suaves. */
function makeSignal(): number[] {
  const out: number[] = []
  for (let i = 0; i < N; i++) {
    const t = i / N
    out.push(
      0.9 * Math.sin(t * Math.PI * 4) * Math.exp(-t * 0.8) +
      0.45 * Math.sin(t * Math.PI * 13 + 1.2) +
      0.18 * Math.cos(t * Math.PI * 31),
    )
  }
  return out
}

export default function QuantDemo() {
  const [bits, setBits] = useState(8)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signal = useMemo(makeSignal, [])

  const { rmse, maxErr, levels } = useMemo(() => {
    const levels = 2 ** bits
    const xmin = Math.min(...signal)
    const xmax = Math.max(...signal)
    const s = (xmax - xmin) / (levels - 1)
    let se = 0
    let me = 0
    for (const v of signal) {
      const q = xmin + Math.round((v - xmin) / s) * s
      se += (q - v) ** 2
      me = Math.max(me, Math.abs(q - v))
    }
    return { rmse: Math.sqrt(se / N), maxErr: me, levels }
  }, [bits, signal])

  const range = useMemo(() => {
    const xmin = Math.min(...signal)
    const xmax = Math.max(...signal)
    return { xmin, xmax }
  }, [signal])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const padL = 46
    const padR = 14
    const plotW = W - padL - padR
    const topH = H * 0.62
    const mid = topH / 2 + 6
    const { xmin, xmax } = range
    const yOf = (v: number) => mid - ((v - (xmin + xmax) / 2) / (xmax - xmin)) * (topH - 24)
    const xOf = (i: number) => padL + (i / (N - 1)) * plotW

    // rejilla
    ctx.strokeStyle = '#1C2440'
    ctx.lineWidth = 1
    for (let g = 0; g <= 4; g++) {
      const y = 8 + (g / 4) * (topH - 8)
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(padL, mid)
    ctx.lineTo(W - padR, mid)
    ctx.strokeStyle = '#2A3560'
    ctx.stroke()

    // etiquetas eje y
    ctx.fillStyle = '#55618A'
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(xmax.toFixed(1), padL - 6, 12)
    ctx.fillText('0', padL - 6, mid + 3)
    ctx.fillText(xmin.toFixed(1), padL - 6, topH)

    // señal cuantizada (escalones, violet)
    const levels2 = 2 ** bits
    const s = (xmax - xmin) / (levels2 - 1)
    const qOf = (v: number) => xmin + Math.round((v - xmin) / s) * s
    ctx.strokeStyle = '#8B5CF6'
    ctx.lineWidth = 2
    ctx.beginPath()
    let prevQ = qOf(signal[0])
    ctx.moveTo(xOf(0), yOf(prevQ))
    for (let i = 1; i < N; i++) {
      const q = qOf(signal[i])
      if (q !== prevQ) {
        ctx.lineTo(xOf(i), yOf(prevQ))
        ctx.lineTo(xOf(i), yOf(q))
        prevQ = q
      } else {
        ctx.lineTo(xOf(i), yOf(q))
      }
    }
    ctx.stroke()

    // señal original (cyan)
    ctx.strokeStyle = '#22D3EE'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    signal.forEach((v, i) => {
      if (i === 0) ctx.moveTo(xOf(i), yOf(v))
      else ctx.lineTo(xOf(i), yOf(v))
    })
    ctx.stroke()

    // panel de error (rose)
    const errTop = topH + 26
    const errH = H - errTop - 10
    ctx.strokeStyle = '#1C2440'
    ctx.strokeRect(padL, errTop, plotW, errH)
    ctx.fillStyle = 'rgba(251,113,133,0.35)'
    ctx.beginPath()
    ctx.moveTo(xOf(0), errTop + errH)
    signal.forEach((v, i) => {
      const e = Math.abs(qOf(v) - v) / (s / 2) // normalizado a s/2
      ctx.lineTo(xOf(i), errTop + errH - Math.min(1, e) * errH)
    })
    ctx.lineTo(xOf(N - 1), errTop + errH)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#55618A'
    ctx.textAlign = 'left'
    ctx.fillText('|error| normalizado a s/2', padL + 6, errTop + 12)

    // leyenda
    ctx.textAlign = 'left'
    ctx.fillStyle = '#22D3EE'
    ctx.fillText('— float32', W - 190, 14)
    ctx.fillStyle = '#8B5CF6'
    ctx.fillText(`— int${bits}`, W - 120, 14)
  }, [bits, signal, range])

  const memRel = bits / 32
  const ahorro = (1 - memRel) * 100

  return (
    <DemoFrame
      title="cuantizacion.py"
      controls={
        <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-3 font-mono text-xs text-muted">
            bits
            <input
              type="range"
              min={2}
              max={16}
              step={1}
              value={bits}
              onChange={(e) => setBits(Number(e.target.value))}
              className="h-1.5 w-44 cursor-pointer accent-cyan"
              aria-label="Bits de cuantización"
            />
            <span className="w-12 font-bold text-cyan">int{bits}</span>
          </label>
          <span className="font-mono text-xs text-muted">
            niveles <span className="text-violet">{levels}</span>
          </span>
          <span className="font-mono text-xs text-muted">
            RMSE <span className="text-rose">{rmse.toFixed(4)}</span>
          </span>
          <span className="font-mono text-xs text-muted">
            err máx <span className="text-rose">{maxErr.toFixed(4)}</span>
          </span>
          <span className="ml-auto font-mono text-xs text-muted">
            memoria <span className="text-amber">{(memRel * 100).toFixed(0)}%</span> de float32
            {bits <= 8 && <span className="text-lime"> (−{ahorro.toFixed(0)}%)</span>}
          </span>
        </div>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </DemoFrame>
  )
}
