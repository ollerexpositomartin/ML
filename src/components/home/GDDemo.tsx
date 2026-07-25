/**
 * GDDemo — Demo S5 del home: playground de gradiente descendente.
 * Contornos de una superficie de pérdida convexa J(x,y) = x² + 3y² + 0.4xy,
 * punto de inicio arrastrable, slider de η (0.01–1.2), botón "Descender"
 * que anima los pasos como polilínea cyan con estela que se desvanece.
 * Canvas 2D puro (sin dependencias pesadas).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'

const W = 560
const H = 400
const RANGE = 2.6 // coordenadas mundo: [-RANGE, RANGE]

const loss = (x: number, y: number) => x * x + 3 * y * y + 0.4 * x * y
const grad = (x: number, y: number): [number, number] => [2 * x + 0.4 * y, 6 * y + 0.4 * x]

const toPx = (x: number, y: number): [number, number] => [
  ((x + RANGE) / (2 * RANGE)) * W,
  H - ((y + RANGE) / (2 * RANGE)) * H,
]
const toWorld = (px: number, py: number): [number, number] => [
  (px / W) * 2 * RANGE - RANGE,
  ((H - py) / H) * 2 * RANGE - RANGE,
]

export default function GDDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [eta, setEta] = useState(0.12)
  const [start, setStart] = useState<[number, number]>([1.9, 1.35])
  const [trail, setTrail] = useState<Array<[number, number]>>([])
  const [descending, setDescending] = useState(false)
  const dragging = useRef(false)
  const animRef = useRef<number>(0)

  // Fondo: curvas de nivel pre-renderizadas en offscreen
  const bgRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const ctx = off.getContext('2d')!
    ctx.fillStyle = '#0A0E1A'
    ctx.fillRect(0, 0, W, H)
    // heat de la loss (muestreo grueso)
    const step = 5
    const img = ctx.createImageData(W, H)
    let maxJ = 0
    const jGrid: number[] = []
    for (let py = 0; py < H; py += step) {
      for (let px = 0; px < W; px += step) {
        const [x, y] = toWorld(px, py)
        const j = loss(x, y)
        jGrid.push(j)
        if (j > maxJ) maxJ = j
      }
    }
    void img
    // contornos por marching squares simple (líneas de nivel)
    const levels = [0.05, 0.2, 0.5, 1, 1.8, 2.8, 4.2, 6, 8.5, 12]
    ctx.lineWidth = 1
    levels.forEach((lv, li) => {
      ctx.strokeStyle = li % 3 === 0 ? 'rgba(139,92,246,0.45)' : 'rgba(28,36,64,0.9)'
      ctx.beginPath()
      // para esta J cuadrática, el contorno de nivel es una elipse: muestrear θ
      // resolver J(x,y)=lv parametrizando en coordenadas polares escaladas
      for (let a = 0; a <= 64; a++) {
        const th = (a / 64) * Math.PI * 2
        // buscar r tal que J(r·cosθ, r·sinθ) = lv → r = sqrt(lv / q(θ))
        const cx = Math.cos(th)
        const sy = Math.sin(th)
        const q = cx * cx + 3 * sy * sy + 0.4 * cx * sy
        const r = Math.sqrt(lv / q)
        if (r > 2 * RANGE) continue
        const [px, py] = toPx(r * cx, r * sy)
        if (a === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    })
    // mínimo
    const [mx, my] = toPx(0, 0)
    ctx.beginPath()
    ctx.arc(mx, my, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#A3E635'
    ctx.shadowColor = '#A3E635'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0
    bgRef.current = off
  }, [])

  // Render principal
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const bg = bgRef.current
    if (!canvas || !bg) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(bg, 0, 0)

    // estela del descenso
    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        const a = toPx(...trail[i - 1])
        const b = toPx(...trail[i])
        const alpha = 0.25 + 0.75 * (i / trail.length)
        ctx.strokeStyle = `rgba(34,211,238,${alpha})`
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.stroke()
      }
      for (let i = 0; i < trail.length; i++) {
        const [px, py] = toPx(...trail[i])
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34,211,238,${0.25 + 0.75 * (i / trail.length)})`
        ctx.fill()
      }
    }

    // punto de inicio / actual
    const [sx, sy] = toPx(...start)
    ctx.beginPath()
    ctx.arc(sx, sy, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#FBBF24'
    ctx.shadowColor = '#FBBF24'
    ctx.shadowBlur = 14
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(sx, sy, 12, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(251,191,36,0.5)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [trail, start])

  useEffect(() => {
    draw()
  }, [draw])

  // Drag del punto de inicio
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return [(e.clientX - rect.left) * (W / rect.width), (e.clientY - rect.top) * (H / rect.height)] as const
    }
    const down = (e: PointerEvent) => {
      const [px, py] = getPos(e)
      const [sx, sy] = toPx(...start)
      if (Math.hypot(px - sx, py - sy) < 22) {
        dragging.current = true
        canvas.setPointerCapture(e.pointerId)
        cancelAnimationFrame(animRef.current)
        setDescending(false)
      }
    }
    const move = (e: PointerEvent) => {
      if (!dragging.current) return
      const [px, py] = getPos(e)
      const [wx, wy] = toWorld(px, py)
      const clamped: [number, number] = [
        Math.max(-RANGE + 0.1, Math.min(RANGE - 0.1, wx)),
        Math.max(-RANGE + 0.1, Math.min(RANGE - 0.1, wy)),
      ]
      setStart(clamped)
      setTrail([clamped])
    }
    const up = () => {
      dragging.current = false
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
    }
  }, [start])

  const descend = () => {
    if (descending) return
    setDescending(true)
    let [x, y] = start
    const steps: Array<[number, number]> = [[x, y]]
    for (let i = 0; i < 60; i++) {
      const [gx, gy] = grad(x, y)
      x -= eta * gx
      y -= eta * gy
      if (Math.abs(x) > 20 || Math.abs(y) > 20) break // diverge
      steps.push([x, y])
      if (Math.hypot(gx, gy) < 1e-3) break // convergió
    }
    let i = 0
    const tick = () => {
      i = Math.min(i + 1, steps.length - 1)
      setTrail(steps.slice(0, i + 1))
      if (i < steps.length - 1) {
        animRef.current = requestAnimationFrame(() => setTimeout(tick, 1000 / 12))
      } else {
        setDescending(false)
        setStart(steps[steps.length - 1])
      }
    }
    tick()
  }

  const reset = () => {
    cancelAnimationFrame(animRef.current)
    setDescending(false)
    setStart([1.9, 1.35])
    setTrail([])
  }

  return (
    <DemoFrame
      title="gradiente_descendente.py"
      controls={
        <>
          <label className="flex items-center gap-3 font-mono text-xs text-muted">
            <span className="text-cyan">η (learning rate)</span>
            <input
              type="range"
              min={0.01}
              max={1.2}
              step={0.01}
              value={eta}
              onChange={(e) => setEta(parseFloat(e.target.value))}
              className="h-1 w-40 cursor-pointer appearance-none rounded-full bg-line accent-cyan"
              aria-label="Tasa de aprendizaje"
            />
            <span className="w-10 text-ink">{eta.toFixed(2)}</span>
          </label>
          <button
            onClick={descend}
            disabled={descending}
            className="flex items-center gap-1.5 rounded-md bg-lime/15 px-3 py-1.5 font-mono text-xs font-bold text-lime transition-colors hover:bg-lime/25 disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Descender
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset
          </button>
          <span className="hidden font-mono text-[10px] text-faint lg:inline">
            arrastra el punto ámbar para cambiar el inicio
          </span>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: 'grab' }}
        role="img"
        aria-label="Superficie de pérdida convexa con descenso por gradiente interactivo"
      />
    </DemoFrame>
  )
}
