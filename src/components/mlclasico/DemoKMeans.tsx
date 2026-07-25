/**
 * DemoKMeans — algoritmo de Lloyd paso a paso.
 * Clic para añadir puntos, Inicializar coloca centroides (ámbar),
 * Paso anima una iteración (asignación + desplazamiento de centroides).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, pointerPos, setupCanvas } from './utils'

const W = 620
const H = 400
const R = 7

type Pt = [number, number]

const PALETTE = [COLORS.cyan, COLORS.violet, COLORS.lime, COLORS.rose, COLORS.amber]

const toCanvas = (x: number, y: number) => ({ x: (x / R) * W, y: H - (y / R) * H })

function makeBlobs(seed: number): Pt[] {
  const rng = mulberry32(seed)
  const pts: Pt[] = []
  const centers: Pt[] = [[1.8, 2], [5, 2.2], [3.4, 5.2]]
  for (const [cx, cy] of centers) {
    for (let i = 0; i < 26; i++) pts.push([gaussian(rng, cx, 0.55), gaussian(rng, cy, 0.55)])
  }
  return pts
}

export default function DemoKMeans() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState(51)
  const basePts = useMemo(() => makeBlobs(seed), [seed])
  const [userPts, setUserPts] = useState<Pt[]>([])
  const [k, setK] = useState(3)
  const [centroids, setCentroids] = useState<Pt[] | null>(null)
  const [labels, setLabels] = useState<number[]>([])
  const [step, setStep] = useState(0)
  const animRef = useRef<number>(0)
  const autoRef = useRef<number>(0)

  const pts = useMemo(() => [...basePts, ...userPts], [basePts, userPts])

  const assign = (cs: Pt[]) =>
    pts.map((p) => {
      let best = 0
      let bd = Infinity
      cs.forEach((c, i) => {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2
        if (d < bd) { bd = d; best = i }
      })
      return best
    })

  const inertia =
    centroids && labels.length === pts.length
      ? pts.reduce((a, p, i) => a + (p[0] - centroids[labels[i]][0]) ** 2 + (p[1] - centroids[labels[i]][1]) ** 2, 0)
      : null

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    // regiones de Voronoi si hay centroides
    if (centroids) {
      const GX = 26
      const GY = 17
      for (let i = 0; i < GX; i++) {
        for (let j = 0; j < GY; j++) {
          const p: Pt = [((i + 0.5) / GX) * R, ((j + 0.5) / GY) * R]
          let best = 0
          let bd = Infinity
          centroids.forEach((c, ci) => {
            const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2
            if (d < bd) { bd = d; best = ci }
          })
          const col = PALETTE[best % PALETTE.length]
          ctx.fillStyle = `${col}22`
          ctx.fillRect((i * W) / GX, H - ((j + 1) * H) / GY, W / GX + 1, H / GY + 1)
        }
      }
    }

    // puntos
    for (let i = 0; i < pts.length; i++) {
      const pc = toCanvas(pts[i][0], pts[i][1])
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = centroids && labels[i] !== undefined ? PALETTE[labels[i] % PALETTE.length] : COLORS.muted
      ctx.fill()
    }

    // centroides (diamantes ámbar con borde negro)
    if (centroids) {
      centroids.forEach((c, i) => {
        const pc = toCanvas(c[0], c[1])
        ctx.beginPath()
        ctx.moveTo(pc.x, pc.y - 9)
        ctx.lineTo(pc.x + 9, pc.y)
        ctx.lineTo(pc.x, pc.y + 9)
        ctx.lineTo(pc.x - 9, pc.y)
        ctx.closePath()
        ctx.fillStyle = COLORS.amber
        ctx.fill()
        ctx.strokeStyle = '#04060D'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.font = 'bold 10px "JetBrains Mono", monospace'
        ctx.fillStyle = '#04060D'
        ctx.fillText(String(i + 1), pc.x - 3, pc.y + 3.5)
      })
    }
  }, [pts, centroids, labels])

  const initCentroids = () => {
    cancelAnimationFrame(animRef.current)
    window.clearInterval(autoRef.current)
    const rng = mulberry32(seed * 13 + 7 + step)
    const idx = new Set<number>()
    while (idx.size < Math.min(k, pts.length)) idx.add(Math.floor(rng() * pts.length))
    const cs = [...idx].map((i) => [...pts[i]] as Pt)
    setCentroids(cs)
    setLabels(assign(cs))
    setStep(0)
  }

  const lloydStep = (animated = true) => {
    if (!centroids) return
    const newLabels = assign(centroids)
    setLabels(newLabels)
    const targets = centroids.map((c, ci) => {
      const members = pts.filter((_, i) => newLabels[i] === ci)
      if (members.length === 0) return c
      const mx = members.reduce((a, p) => a + p[0], 0) / members.length
      const my = members.reduce((a, p) => a + p[1], 0) / members.length
      return [mx, my] as Pt
    })
    if (!animated) {
      setCentroids(targets)
      setStep((s) => s + 1)
      return
    }
    const start = centroids.map((c) => [...c] as Pt)
    const t0 = performance.now()
    const dur = 500
    const tick = (t: number) => {
      const kk = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - kk, 2)
      setCentroids(start.map((c, ci) => [c[0] + (targets[ci][0] - c[0]) * e, c[1] + (targets[ci][1] - c[1]) * e]))
      if (kk < 1) animRef.current = requestAnimationFrame(tick)
      else setStep((s) => s + 1)
    }
    animRef.current = requestAnimationFrame(tick)
  }

  const auto = () => {
    if (!centroids) return
    window.clearInterval(autoRef.current)
    let prevInertia = inertia ?? Infinity
    autoRef.current = window.setInterval(() => {
      lloydStep(true)
      const cur = inertia ?? 0
      if (Math.abs(prevInertia - cur) < 1e-6 || step > 20) window.clearInterval(autoRef.current)
      prevInertia = cur
    }, 700)
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(animRef.current)
      window.clearInterval(autoRef.current)
    },
    [],
  )

  const addPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e, W, H)
    setUserPts((prev) => [...prev, [(p.x / W) * R, (1 - p.y / H) * R]])
    if (centroids) setLabels(assign(centroids))
  }

  const regen = () => {
    window.clearInterval(autoRef.current)
    cancelAnimationFrame(animRef.current)
    setSeed((s) => s + 1)
    setUserPts([])
    setCentroids(null)
    setLabels([])
    setStep(0)
  }

  return (
    <DemoFrame
      title="kmeans.py — asignar, mover, repetir"
      controls={
        <>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            k
            <input
              type="range" min={2} max={5} step={1} value={k}
              onChange={(e) => { setK(Number(e.target.value)); setCentroids(null) }}
              className="w-20 accent-cyan"
            />
            <span className="w-4 text-cyan">{k}</span>
          </label>
          <button
            onClick={initCentroids}
            className="rounded-lg border border-amber/50 bg-amber/10 px-3 py-1.5 font-mono text-xs text-amber transition-colors hover:bg-amber/20"
          >
            Inicializar
          </button>
          <button
            onClick={() => lloydStep(true)}
            disabled={!centroids}
            className="rounded-lg bg-gradient-brand px-3 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40"
          >
            Paso
          </button>
          <button
            onClick={auto}
            disabled={!centroids}
            className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            Auto
          </button>
          <button onClick={regen} className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted hover:text-ink">
            Regenerar
          </button>
          <span className="ml-auto font-mono text-[11px] text-faint">
            {inertia !== null ? `inercia: ${inertia.toFixed(1)} · iteración ${step}` : 'clic en el lienzo para añadir puntos'}
          </span>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={addPoint}
      />
    </DemoFrame>
  )
}
