/**
 * GammaDemo — el efecto de γ en el retorno descontado.
 * Slider de γ + tres escenarios de recompensa; barras γᵏ·rₖ por paso
 * y el retorno total G₀. En llano: cuánto vale un euro mañana.
 */

import { useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, setupCanvas } from '../fundamentos/utils'

const W = 620
const H = 300
const T = 20

type Escenario = 'constante' | 'tardia' | 'inmediata'

const ESCENARIOS: Record<Escenario, { label: string; recompensas: () => number[] }> = {
  constante: {
    label: '€1 cada paso',
    recompensas: () => Array.from({ length: T }, () => 1),
  },
  tardia: {
    label: '€10 al final',
    recompensas: () => Array.from({ length: T }, (_, k) => (k === T - 1 ? 10 : 0)),
  },
  inmediata: {
    label: '€10 ya',
    recompensas: () => Array.from({ length: T }, (_, k) => (k === 0 ? 10 : 0)),
  },
}

export default function GammaDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gamma, setGamma] = useState(0.85)
  const [esc, setEsc] = useState<Escenario>('constante')

  const rs = ESCENARIOS[esc].recompensas()
  const descontadas = rs.map((r, k) => Math.pow(gamma, k) * r)
  const G = descontadas.reduce((a, b) => a + b, 0)
  const sinDescontar = rs.reduce((a, b) => a + b, 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    const padL = 46
    const padR = 16
    const padT = 30
    const padB = 40
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const maxV = Math.max(...descontadas, ...rs, 1e-9)
    const bw = plotW / T

    // rejilla horizontal
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 1
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    for (let f = 0; f <= 4; f++) {
      const v = (maxV * f) / 4
      const y = padT + plotH - (v / maxV) * plotH
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
      ctx.fillText(v.toFixed(1), 8, y + 3)
    }

    // barras: recompensa real (fantasma) + descontada (sólida)
    for (let k = 0; k < T; k++) {
      const x = padL + k * bw
      const hOrig = (rs[k] / maxV) * plotH
      const hDesc = (descontadas[k] / maxV) * plotH

      if (rs[k] > 0) {
        ctx.fillStyle = `${COLORS.faint}55`
        ctx.fillRect(x + 2, padT + plotH - hOrig, bw - 4, hOrig)
      }
      if (descontadas[k] > 1e-9) {
        const grad = ctx.createLinearGradient(0, padT + plotH - hDesc, 0, padT + plotH)
        grad.addColorStop(0, COLORS.cyan)
        grad.addColorStop(1, `${COLORS.cyan}44`)
        ctx.fillStyle = grad
        ctx.fillRect(x + 4, padT + plotH - hDesc, bw - 8, hDesc)
      }

      if (k % 2 === 0) {
        ctx.fillStyle = COLORS.faint
        ctx.fillText(`t=${k}`, x + 2, H - padB + 16)
      }
    }

    // leyenda
    ctx.fillStyle = `${COLORS.faint}55`
    ctx.fillRect(padL, 10, 10, 10)
    ctx.fillStyle = COLORS.muted
    ctx.fillText('recompensa real', padL + 16, 19)
    ctx.fillStyle = COLORS.cyan
    ctx.fillRect(padL + 140, 10, 10, 10)
    ctx.fillStyle = COLORS.muted
    ctx.fillText('lo que vale para el agente (γᵏ·rₖ)', padL + 156, 19)
  }, [gamma, esc]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DemoFrame
      title="gamma.py — un euro mañana vale menos que hoy"
      controls={
        <>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            γ
            <input
              type="range" min={0} max={0.99} step={0.01} value={gamma}
              onChange={(e) => setGamma(Number(e.target.value))}
              className="w-36 accent-cyan"
            />
            <span className="w-10 text-cyan">{gamma.toFixed(2)}</span>
          </label>
          <div className="flex gap-1.5">
            {(Object.keys(ESCENARIOS) as Escenario[]).map((k) => (
              <button
                key={k}
                onClick={() => setEsc(k)}
                className={
                  k === esc
                    ? 'rounded-lg border border-violet/60 bg-violet/15 px-3 py-1.5 font-mono text-xs text-violet'
                    : 'rounded-lg border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink'
                }
              >
                {ESCENARIOS[k].label}
              </button>
            ))}
          </div>
          <span className="ml-auto font-mono text-xs text-muted">
            G₀ = <span className="font-bold text-lime">{G.toFixed(2)}</span>
            <span className="text-faint"> (sin descontar: {sinDescontar.toFixed(0)})</span>
          </span>
        </>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </DemoFrame>
  )
}
