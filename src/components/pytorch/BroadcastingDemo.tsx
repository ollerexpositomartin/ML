/**
 * BroadcastingDemo — elige la forma de A y de B y mira cómo numpy/PyTorch
 * los "estira" hasta una forma común, sin copiar memoria. Celdas con borde
 * continuo = dato real; celdas con borde discontinuo = réplicas virtuales
 * del mismo dato. Si las formas no son compatibles, verás el error real.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, setupCanvas } from './utils'

const W = 660
const H = 300

const SHAPE_OPTIONS: Array<{ label: string; shape: number[] }> = [
  { label: '(3, 1)', shape: [3, 1] },
  { label: '(1, 4)', shape: [1, 4] },
  { label: '(4,)   → vector fila', shape: [4] },
  { label: '(3,)   → vector fila', shape: [3] },
  { label: '(3, 4)', shape: [3, 4] },
  { label: 'escalar ()', shape: [] },
]

/** Alinea una forma a `nd` dimensiones añadiendo unos a la izquierda. */
function align(shape: number[], nd: number): number[] {
  return [...Array(Math.max(0, nd - shape.length)).fill(1), ...shape]
}

function broadcastShape(a: number[], b: number[]): number[] | null {
  const nd = Math.max(a.length, b.length)
  const aa = align(a, nd)
  const bb = align(b, nd)
  const out: number[] = []
  for (let i = 0; i < nd; i++) {
    if (aa[i] === bb[i]) out.push(aa[i])
    else if (aa[i] === 1) out.push(bb[i])
    else if (bb[i] === 1) out.push(aa[i])
    else return null
  }
  return out
}

/** Valor determinista del operando en su propia celda (i, j). */
function cellValue(tag: 'A' | 'B', i: number, j: number): number {
  return tag === 'A' ? i * 4 + j + 1 : 10 * (i + 1) + (j + 1)
}

interface GridModel {
  rows: number
  cols: number
  /** valor visible en la celda (r, c) del resultado */
  val: (r: number, c: number) => number
  /** ¿es réplica por broadcasting? */
  ghost: (r: number, c: number) => boolean
}

function buildGrid(tag: 'A' | 'B', shape: number[], out: number[]): GridModel {
  const [R, C] = [out[0] ?? 1, out[1] ?? 1]
  const al = align(shape, 2)
  return {
    rows: R,
    cols: C,
    val: (r, c) => cellValue(tag, al[0] === 1 ? 0 : r, al[1] === 1 ? 0 : c),
    ghost: (r, c) => (al[0] === 1 && R > 1 && r > 0) || (al[1] === 1 && C > 1 && c > 0),
  }
}

export default function BroadcastingDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ia, setIa] = useState(0) // (3,1)
  const [ib, setIb] = useState(1) // (1,4)

  const shapeA = SHAPE_OPTIONS[ia].shape
  const shapeB = SHAPE_OPTIONS[ib].shape
  const out = useMemo(() => broadcastShape(shapeA, shapeB), [shapeA, shapeB])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    if (!out) {
      ctx.font = '600 15px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = COLORS.rose
      ctx.fillText('✗ operands could not be broadcast together', W / 2, H / 2 - 14)
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillStyle = COLORS.muted
      ctx.fillText(
        `formas (${shapeA.join(', ')}) y (${shapeB.join(', ')}): alineadas por la derecha, ${shapeA[shapeA.length - 1]} ≠ ${shapeB[shapeB.length - 1]} y ninguna es 1`,
        W / 2, H / 2 + 12,
      )
      ctx.fillStyle = COLORS.faint
      ctx.fillText('En PyTorch verías exactamente este RuntimeError.', W / 2, H / 2 + 34)
      return
    }

    const R = out[0] ?? 1
    const C = out[1] ?? 1
    const gA = buildGrid('A', shapeA, out)
    const gB = buildGrid('B', shapeB, out)

    const cell = Math.min(44, 200 / Math.max(R, C))
    const panels: Array<{ title: string; x: number; grid: GridModel | null; sum?: boolean }> = [
      { title: 'A expandido', x: 20, grid: gA },
      { title: 'B expandido', x: 240, grid: gB },
      { title: 'A + B', x: 460, grid: null, sum: true },
    ]

    ctx.textAlign = 'center'
    for (const p of panels) {
      ctx.font = '600 11px "JetBrains Mono", monospace'
      ctx.fillStyle = COLORS.faint
      ctx.fillText(p.title.toUpperCase(), p.x + (C * cell) / 2, 34)
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          const x = p.x + c * cell
          const y = 50 + r * cell
          const ghost = p.grid ? p.grid.ghost(r, c) : false
          const v = p.grid ? p.grid.val(r, c) : gA.val(r, c) + gB.val(r, c)
          ctx.fillStyle = p.sum ? 'rgba(163,230,53,0.10)' : ghost ? 'rgba(139,92,246,0.07)' : 'rgba(34,211,238,0.10)'
          ctx.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3)
          ctx.strokeStyle = p.sum ? COLORS.lime : ghost ? COLORS.violet : COLORS.cyan
          ctx.lineWidth = 1.4
          ctx.setLineDash(ghost && !p.sum ? [4, 3] : [])
          ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3)
          ctx.setLineDash([])
          ctx.font = '600 12px "JetBrains Mono", monospace'
          ctx.fillStyle = p.sum ? COLORS.lime : ghost ? COLORS.muted : COLORS.ink
          ctx.fillText(String(v), x + cell / 2, y + cell / 2 + 4)
        }
      }
      // símbolos entre paneles
    }
    ctx.font = '700 18px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    ctx.fillText('+', 222, 50 + (R * cell) / 2)
    ctx.fillText('=', 442, 50 + (R * cell) / 2)

    // leyenda + regla
    const ly = 50 + R * cell + 30
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = COLORS.cyan
    ctx.fillText('▢ dato real', 20, ly)
    ctx.fillStyle = COLORS.violet
    ctx.fillText('▢ réplica virtual (borde discontinuo)', 130, ly)
    ctx.fillStyle = COLORS.lime
    ctx.fillText('▢ resultado', 420, ly)
    ctx.fillStyle = COLORS.muted
    ctx.fillText(
      `A${JSON.stringify(shapeA)} + B${JSON.stringify(shapeB)}  →  forma ${JSON.stringify(out.length ? out : ['escalar'])} — las réplicas NO copian memoria`,
      20, ly + 22,
    )
  })

  const select =
    'rounded-md border border-line bg-panel-2 px-2.5 py-1.5 font-mono text-xs text-muted outline-none transition-colors hover:border-cyan/50 focus:border-cyan/60'

  return (
    <DemoFrame
      title="broadcasting.py — estira sin copiar"
      controls={
        <>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="text-cyan">A</span>
            <select value={ia} onChange={(e) => setIa(+e.target.value)} className={select}>
              {SHAPE_OPTIONS.map((o, i) => (
                <option key={o.label} value={i}>{o.label}</option>
              ))}
            </select>
          </label>
          <span className="font-mono text-sm text-faint">+</span>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="text-violet">B</span>
            <select value={ib} onChange={(e) => setIb(+e.target.value)} className={select}>
              {SHAPE_OPTIONS.map((o, i) => (
                <option key={o.label} value={i}>{o.label}</option>
              ))}
            </select>
          </label>
          <span className="font-mono text-xs text-faint">
            regla: alinea a la derecha · dim 1 se estira · dim ausente = 1
          </span>
        </>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: `${W}/${H}` }} />
    </DemoFrame>
  )
}
