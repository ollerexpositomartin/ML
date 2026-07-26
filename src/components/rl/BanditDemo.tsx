/**
 * BanditDemo — 4 máquinas tragaperras con medias ocultas.
 * Tira palancas a mano (clic) o activa el piloto automático
 * ε-greedy / UCB y observa cómo las estimaciones Q convergen
 * a las medias reales (revelables) y cómo baja el arrepentimiento.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, pointerPos, setupCanvas } from '../fundamentos/utils'

const W = 620
const H = 380
const K = 4
const MACHINE_COLORS = [COLORS.cyan, COLORS.violet, COLORS.lime, COLORS.amber]
const BASE_MEANS = [0.2, 0.5, 0.8, 0.35]

type Algo = 'eps' | 'ucb'

export default function BanditDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState(3)
  const [algo, setAlgo] = useState<Algo>('eps')
  const [eps, setEps] = useState(0.1)
  const [reveal, setReveal] = useState(false)
  const [running, setRunning] = useState(false)

  // Medias ocultas (barajadas por semilla)
  const means = useMemo(() => {
    const rng = mulberry32(seed * 977 + 13)
    const idx = [0, 1, 2, 3]
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[idx[i], idx[j]] = [idx[j], idx[i]]
    }
    return idx.map((i) => BASE_MEANS[i])
  }, [seed])

  // Fuente de verdad en refs (el bucle automático las lee siempre frescas)
  const rngRef = useRef<() => number>(() => 0)
  const qRef = useRef<number[]>(Array(K).fill(0))
  const nRef = useRef<number[]>(Array(K).fill(0))
  const tRef = useRef(0)
  const regretRef = useRef(0)
  const lastRef = useRef<(number | null)[]>(Array(K).fill(null))
  const flashRef = useRef<number[]>(Array(K).fill(0))

  // Espejo en state para repintar
  const [, setTick] = useState(0)

  const reset = (newSeed?: number) => {
    const s = newSeed ?? seed
    rngRef.current = mulberry32(s * 1000 + 7)
    qRef.current = Array(K).fill(0)
    nRef.current = Array(K).fill(0)
    tRef.current = 0
    regretRef.current = 0
    lastRef.current = Array(K).fill(null)
    flashRef.current = Array(K).fill(0)
    setTick((v) => v + 1)
  }
  // inicializa el rng al montar / cambiar semilla
  useEffect(() => {
    reset()
    setRunning(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const pull = (arm: number) => {
    const r = gaussian(rngRef.current, means[arm], 1)
    nRef.current[arm] += 1
    qRef.current[arm] += (r - qRef.current[arm]) / nRef.current[arm]
    tRef.current += 1
    regretRef.current += Math.max(...means) - means[arm]
    lastRef.current[arm] = r
    flashRef.current[arm] = 1
    setTick((v) => v + 1)
  }

  const autoArm = (): number => {
    const Q = qRef.current
    const N = nRef.current
    if (algo === 'eps') {
      if (rngRef.current() < eps) return Math.floor(rngRef.current() * K)
      const m = Math.max(...Q)
      const best = Q.map((q, i) => [q, i] as const).filter(([q]) => q === m)
      return best[Math.floor(rngRef.current() * best.length)][1]
    }
    // UCB: primero los brazos no probados
    const untried = N.findIndex((n) => n === 0)
    if (untried >= 0) return untried
    const t = tRef.current
    const scores = Q.map((q, i) => q + Math.sqrt((2 * Math.log(t)) / N[i]))
    return scores.indexOf(Math.max(...scores))
  }

  // Bucle automático
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => pull(autoArm()), 120)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, algo, eps, means])

  // Dibujo
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)
    const Q = qRef.current
    const N = nRef.current

    // ---- mitad superior: las máquinas ----
    const slotW = 120
    const gap = (W - K * slotW) / (K + 1)
    const top = 26
    const mh = 150
    for (let i = 0; i < K; i++) {
      const x = gap + i * (slotW + gap)
      const col = MACHINE_COLORS[i]
      const flash = flashRef.current[i]
      const isBest = means[i] === Math.max(...means)

      // cuerpo
      ctx.fillStyle = '#0D1322'
      ctx.strokeStyle = reveal && isBest ? COLORS.lime : COLORS.line
      ctx.lineWidth = reveal && isBest ? 2.5 : 1.5
      ctx.beginPath()
      ctx.roundRect(x, top, slotW, mh, 10)
      ctx.fill()
      ctx.stroke()

      // flash de recompensa
      if (flash > 0.02) {
        ctx.fillStyle = `${col}${Math.round(flash * 60).toString(16).padStart(2, '0')}`
        ctx.beginPath()
        ctx.roundRect(x, top, slotW, mh, 10)
        ctx.fill()
        flashRef.current[i] = flash * 0.9
      }

      // palanca
      ctx.strokeStyle = col
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x + slotW - 14, top + 18)
      ctx.lineTo(x + slotW - 14, top + 44)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x + slotW - 14, top + 14, 6, 0, Math.PI * 2)
      ctx.fillStyle = col
      ctx.fill()

      // etiquetas
      ctx.font = 'bold 11px "JetBrains Mono", monospace'
      ctx.fillStyle = col
      ctx.fillText(`MÁQUINA ${i + 1}`, x + 12, top + 22)

      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillStyle = COLORS.muted
      ctx.fillText(`Q ≈ ${Q[i].toFixed(2)}`, x + 12, top + 62)
      ctx.fillText(`tiradas: ${N[i]}`, x + 12, top + 80)
      if (reveal) {
        ctx.fillStyle = COLORS.faint
        ctx.fillText(`μ real: ${means[i].toFixed(2)}`, x + 12, top + 98)
      } else {
        ctx.fillStyle = COLORS.faint
        ctx.fillText('μ real: ¿?', x + 12, top + 98)
      }
      const last = lastRef.current[i]
      if (last !== null) {
        ctx.fillStyle = last >= 0 ? COLORS.lime : COLORS.rose
        ctx.font = 'bold 13px "JetBrains Mono", monospace'
        ctx.fillText(`${last >= 0 ? '+' : ''}${last.toFixed(2)}`, x + 12, top + 126)
      }
    }

    // ---- mitad inferior: barras de Q vs medias reales ----
    const padL = 40
    const plotW = W - padL - 20
    const base = H - 46
    const plotH = 150
    const maxV = 1.1

    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 1
    ctx.font = '10px "JetBrains Mono", monospace'
    for (let f = 0; f <= 4; f++) {
      const v = (maxV * f) / 4
      const y = base - (v / maxV) * plotH
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - 20, y)
      ctx.stroke()
      ctx.fillStyle = COLORS.faint
      ctx.fillText(v.toFixed(2), 6, y + 3)
    }

    const bw = 56
    const slot = plotW / K
    for (let i = 0; i < K; i++) {
      const x = padL + i * slot + (slot - bw) / 2
      const h = Math.max(0, (Q[i] / maxV) * plotH)
      ctx.fillStyle = `${MACHINE_COLORS[i]}cc`
      ctx.fillRect(x, base - h, bw, h)
      ctx.strokeStyle = MACHINE_COLORS[i]
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, base - h, bw, h)

      if (reveal) {
        const y = base - (means[i] / maxV) * plotH
        ctx.strokeStyle = COLORS.ink
        ctx.setLineDash([5, 4])
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x - 8, y)
        ctx.lineTo(x + bw + 8, y)
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.fillStyle = COLORS.muted
      ctx.fillText(`M${i + 1}`, x + bw / 2 - 8, base + 16)
    }
  })

  const onClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e, W, H)
    const slotW = 120
    const gap = (W - K * slotW) / (K + 1)
    for (let i = 0; i < K; i++) {
      const x = gap + i * (slotW + gap)
      if (p.x >= x && p.x <= x + slotW && p.y >= 26 && p.y <= 26 + 150) {
        setRunning(false)
        pull(i)
        return
      }
    }
  }

  const regret = regretRef.current
  const t = tRef.current

  return (
    <DemoFrame
      title="bandido.py — ¿explorar o explotar?"
      controls={
        <>
          <div className="flex gap-1.5">
            {(['eps', 'ucb'] as Algo[]).map((a) => (
              <button
                key={a}
                onClick={() => setAlgo(a)}
                className={
                  a === algo
                    ? 'rounded-lg border border-violet/60 bg-violet/15 px-3 py-1.5 font-mono text-xs text-violet'
                    : 'rounded-lg border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink'
                }
              >
                {a === 'eps' ? 'ε-greedy' : 'UCB'}
              </button>
            ))}
          </div>
          {algo === 'eps' && (
            <label className="flex items-center gap-2 font-mono text-xs text-muted">
              ε
              <input
                type="range" min={0} max={0.5} step={0.01} value={eps}
                onChange={(e) => setEps(Number(e.target.value))}
                className="w-24 accent-cyan"
              />
              <span className="w-9 text-cyan">{eps.toFixed(2)}</span>
            </label>
          )}
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-lg bg-gradient-brand px-3 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            {running ? '⏸ Pausa' : '▶ Automático'}
          </button>
          <button
            onClick={() => { setRunning(false); reset() }}
            className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            Reiniciar
          </button>
          <button
            onClick={() => { setRunning(false); setSeed((s) => s + 1) }}
            className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            Nuevas máquinas
          </button>
          <label className="flex items-center gap-1.5 font-mono text-xs text-muted">
            <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} className="accent-violet" />
            revelar μ
          </label>
          <span className="ml-auto font-mono text-xs text-muted">
            pasos <span className="text-ink">{t}</span> · arrepentimiento{' '}
            <span className={regret < 20 ? 'text-lime' : regret < 60 ? 'text-amber' : 'text-rose'}>
              {regret.toFixed(1)}
            </span>
          </span>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onClick}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
      />
    </DemoFrame>
  )
}
