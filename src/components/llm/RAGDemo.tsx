/**
 * RAGDemo — mapa 2D de embeddings de documentos. Arrastra la query (punto
 * rose) y observa el top-k por similitud (distancia ~ coseno) y el contexto
 * que se ensamblaría en el prompt. Canvas 2D + panel de contexto.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'

interface Doc {
  id: number
  label: string
  text: string
  x: number // 0..1
  y: number // 0..1
}

const DOCS: Doc[] = [
  { id: 0, label: 'gatos', text: 'Los gatos duermen unas 16 horas al día y ronronean para comunicarse.', x: 0.16, y: 0.22 },
  { id: 1, label: 'perros', text: 'Los perros fueron domesticados hace más de 15 000 años.', x: 0.28, y: 0.34 },
  { id: 2, label: 'transformers', text: 'El Transformer usa atención Q·K·V y codificación posicional.', x: 0.72, y: 0.20 },
  { id: 3, label: 'rope', text: 'RoPE rota pares de dimensiones según la posición del token.', x: 0.86, y: 0.30 },
  { id: 4, label: 'lora', text: 'LoRA congela W y entrena un ajuste de bajo rango ΔW = BA.', x: 0.80, y: 0.52 },
  { id: 5, label: 'paella', text: 'La paella valenciana lleva pollo, conejo y garrofó.', x: 0.20, y: 0.78 },
  { id: 6, label: 'ramen', text: 'El ramen combina caldo, fideos de trigo y tare.', x: 0.34, y: 0.88 },
  { id: 7, label: 'fotosíntesis', text: 'La fotosíntesis convierte CO₂ y luz en glucosa y oxígeno.', x: 0.55, y: 0.82 },
]

const W = 860
const H = 380
const PAD = 46

const toPx = (x: number, y: number) => ({ px: PAD + x * (W - 2 * PAD), py: PAD + y * (H - 2 * PAD) })
const toNorm = (px: number, py: number) => ({
  x: Math.min(1, Math.max(0, (px - PAD) / (W - 2 * PAD))),
  y: Math.min(1, Math.max(0, (py - PAD) / (H - 2 * PAD))),
})

export default function RAGDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [query, setQuery] = useState({ x: 0.78, y: 0.36 })
  const [k, setK] = useState(2)
  const [dragging, setDragging] = useState(false)

  // top-k por distancia euclídea (≈ coseno en este mapa de juguete)
  const ranked = DOCS.map((d) => ({ d, dist: Math.hypot(d.x - query.x, d.y - query.y) }))
    .sort((a, b) => a.dist - b.dist)
  const topK = ranked.slice(0, k)
  const topIds = new Set(topK.map((r) => r.d.id))

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
    ctx.font = '11px "JetBrains Mono", monospace'

    // rejilla blueprint
    ctx.strokeStyle = 'rgba(28,36,64,0.5)'
    for (let gx = PAD; gx <= W - PAD; gx += 48) {
      ctx.beginPath(); ctx.moveTo(gx, PAD); ctx.lineTo(gx, H - PAD); ctx.stroke()
    }
    for (let gy = PAD; gy <= H - PAD; gy += 48) {
      ctx.beginPath(); ctx.moveTo(PAD, gy); ctx.lineTo(W - PAD, gy); ctx.stroke()
    }
    ctx.fillStyle = '#55618A'
    ctx.textAlign = 'left'
    ctx.fillText('espacio de embeddings (2D de juguete)', PAD, 24)

    const { px: qx, py: qy } = toPx(query.x, query.y)

    // líneas query → top-k
    topK.forEach(({ d, dist }, rank) => {
      const { px, py } = toPx(d.x, d.y)
      ctx.strokeStyle = `rgba(251,113,133,${0.85 - rank * 0.25})`
      ctx.lineWidth = 2.5 - rank * 0.6
      ctx.setLineDash([6, 5])
      ctx.beginPath()
      ctx.moveTo(qx, qy)
      ctx.lineTo(px, py)
      ctx.stroke()
      ctx.setLineDash([])
      // etiqueta de similitud en el punto medio
      const sim = Math.max(0, 1 - dist)
      ctx.fillStyle = '#FB7185'
      ctx.textAlign = 'center'
      ctx.fillText(`#${rank + 1} · sim ${sim.toFixed(2)}`, (qx + px) / 2, (qy + py) / 2 - 8)
    })
    ctx.lineWidth = 1

    // documentos
    for (const d of DOCS) {
      const { px, py } = toPx(d.x, d.y)
      const inTop = topIds.has(d.id)
      ctx.fillStyle = inTop ? 'rgba(163,230,53,0.9)' : 'rgba(34,211,238,0.75)'
      ctx.beginPath()
      ctx.arc(px, py, inTop ? 8 : 5.5, 0, Math.PI * 2)
      ctx.fill()
      if (inTop) {
        ctx.strokeStyle = 'rgba(163,230,53,0.4)'
        ctx.beginPath()
        ctx.arc(px, py, 13, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.fillStyle = inTop ? '#A3E635' : '#8E9AB8'
      ctx.textAlign = 'center'
      ctx.fillText(d.label, px, py - 14)
    }

    // query
    ctx.fillStyle = '#FB7185'
    ctx.beginPath()
    ctx.arc(qx, qy, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(251,113,133,0.4)'
    ctx.beginPath()
    ctx.arc(qx, qy, 16, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#FB7185'
    ctx.textAlign = 'center'
    ctx.fillText('query (arrástrame)', qx, qy + 32)
  }, [query, k, topIds, topK])

  useEffect(draw, [draw])

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, phase: 'down' | 'move' | 'up') => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const sx = W / rect.width
    const px = (e.clientX - rect.left) * sx
    const py = (e.clientY - rect.top) * (H / rect.height)
    const { px: qx, py: qy } = toPx(query.x, query.y)
    if (phase === 'down') {
      if (Math.hypot(px - qx, py - qy) < 28) setDragging(true)
    } else if (phase === 'move' && dragging) {
      setQuery(toNorm(px, py))
    } else if (phase === 'up') {
      setDragging(false)
    }
  }

  return (
    <DemoFrame
      title="rag_retrieval_topk.py"
      controls={
        <>
          <span className="font-mono text-xs text-faint">k (documentos recuperados):</span>
          {[1, 2, 3].map((v) => (
            <button
              key={v}
              onClick={() => setK(v)}
              className={
                v === k
                  ? 'rounded-md border border-cyan/60 bg-cyan/20 px-3 py-1.5 font-mono text-xs text-cyan'
                  : 'rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted hover:text-ink'
              }
            >
              {v}
            </button>
          ))}
          <span className="ml-auto font-mono text-xs text-faint">
            top-{k}: {topK.map((r) => r.d.label).join(' · ')}
          </span>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', aspectRatio: `${W}/${H}`, cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        className="block"
        onPointerDown={(e) => onPointer(e, 'down')}
        onPointerMove={(e) => onPointer(e, 'move')}
        onPointerUp={(e) => onPointer(e, 'up')}
        onPointerLeave={(e) => onPointer(e, 'up')}
      />
      <div className="border-t border-line bg-panel px-4 py-3">
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          contexto ensamblado en el prompt
        </div>
        <div className="rounded-lg border border-line bg-bg-1 px-3 py-2.5 font-mono text-xs leading-relaxed text-muted">
          <span className="text-violet">[sistema]</span> Responde usando este contexto:{' '}
          {topK.map((r, i) => (
            <span key={r.d.id}>
              <span className="text-lime">[doc {i + 1} · {r.d.label}]</span> {r.d.text}{' '}
            </span>
          ))}
          <span className="text-rose">[usuario]</span> «tu pregunta aquí»
        </div>
      </div>
    </DemoFrame>
  )
}
