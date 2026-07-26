/**
 * GridworldDemo — Q-learning entrenando EN VIVO.
 * Gridworld 5×5 con meta (G), pozos (X) y muros (#). El agente (punto
 * cyan) ejecuta episodios a velocidad ajustable; las flechas de política
 * se "afianzan" a medida que Q converge, el mapa de calor muestra V(s)
 * y la curva registra la recompensa por episodio.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, drawArrow, mulberry32, setupCanvas } from '../fundamentos/utils'

const W = 620
const H = 380
const GRID = [
  'S....',
  '.##X.',
  '.#...',
  '.X#..',
  '....G',
]
const GH = GRID.length
const GW = GRID[0].length
const CELL = 60
const OX = 20
const OY = 30
const ALPHA = 0.5
const GAMMA = 0.95
const MAX_PASOS = 100
const ACCIONES: Array<[number, number]> = [[-1, 0], [0, 1], [1, 0], [0, -1]]

const S_POS = (() => {
  for (let i = 0; i < GH; i++) for (let j = 0; j < GW; j++) if (GRID[i][j] === 'S') return { i, j }
  return { i: 0, j: 0 }
})()

function idx(i: number, j: number, a: number) {
  return (i * GW + j) * 4 + a
}

/** Color del mapa de calor de V: rose (negativo) → panel (0) → lime (positivo). */
function heatColor(v: number): string {
  const t = Math.max(-1, Math.min(1, v / 10))
  if (t >= 0) {
    const a = Math.min(1, t * 1.2)
    return `rgba(163, 230, 53, ${(0.06 + a * 0.35).toFixed(3)})`
  }
  const a = Math.min(1, -t)
  return `rgba(251, 113, 133, ${(0.06 + a * 0.35).toFixed(3)})`
}

