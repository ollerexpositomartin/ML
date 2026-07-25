/**
 * DemoCausalMask — BERT (atención plena) vs GPT (máscara causal).
 * Dos mini-grids 8×8; el slider elige la posición del token y muestra qué
 * "puede ver" cada paradigma. Tarjeta extra: curva log-log de leyes de escala
 * con punto arrastrable y lectura L ≈ a·N^-0.34 + L∞ (ilustrativa).
 */
import { Fragment, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const N = 8

function MaskGrid({ kind, pos, label, sub }: { kind: 'bert' | 'gpt'; pos: number; label: string; sub: string }) {
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null)
  const allowed = (i: number, j: number) => (kind === 'bert' ? true : j <= i)
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-1 font-mono text-xs font-bold text-ink">{label}</div>
      <div className="mb-3 text-[11px] text-muted">{sub}</div>
      <div className="grid w-fit gap-[3px]" style={{ gridTemplateColumns: `repeat(${N}, 1.4rem)` }}>
        {Array.from({ length: N }).map((_, i) => (
          <Fragment key={i}>
            {Array.from({ length: N }).map((__, j) => {
              const ok = allowed(i, j)
              const inRow = hoverCell ? hoverCell[0] === i : i === pos
              return (
                <motion.button
                  key={`${i}-${j}`}
                  onMouseEnter={() => setHoverCell([i, j])}
                  onMouseLeave={() => setHoverCell(null)}
                  aria-label={`token ${i} mira a token ${j}: ${ok ? 'sí' : 'no'}`}
                  animate={{
                    backgroundColor: ok
                      ? inRow
                        ? 'rgba(163,230,53,0.8)'
                        : 'rgba(34,211,238,0.18)'
                      : inRow
                        ? 'rgba(251,113,133,0.35)'
                        : 'rgba(251,113,133,0.07)',
                  }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'h-[1.4rem] w-[1.4rem] rounded-[4px] border',
                    ok ? 'border-transparent' : 'border-rose/20',
                  )}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
      <div className="mt-3 font-mono text-[10px] text-faint">
        fila {pos}: el token {pos} ve{' '}
        <span className={kind === 'bert' ? 'text-lime' : 'text-amber'}>
          {kind === 'bert' ? `los ${N} tokens` : `${pos + 1} token(s) (él y su pasado)`}
        </span>
      </div>
    </div>
  )
}

/* --- curva de escala log-log con punto arrastrable --- */
const CH_W = 340
const CH_H = 200
const L_INF = 1.69
function scalingLoss(logN: number): number {
  // ilustrativa: L = a·N^-0.34 + L∞, con N = 10^logN parámetros
  return 8.5 * Math.pow(10, -0.34 * (logN - 6)) + L_INF
}

function ScalingChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [logN, setLogN] = useState(9.2) // entre 6 y 12
  const [dragging, setDragging] = useState(false)

  const toX = (l: number) => 34 + ((l - 6) / 6) * (CH_W - 48)
  const maxL = scalingLoss(6)
  const toY = (L: number) => 12 + (1 - (L - L_INF) / (maxL - L_INF)) * (CH_H - 44)

  const path = Array.from({ length: 120 }, (_, k) => {
    const l = 6 + (k / 119) * 6
    return `${k === 0 ? 'M' : 'L'} ${toX(l).toFixed(1)} ${toY(scalingLoss(l)).toFixed(1)}`
  }).join(' ')

  const setFromEvent = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * CH_W
    const l = 6 + ((x - 34) / (CH_W - 48)) * 6
    setLogN(Math.max(6, Math.min(12, l)))
  }

  const params = Math.pow(10, logN)
  const loss = scalingLoss(logN)
  const paramsLabel =
    params >= 1e9 ? `${(params / 1e9).toFixed(1)}B` : `${(params / 1e6).toFixed(0)}M`

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-1 font-mono text-xs font-bold text-ink">Leyes de escala (ilustrativo)</div>
      <div className="mb-2 text-[11px] text-muted">
        Arrastra el punto: la pérdida cae como una ley de potencia con los parámetros.
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CH_W} ${CH_H}`}
        className="w-full cursor-ew-resize touch-none"
        onPointerDown={(e) => {
          setDragging(true)
          e.currentTarget.setPointerCapture(e.pointerId)
          setFromEvent(e)
        }}
        onPointerMove={(e) => dragging && setFromEvent(e)}
        onPointerUp={() => setDragging(false)}
        role="slider"
        aria-label="Número de parámetros (escala log)"
        aria-valuenow={Math.round(logN * 10)}
      >
        {/* ejes */}
        <line x1={34} y1={12} x2={34} y2={CH_H - 32} stroke="#1C2440" />
        <line x1={34} y1={CH_H - 32} x2={CH_W - 14} y2={CH_H - 32} stroke="#1C2440" />
        {[7, 8, 9, 10, 11].map((l) => (
          <text key={l} x={toX(l)} y={CH_H - 18} textAnchor="middle" fill="#55618A" fontSize="9" fontFamily="JetBrains Mono">
            10^{l}
          </text>
        ))}
        {/* asíntota L∞ */}
        <line x1={34} y1={toY(L_INF)} x2={CH_W - 14} y2={toY(L_INF)} stroke="#FB7185" strokeDasharray="4 4" strokeWidth="1" />
        <text x={CH_W - 16} y={toY(L_INF) - 5} textAnchor="end" fill="#FB7185" fontSize="9" fontFamily="JetBrains Mono">
          L∞
        </text>
        <path d={path} fill="none" stroke="url(#scale-grad)" strokeWidth="2.5" />
        <defs>
          <linearGradient id="scale-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <circle cx={toX(logN)} cy={toY(loss)} r="7" fill="#FBBF24" opacity="0.25" />
        <circle cx={toX(logN)} cy={toY(loss)} r="4.5" fill="#FBBF24" />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-xs">
        <span className="text-muted">
          N = <span className="text-amber">{paramsLabel}</span> parámetros
        </span>
        <span className="text-muted">
          L ≈ <span className="text-cyan">{loss.toFixed(2)}</span>
        </span>
      </div>
    </div>
  )
}

export default function DemoCausalMask() {
  const [pos, setPos] = useState(4)
  return (
    <DemoFrame
      title="bert_vs_gpt.py"
      controls={
        <>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            posición del token: <span className="w-5 text-cyan">{pos}</span>
            <input
              type="range"
              min={0}
              max={N - 1}
              value={pos}
              onChange={(e) => setPos(parseInt(e.target.value))}
              className="w-44 accent-cyan"
              aria-label="Posición del token"
            />
          </label>
          <span className="font-mono text-[10px] text-faint">
            <span className="text-lime">■</span> visible&nbsp;&nbsp;
            <span className="text-rose/60">■</span> enmascarado
          </span>
        </>
      }
    >
      <div className="grid gap-5 p-6 lg:grid-cols-3">
        <MaskGrid kind="bert" pos={pos} label="BERT · encoder" sub="Bidireccional: cada token ve TODA la frase. Ideal para entender." />
        <MaskGrid kind="gpt" pos={pos} label="GPT · decoder" sub="Causal: cada token solo ve su pasado. Ideal para generar." />
        <ScalingChart />
      </div>
    </DemoFrame>
  )
}
