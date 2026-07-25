/**
 * DemoGaussiana — histograma de alturas + gaussiana superpuesta con asas
 * arrastrables para μ y σ. NLL en vivo y botón "Ajustar por MLE".
 */

import { useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, pointerPos, setupCanvas } from './utils'

const W = 640
const H = 360
const XMIN = 145
const XMAX = 195
const BIN = 2.5
const N = 140

function sampleHeights(seed: number): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: N }, () => gaussian(rng, 170, 8))
}

const normPdf = (x: number, mu: number, sigma: number) =>
  Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI))

export default function DemoGaussiana() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState(42)
  const [data, setData] = useState<number[]>(() => sampleHeights(42))
  const [mu, setMu] = useState(165)
  const [sigma, setSigma] = useState(4)
  const dragRef = useRef<'mu' | 'sigma' | null>(null)
  const animRef = useRef<number>(0)

  const mleMu = data.reduce((a, v) => a + v, 0) / data.length
  const mleSigma = Math.sqrt(data.reduce((a, v) => a + (v - mleMu) ** 2, 0) / data.length)

  // NLL media por punto
  const nll =
    data.reduce((a, v) => a - Math.log(Math.max(normPdf(v, mu, sigma), 1e-300)), 0) / data.length
  const nllOpt = data.reduce((a, v) => a - Math.log(Math.max(normPdf(v, mleMu, mleSigma), 1e-300)), 0) / data.length

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    const plot = { x0: 40, x1: W - 16, y0: 16, y1: H - 34 }
    const xToC = (x: number) => plot.x0 + ((x - XMIN) / (XMAX - XMIN)) * (plot.x1 - plot.x0)
    const maxCount = Math.max(
      1,
      ...Array.from({ length: Math.ceil((XMAX - XMIN) / BIN) }, (_, i) => {
        const lo = XMIN + i * BIN
        return data.filter((v) => v >= lo && v < lo + BIN).length
      }),
    )
    const yToC = (count: number) => plot.y1 - (count / (maxCount * 1.15)) * (plot.y1 - plot.y0)

    // ejes
    ctx.strokeStyle = COLORS.faint
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(plot.x0, plot.y1); ctx.lineTo(plot.x1, plot.y1); ctx.stroke()
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    for (let x = 150; x <= 190; x += 10) {
      ctx.fillText(String(x), xToC(x) - 8, plot.y1 + 14)
    }
    ctx.fillText('altura (cm)', plot.x1 - 70, plot.y1 + 28)

    // histograma
    const nBins = Math.ceil((XMAX - XMIN) / BIN)
    for (let i = 0; i < nBins; i++) {
      const lo = XMIN + i * BIN
      const count = data.filter((v) => v >= lo && v < lo + BIN).length
      const px = xToC(lo)
      const pw = ((BIN) / (XMAX - XMIN)) * (plot.x1 - plot.x0) - 2
      ctx.fillStyle = 'rgba(34, 211, 238, 0.28)'
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)'
      ctx.lineWidth = 1
      ctx.fillRect(px + 1, yToC(count), pw, plot.y1 - yToC(count))
      ctx.strokeRect(px + 1, yToC(count), pw, plot.y1 - yToC(count))
    }

    // curva gaussiana escalada a conteos (N · ancho_bin · pdf)
    const scale = N * BIN
    ctx.strokeStyle = COLORS.violet
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let px = plot.x0; px <= plot.x1; px++) {
      const x = XMIN + ((px - plot.x0) / (plot.x1 - plot.x0)) * (XMAX - XMIN)
      const y = yToC(scale * normPdf(x, mu, sigma))
      if (px === plot.x0) ctx.moveTo(px, y)
      else ctx.lineTo(px, y)
    }
    ctx.stroke()

    // asa μ: línea vertical + círculo
    const muX = xToC(mu)
    ctx.strokeStyle = COLORS.rose
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(muX, plot.y0); ctx.lineTo(muX, plot.y1); ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath(); ctx.arc(muX, plot.y0 + 8, 8, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.rose; ctx.fill()
    ctx.font = 'bold 11px "JetBrains Mono", monospace'
    ctx.fillStyle = '#04060D'
    ctx.fillText('μ', muX - 3.5, plot.y0 + 12)

    // asa σ: círculo a μ+σ a media altura de la campana
    const sigX = xToC(mu + sigma)
    const sigY = yToC(scale * normPdf(mu + sigma, mu, sigma))
    ctx.beginPath(); ctx.arc(sigX, sigY, 8, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.amber; ctx.fill()
    ctx.fillStyle = '#04060D'
    ctx.fillText('σ', sigX - 3.5, sigY + 4)
  }, [data, mu, sigma])

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    cancelAnimationFrame(animRef.current)
    const p = pointerPos(e, W, H)
    const plot = { x0: 40, x1: W - 16, y0: 16, y1: H - 34 }
    const xToC = (x: number) => plot.x0 + ((x - XMIN) / (XMAX - XMIN)) * (plot.x1 - plot.x0)
    if (Math.hypot(p.x - xToC(mu), p.y - (plot.y0 + 8)) < 18) {
      dragRef.current = 'mu'
      e.currentTarget.setPointerCapture(e.pointerId)
    } else if (Math.abs(p.x - xToC(mu + sigma)) < 18) {
      dragRef.current = 'sigma'
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return
    const p = pointerPos(e, W, H)
    const plot = { x0: 40, x1: W - 16 }
    const x = XMIN + ((p.x - plot.x0) / (plot.x1 - plot.x0)) * (XMAX - XMIN)
    if (dragRef.current === 'mu') setMu(Math.max(XMIN, Math.min(XMAX, x)))
    else setSigma(Math.max(0.8, Math.min(20, x - mu)))
  }
  const onUp = () => { dragRef.current = null }

  const fitMLE = () => {
    cancelAnimationFrame(animRef.current)
    const startMu = mu
    const startSigma = sigma
    const t0 = performance.now()
    const dur = 900
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      setMu(startMu + (mleMu - startMu) * e)
      setSigma(startSigma + (mleSigma - startSigma) * e)
      if (k < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
  }

  const resample = () => {
    cancelAnimationFrame(animRef.current)
    const s = seed + 1
    setSeed(s)
    setData(sampleHeights(s))
    setMu(165)
    setSigma(4)
  }

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  return (
    <DemoFrame
      title="gaussiana.py — arrastra μ y σ, minimiza la NLL"
      controls={
        <>
          <button
            onClick={fitMLE}
            className="rounded-lg bg-gradient-brand px-4 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            Ajustar por MLE
          </button>
          <button
            onClick={resample}
            className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            Remuestrear
          </button>
          <span className="ml-auto font-mono text-[11px] text-faint">
            MLE de una gaussiana: μ̂ = media, σ̂ = desviación (1/N)
          </span>
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_180px]">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
        <div className="flex flex-row flex-wrap gap-2 border-t border-line p-3 md:flex-col md:border-l md:border-t-0">
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">μ / σ</div>
            <div className="font-mono text-sm font-bold">
              <span className="text-rose">{mu.toFixed(1)}</span>
              <span className="text-faint"> / </span>
              <span className="text-amber">{sigma.toFixed(1)}</span>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">μ̂ / σ̂ MLE</div>
            <div className="font-mono text-sm font-bold text-lime">{mleMu.toFixed(1)} / {mleSigma.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">NLL / punto</div>
            <div className="font-mono text-sm font-bold" style={{ color: nll < nllOpt + 0.01 ? COLORS.lime : COLORS.rose }}>
              {nll.toFixed(3)}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">NLL óptima</div>
            <div className="font-mono text-sm font-bold text-lime">{nllOpt.toFixed(3)}</div>
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
