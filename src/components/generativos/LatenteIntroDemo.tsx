/**
 * LatenteIntroDemo — Demo S1 (`demo_latente_intro`) del módulo Generativos.
 * El truco fundacional de todos los modelos generativos: arrastra puntos de una
 * nube gaussiana en el espacio z (simple) y observa cómo el "decoder" los
 * empuja (push-forward) hacia una distribución de dos lunas en el espacio x.
 * Canvas 2D puro, interpolación suave por rAF.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Shuffle } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'

const W = 900
const H = 380
const SPLIT = 300 // px: panel z a la izquierda
const N_POINTS = 22

/** Decoder juguete: z escalar → punto de una "doble luna" 2D. */
function normCDF(z: number): number {
  return 0.5 * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z ** 3)))
}
function decode(z: number): [number, number] {
  // t ∈ [0,2): 0→1 luna superior, 1→2 luna inferior
  const t = normCDF(z) * 1.999
  const seg = Math.min(1.9999, Math.max(0, t))
  const u = seg % 1
  if (seg < 1) {
    // luna superior: arco de (0,1) a (2,0) pasando por (1, 1.3)
    const a = Math.PI * u
    return [1 - Math.cos(a), 0.2 + Math.sin(a) * 1.15]
  }
  // luna inferior desplazada
  const a = Math.PI * u
  return [Math.cos(a), -(0.2 + Math.sin(a) * 1.15) - 0.15]
}

interface Pt {
  z: number // posición en el espacio latente (1D, eje horizontal)
  jitter: number // desplazamiento vertical decorativo en z-space
  dz: number // z mostrado (interpolado)
}

function samplePoints(): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < N_POINTS; i++) {
    // Box-Muller para N(0,1)
    const u1 = Math.random() || 1e-9
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    pts.push({ z: Math.max(-2.6, Math.min(2.6, z)), jitter: (Math.random() - 0.5) * 90, dz: 0 })
  }
  for (const p of pts) p.dz = p.z
  return pts
}

const Z_RANGE = 3
const zToPx = (z: number) => ((z + Z_RANGE) / (2 * Z_RANGE)) * (SPLIT - 40) + 20
const pxToZ = (px: number) => ((px - 20) / (SPLIT - 40)) * 2 * Z_RANGE - Z_RANGE
const dataToPx = (x: number, y: number): [number, number] => [
  SPLIT + 60 + ((x + 1.6) / 3.2) * (W - SPLIT - 120),
  H / 2 - (y / 1.6) * (H / 2 - 46),
]

export default function LatenteIntroDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ptsRef = useRef<Pt[]>(samplePoints())
  const dragRef = useRef<number | null>(null)
  const rafRef = useRef(0)
  const [hovering, setHovering] = useState(false)

  const resample = useCallback(() => {
    ptsRef.current = samplePoints()
    dragRef.current = null
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const draw = () => {
      // Interpolación 400ms-ish: lerp agresivo por frame
      for (const p of ptsRef.current) p.dz += (p.z - p.dz) * 0.18

      ctx.fillStyle = '#0A0E1A'
      ctx.fillRect(0, 0, W, H)

      // Separador
      ctx.strokeStyle = '#1C2440'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(SPLIT, 16)
      ctx.lineTo(SPLIT, H - 16)
      ctx.stroke()

      // ----- Panel z -----
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillStyle = '#55618A'
      ctx.fillText('espacio z  ~  N(0, 1)', 20, 30)
      // curva gaussiana
      ctx.beginPath()
      for (let px = 20; px <= SPLIT - 20; px += 3) {
        const z = pxToZ(px)
        const d = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
        const py = H - 60 - d * 130
        if (px === 20) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = 'rgba(139,92,246,0.7)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // ----- Panel x -----
      ctx.fillStyle = '#55618A'
      ctx.fillText('espacio x  ·  push-forward por el decoder', SPLIT + 60, 30)
      // curva decoder (doble luna), glow cyan
      ctx.save()
      ctx.shadowColor = '#22D3EE'
      ctx.shadowBlur = 10
      ctx.beginPath()
      for (let i = 0; i <= 220; i++) {
        const seg = (i / 220) * 1.999
        const u = seg % 1
        let x: number, y: number
        if (seg < 1) {
          const a = Math.PI * u
          x = 1 - Math.cos(a); y = 0.2 + Math.sin(a) * 1.15
        } else {
          const a = Math.PI * u
          x = Math.cos(a); y = -(0.2 + Math.sin(a) * 1.15) - 0.15
        }
        const [px, py] = dataToPx(x, y)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = 'rgba(34,211,238,0.55)'
      ctx.lineWidth = 1.6
      ctx.stroke()
      ctx.restore()

      // puntos + conexiones
      for (const p of ptsRef.current) {
        const zx = zToPx(p.dz)
        const zy = H / 2 + p.jitter * 0.4 + 60
        const [dx, dy] = dataToPx(...decode(p.dz))
        // línea de conexión tenue
        ctx.beginPath()
        ctx.moveTo(zx, zy)
        ctx.lineTo(dx, dy)
        ctx.strokeStyle = 'rgba(34,211,238,0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
        // punto z (violeta)
        ctx.beginPath()
        ctx.arc(zx, zy, dragRef.current !== null ? 5 : 4, 0, Math.PI * 2)
        ctx.fillStyle = '#8B5CF6'
        ctx.fill()
        // punto x (cyan)
        ctx.beginPath()
        ctx.arc(dx, dy, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#22D3EE'
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Drag de puntos en el panel z
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rectOf = () => canvas.getBoundingClientRect()
    const toLocal = (e: PointerEvent): [number, number] => {
      const r = rectOf()
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]
    }
    const nearest = (px: number, py: number): number | null => {
      let best: number | null = null
      let bestD = 22
      ptsRef.current.forEach((p, i) => {
        const zx = zToPx(p.z)
        const zy = H / 2 + p.jitter * 0.4 + 60
        const d = Math.hypot(zx - px, zy - py)
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      return best
    }
    const down = (e: PointerEvent) => {
      const [px, py] = toLocal(e)
      if (px > SPLIT) return
      dragRef.current = nearest(px, py)
      if (dragRef.current !== null) canvas.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      const [px] = toLocal(e)
      setHovering(px < SPLIT)
      if (dragRef.current === null) return
      const p = ptsRef.current[dragRef.current]
      p.z = Math.max(-Z_RANGE, Math.min(Z_RANGE, pxToZ(px)))
    }
    const up = () => {
      dragRef.current = null
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointerleave', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointerleave', up)
    }
  }, [])

  return (
    <DemoFrame
      title="push_forward_latente.py"
      controls={
        <>
          <button
            onClick={resample}
            className="flex items-center gap-1.5 rounded-md border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20"
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden />
            Remuestrear z ~ N(0,1)
          </button>
          <span className="font-mono text-xs text-faint">
            Arrastra los puntos violetas del espacio z: el decoder los empuja a la doble luna
          </span>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: hovering ? 'grab' : 'default' }}
        aria-label="Demo interactiva: arrastra puntos del espacio latente y observa su imagen en el espacio de datos"
      />
    </DemoFrame>
  )
}
