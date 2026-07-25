/**
 * DemoTangente — la derivada como límite de la secante.
 * Arrastra el punto por la curva; el slider h → 0 muestra la secante (fantasma)
 * convergiendo a la tangente. Tres funciones preset.
 */

import { useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, pointerPos, setupCanvas } from './utils'

const W = 640
const H = 380
const XR = 3.4 // rango x: [-XR, XR]
const YR = 4.2 // rango y: [-YR, YR]

const PRESETS = [
  { name: 'f(x) = 0.2x³ − x', f: (x: number) => 0.2 * x ** 3 - x, df: (x: number) => 0.6 * x ** 2 - 1 },
  { name: 'f(x) = x² / 2', f: (x: number) => (x * x) / 2 - 2, df: (x: number) => x },
  { name: 'f(x) = 2 sin(x)', f: (x: number) => 2 * Math.sin(x), df: (x: number) => 2 * Math.cos(x)},
]

const toCanvas = (x: number, y: number) => ({
  x: ((x + XR) / (2 * XR)) * W,
  y: H - ((y + YR) / (2 * YR)) * H,
})

export default function DemoTangente() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [presetIdx, setPresetIdx] = useState(0)
  const [x0, setX0] = useState(1.2)
  const [h, setH] = useState(1.6)
  const dragRef = useRef(false)

  const { f, df } = PRESETS[presetIdx]
  const slope = df(x0)
  const secSlope = (f(x0 + h) - f(x0)) / h

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    // rejilla + ejes
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    for (let i = -Math.floor(XR); i <= Math.floor(XR); i++) {
      const p = toCanvas(i, 0)
      ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, H); ctx.stroke()
    }
    for (let j = -Math.floor(YR); j <= Math.floor(YR); j++) {
      const p = toCanvas(0, j)
      ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(W, p.y); ctx.stroke()
    }
    ctx.globalAlpha = 1
    const o = toCanvas(0, 0)
    ctx.strokeStyle = COLORS.faint
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(W, o.y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, H); ctx.stroke()

    // curva
    ctx.strokeStyle = COLORS.cyan
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let px = 0; px <= W; px++) {
      const xm = (px / W) * 2 * XR - XR
      const p = toCanvas(xm, f(xm))
      if (px === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()

    // línea auxiliar: recorta al rango visible
    const drawLine = (m: number, throughX: number, throughY: number, color: string, dash: number[], width: number, alpha: number) => {
      const yAt = (xm: number) => throughY + m * (xm - throughX)
      const p1 = toCanvas(-XR, yAt(-XR))
      const p2 = toCanvas(XR, yAt(XR))
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.setLineDash(dash)
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
      ctx.restore()
    }

    // secante fantasma (x0 → x0+h)
    if (h > 0.051) {
      drawLine(secSlope, x0, f(x0), COLORS.amber, [7, 6], 1.8, 0.85)
      const pH = toCanvas(x0 + h, f(x0 + h))
      ctx.fillStyle = COLORS.amber
      ctx.beginPath(); ctx.arc(pH.x, pH.y, 5, 0, Math.PI * 2); ctx.fill()
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillText(`h=${h.toFixed(2)}`, pH.x + 9, pH.y - 6)
    }

    // tangente
    drawLine(slope, x0, f(x0), COLORS.rose, [], 2.5, 1)

    // punto arrastrable
    const p0 = toCanvas(x0, f(x0))
    ctx.beginPath(); ctx.arc(p0.x, p0.y, 9, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.rose; ctx.fill()
    ctx.strokeStyle = '#04060D'; ctx.lineWidth = 2; ctx.stroke()

    // etiquetas
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.cyan
    ctx.fillText(PRESETS[presetIdx].name, 14, 24)
  }, [presetIdx, x0, h, f, df, slope, secSlope])

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e, W, H)
    const p0 = toCanvas(x0, f(x0))
    if (Math.hypot(p.x - p0.x, p.y - p0.y) < 22) {
      dragRef.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return
    const p = pointerPos(e, W, H)
    setX0(Math.max(-XR + 0.1, Math.min(XR - 0.1, (p.x / W) * 2 * XR - XR)))
  }
  const onUp = () => { dragRef.current = false }

  return (
    <DemoFrame
      title="tangente.py — la secante converge a la tangente"
      controls={
        <>
          <div className="flex gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setPresetIdx(i)}
                className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
                  i === presetIdx ? 'border-cyan/60 bg-cyan/15 text-cyan' : 'border-line text-muted hover:text-ink'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            h
            <input
              type="range" min={0.05} max={2.2} step={0.01} value={h}
              onChange={(e) => setH(Number(e.target.value))}
              className="w-32 accent-cyan"
            />
            <span className="w-12 text-cyan">{h.toFixed(2)}</span>
          </label>
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_180px]">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
        <div className="flex flex-row flex-wrap gap-2 border-t border-line p-3 md:flex-col md:border-l md:border-t-0">
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">x₀</div>
            <div className="font-mono text-sm font-bold text-ink">{x0.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">pendiente secante</div>
            <div className="font-mono text-sm font-bold text-amber">{secSlope.toFixed(3)}</div>
          </div>
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">f′(x₀) exacta</div>
            <div className="font-mono text-sm font-bold text-rose">{slope.toFixed(3)}</div>
          </div>
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">|error|</div>
            <div className="font-mono text-sm font-bold text-lime">{Math.abs(secSlope - slope).toFixed(4)}</div>
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
