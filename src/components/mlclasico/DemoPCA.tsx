/**
 * DemoPCA — nube de puntos 3D rotando; "Proyectar" la aplana sobre PC1/PC2
 * con el porcentaje de varianza explicada. 3D manual en canvas (sin Three.js).
 */

import { useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, jacobiEigen3, mulberry32, setupCanvas } from './utils'

const W = 620
const H = 400

type V3 = [number, number, number]

// nube 3D alargada sobre un plano inclinado
const CLOUD: V3[] = (() => {
  const rng = mulberry32(61)
  const pts: V3[] = []
  for (let i = 0; i < 90; i++) {
    const u = gaussian(rng, 0, 1.6)
    const v = gaussian(rng, 0, 0.8)
    const w = gaussian(rng, 0, 0.22)
    // base: e1=(1,0.5,0.3), e2=(-0.3,1,0.2), e3=(0.2,-0.2,1) aprox ortogonales
    pts.push([
      u * 1 + v * -0.3 + w * 0.2,
      u * 0.5 + v * 1 + w * -0.2,
      u * 0.3 + v * 0.2 + w * 1,
    ])
  }
  return pts
})()

const PCA = (() => {
  const n = CLOUD.length
  const mean: V3 = [0, 0, 0]
  for (const p of CLOUD) for (let k = 0; k < 3; k++) mean[k] += p[k] / n
  const cov = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (const p of CLOUD) {
    const d = [p[0] - mean[0], p[1] - mean[1], p[2] - mean[2]]
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] += (d[i] * d[j]) / n
  }
  const { values, vectors } = jacobiEigen3(cov)
  const total = values[0] + values[1] + values[2]
  return { mean, values, vectors, varPct: values.map((v) => (100 * v) / total) }
})()

export default function DemoPCA() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [flat, setFlat] = useState(0) // 0 = 3D rotando, 1 = proyectado 2D
  const [target, setTarget] = useState(0)
  const animRef = useRef<number>(0)
  const angleRef = useRef(0.6)
  const flatRef = useRef(0)

  // animación continua: rotación lenta + transición 3D→2D
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      if (flatRef.current < 0.999) angleRef.current += dt * 0.35
      setFlat((prev) => {
        const next = prev + (target - prev) * Math.min(1, dt * 3.2)
        flatRef.current = next
        return Math.abs(target - next) < 0.002 ? target : next
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [target])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    const cx = W / 2
    const cy = H / 2
    const S = 62 // escala px/unidad
    const yaw = angleRef.current
    const pitch = 0.45

    // proyectar 3D → 2D pantalla
    const project3d = (p: V3): { x: number; y: number; z: number } => {
      const d = [p[0] - PCA.mean[0], p[1] - PCA.mean[1], p[2] - PCA.mean[2]]
      // yaw sobre Y, pitch sobre X
      const x1 = d[0] * Math.cos(yaw) + d[2] * Math.sin(yaw)
      const z1 = -d[0] * Math.sin(yaw) + d[2] * Math.cos(yaw)
      const y2 = d[1] * Math.cos(pitch) - z1 * Math.sin(pitch)
      const z2 = d[1] * Math.sin(pitch) + z1 * Math.cos(pitch)
      const persp = 1 / (1 + z2 * 0.06)
      return { x: cx + x1 * S * persp, y: cy - y2 * S * persp, z: z2 }
    }

    // coordenadas PCA (2D planas)
    const projectPCA = (p: V3): { x: number; y: number } => {
      const d = [p[0] - PCA.mean[0], p[1] - PCA.mean[1], p[2] - PCA.mean[2]]
      const pc1 = d[0] * PCA.vectors[0][0] + d[1] * PCA.vectors[0][1] + d[2] * PCA.vectors[0][2]
      const pc2 = d[0] * PCA.vectors[1][0] + d[1] * PCA.vectors[1][1] + d[2] * PCA.vectors[1][2]
      return { x: cx + pc1 * S, y: cy - pc2 * S }
    }

    // ejes PC1/PC2 cuando está plano
    if (flat > 0.03) {
      ctx.save()
      ctx.globalAlpha = flat
      // PC1
      const axis = (v: number[], color: string, label: string, pct: number) => {
        const len = 2.6
        const a0 = projectPCA([PCA.mean[0] - v[0] * len, PCA.mean[1] - v[1] * len, PCA.mean[2] - v[2] * len])
        const a1 = projectPCA([PCA.mean[0] + v[0] * len, PCA.mean[1] + v[1] * len, PCA.mean[2] + v[2] * len])
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke()
        ctx.font = 'bold 11px "JetBrains Mono", monospace'
        ctx.fillStyle = color
        ctx.fillText(`${label} · ${pct.toFixed(0)} %`, a1.x - 70, a1.y - 8)
      }
      axis(PCA.vectors[0], COLORS.cyan, 'PC1', PCA.varPct[0])
      axis(PCA.vectors[1], COLORS.violet, 'PC2', PCA.varPct[1])
      ctx.restore()
    }

    // puntos (interpolados 3D → plano)
    const pts = CLOUD.map((p) => {
      const a = project3d(p)
      const b = projectPCA(p)
      return {
        x: a.x + (b.x - a.x) * flat,
        y: a.y + (b.y - a.y) * flat,
        z: a.z,
      }
    })
    pts.sort((p, q) => q.z - p.z)
    for (const p of pts) {
      const depth = Math.max(0.35, Math.min(1, 1 - p.z * 0.08))
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(34, 211, 238, ${(0.35 + 0.6 * depth).toFixed(2)})`
      ctx.fill()
    }

    // etiqueta de estado
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillStyle = COLORS.faint
    ctx.fillText(
      flat < 0.5 ? 'ℝ³ · nube original (rotando)' : 'ℝ² · proyección sobre PC1/PC2',
      14,
      22,
    )
  }, [flat])

  const var2 = PCA.varPct[0] + PCA.varPct[1]

  return (
    <DemoFrame
      title="pca.py — la mejor sombra 2D de una nube 3D"
      controls={
        <>
          <button
            onClick={() => setTarget((t) => (t === 0 ? 1 : 0))}
            className="rounded-lg bg-gradient-brand px-4 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            {target === 0 ? 'Proyectar a 2D' : 'Volver a 3D'}
          </button>
          <span className="ml-auto font-mono text-[11px] text-faint">
            PC1+PC2 conservan el {var2.toFixed(1)} % de la varianza
          </span>
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_190px]">
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        <div className="flex flex-row flex-wrap gap-2 border-t border-line p-3 md:flex-col md:border-l md:border-t-0">
          {PCA.varPct.map((v, i) => (
            <div key={i} className="rounded-lg border border-line bg-panel px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-faint">
                var. PC{i + 1}
              </div>
              <div
                className="font-mono text-sm font-bold"
                style={{ color: [COLORS.cyan, COLORS.violet, COLORS.faint][i] }}
              >
                {v.toFixed(1)} %
              </div>
            </div>
          ))}
          <p className="px-1 font-mono text-[10px] leading-relaxed text-faint">
            PC3 aporta tan poco que podemos tirarla: compresión casi sin pérdida.
          </p>
        </div>
      </div>
    </DemoFrame>
  )
}