export default function GridworldDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(8)
  const [eps, setEps] = useState(0.1)
  const [stats, setStats] = useState({ ep: 0, tasa: 0, ultimo: 0 })

  const Q = useRef(new Float64Array(GH * GW * 4))
  const agent = useRef({ ...S_POS })
  const ep = useRef(0)
  const pasos = useRef(0)
  const epR = useRef(0)
  const hist = useRef<number[]>([])
  const exitos = useRef<boolean[]>([])
  const rng = useRef(mulberry32(11))
  const epsRef = useRef(eps)
  epsRef.current = eps
  const rafRef = useRef(0)

  const transicion = (i: number, j: number, a: number): { ni: number; nj: number; r: number; fin: boolean } => {
    const [di, dj] = ACCIONES[a]
    let ni = i + di
    let nj = j + dj
    if (ni < 0 || ni >= GH || nj < 0 || nj >= GW || GRID[ni][nj] === '#') {
      ni = i
      nj = j
    }
    const c = GRID[ni][nj]
    const r = c === 'G' ? 10 : c === 'X' ? -10 : 0
    return { ni, nj, r, fin: c === 'G' || c === 'X' }
  }

  const step = useCallback(() => {
    const { i, j } = agent.current
    const q = Q.current
    const rand = rng.current
    let a: number
    if (rand() < epsRef.current) {
      a = Math.floor(rand() * 4)
    } else {
      let best = 0
      let bv = -Infinity
      for (let aa = 0; aa < 4; aa++) {
        const v = q[idx(i, j, aa)]
        if (v > bv) {
          bv = v
          best = aa
        }
      }
      a = best
    }
    const { ni, nj, r, fin } = transicion(i, j, a)
    let maxNext = 0
    if (!fin) {
      maxNext = -Infinity
      for (let aa = 0; aa < 4; aa++) maxNext = Math.max(maxNext, q[idx(ni, nj, aa)])
    }
    q[idx(i, j, a)] += ALPHA * (r + GAMMA * maxNext - q[idx(i, j, a)])
    agent.current = { i: ni, j: nj }
    epR.current += r
    pasos.current += 1
    if (fin || pasos.current >= MAX_PASOS) {
      hist.current.push(epR.current)
      if (hist.current.length > 200) hist.current.shift()
      exitos.current.push(GRID[agent.current.i][agent.current.j] === 'G')
      if (exitos.current.length > 50) exitos.current.shift()
      ep.current += 1
      setStats({
        ep: ep.current,
        ultimo: epR.current,
        tasa: exitos.current.filter(Boolean).length / exitos.current.length,
      })
      agent.current = { ...S_POS }
      pasos.current = 0
      epR.current = 0
    }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)
    const q = Q.current

    // ---- gridworld ----
    for (let i = 0; i < GH; i++) {
      for (let j = 0; j < GW; j++) {
        const x = OX + j * CELL
        const y = OY + i * CELL
        const c = GRID[i][j]

        // valor de la celda
        let v = 0
        if (c !== '#' && c !== 'G' && c !== 'X') {
          v = -Infinity
          for (let a = 0; a < 4; a++) v = Math.max(v, q[idx(i, j, a)])
          if (v === -Infinity) v = 0
        }

        ctx.fillStyle = c === '#' ? '#070A14' : heatColor(v)
        ctx.fillRect(x, y, CELL, CELL)
        ctx.strokeStyle = COLORS.line
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, CELL, CELL)

        ctx.font = 'bold 13px "JetBrains Mono", monospace'
        if (c === 'G') {
          ctx.fillStyle = COLORS.lime
          ctx.fillText('G', x + CELL / 2 - 5, y + CELL / 2 + 5)
          ctx.strokeStyle = `${COLORS.lime}88`
          ctx.lineWidth = 2
          ctx.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6)
        } else if (c === 'X') {
          ctx.fillStyle = COLORS.rose
          ctx.fillText('✕', x + CELL / 2 - 5, y + CELL / 2 + 5)
          ctx.strokeStyle = `${COLORS.rose}88`
          ctx.lineWidth = 2
          ctx.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6)
        } else if (c === 'S') {
          ctx.fillStyle = COLORS.faint
          ctx.fillText('S', x + 6, y + 16)
        }

        // flecha de política (alfa según ventaja de la mejor acción)
        if (c === '.' || c === 'S') {
          let best = 0
          let bv = -Infinity
          let sv = Infinity
          for (let a = 0; a < 4; a++) {
            const val = q[idx(i, j, a)]
            if (val > bv) {
              bv = val
              best = a
            }
            sv = Math.min(sv, val)
          }
          const ventaja = Math.min(1, Math.abs(bv) / 4) // se "afianza" al crecer |Q|
          if (bv !== 0 || sv !== 0) {
            const cx = x + CELL / 2
            const cy = y + CELL / 2
            const L = 14
            const [di, dj] = ACCIONES[best]
            drawArrow(ctx, cx - dj * L, cy - di * L, cx + dj * L, cy + di * L,
              `rgba(34, 211, 238, ${(0.25 + ventaja * 0.75).toFixed(3)})`, 2.5)
          }
        }
      }
    }

    // agente
    const ax = OX + agent.current.j * CELL + CELL / 2
    const ay = OY + agent.current.i * CELL + CELL / 2
    ctx.beginPath()
    ctx.arc(ax, ay, 9, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.cyan
    ctx.shadowColor = COLORS.cyan
    ctx.shadowBlur = 14
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#04060D'
    ctx.beginPath()
    ctx.arc(ax, ay, 3.5, 0, Math.PI * 2)
    ctx.fill()

    // ---- panel derecho: curva de recompensa ----
    const px = OX + GW * CELL + 30
    const pw = W - px - 20
    const ph = 150
    const py = OY
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    ctx.fillText('recompensa por episodio', px, py - 8)

    ctx.strokeStyle = COLORS.line
    ctx.strokeRect(px, py, pw, ph)
    // eje 0
    const y0 = py + ph * (10 / 20)
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(px, y0)
    ctx.lineTo(px + pw, y0)
    ctx.stroke()
    ctx.setLineDash([])

    const histArr = hist.current
    if (histArr.length > 1) {
      // media móvil de 10 episodios
      ctx.strokeStyle = COLORS.cyan
      ctx.lineWidth = 2
      ctx.beginPath()
      const win = 10
      let started = false
      for (let k = 0; k < histArr.length; k++) {
        const lo = Math.max(0, k - win + 1)
        let m = 0
        for (let u = lo; u <= k; u++) m += histArr[u]
        m /= k - lo + 1
        const xx = px + (k / 199) * pw
        const yy = py + ph * ((10 - Math.max(-10, Math.min(10, m))) / 20)
        if (!started) {
          ctx.moveTo(xx, yy)
          started = true
        } else ctx.lineTo(xx, yy)
      }
      ctx.stroke()
      // puntos crudos (tenues)
      ctx.fillStyle = `${COLORS.violet}55`
      for (let k = 0; k < histArr.length; k++) {
        const xx = px + (k / 199) * pw
        const yy = py + ph * ((10 - Math.max(-10, Math.min(10, histArr[k]))) / 20)
        ctx.fillRect(xx, yy, 2, 2)
      }
    }

    // leyenda de calor
    ctx.fillStyle = COLORS.faint
    ctx.fillText('V(s) = max Q(s,·)', px, py + ph + 30)
    const lgY = py + ph + 42
    const grad = ctx.createLinearGradient(px, 0, px + pw, 0)
    grad.addColorStop(0, 'rgba(251,113,133,0.4)')
    grad.addColorStop(0.5, 'rgba(13,19,34,1)')
    grad.addColorStop(1, 'rgba(163,230,53,0.4)')
    ctx.fillStyle = grad
    ctx.fillRect(px, lgY, pw, 10)
    ctx.strokeStyle = COLORS.line
    ctx.strokeRect(px, lgY, pw, 10)
    ctx.fillStyle = COLORS.faint
    ctx.fillText('pozo', px, lgY + 24)
    ctx.fillText('meta', px + pw - 26, lgY + 24)
  }, [])

  // bucle principal
  useEffect(() => {
    if (!running) return
    const loop = () => {
      for (let s = 0; s < speed; s++) step()
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, speed, step, draw])

  // dibujo inicial y tras acciones en pausa
  useEffect(() => {
    draw()
  }, [draw, stats])

  const runEpisode = () => {
    // un episodio completo de golpe (hasta 500 pasos de seguridad)
    const antes = ep.current
    let guard = 0
    while (ep.current === antes && guard < 500) {
      step()
      guard++
    }
    draw()
  }

  const reset = () => {
    setRunning(false)
    Q.current = new Float64Array(GH * GW * 4)
    agent.current = { ...S_POS }
    ep.current = 0
    pasos.current = 0
    epR.current = 0
    hist.current = []
    exitos.current = []
    rng.current = mulberry32(11)
    setStats({ ep: 0, tasa: 0, ultimo: 0 })
    draw()
  }

  return (
    <DemoFrame
      title="qlearning.py — el agente aprende el mapa solo"
      controls={
        <>
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-lg bg-gradient-brand px-3 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            {running ? '⏸ Pausa' : '▶ Entrenar'}
          </button>
          <button
            onClick={runEpisode}
            disabled={running}
            className="rounded-lg border border-cyan/50 bg-cyan/10 px-3 py-1.5 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-40"
          >
            +1 episodio
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            Reiniciar
          </button>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            velocidad
            <input
              type="range" min={1} max={64} step={1} value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-cyan"
            />
            <span className="w-8 text-cyan">{speed}×</span>
          </label>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            ε
            <input
              type="range" min={0} max={0.5} step={0.01} value={eps}
              onChange={(e) => setEps(Number(e.target.value))}
              className="w-20 accent-cyan"
            />
            <span className="w-9 text-cyan">{eps.toFixed(2)}</span>
          </label>
          <span className="ml-auto font-mono text-xs text-muted">
            episodio <span className="text-ink">{stats.ep}</span> · última recompensa{' '}
            <span className={stats.ultimo > 0 ? 'text-lime' : stats.ultimo < 0 ? 'text-rose' : 'text-muted'}>
              {stats.ultimo.toFixed(0)}
            </span>{' '}
            · éxito (50 ep.) <span className="text-lime">{Math.round(stats.tasa * 100)}%</span>
          </span>
        </>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </DemoFrame>
  )
}
