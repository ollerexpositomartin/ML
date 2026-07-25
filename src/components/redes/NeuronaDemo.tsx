/**
 * Demo S1 · La neurona — una neurona interactiva:
 * 3 sliders de entrada x₁..x₃, pesos editables arrastrando sobre las aristas,
 * bias knob, elección de φ (ReLU/tanh/sigmoid) y gauge de salida animado.
 * Los pulsos lime viajan por las aristas al cambiar cualquier valor.
 */

import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import DemoFrame from '@/components/DemoFrame'
import { TeX } from '@/lib/katex-content'

type Act = 'relu' | 'tanh' | 'sigmoid'

const PHI: Record<Act, (z: number) => number> = {
  relu: (z) => Math.max(0, z),
  tanh: (z) => Math.tanh(z),
  sigmoid: (z) => 1 / (1 + Math.exp(-z)),
}

const PHI_LABEL: Record<Act, string> = {
  relu: 'ReLU',
  tanh: 'tanh',
  sigmoid: 'σ (sigmoid)',
}

// Posiciones del diagrama (viewBox 460x260)
const INPUT_Y = [50, 130, 210]
const NODE = { x: 300, y: 130 }
const INPUT_X = 70
const GAUGE_CX = 300
const GAUGE_CY = 130

export default function NeuronaDemo() {
  const [xs, setXs] = useState([1.0, -0.6, 0.8])
  const [ws, setWs] = useState([0.7, -1.1, 0.4])
  const [b, setB] = useState(0.3)
  const [act, setAct] = useState<Act>('tanh')
  const dragRef = useRef<{ edge: number; startY: number; startW: number } | null>(null)

  const z = xs.reduce((acc, x, i) => acc + x * ws[i], b)
  const a = PHI[act](z)
  // firma que cambia con cualquier valor → re-dispara los pulsos
  const pulseKey = useMemo(
    () => xs.map((v) => v.toFixed(2)).join(',') + '|' + ws.map((v) => v.toFixed(2)).join(',') + '|' + b.toFixed(2) + act,
    [xs, ws, b, act],
  )

  const startDrag = (edge: number, e: React.PointerEvent) => {
    dragRef.current = { edge, startY: e.clientY, startW: ws[edge] }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const onDrag = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const next = Math.max(-2, Math.min(2, d.startW - (e.clientY - d.startY) / 60))
    setWs((prev) => prev.map((w, i) => (i === d.edge ? Number(next.toFixed(2)) : w)))
  }
  const endDrag = () => {
    dragRef.current = null
  }

  // Gauge: semicírculo de 0 (izq) a maxVal (dcha) según activación
  const maxOut = act === 'relu' ? 4 : 1
  const frac = Math.max(0, Math.min(1, a / maxOut))
  const angle = Math.PI - frac * Math.PI // π → 0
  const nx = GAUGE_CX + 62 * Math.cos(angle)
  const ny = GAUGE_CY - 62 * Math.sin(angle)
  const needleX = GAUGE_CX + 52 * Math.cos(angle)
  const needleY = GAUGE_CY - 52 * Math.sin(angle)

  const controls = (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 font-mono text-xs text-muted">
        φ =
        <select
          value={act}
          onChange={(e) => setAct(e.target.value as Act)}
          className="rounded-md border border-violet/40 bg-bg-1 px-2 py-1 font-mono text-xs text-violet"
        >
          {(Object.keys(PHI) as Act[]).map((k) => (
            <option key={k} value={k}>
              {PHI_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 font-mono text-xs text-muted">
        b
        <input
          type="range"
          min={-3}
          max={3}
          step={0.1}
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          className="w-28 accent-cyan"
        />
        <span className="w-12 text-cyan">{b.toFixed(1)}</span>
      </label>
      {xs.map((x, i) => (
        <label key={i} className="flex items-center gap-2 font-mono text-xs text-muted">
          x{i + 1}
          <input
            type="range"
            min={-2}
            max={2}
            step={0.1}
            value={x}
            onChange={(e) =>
              setXs((prev) => prev.map((v, j) => (j === i ? Number(e.target.value) : v)))
            }
            className="w-20 accent-cyan"
          />
          <span className="w-12 text-cyan">{x.toFixed(1)}</span>
        </label>
      ))}
    </div>
  )

  return (
    <DemoFrame title="neurona.py" controls={controls}>
      <style>{`
        @keyframes sinapsis-pulse { to { stroke-dashoffset: -28; } }
        .edge-pulse { stroke-dasharray: 7 7; animation: sinapsis-pulse 0.3s linear infinite; }
      `}</style>
      <div className="grid gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
        {/* Diagrama */}
        <svg viewBox="0 0 460 260" className="w-full rounded-lg border border-line bg-bg-0">
          {/* Aristas con pulso */}
          {INPUT_Y.map((y, i) => (
            <g key={pulseKey + i}>
              <line
                x1={INPUT_X}
                y1={y}
                x2={NODE.x}
                y2={NODE.y}
                stroke="#A3E635"
                strokeWidth={Math.max(1.2, Math.abs(ws[i]) * 2.6)}
                className="edge-pulse"
                opacity={0.85}
              />
            </g>
          ))}
          {/* Zona draggable de cada arista (peso) */}
          {INPUT_Y.map((y, i) => {
            const mx = (INPUT_X + NODE.x) / 2
            const my = (y + NODE.y) / 2
            return (
              <g
                key={'w' + i}
                transform={`translate(${mx}, ${my})`}
                onPointerDown={(e) => startDrag(i, e)}
                onPointerMove={onDrag}
                onPointerUp={endDrag}
                style={{ cursor: 'ns-resize' }}
              >
                <rect x={-26} y={-13} width={52} height={26} rx={6} fill="#0D1322" stroke="#8B5CF6" strokeOpacity={0.6} />
                <text textAnchor="middle" dy={4} fill="#8B5CF6" fontSize={12} fontFamily="JetBrains Mono, monospace">
                  w{i + 1}={ws[i].toFixed(2)}
                </text>
              </g>
            )
          })}
          {/* Nodos de entrada */}
          {INPUT_Y.map((y, i) => (
            <g key={'n' + i}>
              <circle cx={INPUT_X} cy={y} r={20} fill="#0D1322" stroke="#22D3EE" strokeWidth={1.5} />
              <text x={INPUT_X} y={y + 4} textAnchor="middle" fill="#22D3EE" fontSize={12} fontFamily="JetBrains Mono, monospace">
                {xs[i].toFixed(1)}
              </text>
              <text x={INPUT_X - 34} y={y + 4} fill="#55618A" fontSize={11} fontFamily="JetBrains Mono, monospace">
                x{i + 1}
              </text>
            </g>
          ))}
          {/* Neurona */}
          <motion.g
            animate={{ filter: `drop-shadow(0 0 ${6 + Math.abs(a) * 8}px rgba(163,230,53,0.7))` }}
          >
            <circle cx={NODE.x} cy={NODE.y} r={30} fill="#0D1322" stroke="#A3E635" strokeWidth={2} />
          </motion.g>
          <text x={NODE.x} y={NODE.y - 3} textAnchor="middle" fill="#EDF1FA" fontSize={12} fontFamily="JetBrains Mono, monospace">
            Σ+φ
          </text>
          <text x={NODE.x} y={NODE.y + 12} textAnchor="middle" fill="#A3E635" fontSize={11} fontFamily="JetBrains Mono, monospace">
            {a.toFixed(3)}
          </text>
          <text x={NODE.x + 60} y={NODE.y + 4} fill="#55618A" fontSize={11} fontFamily="JetBrains Mono, monospace">
            a = φ(z)
          </text>
        </svg>

        {/* Gauge + lecturas */}
        <div className="flex flex-col gap-3">
          <svg viewBox="150 40 300 120" className="w-full rounded-lg border border-line bg-bg-0">
            <path d={`M ${GAUGE_CX - 62} ${GAUGE_CY} A 62 62 0 0 1 ${GAUGE_CX + 62} ${GAUGE_CY}`} fill="none" stroke="#1C2440" strokeWidth={8} strokeLinecap="round" />
            <motion.path
              d={`M ${GAUGE_CX - 62} ${GAUGE_CY} A 62 62 0 0 1 ${nx} ${ny}`}
              fill="none"
              stroke="url(#gauge-grad)"
              strokeWidth={8}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
            <motion.line
              x1={GAUGE_CX}
              y1={GAUGE_CY}
              animate={{ x2: needleX, y2: needleY }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              stroke="#EDF1FA"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <circle cx={GAUGE_CX} cy={GAUGE_CY} r={5} fill="#EDF1FA" />
            <text x={GAUGE_CX} y={GAUGE_CY - 20} textAnchor="middle" fill="#A3E635" fontSize={20} fontWeight={700} fontFamily="JetBrains Mono, monospace">
              {a.toFixed(3)}
            </text>
          </svg>
          <div className="rounded-lg border border-line bg-bg-0 px-4 py-3 font-mono text-xs leading-relaxed text-muted">
            <div>
              <TeX content="$z = \sum_i w_i x_i + b$" /> ={' '}
              <span className="text-violet">{z.toFixed(3)}</span>
            </div>
            <div>
              <TeX content="$a = \varphi(z)$" /> = <span className="text-lime">{a.toFixed(3)}</span>
            </div>
            <div className="mt-1 text-faint">arrastra las aristas w₁–w₃ ↕ para cambiar los pesos</div>
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
