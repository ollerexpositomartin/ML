/**
 * DemoEmbeddings — proyección 2D de ~40 palabras en clusters semánticos.
 * Hover → halo de similitud coseno + lista top-5 de vecinos.
 * Panel "aritmética": A − B + C → caminata vectorial animada hasta el vecino más cercano.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

/* ---------- datos precomputados (deterministas) ---------- */
function lcg(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const CLUSTERS: { name: string; color: string; center: [number, number]; words: string[] }[] = [
  { name: 'animales', color: '#22D3EE', center: [-0.62, 0.55], words: ['perro', 'gato', 'lobo', 'águila', 'caballo', 'pez', 'serpiente', 'tigre', 'oso', 'conejo'] },
  { name: 'verbos', color: '#8B5CF6', center: [0.58, 0.6], words: ['correr', 'saltar', 'nadar', 'volar', 'caminar', 'comer', 'dormir', 'leer', 'escribir', 'pensar'] },
  { name: 'tecnología', color: '#A3E635', center: [0.62, -0.55], words: ['ordenador', 'algoritmo', 'red', 'datos', 'programa', 'pantalla', 'código', 'robot', 'sensor', 'chip'] },
  { name: 'emociones', color: '#FB7185', center: [-0.6, -0.58], words: ['alegría', 'tristeza', 'miedo', 'ira', 'amor', 'odio', 'calma', 'ansiedad', 'euforia', 'nostalgia'] },
]

interface WordVec { w: string; x: number; y: number; color: string; cluster: string }

const WORDS: WordVec[] = (() => {
  const rnd = lcg(42)
  const out: WordVec[] = []
  for (const c of CLUSTERS) {
    for (const w of c.words) {
      out.push({
        w,
        x: c.center[0] + (rnd() - 0.5) * 0.42,
        y: c.center[1] + (rnd() - 0.5) * 0.42,
        color: c.color,
        cluster: c.name,
      })
    }
  }
  return out
})()

/* Parejas para la aritmética (añadidas al espacio) */
const EXTRA: WordVec[] = [
  { w: 'rey', x: -0.18, y: 0.16, color: '#FBBF24', cluster: 'realeza' },
  { w: 'reina', x: -0.02, y: 0.3, color: '#FBBF24', cluster: 'realeza' },
  { w: 'hombre', x: -0.2, y: 0.02, color: '#FBBF24', cluster: 'realeza' },
  { w: 'mujer', x: -0.04, y: 0.16, color: '#FBBF24', cluster: 'realeza' },
  { w: 'parís', x: 0.14, y: -0.12, color: '#FBBF24', cluster: 'geografía' },
  { w: 'francia', x: 0.02, y: -0.26, color: '#FBBF24', cluster: 'geografía' },
  { w: 'madrid', x: 0.3, y: 0.02, color: '#FBBF24', cluster: 'geografía' },
  { w: 'españa', x: 0.18, y: -0.12, color: '#FBBF24', cluster: 'geografía' },
]
const ALL: WordVec[] = [...WORDS, ...EXTRA]
const ARITH_WORDS = EXTRA.map((e) => e.w)

function cosSim(a: WordVec, b: WordVec) {
  const dot = a.x * b.x + a.y * b.y
  const na = Math.hypot(a.x, a.y)
  const nb = Math.hypot(b.x, b.y)
  return na * nb === 0 ? 0 : dot / (na * nb)
}

const W = 760
const H = 430
const PAD = 44
function toPx(x: number, y: number): [number, number] {
  return [PAD + ((x + 1) / 2) * (W - 2 * PAD), H - PAD - ((y + 1) / 2) * (H - 2 * PAD)]
}

interface Walk {
  from: [number, number]
  to: [number, number]
  result: WordVec | null
  t0: number
}

export default function DemoEmbeddings() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<WordVec | null>(null)
  const hoverRef = useRef<WordVec | null>(null)
  useEffect(() => {
    hoverRef.current = hover
  }, [hover])
  const walkRef = useRef<Walk | null>(null)
  const [selA, setSelA] = useState('rey')
  const [selB, setSelB] = useState('hombre')
  const [selC, setSelC] = useState('mujer')
  const [arithResult, setArithResult] = useState<WordVec | null>(null)

  const neighbors = useMemo(() => {
    if (!hover) return []
    return ALL.filter((o) => o.w !== hover.w)
      .map((o) => ({ o, s: cosSim(hover, o) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
  }, [hover])

  /* Dibujo principal (rAF para la animación de la caminata) */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr
    canvas.height = H * dpr
    let raf = 0

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const hov = hoverRef.current
      const walk = walkRef.current

      // Halo de similitud
      if (hov) {
        for (const o of ALL) {
          if (o.w === hov.w) continue
          const s = cosSim(hov, o)
          if (s <= 0.15) continue
          const [px, py] = toPx(o.x, o.y)
          const r = 8 + 26 * s
          const g = ctx.createRadialGradient(px, py, 0, px, py, r)
          g.addColorStop(0, `rgba(139,92,246,${0.28 * s})`)
          g.addColorStop(1, 'rgba(139,92,246,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(px, py, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Caminata vectorial A−B+C
      if (walk) {
        const t = Math.min(1, (now - walk.t0) / 600)
        const ease = 1 - Math.pow(1 - t, 3)
        const [fx, fy] = toPx(...walk.from)
        const [tx, ty] = toPx(...walk.to)
        const cx = fx + (tx - fx) * ease
        const cy = fy + (ty - fy) * ease
        ctx.strokeStyle = '#22D3EE'
        ctx.lineWidth = 2.5
        ctx.setLineDash([7, 6])
        ctx.lineDashOffset = -((now / 30) % 13)
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.lineTo(cx, cy)
        ctx.stroke()
        ctx.setLineDash([])
        // punta
        ctx.fillStyle = '#22D3EE'
        ctx.beginPath()
        ctx.arc(cx, cy, 5, 0, Math.PI * 2)
        ctx.fill()
        if (t >= 1 && walk.result) {
          const [rx, ry] = toPx(walk.result.x, walk.result.y)
          const pulse = 1 + 0.25 * Math.sin(now / 160)
          ctx.strokeStyle = '#A3E635'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(rx, ry, 12 * pulse, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Puntos + etiquetas
      ctx.font = '11px "JetBrains Mono", monospace'
      for (const o of ALL) {
        const [px, py] = toPx(o.x, o.y)
        const isHover = hov?.w === o.w
        const isResult = walk?.result?.w === o.w
        ctx.fillStyle = isResult ? '#A3E635' : o.color
        ctx.globalAlpha = hov && !isHover && cosSim(hov, o) <= 0.15 ? 0.45 : 1
        ctx.beginPath()
        ctx.arc(px, py, isHover || isResult ? 6 : 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = isHover ? '#EDF1FA' : '#8E9AB8'
        ctx.fillText(o.w, px + 8, py + 4)
        ctx.globalAlpha = 1
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const pickWord = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    const my = ((e.clientY - rect.top) / rect.height) * H
    let best: WordVec | null = null
    let bestD = 16
    for (const o of ALL) {
      const [px, py] = toPx(o.x, o.y)
      const d = Math.hypot(px - mx, py - my)
      if (d < bestD) {
        bestD = d
        best = o
      }
    }
    setHover(best)
  }

  const calcular = () => {
    const A = EXTRA.find((w) => w.w === selA)!
    const B = EXTRA.find((w) => w.w === selB)!
    const C = EXTRA.find((w) => w.w === selC)!
    const rx = A.x - B.x + C.x
    const ry = A.y - B.y + C.y
    let best: WordVec | null = null
    let bestD = Infinity
    for (const o of ALL) {
      if (o.w === selA || o.w === selB || o.w === selC) continue
      const d = Math.hypot(o.x - rx, o.y - ry)
      if (d < bestD) {
        bestD = d
        best = o
      }
    }
    walkRef.current = { from: [C.x, C.y], to: [rx, ry], result: best, t0: performance.now() }
    setArithResult(best)
    setHover(null)
  }

  const selCls =
    'rounded-md border border-line bg-bg-1 px-2 py-1.5 font-mono text-xs text-cyan outline-none focus:border-cyan/60'

  return (
    <DemoFrame
      title="embeddings_geometria.py"
      controls={
        <>
          <span className="font-mono text-xs text-faint">aritmética:</span>
          <select className={selCls} value={selA} onChange={(e) => setSelA(e.target.value)}>
            {ARITH_WORDS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <span className="font-mono text-sm text-rose">−</span>
          <select className={selCls} value={selB} onChange={(e) => setSelB(e.target.value)}>
            {ARITH_WORDS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <span className="font-mono text-sm text-lime">+</span>
          <select className={selCls} value={selC} onChange={(e) => setSelC(e.target.value)}>
            {ARITH_WORDS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <button
            onClick={calcular}
            className="rounded-md bg-gradient-brand px-3 py-1.5 font-mono text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            ≈ Calcular
          </button>
          {arithResult && (
            <motion.span
              key={`${selA}-${selB}-${selC}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs text-lime"
            >
              ≈ {arithResult.w} ✓
            </motion.span>
          )}
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_210px]">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
          onMouseMove={pickWord}
          onMouseLeave={() => setHover(null)}
        />
        <aside className="border-t border-line p-4 md:border-l md:border-t-0">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // vecinos más cercanos
          </div>
          {hover ? (
            <>
              <div className="mb-3 font-mono text-sm font-bold" style={{ color: hover.color }}>
                {hover.w}
                <span className="ml-2 text-[10px] font-normal text-faint">{hover.cluster}</span>
              </div>
              <ul className="space-y-1.5">
                {neighbors.map(({ o, s }, i) => (
                  <motion.li
                    key={o.w}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between font-mono text-xs"
                  >
                    <span className="text-ink">{o.w}</span>
                    <span className={cn(s > 0.9 ? 'text-lime' : s > 0.6 ? 'text-cyan' : 'text-muted')}>
                      {s.toFixed(2)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              Pasa el cursor sobre una palabra para ver su halo de similitud coseno y sus 5 vecinos
              más próximos. Las palabras del mismo cluster semántico viven juntas.
            </p>
          )}
        </aside>
      </div>
    </DemoFrame>
  )
}
