/**
 * Demo · Drift — dos distribuciones (referencia cyan, producción violet).
 * Arrastra la distribución de producción horizontalmente (o cambia su
 * dispersión) y observa el PSI en vivo con semáforo de alerta:
 * < 0.1 estable (lime) · 0.1–0.2 vigilar (amber) · ≥ 0.2 drift (rose).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'

const W = 860
const H = 320
const BINS = 28
const DOM_MIN = -4
const DOM_MAX = 8
const PAD_L = 16
const PAD_R = 220

const gauss = (x: number, mu: number, sigma: number) =>
  Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI))

function histogram(mu: number, sigma: number): number[] {
  const raw: number[] = []
  for (let i = 0; i < BINS; i++) {
    const c = DOM_MIN + ((i + 0.5) / BINS) * (DOM_MAX - DOM_MIN)
    raw.push(gauss(c, mu, sigma))
  }
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => v / sum)
}

function psi(e: number[], a: number[]): number {
  const eps = 1e-6
  let s = 0
  for (let i = 0; i < e.length; i++) {
    const ei = Math.max(e[i], eps)
    const ai = Math.max(a[i], eps)
    s += (ai - ei) * Math.log(ai / ei)
  }
  return s
}

const xToMu = (px: number) =>
  DOM_MIN + ((px - PAD_L) / (W - PAD_L - PAD_R)) * (DOM_MAX - DOM_MIN)
const muToX = (mu: number) =>
  PAD_L + ((mu - DOM_MIN) / (DOM_MAX - DOM_MIN)) * (W - PAD_L - PAD_R)

export default function DriftDemo() {
  const [mu, setMu] = useState(0.6)
  const [sigma, setSigma] = useState(1)
  const [dragging, setDragging] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const refHist = useMemo(() => histogram(0, 1), [])
  const newHist = useMemo(() => histogram(mu, sigma), [mu, sigma])
  const psiVal = useMemo(() => psi(refHist, newHist), [refHist, newHist])

  const estado =
    psiVal < 0.1
      ? { label: 'ESTABLE', color: '#A3E635', desc: 'Todo en orden: la entrada se parece al entrenamiento.' }
      : psiVal < 0.2
        ? { label: 'VIGILAR', color: '#FBBF24', desc: 'Cambio moderado: vigila métricas de negocio y prepara datos nuevos.' }
        : { label: 'DRIFT · RE-ENTRENAR', color: '#FB7185', desc: 'Alerta: la distribución cambió de verdad. Dispara el pipeline de re-entrenamiento.' }

  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const plotW = W - PAD_L - PAD_R
    const plotH = H - 56
    const maxP = Math.max(...refHist, ...newHist)
    const binW = plotW / BINS
    const yOf = (p: number) => 16 + plotH - (p / maxP) * plotH

    // rejilla horizontal
    ctx.strokeStyle = '#1C2440'
    ctx.lineWidth = 1
    for (let g = 0; g <= 4; g++) {
      const y = 16 + (g / 4) * plotH
      ctx.beginPath()
      ctx.moveTo(PAD_L, y)
      ctx.lineTo(PAD_L + plotW, y)
      ctx.stroke()
    }

    // histogramas
    const drawHist = (hist: number[], fill: string, stroke: string) => {
      ctx.beginPath()
      for (let i = 0; i < BINS; i++) {
        const x = PAD_L + i * binW
        const y = yOf(hist[i])
        ctx.rect(x + 1, y, binW - 2, 16 + plotH - y)
      }
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.stroke()
    }
    drawHist(refHist, 'rgba(34,211,238,0.18)', 'rgba(34,211,238,0.7)')
    drawHist(newHist, 'rgba(139,92,246,0.28)', 'rgba(139,92,246,0.9)')

    // asa de arrastre sobre la media de producción
    const hx = muToX(mu)
    ctx.strokeStyle = '#8B5CF6'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(hx, 16)
    ctx.lineTo(hx, 16 + plotH)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#8B5CF6'
    ctx.beginPath()
    ctx.arc(hx, 16 + plotH + 14, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#04060D'
    ctx.font = 'bold 9px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('↔', hx, 16 + plotH + 17)

    // etiquetas eje x
    ctx.fillStyle = '#55618A'
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    for (let v = DOM_MIN; v <= DOM_MAX; v += 2) {
      ctx.fillText(String(v), muToX(v), H - 4)
    }

    // panel PSI (derecha)
    const px = W - PAD_R + 20
    const pw = PAD_R - 36
    ctx.textAlign = 'left'
    ctx.fillStyle = '#8E9AB8'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('PSI en vivo', px, 40)
    ctx.fillStyle = estado.color
    ctx.font = 'bold 26px "JetBrains Mono", monospace'
    ctx.fillText(psiVal.toFixed(3), px, 70)

    // barra semáforo 0 → 0.6
    const barY = 92
    const barH = 12
    const scale = (v: number) => px + Math.min(1, v / 0.6) * pw
    ctx.fillStyle = 'rgba(163,230,53,0.25)'
    ctx.fillRect(px, barY, scale(0.1) - px, barH)
    ctx.fillStyle = 'rgba(251,191,36,0.25)'
    ctx.fillRect(scale(0.1), barY, scale(0.2) - scale(0.1), barH)
    ctx.fillStyle = 'rgba(251,113,133,0.25)'
    ctx.fillRect(scale(0.2), barY, px + pw - scale(0.2), barH)
    ctx.strokeStyle = '#1C2440'
    ctx.strokeRect(px, barY, pw, barH)
    // marcador
    const mx = scale(psiVal)
    ctx.fillStyle = estado.color
    ctx.beginPath()
    ctx.moveTo(mx, barY - 6)
    ctx.lineTo(mx - 5, barY - 14)
    ctx.lineTo(mx + 5, barY - 14)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#55618A'
    ctx.font = '9px "JetBrains Mono", monospace'
    ctx.fillText('0.1', scale(0.1) - 6, barY + barH + 12)
    ctx.fillText('0.2', scale(0.2) - 6, barY + barH + 12)
    ctx.fillText('0.6', px + pw - 12, barY + barH + 12)

    // semáforo
    const sy = 150
    ;[['#A3E635', psiVal < 0.1], ['#FBBF24', psiVal >= 0.1 && psiVal < 0.2], ['#FB7185', psiVal >= 0.2]].forEach(
      ([c, on], i) => {
        ctx.beginPath()
        ctx.arc(px + 12, sy + i * 24, 7, 0, Math.PI * 2)
        ctx.fillStyle = on ? (c as string) : '#1C2440'
        ctx.fill()
        if (on) {
          ctx.shadowColor = c as string
          ctx.shadowBlur = 12
          ctx.fill()
          ctx.shadowBlur = 0
        }
      },
    )
    ctx.fillStyle = estado.color
    ctx.font = 'bold 11px "JetBrains Mono", monospace'
    ctx.fillText(estado.label, px + 28, sy + (psiVal < 0.1 ? 4 : psiVal < 0.2 ? 28 : 52))

    // leyenda
    ctx.fillStyle = '#22D3EE'
    ctx.fillText('— referencia (train)', px, 246)
    ctx.fillStyle = '#8B5CF6'
    ctx.fillText('— producción (hoy)', px, 264)
    ctx.fillStyle = '#55618A'
    ctx.font = '9px "JetBrains Mono", monospace'
    ctx.fillText('arrastra la violeta', px, 286)
  }, [refHist, newHist, psiVal, mu, estado])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: PointerEvent) => {
      const cv = canvasRef.current
      if (!cv) return
      const rect = cv.getBoundingClientRect()
      const px = ((e.clientX - rect.left) / rect.width) * W
      setMu(Math.max(DOM_MIN + 0.5, Math.min(DOM_MAX - 0.5, xToMu(px))))
    }
    const onUp = () => setDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging])

  return (
    <DemoFrame
      title="monitor_drift.py"
      controls={
        <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-3 font-mono text-xs text-muted">
            σ producción
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={sigma}
              onChange={(e) => setSigma(Number(e.target.value))}
              className="h-1.5 w-36 cursor-pointer accent-violet"
              aria-label="Dispersión de la distribución de producción"
            />
            <span className="w-8 text-violet">{sigma.toFixed(2)}</span>
          </label>
          <span className="font-mono text-xs text-muted">
            μ producción <span className="text-violet">{mu.toFixed(2)}</span> (arrastra el asa ●)
          </span>
          <span className="ml-auto font-mono text-xs" style={{ color: estado.color }}>
            {estado.desc}
          </span>
        </div>
      }
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'ew-resize', touchAction: 'none' }}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const px = ((e.clientX - rect.left) / rect.width) * W
          if (px < W - PAD_R) {
            setDragging(true)
            setMu(Math.max(DOM_MIN + 0.5, Math.min(DOM_MAX - 0.5, xToMu(px))))
          }
        }}
      />
    </DemoFrame>
  )
}
