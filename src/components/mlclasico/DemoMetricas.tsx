/**
 * DemoMetricas — matriz de confusión en vivo + barras P/R/F1 + curva ROC.
 * Slider de umbral; presets que cambian el balance de clases y el solapamiento.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, setupCanvas, sigmoid, trainLogistic } from './utils'

const LW = 300
const LH = 300

interface Preset {
  name: string
  posFrac: number
  sep: number
  sigma: number
}

const PRESETS: Preset[] = [
  { name: 'Balanceado', posFrac: 0.5, sep: 2.6, sigma: 1.0 },
  { name: 'Detector de fraude', posFrac: 0.12, sep: 2.4, sigma: 1.0 },
  { name: 'Diagnóstico médico', posFrac: 0.35, sep: 1.6, sigma: 1.1 },
]

function buildData(p: Preset) {
  const rng = mulberry32(31)
  const X: Array<[number, number]> = []
  const Y: number[] = []
  const nPos = Math.round(160 * p.posFrac)
  const nNeg = 160 - nPos
  for (let i = 0; i < nNeg; i++) {
    X.push([gaussian(rng, 2, p.sigma), gaussian(rng, 2, p.sigma)])
    Y.push(0)
  }
  for (let i = 0; i < nPos; i++) {
    X.push([gaussian(rng, 2 + p.sep * 0.7, p.sigma), gaussian(rng, 2 + p.sep, p.sigma)])
    Y.push(1)
  }
  return { X, Y }
}

export default function DemoMetricas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [presetIdx, setPresetIdx] = useState(0)
  const [threshold, setThreshold] = useState(0.5)

  const { Y, scores } = useMemo(() => {
    const { X, Y } = buildData(PRESETS[presetIdx])
    const { w, b } = trainLogistic(X, Y, 0.4, 400)
    const scores = X.map((x) => sigmoid(w[0] * x[0] + w[1] * x[1] + b))
    return { Y, scores }
  }, [presetIdx])

  // ROC: barrer umbrales
  const roc = useMemo(() => {
    const pts: Array<{ fpr: number; tpr: number }> = []
    const nPos = Y.filter((v) => v === 1).length
    const nNeg = Y.length - nPos
    for (let t = 0; t <= 1.001; t += 0.02) {
      let tp = 0
      let fp = 0
      for (let i = 0; i < scores.length; i++) {
        if (scores[i] >= t) {
          if (Y[i] === 1) tp++
          else fp++
        }
      }
      pts.push({ fpr: nNeg ? fp / nNeg : 0, tpr: nPos ? tp / nPos : 0 })
    }
    let auc = 0
    const sorted = [...pts].sort((a, b) => a.fpr - b.fpr)
    for (let i = 1; i < sorted.length; i++) {
      auc += ((sorted[i].fpr - sorted[i - 1].fpr) * (sorted[i].tpr + sorted[i - 1].tpr)) / 2
    }
    return { pts, auc }
  }, [scores, Y])

  const conf = useMemo(() => {
    let tp = 0
    let fp = 0
    let tn = 0
    let fn = 0
    for (let i = 0; i < scores.length; i++) {
      const pred = scores[i] >= threshold ? 1 : 0
      if (pred === 1 && Y[i] === 1) tp++
      else if (pred === 1) fp++
      else if (Y[i] === 1) fn++
      else tn++
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
    const acc = (tp + tn) / scores.length
    return { tp, fp, tn, fn, precision, recall, f1, acc }
  }, [scores, Y, threshold])

  // punto ROC al umbral actual
  const rocDot = useMemo(() => {
    const nPos = Y.filter((v) => v === 1).length
    const nNeg = Y.length - nPos
    return {
      fpr: nNeg ? conf.fp / nNeg : 0,
      tpr: nPos ? conf.tp / nPos : 0,
    }
  }, [conf, Y])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, LW, LH)
    ctx.clearRect(0, 0, LW, LH)
    const pad = 34
    const px = (fpr: number) => pad + fpr * (LW - pad - 10)
    const py = (tpr: number) => LH - 24 - tpr * (LH - 24 - 14)

    // rejilla + diagonal aleatoria
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 1
    ctx.strokeRect(pad, 14, LW - pad - 10, LH - 38)
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = COLORS.faint
    ctx.beginPath(); ctx.moveTo(pad, py(0)); ctx.lineTo(px(1), py(1)); ctx.stroke()
    ctx.setLineDash([])

    // curva ROC
    ctx.strokeStyle = COLORS.cyan
    ctx.lineWidth = 2.5
    ctx.beginPath()
    roc.pts.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(px(pt.fpr), py(pt.tpr))
      else ctx.lineTo(px(pt.fpr), py(pt.tpr))
    })
    ctx.stroke()

    // punto del umbral actual
    ctx.beginPath(); ctx.arc(px(rocDot.fpr), py(rocDot.tpr), 7, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.amber; ctx.fill()
    ctx.strokeStyle = '#04060D'; ctx.lineWidth = 2; ctx.stroke()

    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    ctx.fillText('FPR →', pad + 90, LH - 8)
    ctx.save()
    ctx.translate(12, 150)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('TPR →', 0, 0)
    ctx.restore()
    ctx.fillStyle = COLORS.cyan
    ctx.fillText(`AUC = ${roc.auc.toFixed(3)}`, pad + 8, 30)
  }, [roc, rocDot])

  const cells: Array<[string, number, string]> = [
    ['TP', conf.tp, 'text-lime'],
    ['FP', conf.fp, 'text-rose'],
    ['FN', conf.fn, 'text-rose'],
    ['TN', conf.tn, 'text-lime'],
  ]
  const bars: Array<[string, number, string]> = [
    ['Precision', conf.precision, COLORS.violet],
    ['Recall', conf.recall, COLORS.cyan],
    ['F1', conf.f1, COLORS.amber],
    ['Accuracy', conf.acc, COLORS.lime],
  ]

  return (
    <DemoFrame
      title="metricas.py — mueve el umbral y mira quién paga el error"
      controls={
        <>
          <div className="flex gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setPresetIdx(i)}
                className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
                  i === presetIdx ? 'border-cyan/60 bg-cyan/15 text-cyan' : 'border-line text-muted hover:text-ink'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            umbral
            <input
              type="range" min={0.02} max={0.98} step={0.01} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-32 accent-cyan"
            />
            <span className="w-10 text-cyan">{threshold.toFixed(2)}</span>
          </label>
        </>
      }
    >
      <div className="grid md:grid-cols-[300px_1fr]">
        <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 300, height: 'auto', display: 'block' }} />
        <div className="flex flex-col gap-4 border-t border-line p-4 md:border-l md:border-t-0">
          {/* matriz de confusión */}
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              matriz de confusión · umbral {threshold.toFixed(2)}
            </div>
            <div className="grid max-w-[280px] grid-cols-2 gap-1.5">
              {cells.map(([label, v, cls]) => (
                <div key={label} className="rounded-lg border border-line bg-panel px-3 py-2 text-center">
                  <div className="font-mono text-[10px] text-faint">{label}</div>
                  <div className={`font-mono text-xl font-bold ${cls}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          {/* barras */}
          <div className="space-y-2.5">
            {bars.map(([label, v, color]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between font-mono text-[11px]">
                  <span className="text-muted">{label}</span>
                  <span style={{ color }}>{(v * 100).toFixed(1)} %</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${v * 100}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-faint">
            Con clases desbalanceadas la accuracy miente: un clasificador que siempre dice
            "no fraude" acierta el {(100 - PRESETS[presetIdx].posFrac * 100).toFixed(0)} %… y no sirve para nada.
          </p>
        </div>
      </div>
    </DemoFrame>
  )
}
