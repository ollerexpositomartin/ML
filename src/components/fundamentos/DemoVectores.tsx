/**
 * DemoVectores — canvas 2D: arrastra los vectores w (violet) y x (cyan).
 * Lectura en vivo de producto escalar, ángulo y proyección (lima discontinua).
 */

import { useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, drawArrow, pointerPos, setupCanvas } from './utils'

const W = 640
const H = 380
const SCALE = 46 // px por unidad
const OX = W / 2
const OY = H / 2

interface Vec { x: number; y: number }

const toCanvas = (v: Vec) => ({ x: OX + v.x * SCALE, y: OY - v.y * SCALE })
const toMath = (p: Vec) => ({ x: (p.x - OX) / SCALE, y: (OY - p.y) / SCALE })

export default function DemoVectores() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [w, setW] = useState<Vec>({ x: 2.4, y: 1.6 })
  const [x, setX] = useState<Vec>({ x: 1.9, y: -1.2 })
  const [showProj, setShowProj] = useState(true)
  const dragRef = useRef<'w' | 'x' | null>(null)

  const dot = w.x * x.x + w.y * x.y
  const nw = Math.hypot(w.x, w.y)
  const nx = Math.hypot(x.x, x.y)
  const cosPhi = nw * nx > 1e-9 ? dot / (nw * nx) : 0
  const angleDeg = (Math.acos(Math.min(1, Math.max(-1, cosPhi))) * 180) / Math.PI
  // Proyección de x sobre w
  const projScale = nw > 1e-9 ? dot / (nw * nw) : 0
  const proj = { x: w.x * projScale, y: w.y * projScale }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    // rejilla
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    for (let gx = OX % SCALE; gx < W; gx += SCALE) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
    }
    for (let gy = OY % SCALE; gy < H; gy += SCALE) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
    }
    ctx.globalAlpha = 1

    // ejes
    ctx.strokeStyle = COLORS.faint
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, OY); ctx.lineTo(W, OY); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(OX, 0); ctx.lineTo(OX, H); ctx.stroke()

    const cw = toCanvas(w)
    const cx = toCanvas(x)

    // proyección (lima discontinua) + marcador de ángulo recto
    if (showProj && nw > 1e-9 && nx > 1e-9) {
      const cp = toCanvas(proj)
      ctx.setLineDash([6, 5])
      ctx.strokeStyle = COLORS.lime
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx.x, cx.y); ctx.lineTo(cp.x, cp.y); ctx.stroke()
      ctx.setLineDash([])
      drawArrow(ctx, OX, OY, cp.x, cp.y, COLORS.lime, 2)
      // cuadradito de ángulo recto
      const uw = { x: w.x / nw, y: w.y / nw }
      const up = { x: (x.x - proj.x), y: (x.y - proj.y) }
      const lp = Math.hypot(up.x, up.y)
      if (lp > 1e-6) {
        up.x /= lp; up.y /= lp
        const s = 10
        const p1 = { x: cp.x + (-up.x) * s, y: cp.y + up.y * s }
        const p2 = { x: p1.x + (-uw.x) * s * Math.sign(1), y: p1.y + uw.y * s }
        ctx.strokeStyle = COLORS.lime
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(cp.x - up.x * s, cp.y + up.y * s)
        ctx.lineTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }
      ctx.fillStyle = COLORS.lime
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillText('proy_w(x)', cp.x + 8, cp.y - 8)
    }

    // arco del ángulo entre vectores
    if (nw > 1e-9 && nx > 1e-9) {
      const a1 = Math.atan2(-w.y, w.x)
      const a2 = Math.atan2(-x.y, x.x)
      let start = a1
      let end = a2
      let diff = end - start
      while (diff > Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      end = start + diff
      ctx.strokeStyle = COLORS.amber
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(OX, OY, 34, start, end, diff > 0)
      ctx.stroke()
    }

    // vectores
    drawArrow(ctx, OX, OY, cw.x, cw.y, COLORS.violet, 3)
    drawArrow(ctx, OX, OY, cx.x, cx.y, COLORS.cyan, 3)

    // handles
    for (const [p, c] of [[cw, COLORS.violet], [cx, COLORS.cyan]] as const) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = c
      ctx.fill()
      ctx.strokeStyle = '#04060D'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // etiquetas
    ctx.font = 'bold 13px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.violet
    ctx.fillText('w', cw.x + 12, cw.y - 4)
    ctx.fillStyle = COLORS.cyan
    ctx.fillText('x', cx.x + 12, cx.y - 4)
  }, [w, x, showProj, dot, nw, nx, proj])

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e, W, H)
    const cw = toCanvas(w)
    const cx = toCanvas(x)
    const dw = Math.hypot(p.x - cw.x, p.y - cw.y)
    const dx = Math.hypot(p.x - cx.x, p.y - cx.y)
    if (dw < 18 || dx < 18) {
      dragRef.current = dw <= dx ? 'w' : 'x'
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return
    const p = pointerPos(e, W, H)
    const m = toMath(p)
    const clamped = {
      x: Math.max(-6.4, Math.min(6.4, m.x)),
      y: Math.max(-3.8, Math.min(3.8, m.y)),
    }
    if (dragRef.current === 'w') setW(clamped)
    else setX(clamped)
  }
  const onUp = () => { dragRef.current = null }

  const stats: Array<[string, string, string]> = [
    ['w·x', dot.toFixed(2), COLORS.amber],
    ['φ', `${angleDeg.toFixed(1)}°`, COLORS.amber],
    ['‖w‖', nw.toFixed(2), COLORS.violet],
    ['‖x‖', nx.toFixed(2), COLORS.cyan],
    ['cos φ', cosPhi.toFixed(3), COLORS.lime],
  ]

  return (
    <DemoFrame
      title="vectores.py — arrastra las puntas de w y x"
      controls={
        <>
          <button
            onClick={() => setShowProj((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
              showProj ? 'border-violet/60 bg-violet/15 text-violet' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {showProj ? '◉ proyección visible' : '○ ver proyección'}
          </button>
          <button
            onClick={() => { setW({ x: 2.4, y: 1.6 }); setX({ x: 1.9, y: -1.2 }) }}
            className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            Reiniciar
          </button>
          <span className="ml-auto font-mono text-[11px] text-faint">
            w·x = ‖w‖‖x‖cos φ — positivo si apuntan al mismo lado
          </span>
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_170px]">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
        <div className="flex flex-row flex-wrap gap-2 border-t border-line p-3 md:flex-col md:border-l md:border-t-0">
          {stats.map(([label, value, color]) => (
            <div key={label} className="rounded-lg border border-line bg-panel px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
              <div className="font-mono text-sm font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </DemoFrame>
  )
}
