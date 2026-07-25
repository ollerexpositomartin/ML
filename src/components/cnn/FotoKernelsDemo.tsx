/**
 * Demo S3 · Kernels sobre una foto real — kernels-photo.png procesada en vivo
 * (canvas 2D): identidad, Sobel-x, Sobel-y, Laplaciano, desenfoque y enfoque.
 * Split-wipe comparador original|filtrada, overlay de la matriz 3×3 al hover
 * y slider de intensidad (mezcla con la original).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const SIZE = 512

interface KernelDef {
  id: string
  label: string
  k: number[][]
  /** true → detector de bordes (se muestra en valor absoluto) */
  edge?: boolean
}

const KERNELS: KernelDef[] = [
  { id: 'identidad', label: 'Identidad', k: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
  { id: 'sobelx', label: 'Sobel-x', k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], edge: true },
  { id: 'sobely', label: 'Sobel-y', k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], edge: true },
  { id: 'laplaciano', label: 'Laplaciano', k: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]], edge: true },
  { id: 'desenfoque', label: 'Desenfoque', k: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]] },
  { id: 'enfoque', label: 'Enfoque', k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
]

export default function FotoKernelsDemo() {
  const [kernelId, setKernelId] = useState('sobelx')
  const [intensity, setIntensity] = useState(1)
  const [wipe, setWipe] = useState(50) // %
  const [hovered, setHovered] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const origRef = useRef<ImageData | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)

  const kernel = KERNELS.find((k) => k.id === kernelId)!
  const hoverKernel = KERNELS.find((k) => k.id === hovered)

  // Carga de la imagen
  useEffect(() => {
    const img = new Image()
    img.src = '/kernels-photo.png'
    img.onload = () => {
      const off = document.createElement('canvas')
      off.width = SIZE
      off.height = SIZE
      const ctx = off.getContext('2d')!
      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      origRef.current = ctx.getImageData(0, 0, SIZE, SIZE)
      setReady(true)
    }
  }, [])

  // Convolución + mezcla
  const applyFilter = useCallback(() => {
    const canvas = canvasRef.current
    const orig = origRef.current
    if (!canvas || !orig) return
    const ctx = canvas.getContext('2d')!
    const src = orig.data
    const out = ctx.createImageData(SIZE, SIZE)
    const dst = out.data
    const k = kernel.k
    const edge = kernel.edge
    const f = intensity
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        for (let ch = 0; ch < 3; ch++) {
          let acc = 0
          for (let u = -1; u <= 1; u++) {
            for (let v = -1; v <= 1; v++) {
              const yy = Math.min(SIZE - 1, Math.max(0, y + u))
              const xx = Math.min(SIZE - 1, Math.max(0, x + v))
              acc += src[(yy * SIZE + xx) * 4 + ch] * k[u + 1][v + 1]
            }
          }
          const idx = (y * SIZE + x) * 4 + ch
          const conv = edge ? Math.min(255, Math.abs(acc) * 1.6) : acc
          dst[idx] = Math.min(255, Math.max(0, src[idx] * (1 - f) + conv * f))
        }
        const aIdx = (y * SIZE + x) * 4 + 3
        dst[aIdx] = 255
      }
    }
    ctx.putImageData(out, 0, 0)
  }, [kernel, intensity])

  useEffect(() => {
    if (ready) applyFilter()
  }, [ready, applyFilter])

  // Wipe drag
  const setWipeFromEvent = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setWipe(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
  }

  const matrixOverlay = useMemo(() => {
    const k = hoverKernel ?? kernel
    return (
      <motion.div
        key={k.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.18 }}
        className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg border border-violet/60 bg-bg-0/90 p-3 backdrop-blur-sm"
      >
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-violet">{k.label}</div>
        <div className="grid grid-cols-3 gap-0.5">
          {k.k.flat().map((v, i) => (
            <span key={i} className="flex h-9 w-9 items-center justify-center rounded border border-line bg-panel font-mono text-[11px] text-ink">
              {Math.abs(v) < 0.01 ? '0' : v % 1 !== 0 ? v.toFixed(2).replace('0.', '.') : v}
            </span>
          ))}
        </div>
      </motion.div>
    )
  }, [hoverKernel, kernel])

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      {KERNELS.map((k) => (
        <button
          key={k.id}
          onClick={() => setKernelId(k.id)}
          onMouseEnter={() => setHovered(k.id)}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            'rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors',
            kernelId === k.id ? 'border-cyan/60 bg-cyan/15 text-cyan' : 'border-line text-muted hover:border-violet/50 hover:text-ink',
          )}
        >
          {k.label}
        </button>
      ))}
      <label className="ml-auto flex items-center gap-2 font-mono text-[10px] text-faint">
        intensidad
        <input type="range" min={0} max={1} step={0.05} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-24 accent-cyan" />
        <span className="w-8 text-cyan">{Math.round(intensity * 100)}%</span>
      </label>
    </div>
  )

  return (
    <DemoFrame title="foto_kernels.py" controls={controls}>
      <div className="p-4">
        <div
          ref={wrapRef}
          className="relative mx-auto max-w-[560px] select-none overflow-hidden rounded-lg border border-line"
          onPointerDown={(e) => {
            dragRef.current = true
            setWipeFromEvent(e.clientX)
            ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => dragRef.current && setWipeFromEvent(e.clientX)}
          onPointerUp={() => {
            dragRef.current = false
          }}
          style={{ cursor: 'ew-resize' }}
        >
          {/* original debajo */}
          <img src="/kernels-photo.png" alt="Foto de prueba original" className="block w-full" draggable={false} />
          {/* filtrada encima, recortada por el wipe */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${wipe}%)` }}>
            <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ width: '100%', height: '100%' }} />
          </div>
          {/* divisor */}
          <div className="absolute inset-y-0 z-10 w-0.5 bg-cyan" style={{ left: `${wipe}%`, boxShadow: '0 0 12px rgba(34,211,238,0.8)' }}>
            <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan bg-bg-0 font-mono text-[10px] text-cyan">
              ⇔
            </span>
          </div>
          <span className="absolute left-2 top-2 rounded bg-bg-0/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">original</span>
          <span className="absolute bottom-2 right-2 rounded bg-bg-0/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan">{kernel.label}</span>
          <AnimatePresence>{matrixOverlay}</AnimatePresence>
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-0/70 font-mono text-xs text-muted">
              cargando kernels-photo.png…
            </div>
          )}
        </div>
        <p className="mx-auto mt-2 max-w-[560px] text-center font-mono text-[11px] text-faint">
          arrastra el divisor para comparar · pasa el ratón por un kernel para ver su matriz 3×3
        </p>
      </div>
    </DemoFrame>
  )
}
