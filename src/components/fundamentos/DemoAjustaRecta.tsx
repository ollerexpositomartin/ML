/**
 * DemoAjustaRecta — 12 puntos; arrastra los dos asas para mover la recta.
 * Los residuos se dibujan como cuadrados (su área ES el término del MSE).
 * Botón "Solución exacta" anima la recta al ajuste OLS.
 */

import { useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, pointerPos, setupCanvas } from './utils'

const W = 640
const H = 400
const XMIN = -0.5
const XMAX = 10.5
const YMIN = -1
const YMAX = 16

const PTS: Array<{ x: number; y: number }> = (() => {
  const rng = mulberry32(7)
  return Array.from({ length: 12 }, (_, i) => {
    const x = 0.4 + i * 0.85
    return { x, y: 1.25 * x + 1 + gaussian(rng, 0, 1.1) }
  })
})()

// Solución OLS exacta
const OLS = (() => {
  const mx = PTS.reduce((a, p) => a + p.x, 0) / PTS.length
  const my = PTS.reduce((a, p) => a + p.y, 0) / PTS.length
  const w = PTS.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / PTS.reduce((a, p) => a + (p.x - mx) ** 2, 0)
  return { w, b: my - w * mx }
})()

const mseOf = (w: number, b: number) =>
  PTS.reduce((a, p) => a + (p.y - (w * p.x + b)) ** 2, 0) / PTS.length

const OPT_MSE = mseOf(OLS.w, OLS.b)

const toCanvas = (x: number, y: number) => ({
  x: ((x - XMIN) / (XMAX - XMIN)) * W,
  y: H - ((y - YMIN) / (YMAX - YMIN)) * H,
})

export default function DemoAjustaRecta() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [wb, setWb] = useState({ w: 0.6, b: 6 })
  const dragRef = useRef<'a' | 'b' | null>(null)
  const animRef = useRef<number>(0)

  // Asas: puntos de la recta en x=1.2 y x=9
  const handleA = { x: 1.2, y: wb.w * 1.2 + wb.b }
  const handleB = { x: 9, y: wb.w * 9 + wb.b }
  const mse = mseOf(wb.w, wb.b)
  const within1 = mse <= OPT_MSE * 1.01 + 1e-9

  const setFromHandles = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const w = (b.y - a.y) / (b.x - a.x)
    setWb({ w, b: a.y - w * a.x })
  }

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
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    for (let x = 0; x <= 10; x += 2) ctx.fillText(String(x), toCanvas(x, 0).x - 4, o.y + 14)

    // cuadrados de residuos (rosa translúcido)
    for (const p of PTS) {
      const yHat = wb.w * p.x + wb.b
      const pc = toCanvas(p.x, p.y)
      const ph = toCanvas(p.x, yHat)
      const top = Math.min(pc.y, ph.y)
      const side = Math.abs(pc.y - ph.y)
      ctx.fillStyle = 'rgba(251, 113, 133, 0.16)'
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.55)'
      ctx.lineWidth = 1
      ctx.fillRect(pc.x, top, side, side)
      ctx.strokeRect(pc.x, top, side, side)
      // línea de residuo
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.8)'
      ctx.beginPath(); ctx.moveTo(pc.x, pc.y); ctx.lineTo(ph.x, ph.y); ctx.stroke()
    }

    // recta
    const p1 = toCanvas(XMIN, wb.w * XMIN + wb.b)
    const p2 = toCanvas(XMAX, wb.w * XMAX + wb.b)
    ctx.strokeStyle = within1 ? COLORS.lime : COLORS.cyan
    ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()

    // puntos
    for (const p of PTS) {
      const pc = toCanvas(p.x, p.y)
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.ink; ctx.fill()
      ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 1.5; ctx.stroke()
    }

    // asas
    for (const [hnd, label] of [[handleA, 'b'], [handleB, 'w']] as const) {
      const hc = toCanvas(hnd.x, hnd.y)
      ctx.beginPath(); ctx.arc(hc.x, hc.y, 9, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.amber; ctx.fill()
      ctx.strokeStyle = '#04060D'; ctx.lineWidth = 2; ctx.stroke()
      ctx.font = 'bold 10px "JetBrains Mono", monospace'
      ctx.fillStyle = '#04060D'
      ctx.fillText(label, hc.x - 3, hc.y + 3.5)
    }
  }, [wb, within1, handleA.x, handleA.y, handleB.x, handleB.y])

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    cancelAnimationFrame(animRef.current)
    const p = pointerPos(e, W, H)
    const ca = toCanvas(handleA.x, handleA.y)
    const cb = toCanvas(handleB.x, handleB.y)
    if (Math.hypot(p.x - ca.x, p.y - ca.y) < 20) {
      dragRef.current = 'a'
      e.currentTarget.setPointerCapture(e.pointerId)
    } else if (Math.hypot(p.x - cb.x, p.y - cb.y) < 20) {
      dragRef.current = 'b'
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return
    const p = pointerPos(e, W, H)
    const y = YMIN + (1 - p.y / H) * (YMAX - YMIN)
    const clampedY = Math.max(YMIN, Math.min(YMAX, y))
    if (dragRef.current === 'a') setFromHandles({ x: handleA.x, y: clampedY }, handleB)
    else setFromHandles(handleA, { x: handleB.x, y: clampedY })
  }
  const onUp = () => { dragRef.current = null }

  const solveExact = () => {
    cancelAnimationFrame(animRef.current)
    const start = { ...wb }
    const t0 = performance.now()
    const dur = 800
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      const e = k < 0.5 ? 4 * k ** 3 : 1 - Math.pow(-2 * k + 2, 3) / 2
      setWb({ w: start.w + (OLS.w - start.w) * e, b: start.b + (OLS.b - start.b) * e })
      if (k < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
  }

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  return (
    <DemoFrame
      title="ajusta_recta.py — el área rosa es tu MSE"
      controls={
        <>
          <button
            onClick={solveExact}
            className="rounded-lg bg-gradient-brand px-4 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            Solución exacta (OLS)
          </button>
          <button
            onClick={() => { cancelAnimationFrame(animRef.current); setWb({ w: 0.6, b: 6 }) }}
            className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            Reiniciar
          </button>
          <span className="ml-auto font-mono text-[11px] text-faint">
            OLS: w* = {OLS.w.toFixed(3)}, b* = {OLS.b.toFixed(3)}
          </span>
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
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">tu recta</div>
            <div className="font-mono text-sm font-bold text-cyan">w={wb.w.toFixed(2)}</div>
            <div className="font-mono text-sm font-bold text-cyan">b={wb.b.toFixed(2)}</div>
          </div>
          <div className={`rounded-lg border px-3 py-2 transition-colors ${within1 ? 'border-lime/50 bg-lime/10' : 'border-line bg-panel'}`}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">tu MSE</div>
            <div className="font-mono text-sm font-bold" style={{ color: within1 ? COLORS.lime : COLORS.rose }}>
              {mse.toFixed(3)}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">MSE óptimo</div>
            <div className="font-mono text-sm font-bold text-lime">{OPT_MSE.toFixed(3)}</div>
          </div>
          {within1 && (
            <div className="rounded-lg border border-lime/50 bg-lime/10 px-3 py-2 font-mono text-[11px] text-lime">
              ✓ ¡Estás a menos del 1 % del óptimo!
            </div>
          )}
        </div>
      </div>
    </DemoFrame>
  )
}
