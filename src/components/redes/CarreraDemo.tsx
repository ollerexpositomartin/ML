/**
 * Demo S6 · La carrera de optimizadores — SGD (cyan) vs Momentum (violet) vs
 * Adam (lime) descendiendo un paisaje de pérdida. Terrenos: cuenco, barranco,
 * silla de montar. Trayectorias en vivo, HUD con pérdida y tiempo de llegada.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Flag, RotateCcw } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

type Terrain = 'cuenco' | 'barranco' | 'silla'

const TERRAINS: { id: Terrain; label: string; f: (x: number, y: number) => number; g: (x: number, y: number) => [number, number] }[] = [
  {
    id: 'cuenco', label: 'Cuenco',
    f: (x, y) => 0.3 * x * x + 0.3 * y * y,
    g: (x, y) => [0.6 * x, 0.6 * y],
  },
  {
    id: 'barranco', label: 'Barranco',
    f: (x, y) => 0.06 * x * x + 0.9 * y * y,
    g: (x, y) => [0.12 * x, 1.8 * y],
  },
  {
    id: 'silla', label: 'Silla de montar',
    f: (x, y) => 0.22 * x * x - 0.12 * y * y + 0.02 * y ** 4,
    g: (x, y) => [0.44 * x, -0.24 * y + 0.08 * y ** 3],
  },
]

const W = 640
const H = 400
const XR = 5
const YR = 4
const FINISH = 0.02
const MAX_STEPS = 6000

const toCanvas = (x: number, y: number): [number, number] => [
  ((x + XR) / (2 * XR)) * W,
  H - ((y + YR) / (2 * YR)) * H,
]

interface Racer {
  name: string
  color: string
  x: number
  y: number
  vx: number
  vy: number
  mx: number
  my: number
  sx: number
  sy: number
  t: number
  steps: number
  path: [number, number][]
  done: boolean
  lr: number
}

function makeRacers(terrain: Terrain): Racer[] {
  const start: [number, number] = terrain === 'silla' ? [4.2, 0.35] : [4, 3.4]
  const base = { x: start[0], y: start[1], vx: 0, vy: 0, mx: 0, my: 0, sx: 0, sy: 0, t: 0, steps: 0, done: false }
  const lrMap: Record<Terrain, [number, number, number]> = {
    cuenco: [0.2, 0.14, 0.35],
    barranco: [0.3, 0.18, 0.4],
    silla: [0.12, 0.09, 0.25],
  }
  const [l1, l2, l3] = lrMap[terrain]
  return [
    { ...base, name: 'SGD', color: '#22D3EE', lr: l1, path: [[start[0], start[1]]] },
    { ...base, name: 'Momentum', color: '#8B5CF6', lr: l2, path: [[start[0], start[1]]] },
    { ...base, name: 'Adam', color: '#A3E635', lr: l3, path: [[start[0], start[1]]] },
  ]
}

export default function CarreraDemo() {
  const [terrain, setTerrain] = useState<Terrain>('barranco')
  const [running, setRunning] = useState(false)
  const [hud, setHud] = useState<{ name: string; color: string; loss: number; steps: number; done: boolean }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgRef = useRef<HTMLCanvasElement | null>(null)
  const racersRef = useRef<Racer[]>([])
  const rafRef = useRef(0)
  const terrainRef = useRef(terrain)
  terrainRef.current = terrain

  const buildBackground = useCallback(() => {
    const t = TERRAINS.find((tt) => tt.id === terrainRef.current)!
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const ctx = off.getContext('2d')!
    const cell = 4
    // rango de pérdida para escala log
    let maxF = 1e-6
    for (let py = 0; py < H; py += cell)
      for (let px = 0; px < W; px += cell) {
        const x = (px / W) * 2 * XR - XR
        const y = ((H - py) / H) * 2 * YR - YR
        const v = t.f(x, y)
        if (Number.isFinite(v) && v > maxF) maxF = v
      }
    for (let py = 0; py < H; py += cell) {
      for (let px = 0; px < W; px += cell) {
        const x = (px / W) * 2 * XR - XR
        const y = ((H - py) / H) * 2 * YR - YR
        const v = Math.max(0, t.f(x, y))
        const s = Math.log10(1 + (v / maxF) * 99) / 2 // 0..1
        const r = Math.round(4 + s * 24)
        const g = Math.round(6 + s * 45)
        const b = Math.round(13 + s * 90)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(px, py, cell, cell)
      }
    }
    // mínimo
    const [mx, my] = toCanvas(0, 0)
    ctx.beginPath()
    ctx.arc(mx, my, 5, 0, 2 * Math.PI)
    ctx.fillStyle = '#EDF1FA'
    ctx.fill()
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('mínimo', mx + 9, my + 4)
    bgRef.current = off
  }, [])

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    const bg = bgRef.current
    if (!canvas || !bg) return
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bg, 0, 0)
    const t = TERRAINS.find((tt) => tt.id === terrainRef.current)!
    for (const r of racersRef.current) {
      // trail
      if (r.path.length > 1) {
        ctx.beginPath()
        r.path.forEach(([x, y], i) => {
          const [cx, cy] = toCanvas(x, y)
          if (i === 0) ctx.moveTo(cx, cy)
          else ctx.lineTo(cx, cy)
        })
        ctx.strokeStyle = r.color
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      // punto
      const [cx, cy] = toCanvas(r.x, r.y)
      ctx.beginPath()
      ctx.arc(cx, cy, 6, 0, 2 * Math.PI)
      ctx.fillStyle = r.color
      ctx.shadowColor = r.color
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.font = 'bold 10px "JetBrains Mono", monospace'
      ctx.fillStyle = r.color
      ctx.fillText(r.name, cx + 9, cy - 7)
      if (r.done) {
        ctx.fillStyle = '#A3E635'
        ctx.fillText(`⚑ ${r.steps} pasos`, cx + 9, cy + 14)
      }
    }
    void t
  }, [])

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    racersRef.current = makeRacers(terrainRef.current)
    buildBackground()
    drawFrame()
    setHud(
      racersRef.current.map((r) => ({
        name: r.name,
        color: r.color,
        loss: TERRAINS.find((tt) => tt.id === terrainRef.current)!.f(r.x, r.y),
        steps: 0,
        done: false,
      })),
    )
  }, [buildBackground, drawFrame])

  useEffect(() => {
    reset()
    return () => cancelAnimationFrame(rafRef.current)
  }, [terrain, reset])

  // Bucle de carrera
  useEffect(() => {
    if (!running) return
    let alive = true
    let frame = 0
    const step = () => {
      if (!alive) return
      const t = TERRAINS.find((tt) => tt.id === terrainRef.current)!
      let allDone = true
      for (const r of racersRef.current) {
        if (r.done) continue
        for (let s = 0; s < 3; s++) {
          const [gx, gy] = t.g(r.x, r.y)
          if (r.name === 'SGD') {
            r.x -= r.lr * gx
            r.y -= r.lr * gy
          } else if (r.name === 'Momentum') {
            r.vx = 0.9 * r.vx - r.lr * gx
            r.vy = 0.9 * r.vy - r.lr * gy
            r.x += r.vx
            r.y += r.vy
          } else {
            r.t += 1
            r.mx = 0.9 * r.mx + 0.1 * gx
            r.my = 0.9 * r.my + 0.1 * gy
            r.sx = 0.999 * r.sx + 0.001 * gx * gx
            r.sy = 0.999 * r.sy + 0.001 * gy * gy
            const mhx = r.mx / (1 - 0.9 ** r.t)
            const mhy = r.my / (1 - 0.9 ** r.t)
            const shx = r.sx / (1 - 0.999 ** r.t)
            const shy = r.sy / (1 - 0.999 ** r.t)
            r.x -= (r.lr * mhx) / (Math.sqrt(shx) + 1e-8)
            r.y -= (r.lr * mhy) / (Math.sqrt(shy) + 1e-8)
          }
          r.steps += 1
          if (r.steps % 6 === 0) r.path.push([r.x, r.y])
          const v = t.f(r.x, r.y)
          if (v < FINISH || r.steps >= MAX_STEPS || Math.abs(r.x) > XR * 2 || Math.abs(r.y) > YR * 2) {
            r.done = true
            break
          }
        }
        if (!r.done) allDone = false
      }
      drawFrame()
      frame++
      if (frame % 10 === 0) {
        setHud(
          racersRef.current.map((r) => ({
            name: r.name,
            color: r.color,
            loss: t.f(r.x, r.y),
            steps: r.steps,
            done: r.done,
          })),
        )
      }
      if (!allDone) rafRef.current = requestAnimationFrame(step)
      else {
        setRunning(false)
        setHud(
          racersRef.current.map((r) => ({
            name: r.name, color: r.color, loss: t.f(r.x, r.y), steps: r.steps, done: r.done,
          })),
        )
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      alive = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [running, drawFrame])

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => {
          if (running) {
            setRunning(false)
          } else {
            reset()
            setRunning(true)
          }
        }}
        className="flex items-center gap-1.5 rounded-md bg-lime/15 px-3.5 py-1.5 font-mono text-xs font-bold text-lime transition-colors hover:bg-lime/25"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {running ? 'Parar' : '¡Carrera!'}
      </button>
      <button onClick={reset} className="flex items-center gap-1 rounded-md px-2 py-1.5 font-mono text-xs text-muted hover:text-ink">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Reiniciar
      </button>
      <div className="flex gap-1.5">
        {TERRAINS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setRunning(false)
              setTerrain(t.id)
            }}
            className={cn(
              'rounded-md border px-2.5 py-1 font-mono text-xs transition-colors',
              terrain === t.id ? 'border-cyan/60 bg-cyan/15 text-cyan' : 'border-line text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <span className="ml-auto font-mono text-[11px] text-faint">meta: L &lt; {FINISH}</span>
    </div>
  )

  return (
    <DemoFrame title="carrera_optimizadores.py" controls={controls}>
      <div className="p-4">
        <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto' }} className="rounded-lg border border-line" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {hud.map((r) => (
            <div key={r.name} className="rounded-lg border border-line bg-bg-0 px-3 py-2 font-mono text-xs">
              <div className="flex items-center gap-2 font-bold" style={{ color: r.color }}>
                <span className="h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden />
                {r.name}
                {r.done && <span className="text-lime">⚑</span>}
              </div>
              <div className="mt-1 text-muted">
                L = <span className="text-ink">{r.loss < 0.001 ? r.loss.toExponential(1) : r.loss.toFixed(3)}</span>
              </div>
              <div className="text-faint">{r.steps} pasos</div>
            </div>
          ))}
        </div>
      </div>
    </DemoFrame>
  )
}
