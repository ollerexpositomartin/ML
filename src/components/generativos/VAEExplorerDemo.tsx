/**
 * VAEExplorerDemo — Demo S2 (`demo_latente_vae`) del módulo Generativos.
 * Explorador de rejilla latente 2D: el puntero barre z = (z₁, z₂) y la forma
 * decodificada (continuo círculo → cuadrado → estrella) se morfa en vivo.
 * Toggle KL: colapso del posterior (todos los puntos agrupados en el centro)
 * vs. dispersión sana. Crosshair con retardo de muelle, canvas 2D.
 */

import { useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const W = 900
const H = 380
const SPLIT = 420 // panel latente a la izquierda (cuadrado ~340)
const GRID_HALF = 170
const Z_RANGE = 2.5

/** Forma decodificada: radio polar r(θ) interpolando círculo/cuadrado/estrella. */
function shapeRadius(theta: number, z1: number, z2: number): number {
  // z1: -2.5 (círculo) → 0 (cuadrado) → +2.5 (estrella)
  const t = (z1 + Z_RANGE) / (2 * Z_RANGE) // 0..1
  const rCircle = 1
  // cuadrado: superelipse p→∞ ≈ 1/max(|cos|,|sin|) suavizada
  const rSquare = 1 / Math.pow(Math.abs(Math.cos(theta)) ** 6 + Math.abs(Math.sin(theta)) ** 6, 1 / 6)
  // estrella de 5 puntas
  const rStar = 0.72 + 0.38 * Math.cos(5 * theta)
  let r: number
  if (t < 0.5) r = rCircle + (rSquare - rCircle) * (t * 2)
  else r = rSquare + (rStar - rSquare) * ((t - 0.5) * 2)
  // z2 controla escala (0.55 → 1.35) y algo de rotación se aplica fuera
  const scale = 0.55 + ((z2 + Z_RANGE) / (2 * Z_RANGE)) * 0.8
  return r * scale
}

interface SamplePt {
  hx: number // sano
  hy: number
  cx: number // colapsado
  cy: number
}

function makeSamples(): SamplePt[] {
  const pts: SamplePt[] = []
  for (let i = 0; i < 26; i++) {
    const u1 = Math.random() || 1e-9
    const u2 = Math.random()
    const r = Math.sqrt(-2 * Math.log(u1))
    pts.push({
      hx: Math.max(-2.4, Math.min(2.4, r * Math.cos(2 * Math.PI * u2))),
      hy: Math.max(-2.4, Math.min(2.4, r * Math.sin(2 * Math.PI * u2))),
      cx: (Math.random() - 0.5) * 0.3,
      cy: (Math.random() - 0.5) * 0.3,
    })
  }
  return pts
}

const zToPx = (z1: number, z2: number): [number, number] => [
  SPLIT / 2 + (z1 / Z_RANGE) * GRID_HALF,
  H / 2 - (z2 / Z_RANGE) * GRID_HALF,
]

export default function VAEExplorerDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const collapsedRef = useRef(collapsed)
  useEffect(() => {
    collapsedRef.current = collapsed
  }, [collapsed])
  const pointerRef = useRef({ z1: 0.8, z2: 0.4, tx: 0.8, ty: 0.4 })
  const spreadRef = useRef(1) // 1 = sano, 0 = colapsado (interpolado)
  const samplesRef = useRef<SamplePt[]>(makeSamples())
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const draw = () => {
      const p = pointerRef.current
      // muelle: el crosshair sigue al puntero con retardo
      p.z1 += (p.tx - p.z1) * 0.14
      p.z2 += (p.ty - p.z2) * 0.14
      const target = collapsedRef.current ? 0 : 1
      spreadRef.current += (target - spreadRef.current) * 0.08
      const spread = spreadRef.current

      ctx.fillStyle = '#0A0E1A'
      ctx.fillRect(0, 0, W, H)

      // ---------- Panel latente ----------
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillStyle = '#55618A'
      ctx.fillText('espacio latente z = (z₁, z₂)', 24, 30)

      // rejilla
      ctx.strokeStyle = 'rgba(28,36,64,0.9)'
      ctx.lineWidth = 1
      for (let i = -2; i <= 2; i++) {
        const [gx] = zToPx(i, 0)
        const [, gy] = zToPx(0, i)
        ctx.beginPath(); ctx.moveTo(gx, H / 2 - GRID_HALF); ctx.lineTo(gx, H / 2 + GRID_HALF); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(SPLIT / 2 - GRID_HALF, gy); ctx.lineTo(SPLIT / 2 + GRID_HALF, gy); ctx.stroke()
      }
      // ejes
      ctx.strokeStyle = '#2A3556'
      ctx.beginPath(); ctx.moveTo(SPLIT / 2 - GRID_HALF, H / 2); ctx.lineTo(SPLIT / 2 + GRID_HALF, H / 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(SPLIT / 2, H / 2 - GRID_HALF); ctx.lineTo(SPLIT / 2, H / 2 + GRID_HALF); ctx.stroke()

      // muestras del posterior (sanas vs colapsadas)
      for (const s of samplesRef.current) {
        const x = s.cx + (s.hx - s.cx) * spread
        const y = s.cy + (s.hy - s.cy) * spread
        const [px, py] = zToPx(x, y)
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = spread < 0.4 ? 'rgba(251,113,133,0.75)' : 'rgba(139,92,246,0.75)'
        ctx.fill()
      }

      // crosshair con retardo de muelle
      const [cx, cy] = zToPx(p.z1, p.z2)
      ctx.strokeStyle = 'rgba(34,211,238,0.35)'
      ctx.beginPath(); ctx.moveTo(SPLIT / 2 - GRID_HALF, cy); ctx.lineTo(SPLIT / 2 + GRID_HALF, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, H / 2 - GRID_HALF); ctx.lineTo(cx, H / 2 + GRID_HALF); ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, Math.PI * 2)
      ctx.strokeStyle = '#22D3EE'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#22D3EE'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillText(`z = (${p.z1.toFixed(2)}, ${p.z2.toFixed(2)})`, Math.min(cx + 12, SPLIT - 110), cy - 10)

      // ---------- Panel decodificado ----------
      ctx.fillStyle = '#55618A'
      ctx.fillText('decodificado  x = D(z)', SPLIT + 40, 30)
      const dcx = SPLIT + 40 + (W - SPLIT - 80) / 2
      const dcy = H / 2 + 6
      const R = Math.min(W - SPLIT - 80, H - 90) / 2.4
      const rot = (p.z2 / Z_RANGE) * Math.PI // z2 también roza la forma

      ctx.save()
      ctx.shadowColor = '#22D3EE'
      ctx.shadowBlur = 14
      ctx.beginPath()
      for (let i = 0; i <= 160; i++) {
        const th = (i / 160) * Math.PI * 2
        const r = shapeRadius(th - rot, p.z1, p.z2) * R
        const px = dcx + Math.cos(th) * r
        const py = dcy - Math.sin(th) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(34,211,238,0.10)'
      ctx.fill()
      ctx.strokeStyle = '#22D3EE'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()

      // etiqueta del morfo
      const t = (p.z1 + Z_RANGE) / (2 * Z_RANGE)
      const label = t < 0.35 ? '≈ círculo' : t < 0.65 ? '≈ cuadrado' : '≈ estrella'
      ctx.fillStyle = '#8E9AB8'
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillText(label, dcx - 34, dcy + R + 30)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Puntero sobre el panel latente
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width) * W
      const py = ((e.clientY - r.top) / r.height) * H
      if (px > SPLIT - 20) return
      const p = pointerRef.current
      p.tx = Math.max(-Z_RANGE, Math.min(Z_RANGE, ((px - SPLIT / 2) / GRID_HALF) * Z_RANGE))
      p.ty = Math.max(-Z_RANGE, Math.min(Z_RANGE, -((py - H / 2) / GRID_HALF) * Z_RANGE))
    }
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerdown', move)
    return () => {
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerdown', move)
    }
  }, [])

  return (
    <DemoFrame
      title="explorador_latente_vae.py"
      controls={
        <>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              'rounded-md border px-3 py-1.5 font-mono text-xs transition-colors',
              collapsed
                ? 'border-rose/50 bg-rose/10 text-rose'
                : 'border-violet/40 bg-violet/10 text-violet hover:bg-violet/20',
            )}
            aria-pressed={collapsed}
          >
            {collapsed ? 'KL débil: posterior colapsado' : 'KL fuerte: posterior sano'}
          </button>
          <span className="font-mono text-xs text-faint">
            {collapsed
              ? 'Sin presión KL el encoder “hace trampas”: todos los z se apilan y el espacio deja de ser navegable'
              : 'Mueve el puntero por la rejilla z: la forma decodificada se morfa en vivo'}
          </span>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: 'crosshair' }}
        aria-label="Explorador del espacio latente 2D de un VAE: la forma decodificada cambia al mover el puntero"
      />
    </DemoFrame>
  )
}
