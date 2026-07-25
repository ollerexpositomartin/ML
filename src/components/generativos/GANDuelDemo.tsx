/**
 * GANDuelDemo — Demo S3 (`demo_duelo`), pieza central del módulo Generativos.
 * Duelo minimax en 1D: distribución objetivo (mezcla gaussiana, cyan),
 * distribución generada (gaussiana, violeta) y campo de scores del
 * discriminador (sombreado rosa; alto = "parece real").
 * Paso ▸ alterna D/G; Auto; toggles "D demasiado fuerte" (gradiente que se
 * desvanece) y "forzar colapso" (mode collapse sobre una moda).
 * Canvas 2D con interpolación de parámetros por rAF (morfo ~500ms).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, StepForward, RotateCcw, TriangleAlert } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const W = 900
const H = 400
const X_MIN = -4
const X_MAX = 4

const gauss = (x: number, m: number, s: number) =>
  Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI))
/** Distribución objetivo: mezcla de dos gaussianas. */
const pData = (x: number) => 0.5 * gauss(x, -1.5, 0.45) + 0.5 * gauss(x, 1.5, 0.45)

interface SimState {
  m: number; s: number; k: number // objetivos
  dm: number; ds: number; dk: number // mostrados (interpolados)
  shake: number
}
const INITIAL: SimState = { m: 2.7, s: 1.1, k: 1, dm: 2.7, ds: 1.1, dk: 1, shake: 0 }

const xToPx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W
const yToPx = (d: number) => H - 46 - d * (H - 110) / 0.95

