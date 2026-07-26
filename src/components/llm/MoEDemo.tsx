/**
 * MoEDemo — Mixture of Experts: un stream de tokens entra por la izquierda,
 * el router (softmax top-2) los reparte a 4 expertos y las barras de carga
 * crecen. Toggle "aux loss": penaliza al experto más cargado y equilibra.
 * Canvas 2D con partículas; leyenda numérica sincronizada.
 */
import { useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const EXPERTS = [
  { name: 'E0 · sintaxis', color: '#22D3EE' },
  { name: 'E1 · semántica', color: '#8B5CF6' },
  { name: 'E2 · código', color: '#FB7185' },
  { name: 'E3 · números', color: '#FBBF24' },
]
const W = 860
const H = 340

interface Particle {
  x: number
  y: number
  tx: number
  ty: number
  expert: number
  speed: number
  done: boolean
}

interface Sim {
  particles: Particle[]
  counts: number[]
  total: number
  spawnAcc: number
}

// afinidad determinista token→experto (router "entrenado" de juguete)
function routerScores(tokenId: number): number[] {
  const raw = EXPERTS.map((_, e) => {
    const x = Math.sin(tokenId * 7.13 + e * 3.71) * 0.5 + 0.5
    // E0 y E1 son "populares": sesgo que desbalancea la carga
    const bias = e === 0 ? 0.9 : e === 1 ? 0.6 : 0
    return x + bias
  })
  const m = Math.max(...raw)
  const ex = raw.map((r) => Math.exp(r - m))
  const s = ex.reduce((a, b) => a + b, 0)
  return ex.map((v) => v / s)
}

function pickExpert(scores: number[], counts: number[], total: number, auxOn: boolean): number {
  // top-1 con penalización de carga si la pérdida auxiliar está activa
  let best = -1
  let bestV = -Infinity
  for (let e = 0; e < EXPERTS.length; e++) {
    const load = total > 0 ? counts[e] / total : 0
    const penalty = auxOn ? 0.55 * load : 0
    const v = scores[e] - penalty
    if (v > bestV) {
      bestV = v
      best = e
    }
  }
  return best
}

export default function MoEDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<Sim>({ particles: [], counts: [0, 0, 0, 0], total: 0, spawnAcc: 0 })
  const rafRef = useRef(0)
  const tokenIdRef = useRef(0)
  const [running, setRunning] = useState(true)
  const [auxOn, setAuxOn] = useState(false)
  const auxRef = useRef(false)
  auxRef.current = auxOn
  const [stats, setStats] = useState<{ counts: number[]; total: number }>({ counts: [0, 0, 0, 0], total: 0 })

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.scale(dpr, dpr)

    const expertX = (e: number) => 300 + e * 140
    const expertY = 60
    let last = performance.now()
    let statAcc = 0

    const frame = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      const sim = simRef.current

      if (running) {
        // spawn
        sim.spawnAcc += dt
        if (sim.spawnAcc > 260 && sim.particles.length < 40) {
          sim.spawnAcc = 0
          const id = tokenIdRef.current++
          const scores = routerScores(id)
          const e = pickExpert(scores, sim.counts, sim.total, auxRef.current)
          sim.counts[e]++
          sim.total++
          sim.particles.push({
            x: 30,
            y: 190 + Math.sin(id * 2.3) * 40,
            tx: expertX(e),
            ty: expertY + 34,
            expert: e,
            speed: 0.18 + Math.random() * 0.1,
            done: false,
          })
        }
        // move
        for (const p of sim.particles) {
          if (p.done) continue
          const dx = p.tx - p.x
          const dy = p.ty - p.y
          const dist = Math.hypot(dx, dy)
          const step = p.speed * dt
          if (dist < step + 4) {
            p.done = true
          } else {
            p.x += (dx / dist) * step
            p.y += (dy / dist) * step
          }
        }
        sim.particles = sim.particles.filter((p) => !p.done)
      }

      // sync stats ~4 veces/seg
      statAcc += dt
      if (statAcc > 250) {
        statAcc = 0
        setStats({ counts: [...sim.counts], total: sim.total })
      }

      // ---- draw ----
      ctx.clearRect(0, 0, W, H)
      ctx.font = '11px "JetBrains Mono", monospace'

      // fuente de tokens
      ctx.fillStyle = 'rgba(34,211,238,0.12)'
      ctx.strokeStyle = 'rgba(34,211,238,0.5)'
      ctx.beginPath()
      ctx.roundRect(10, 140, 70, 100, 8)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#22D3EE'
      ctx.textAlign = 'center'
      ctx.fillText('tokens', 45, 185)
      ctx.fillText('entrantes', 45, 200)

      // router
      ctx.fillStyle = 'rgba(139,92,246,0.12)'
      ctx.strokeStyle = 'rgba(139,92,246,0.6)'
      ctx.beginPath()
      ctx.roundRect(150, 150, 90, 80, 8)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#8B5CF6'
      ctx.fillText('router', 195, 185)
      ctx.fillText('softmax', 195, 200)
      ctx.fillStyle = '#55618A'
      ctx.fillText(auxRef.current ? 'aux loss ON' : 'top-1', 195, 216)

      // expertos + barras de carga
      const maxC = Math.max(1, ...sim.counts)
      EXPERTS.forEach((ex, e) => {
        const x = expertX(e)
        const load = sim.total > 0 ? sim.counts[e] / sim.total : 0
        const overloaded = !auxRef.current && load > 0.45
        ctx.fillStyle = overloaded ? 'rgba(251,113,133,0.10)' : 'rgba(13,19,34,0.9)'
        ctx.strokeStyle = overloaded ? '#FB7185' : `${ex.color}88`
        ctx.beginPath()
        ctx.roundRect(x - 55, expertY, 110, 54, 8)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = overloaded ? '#FB7185' : ex.color
        ctx.textAlign = 'center'
        ctx.fillText(ex.name, x, expertY + 22)
        ctx.fillStyle = '#8E9AB8'
        ctx.fillText(`${sim.counts[e]} tokens`, x, expertY + 40)

        // barra de carga
        const barH = 120
        const bh = (sim.counts[e] / maxC) * barH
        ctx.fillStyle = 'rgba(28,36,64,0.6)'
        ctx.fillRect(x - 40, expertY + 70, 80, barH)
        ctx.fillStyle = overloaded ? 'rgba(251,113,133,0.75)' : `${ex.color}cc`
        ctx.fillRect(x - 40, expertY + 70 + barH - bh, 80, bh)
        ctx.fillStyle = '#55618A'
        ctx.fillText(`${Math.round(load * 100)}%`, x, expertY + 70 + barH + 16)
      })

      // partículas
      for (const p of sim.particles) {
        ctx.fillStyle = EXPERTS[p.expert].color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(237,241,250,0.25)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
        ctx.stroke()
      }

      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  const reset = () => {
    simRef.current = { particles: [], counts: [0, 0, 0, 0], total: 0, spawnAcc: 0 }
    tokenIdRef.current = 0
    setStats({ counts: [0, 0, 0, 0], total: 0 })
  }

  const imbalance = stats.total > 4 ? stats.counts.reduce((a, c) => a + Math.abs(c / stats.total - 0.25), 0) / 2 : 0

  return (
    <DemoFrame
      title="mixture_of_experts_router.py"
      controls={
        <>
          <button
            onClick={() => setRunning((r) => !r)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-bold transition-transform hover:scale-[1.03] active:scale-[0.97]',
              running ? 'bg-rose/20 text-rose' : 'bg-lime/20 text-lime',
            )}
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? 'Pausa' : 'Reanudar'}
          </button>
          <button
            onClick={() => setAuxOn((v) => !v)}
            className={cn(
              'rounded-md border px-3 py-1.5 font-mono text-xs transition-colors',
              auxOn ? 'border-violet/60 bg-violet/20 text-violet' : 'border-line text-muted hover:text-ink',
            )}
          >
            aux load-balancing: {auxOn ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <span className="ml-auto font-mono text-xs text-faint">
            {stats.total} tokens enrutados · desbalance: {(imbalance * 100).toFixed(0)}% · experto pico: {Math.round((Math.max(...stats.counts) / Math.max(1, stats.total)) * 100)}%
          </span>
        </>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: `${W}/${H}` }} className="block" />
    </DemoFrame>
  )
}
