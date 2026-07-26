/**
 * KVCacheDemo — generación token a token con KV cache.
 * Canvas 2D: la caché crece fila a fila; la query del token nuevo atiende a
 * todo lo cacheado (arcos con intensidad ∝ peso). Contadores: proyecciones
 * K/V con caché (T) vs sin caché (T(T+1)/2).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOKENS = ['El', 'modelo', 'aprende', 'a', 'generar', 'texto', 'sin', 'recomputar', 'nada', 'más']
const T_MAX = TOKENS.length
const DK = 8 // columnas visuales de la caché

// pesos de atención pseudoaleatorios pero deterministas por paso
function attnWeights(t: number): number[] {
  const w: number[] = []
  let s = 0
  for (let j = 0; j <= t; j++) {
    const x = Math.sin(t * 12.9898 + j * 78.233) * 43758.5453
    const v = Math.exp(1.6 * (x - Math.floor(x)))
    w.push(v)
    s += v
  }
  return w.map((v) => v / s)
}

const W = 860
const H = 330

export default function KVCacheDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [t, setT] = useState(1) // tokens ya generados (1..T_MAX)
  const [playing, setPlaying] = useState(false)

  const step = useCallback(() => setT((v) => (v >= T_MAX ? v : v + 1)), [])
  const reset = useCallback(() => {
    setPlaying(false)
    setT(1)
  }, [])

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setT((v) => {
        if (v >= T_MAX) {
          setPlaying(false)
          return v
        }
        return v + 1
      })
    }, 900)
    return () => window.clearInterval(id)
  }, [playing])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)
    ctx.font = '11px "JetBrains Mono", monospace'

    const weights = attnWeights(t - 1)
    const cellW = 22
    const cellH = 14
    const gap = 3
    const gridX = 40
    const gridY = 96
    const rowH = cellH + gap

    // --- fila de tokens ---
    const tokY = 34
    const tokW = 72
    TOKENS.forEach((tok, i) => {
      const x = gridX + i * (tokW + 6)
      const active = i < t
      const isNew = i === t - 1
      ctx.fillStyle = isNew ? 'rgba(251,113,133,0.18)' : active ? 'rgba(34,211,238,0.10)' : 'rgba(28,36,64,0.35)'
      ctx.strokeStyle = isNew ? '#FB7185' : active ? 'rgba(34,211,238,0.5)' : '#1C2440'
      ctx.beginPath()
      ctx.roundRect(x, tokY, tokW, 26, 6)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = active ? (isNew ? '#FB7185' : '#EDF1FA') : '#55618A'
      ctx.textAlign = 'center'
      ctx.fillText(tok, x + tokW / 2, tokY + 17)
      if (isNew) {
        ctx.fillStyle = '#FB7185'
        ctx.fillText('query nueva', x + tokW / 2, tokY + 42)
      }
    })

    // --- arcos de atención de la query nueva hacia la caché ---
    const qx = gridX + (t - 1) * (tokW + 6) + tokW / 2
    for (let j = 0; j < t; j++) {
      const kx = gridX + j * (tokW + 6) + tokW / 2
      const wgt = weights[j]
      ctx.strokeStyle = `rgba(139,92,246,${0.15 + 0.75 * wgt})`
      ctx.lineWidth = 0.5 + 5 * wgt
      ctx.beginPath()
      ctx.moveTo(qx, tokY + 30)
      ctx.quadraticCurveTo((qx + kx) / 2, gridY - 26 - (qx - kx) * 0.08, kx, gridY - 4)
      ctx.stroke()
    }
    ctx.lineWidth = 1

    // --- caché K/V (grid que crece) ---
    ctx.textAlign = 'left'
    ctx.fillStyle = '#8E9AB8'
    ctx.fillText('KV cache (crece 1 fila por paso)', gridX, gridY - 44)
    ctx.fillStyle = '#55618A'
    ctx.fillText('K', gridX - 16, gridY + cellH - 2)
    for (let i = 0; i < t; i++) {
      for (let c = 0; c < DK; c++) {
        const x = Math.sin(i * 91.7 + c * 37.3) * 0.5 + 0.5
        const isNewRow = i === t - 1
        ctx.fillStyle = isNewRow
          ? `rgba(251,113,133,${0.25 + 0.55 * x})`
          : `rgba(34,211,238,${0.10 + 0.45 * x})`
        ctx.fillRect(gridX + c * (cellW + gap), gridY + i * rowH, cellW, cellH)
      }
      if (i === t - 1) {
        ctx.strokeStyle = '#FB7185'
        ctx.strokeRect(gridX - 2, gridY + i * rowH - 2, DK * (cellW + gap) - gap + 4, cellH + 4)
        ctx.fillStyle = '#FB7185'
        ctx.textAlign = 'left'
        ctx.fillText('← solo ESTA fila se calcula en este paso', gridX + DK * (cellW + gap) + 12, gridY + i * rowH + cellH - 2)
      }
    }
    // huecos futuros
    ctx.fillStyle = 'rgba(28,36,64,0.35)'
    for (let i = t; i < T_MAX; i++) {
      for (let c = 0; c < DK; c++) {
        ctx.fillRect(gridX + c * (cellW + gap), gridY + i * rowH, cellW, cellH)
      }
    }

    // --- contadores ---
    const sinCache = (t * (t + 1)) / 2
    const panelX = 480
    const panelY = gridY + 20
    ctx.textAlign = 'left'
    ctx.fillStyle = '#8E9AB8'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('proyecciones K/V calculadas', panelX, panelY - 14)
    ctx.fillStyle = '#A3E635'
    ctx.font = 'bold 22px "JetBrains Mono", monospace'
    ctx.fillText(`con caché:  ${t}`, panelX, panelY + 14)
    ctx.fillStyle = '#FB7185'
    ctx.fillText(`sin caché:  ${sinCache}`, panelX, panelY + 44)
    ctx.font = '11px "JetBrains Mono", monospace'
    const saved = Math.round((1 - t / sinCache) * 100)
    ctx.fillStyle = '#EDF1FA'
    ctx.fillText(t > 1 ? `ahorro: ${saved}% del cómputo de K/V` : 'el ahorro crece con cada token', panelX, panelY + 72)
    ctx.fillStyle = '#55618A'
    ctx.fillText('mismo resultado, bit a bit', panelX, panelY + 90)
  }, [t])

  return (
    <DemoFrame
      title="kv_cache_generacion.py"
      controls={
        <>
          <button
            onClick={() => (t >= T_MAX ? reset() : setPlaying((p) => !p))}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-bold transition-transform hover:scale-[1.03] active:scale-[0.97]',
              playing ? 'bg-rose/20 text-rose' : 'bg-lime/20 text-lime',
            )}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pausa' : t >= T_MAX ? 'Reiniciar' : 'Generar'}
          </button>
          <button
            onClick={step}
            disabled={t >= T_MAX}
            className="flex items-center gap-1.5 rounded-md border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-40"
          >
            <StepForward className="h-3.5 w-3.5" />
            +1 token
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <span className="ml-auto font-mono text-xs text-faint">
            token {t}/{T_MAX} · caché: {t} filas
          </span>
        </>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: `${W}/${H}` }} className="block" />
    </DemoFrame>
  )
}
