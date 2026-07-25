/**
 * Demo S3 · El arquitecto — construye tu red:
 * añade/quita capas ocultas (máx. 5), stepper de unidades por capa (1–8),
 * contador de parámetros en vivo y aristas con grosor ∝ |peso| (botón re-roll).
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Dices } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'

const N_IN = 3
const N_OUT = 2
const MAX_LAYERS = 5

function mulberry(seed: number) {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export default function ArquitectoDemo() {
  const [hidden, setHidden] = useState<number[]>([4, 4])
  const [seed, setSeed] = useState(7)

  const dims = [N_IN, ...hidden, N_OUT]
  const total = useMemo(() => {
    let t = 0
    for (let l = 1; l < dims.length; l++) t += (dims[l - 1] + 1) * dims[l]
    return t
  }, [dims.join(',')])

  // Pesos aleatorios por arista (para grosor)
  const weights = useMemo(() => {
    const rand = mulberry(seed)
    const w: number[][][] = []
    for (let l = 1; l < dims.length; l++) {
      const layer: number[][] = []
      for (let i = 0; i < dims[l - 1]; i++) {
        const row: number[] = []
        for (let j = 0; j < dims[l]; j++) row.push(rand() * 2 - 1)
        layer.push(row)
      }
      w.push(layer)
    }
    return w
  }, [seed, dims.join(',')])

  const setUnits = (idx: number, delta: number) =>
    setHidden((prev) => prev.map((u, i) => (i === idx ? Math.max(1, Math.min(8, u + delta)) : u)))

  // Geometría
  const Wsvg = 720
  const Hsvg = 300
  const colX = (l: number) => 60 + (l / (dims.length - 1)) * (Wsvg - 120)
  const nodeY = (l: number, j: number) => {
    const n = dims[l]
    const gap = Math.min(46, (Hsvg - 60) / Math.max(1, n - 1))
    const h = (n - 1) * gap
    return Hsvg / 2 - h / 2 + j * gap
  }

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => setHidden((p) => (p.length < MAX_LAYERS ? [...p, 4] : p))}
        disabled={hidden.length >= MAX_LAYERS}
        className="rounded-md border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs font-bold text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-40"
      >
        + capa oculta
      </button>
      <button
        onClick={() => setHidden((p) => (p.length > 0 ? p.slice(0, -1) : p))}
        disabled={hidden.length === 0}
        className="rounded-md border border-rose/40 bg-rose/10 px-3 py-1.5 font-mono text-xs font-bold text-rose transition-colors hover:bg-rose/20 disabled:opacity-40"
      >
        − capa oculta
      </button>
      <button
        onClick={() => setSeed((s) => s + 1)}
        className="flex items-center gap-1.5 rounded-md border border-violet/40 bg-violet/10 px-3 py-1.5 font-mono text-xs font-bold text-violet transition-colors hover:bg-violet/20"
      >
        <Dices className="h-3.5 w-3.5" aria-hidden />
        re-inicializar pesos
      </button>
      <motion.span
        key={total}
        initial={{ scale: 1.15, color: '#A3E635' }}
        animate={{ scale: 1, color: '#EDF1FA' }}
        className="ml-auto font-mono text-sm font-bold"
      >
        θ total = {total.toLocaleString('es-ES')}
      </motion.span>
    </div>
  )

  return (
    <DemoFrame title="arquitecto.py" controls={controls}>
      <div className="p-4">
        <svg viewBox={`0 0 ${Wsvg} ${Hsvg}`} className="w-full rounded-lg border border-line bg-bg-0">
          {/* Aristas */}
          {weights.map((layer, l) =>
            layer.map((row, i) =>
              row.map((w, j) => (
                <line
                  key={`e${l}-${i}-${j}-${dims.join('-')}`}
                  x1={colX(l)}
                  y1={nodeY(l, i)}
                  x2={colX(l + 1)}
                  y2={nodeY(l + 1, j)}
                  stroke={w >= 0 ? '#8B5CF6' : '#22D3EE'}
                  strokeWidth={0.5 + Math.abs(w) * 2.4}
                  opacity={0.22 + Math.abs(w) * 0.3}
                />
              )),
            ),
          )}
          {/* Nodos por capa */}
          {dims.map((n, l) => (
            <g key={`col${l}-${dims.join('-')}`}>
              {Array.from({ length: n }, (_, j) => (
                <motion.circle
                  key={j}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.03 * j + 0.06 * l, type: 'spring', stiffness: 260, damping: 20 }}
                  cx={colX(l)}
                  cy={nodeY(l, j)}
                  r={11}
                  fill="#0D1322"
                  stroke={l === 0 ? '#22D3EE' : l === dims.length - 1 ? '#A3E635' : '#8B5CF6'}
                  strokeWidth={1.6}
                />
              ))}
              <text
                x={colX(l)}
                y={Hsvg - 12}
                textAnchor="middle"
                fill="#55618A"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
              >
                {l === 0 ? 'entrada' : l === dims.length - 1 ? 'salida' : `oculta ${l}`}
              </text>
              <text
                x={colX(l)}
                y={22}
                textAnchor="middle"
                fill="#8E9AB8"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
              >
                n={n}
              </text>
            </g>
          ))}
        </svg>

        {/* Steppers por capa oculta */}
        <div className="mt-3 flex flex-wrap gap-2">
          <AnimatePresence>
            {hidden.map((u, i) => (
              <motion.div
                key={i}
                layout="position"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-bg-0 px-2 py-1.5"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-faint">capa {i + 1}</span>
                <button
                  onClick={() => setUnits(i, -1)}
                  disabled={u <= 1}
                  className="rounded p-0.5 text-muted transition-colors hover:text-ink disabled:opacity-30"
                  aria-label="Quitar neurona"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-5 text-center font-mono text-sm font-bold text-violet">{u}</span>
                <button
                  onClick={() => setUnits(i, 1)}
                  disabled={u >= 8}
                  className="rounded p-0.5 text-muted transition-colors hover:text-ink disabled:opacity-30"
                  aria-label="Añadir neurona"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {hidden.length === 0 && (
            <span className="px-2 py-1.5 font-mono text-xs text-faint">
              sin capas ocultas = regresión lineal… añade alguna
            </span>
          )}
        </div>
      </div>
    </DemoFrame>
  )
}
