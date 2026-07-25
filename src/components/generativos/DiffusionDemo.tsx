/**
 * DiffusionDemo — Demo S4 (`demo_difusion`) del módulo Generativos.
 * Slider t (0→T) que barre limpio → ruido gaussiano puro. Fuente de frames:
 * sprite `/noise-grid.png` (4×4, limpio → ruido); fallback offline: ruido
 * generado por canvas aplicado sobre `/kernels-photo.png` con la forma cerrada
 * x_t = √ᾱ_t·x₀ + √(1−ᾱ_t)·ε. Botón "Denoise ▶" reproduce el proceso
 * inverso estilizado (12 pasos, blends de 300ms) con indicador descendente.
 * Panel lateral: curva del schedule β_t / ᾱ_t con marcador en t.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const T = 100
const SIZE = 512 // tamaño interno del canvas de imagen
const SPRITE_FRAMES = 16
const DENOISE_STEPS = 12

/** Schedule lineal β: 1e-4 → 0.02, y ᾱ acumulada. */
const BETAS = Array.from({ length: T }, (_, i) => 1e-4 + ((0.02 - 1e-4) * i) / (T - 1))
const ABARS = (() => {
  let a = 1
  return BETAS.map((b) => (a *= 1 - b))
})()

export default function DiffusionDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spriteRef = useRef<HTMLImageElement | null>(null)
  const photoRef = useRef<ImageData | null>(null)
  const noiseRef = useRef<ImageData | null>(null)
  const [mode, setMode] = useState<'sprite' | 'proc' | null>(null)
  const [t, setT] = useState(0)
  const [denoising, setDenoising] = useState(false)
  const [denoiseStep, setDenoiseStep] = useState(0)
  const tRef = useRef(0)
  tRef.current = t

  /* ---------- carga de recursos ---------- */
  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      spriteRef.current = img
      setMode('sprite')
    }
    img.onerror = () => {
      if (cancelled) return
      // Fallback offline: foto + ruido procedural
      const photo = new Image()
      photo.onload = () => {
        if (cancelled) return
        const off = document.createElement('canvas')
        off.width = SIZE
        off.height = SIZE
        const octx = off.getContext('2d')!
        octx.drawImage(photo, 0, 0, SIZE, SIZE)
        photoRef.current = octx.getImageData(0, 0, SIZE, SIZE)
        const noise = octx.createImageData(SIZE, SIZE)
        for (let i = 0; i < noise.data.length; i += 4) {
          const v = Math.floor(Math.random() * 256)
          noise.data[i] = v
          noise.data[i + 1] = v
          noise.data[i + 2] = v
          noise.data[i + 3] = 255
        }
        noiseRef.current = noise
        setMode('proc')
      }
      photo.onerror = () => {
        // Sin recursos: "foto" procedural (gradiente con formas)
        if (cancelled) return
        const off = document.createElement('canvas')
        off.width = SIZE
        off.height = SIZE
        const octx = off.getContext('2d')!
        const grad = octx.createLinearGradient(0, 0, SIZE, SIZE)
        grad.addColorStop(0, '#8B5CF6')
        grad.addColorStop(1, '#22D3EE')
        octx.fillStyle = grad
        octx.fillRect(0, 0, SIZE, SIZE)
        octx.fillStyle = '#04060D'
        octx.beginPath()
        octx.arc(SIZE / 2, SIZE / 2, SIZE / 4, 0, Math.PI * 2)
        octx.fill()
        photoRef.current = octx.getImageData(0, 0, SIZE, SIZE)
        const noise = octx.createImageData(SIZE, SIZE)
        for (let i = 0; i < noise.data.length; i += 4) {
          const v = Math.floor(Math.random() * 256)
          noise.data[i] = v
          noise.data[i + 1] = v
          noise.data[i + 2] = v
          noise.data[i + 3] = 255
        }
        noiseRef.current = noise
        setMode('proc')
      }
      photo.src = '/kernels-photo.png'
    }
    img.src = '/noise-grid.png'
    return () => {
      cancelled = true
    }
  }, [])

  /* ---------- render ---------- */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || mode === null) return
    const ctx = canvas.getContext('2d')!
    if (mode === 'sprite' && spriteRef.current) {
      const frame = Math.round((t / T) * (SPRITE_FRAMES - 1))
      const cell = spriteRef.current.width / 4
      const sx = (frame % 4) * cell
      const sy = Math.floor(frame / 4) * cell
      ctx.drawImage(spriteRef.current, sx, sy, cell, cell, 0, 0, SIZE, SIZE)
    } else if (mode === 'proc' && photoRef.current && noiseRef.current) {
      const ti = Math.min(T - 1, Math.max(0, Math.round(t)))
      const abar = ABARS[ti]
      const a = Math.sqrt(abar)
      const b = Math.sqrt(1 - abar)
      const src = photoRef.current.data
      const nz = noiseRef.current.data
      const out = ctx.createImageData(SIZE, SIZE)
      for (let i = 0; i < src.length; i += 4) {
        out.data[i] = a * src[i] + b * nz[i]
        out.data[i + 1] = a * src[i + 1] + b * nz[i + 1]
        out.data[i + 2] = a * src[i + 2] + b * nz[i + 2]
        out.data[i + 3] = 255
      }
      ctx.putImageData(out, 0, 0)
    }
  }, [t, mode])

  /* ---------- denoise inverso (12 pasos, 300ms) ---------- */
  const denoise = useCallback(() => {
    if (denoising) return
    setDenoising(true)
    const start = tRef.current
    let k = 0
    const id = setInterval(() => {
      k++
      const nt = Math.max(0, start * (1 - k / DENOISE_STEPS))
      setT(Math.round(nt))
      setDenoiseStep(k)
      if (k >= DENOISE_STEPS) {
        clearInterval(id)
        setT(0)
        setTimeout(() => {
          setDenoising(false)
          setDenoiseStep(0)
        }, 350)
      }
    }, 300)
  }, [denoising])

  const ti = Math.min(T - 1, Math.max(0, Math.round(t)))
  const abarNow = ABARS[ti]

  /* mini-plot SVG del schedule */
  const PW = 200
  const PH = 120
  const betaPath = BETAS.map((b, i) => `${i === 0 ? 'M' : 'L'}${(i / (T - 1)) * PW},${PH - (b / 0.02) * (PH - 14)}`).join(' ')
  const abarPath = ABARS.map((a, i) => `${i === 0 ? 'M' : 'L'}${(i / (T - 1)) * PW},${PH - a * (PH - 14)}`).join(' ')

  return (
    <DemoFrame
      title="difusion_forward.py"
      controls={
        <>
          <label className="flex items-center gap-3 font-mono text-xs text-cyan">
            t = {Math.round(t)}
            <input
              type="range"
              min={0}
              max={T}
              value={Math.round(t)}
              disabled={denoising}
              onChange={(e) => setT(Number(e.target.value))}
              className="w-56 accent-cyan"
              aria-label="Paso de difusión t"
            />
          </label>
          <span className="font-mono text-[11px] text-faint">
            ᾱ_t = {abarNow.toExponential(2)} · señal {Math.sqrt(abarNow * 100).toFixed(1)}%
          </span>
          <button
            onClick={denoise}
            disabled={denoising || t === 0}
            className={cn(
              'ml-auto flex items-center gap-1.5 rounded-md px-3.5 py-1.5 font-mono text-xs font-bold transition-all',
              'bg-lime/15 text-lime hover:bg-lime/25 disabled:opacity-40',
            )}
          >
            {denoising ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
            {denoising ? `Denoise · paso ${DENOISE_STEPS - denoiseStep + 1}/${DENOISE_STEPS}` : 'Denoise ▶'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row">
        <div className="relative mx-auto w-full max-w-[420px]">
          {mode === null && (
            <div className="flex aspect-square items-center justify-center rounded-lg border border-line bg-panel font-mono text-xs text-faint">
              Cargando frames…
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{ width: '100%', height: 'auto', display: mode === null ? 'none' : 'block' }}
            className="rounded-lg border border-line"
            aria-label="Imagen progresivamente ruidosa según el paso de difusión t"
          />
          {denoising && (
            <span className="absolute left-3 top-3 rounded border border-lime/50 bg-bg-0/80 px-2 py-1 font-mono text-[11px] text-lime">
              proceso inverso · {DENOISE_STEPS - denoiseStep} pasos restantes
            </span>
          )}
          <div className="mt-2 text-center font-mono text-[11px] text-faint">
            {mode === 'proc' ? 'fuente: ruido procedural sobre kernels-photo.png (fallback offline)' : 'fuente: sprite noise-grid.png'}
          </div>
        </div>

        {/* Schedule β / ᾱ */}
        <div className="min-w-[220px] flex-1 rounded-lg border border-line bg-panel p-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
            schedule de ruido
          </div>
          <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full" role="img" aria-label="Curvas del schedule beta y alfa-barra">
            <path d={abarPath} fill="none" stroke="#22D3EE" strokeWidth="2" />
            <path d={betaPath} fill="none" stroke="#FB7185" strokeWidth="1.5" strokeDasharray="4 3" />
            <line
              x1={(ti / (T - 1)) * PW}
              y1={0}
              x2={(ti / (T - 1)) * PW}
              y2={PH}
              stroke="#8B5CF6"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={(ti / (T - 1)) * PW} cy={PH - abarNow * (PH - 14)} r="4" fill="#22D3EE" />
          </svg>
          <div className="mt-2 space-y-1 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-cyan">
              <span className="inline-block h-0.5 w-4 bg-cyan" /> ᾱ_t (señal retenida)
            </div>
            <div className="flex items-center gap-2 text-rose">
              <span className="inline-block h-0.5 w-4 bg-rose" /> β_t (ruido por paso)
            </div>
            <p className="pt-1 leading-relaxed text-faint">
              Forward: destruir poco a poco. Inverso: aprender a deshacer el ruido paso a paso — eso
              es lo que predice ε_θ(x_t, t).
            </p>
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