export default function GANDuelDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<SimState>({ ...INITIAL })
  const rafRef = useRef(0)
  const [step, setStep] = useState(0)
  const [turn, setTurn] = useState<'D' | 'G'>('D')
  const [auto, setAuto] = useState(false)
  const [tooStrong, setTooStrong] = useState(false)
  const [collapse, setCollapse] = useState(false)
  const [status, setStatus] = useState('Pulsa Paso ▸ para alternar el entrenamiento de D y de G.')
  const tooStrongRef = useRef(tooStrong)
  const collapseRef = useRef(collapse)
  useEffect(() => {
    tooStrongRef.current = tooStrong
  }, [tooStrong])
  useEffect(() => {
    collapseRef.current = collapse
  }, [collapse])

  const trainD = useCallback(() => {
    const sim = simRef.current
    sim.k = Math.min(11, sim.k + (tooStrongRef.current ? 2.2 : 1.0))
    setStep((n) => n + 1)
    setStatus(
      tooStrongRef.current
        ? 'D mejora demasiado: sus scores se saturan a 0 y 1… el gradiente de G se está muriendo.'
        : 'D mejora: su campo de scores se afila y distingue mejor reales de generadas.',
    )
  }, [])

  const trainG = useCallback(() => {
    const sim = simRef.current
    const vanish = tooStrongRef.current ? 0.07 : 1
    if (collapseRef.current) {
      // Mode collapse: G se encarama sobre la moda más cercana y se encoge
      const target = sim.m >= 0 ? 1.5 : -1.5
      sim.m += (target - sim.m) * 0.45 * vanish
      sim.s = Math.max(0.14, sim.s * (1 - 0.35 * vanish))
      sim.shake = 1
      setStatus('G colapsa: ha encontrado UNA moda que engaña a D y la explota sin piedad. MODE COLLAPSE.')
    } else {
      // G sano: se acerca a la media global y ensancha para cubrir ambas modas
      sim.m += (0 - sim.m) * 0.3 * vanish
      sim.s += (1.55 - sim.s) * 0.25 * vanish
      setStatus(
        vanish < 1
          ? 'G apenas se mueve: con D saturado, ∂L/∂G ≈ 0. El gradiente se ha desvanecido.'
          : 'G mejora: su curva violeta se desliza hacia la distribución de datos.',
      )
    }
    setStep((n) => n + 1)
  }, [])

  const stepOnce = useCallback(() => {
    if (turn === 'D') {
      trainD()
      setTurn('G')
    } else {
      trainG()
      setTurn('D')
    }
  }, [turn, trainD, trainG])

  const reset = useCallback(() => {
    simRef.current = { ...INITIAL }
    setStep(0)
    setTurn('D')
    setAuto(false)
    setStatus('Reiniciado. G empieza lejos de los datos; D todavía es ingenuo.')
  }, [])

  // Auto: 2 pasos de D por cada paso de G (como en el entrenamiento real)
  useEffect(() => {
    if (!auto) return
    let i = 0
    const id = setInterval(() => {
      if (i % 3 < 2) trainD()
      else trainG()
      i++
    }, 850)
    return () => clearInterval(id)
  }, [auto, trainD, trainG])

  // Bucle de render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const draw = () => {
      const sim = simRef.current
      // interpolación ~500ms
      sim.dm += (sim.m - sim.dm) * 0.09
      sim.ds += (sim.s - sim.ds) * 0.09
      sim.dk += (sim.k - sim.dk) * 0.09
      sim.shake *= 0.94

      const shakeX = sim.shake * 7 * Math.sin(performance.now() / 28)

      ctx.fillStyle = '#0A0E1A'
      ctx.fillRect(0, 0, W, H)

      // eje x
      ctx.strokeStyle = '#1C2440'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, H - 46)
      ctx.lineTo(W, H - 46)
      ctx.stroke()
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillStyle = '#55618A'
      for (let x = -4; x <= 4; x += 1) ctx.fillText(String(x), xToPx(x) - 3, H - 30)

      // campo de scores de D (rosa, alto = "real")
      ctx.beginPath()
      ctx.moveTo(0, H - 46)
      for (let px = 0; px <= W; px += 3) {
        const x = X_MIN + (px / W) * (X_MAX - X_MIN)
        const pd = pData(x)
        const pg = gauss(x, sim.dm, sim.ds)
        const D = 1 / (1 + Math.exp(-sim.dk * Math.log((pd + 1e-6) / (pg + 1e-6))))
        ctx.lineTo(px, H - 46 - D * (H - 110))
      }
      ctx.lineTo(W, H - 46)
      ctx.closePath()
      ctx.fillStyle = 'rgba(251,113,133,0.10)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(251,113,133,0.45)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      ctx.save()
      ctx.translate(shakeX, 0)

      // curva objetivo (cyan)
      ctx.save()
      ctx.shadowColor = '#22D3EE'
      ctx.shadowBlur = 8
      ctx.beginPath()
      for (let px = 0; px <= W; px += 2) {
        const x = X_MIN + (px / W) * (X_MAX - X_MIN)
        const py = yToPx(pData(x))
        if (px === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#22D3EE'
      ctx.lineWidth = 2.2
      ctx.stroke()
      ctx.restore()

      // curva generada (violeta)
      ctx.save()
      ctx.shadowColor = '#8B5CF6'
      ctx.shadowBlur = 8
      ctx.beginPath()
      for (let px = 0; px <= W; px += 2) {
        const x = X_MIN + (px / W) * (X_MAX - X_MIN)
        const py = yToPx(gauss(x, sim.dm, sim.ds))
        if (px === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#8B5CF6'
      ctx.lineWidth = 2.2
      ctx.stroke()
      ctx.restore()

      ctx.restore()

      // leyenda
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillStyle = '#22D3EE'
      ctx.fillText('— p_data (objetivo)', 18, 26)
      ctx.fillStyle = '#8B5CF6'
      ctx.fillText('— p_g (generador)', 18, 44)
      ctx.fillStyle = '#FB7185'
      ctx.fillText('— D(x): “parece real”', 18, 62)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const collapsed = collapse && simRef.current.s < 0.45

  return (
    <DemoFrame
      title="duelo_minimax_gan.py"
      controls={
        <>
          <button
            onClick={stepOnce}
            className="flex items-center gap-1.5 rounded-md bg-gradient-brand px-3.5 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <StepForward className="h-3.5 w-3.5" aria-hidden />
            Paso ▸ ({turn === 'D' ? 'entrenar D' : 'entrenar G'})
          </button>
          <button
            onClick={() => setAuto((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors',
              auto ? 'border-lime/50 bg-lime/10 text-lime' : 'border-line text-muted hover:text-ink',
            )}
          >
            {auto ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
            {auto ? 'Auto · ON' : 'Auto'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset
          </button>
          <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-muted">
            <input
              type="checkbox"
              checked={tooStrong}
              onChange={(e) => setTooStrong(e.target.checked)}
              className="h-3.5 w-3.5 accent-amber"
            />
            D demasiado fuerte
          </label>
          <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-muted">
            <input
              type="checkbox"
              checked={collapse}
              onChange={(e) => setCollapse(e.target.checked)}
              className="h-3.5 w-3.5 accent-violet"
            />
            forzar colapso
          </label>
          <span className="ml-auto font-mono text-xs text-faint">paso {step}</span>
        </>
      }
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          aria-label="Duelo minimax de una GAN en 1D: curvas de p_data, p_g y campo de scores del discriminador"
        />
        {collapsed && (
          <span className="absolute right-3 top-3 animate-pulse rounded border border-rose/60 bg-rose/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-rose">
            MODE COLLAPSE
          </span>
        )}
      </div>
      <div className="flex items-center gap-2.5 border-t border-line bg-bg-0 px-4 py-2.5">
        {tooStrong && <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber" aria-hidden />}
        <p className={cn('font-mono text-xs', tooStrong ? 'text-amber' : 'text-muted')}>{status}</p>
      </div>
    </DemoFrame>
  )
}
