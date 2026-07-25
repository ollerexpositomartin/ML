/**
 * DemoPuertas — simulador de una celda LSTM (versión escalar, didáctica).
 * Sliders de x_t, C_{t-1}, h_{t-1} → puertas calculadas en vivo con "iris"
 * que abren/cierran; tira del estado de celda (memoria que fluye cyan,
 * escritura lime, borrado atenuado); modo play: 20 pasos LSTM vs RNN.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const sig = (z: number) => 1 / (1 + Math.exp(-z))

interface LstmState { f: number; i: number; g: number; o: number; C: number; h: number }

function lstmStep(x: number, hPrev: number, cPrev: number): LstmState {
  const f = sig(1.3 * hPrev + 0.9 * x + 0.6)
  const i = sig(1.5 * x - 0.2 * hPrev)
  const g = Math.tanh(1.2 * x + 0.3 * hPrev)
  const C = f * cPrev + i * g
  const o = sig(0.9 * hPrev + 0.4 * C + 0.2)
  const h = o * Math.tanh(C)
  return { f, i, g, o, C, h }
}

const STEPS = 20
const SCRIPT = Array.from({ length: STEPS }, (_, t) => (t === 2 ? 2.0 : t === 12 ? -0.8 : 0.0))

function Iris({ label, symbol, value, color }: { label: string; symbol: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-full border-2"
        style={{ borderColor: color, boxShadow: `0 0 ${18 * value}px ${color}66` }}
      >
        {/* iris: apertura ∝ valor de la puerta */}
        <motion.div
          className="h-12 w-12 rounded-full"
          style={{ background: `radial-gradient(circle, ${color} 0%, ${color}44 70%, transparent 100%)` }}
          animate={{ scale: 0.15 + 0.85 * value, opacity: 0.25 + 0.75 * value }}
          transition={{ duration: 0.3 }}
        />
        <span className="absolute font-mono text-sm font-bold text-ink">{symbol}</span>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{label}</span>
      <span className="font-mono text-xs" style={{ color }}>{value.toFixed(2)}</span>
    </div>
  )
}

export default function DemoPuertas() {
  const [x, setX] = useState(0.8)
  const [cPrev, setCPrev] = useState(0.6)
  const [hPrev, setHPrev] = useState(0.2)
  const [playStep, setPlayStep] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const live = lstmStep(x, hPrev, cPrev)

  const trajectory = useMemo(() => {
    const lstm: number[] = []
    const rnn: number[] = []
    let hL = 0
    let cL = 0
    let hR = 0
    for (let t = 0; t < STEPS; t++) {
      const s = lstmStep(SCRIPT[t], hL, cL)
      hL = s.h
      cL = s.C
      hR = Math.tanh(0.7 * hR + SCRIPT[t])
      lstm.push(cL)
      rnn.push(hR)
    }
    return { lstm, rnn }
  }, [])

  const play = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPlayStep(0)
    let t = 0
    timerRef.current = setInterval(() => {
      t += 1
      setPlayStep(t)
      if (t >= STEPS - 1 && timerRef.current) clearInterval(timerRef.current)
    }, 260)
  }
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const sliderCls = 'w-32 accent-cyan'
  const chartW = 560
  const chartH = 130
  const upTo = playStep >= 0 ? playStep + 1 : STEPS
  const toX = (t: number) => 14 + (t / (STEPS - 1)) * (chartW - 28)
  const toY = (v: number) => chartH / 2 - (v / 1.6) * (chartH / 2 - 10)
  const path = (arr: number[]) =>
    arr.slice(0, upTo).map((v, t) => `${t === 0 ? 'M' : 'L'} ${toX(t).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ')

  return (
    <DemoFrame
      title="puertas_lstm.py"
      controls={
        <>
          {([
            ['x_t', x, setX, -2, 2],
            ['C_{t−1}', cPrev, setCPrev, -2, 2],
            ['h_{t−1}', hPrev, setHPrev, -2, 2],
          ] as const).map(([label, val, set, mn, mx]) => (
            <label key={label} className="flex items-center gap-2 font-mono text-xs text-muted">
              {label}
              <input
                type="range"
                min={mn}
                max={mx}
                step={0.05}
                value={val}
                onChange={(e) => set(parseFloat(e.target.value))}
                className={sliderCls}
                aria-label={label}
              />
              <span className="w-10 text-cyan">{val.toFixed(2)}</span>
            </label>
          ))}
          <button
            onClick={play}
            className="flex items-center gap-1.5 rounded-md bg-lime/15 px-3 py-1.5 font-mono text-xs font-bold text-lime transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <Play className="h-3.5 w-3.5" /> 20 pasos
          </button>
        </>
      }
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr]">
        {/* Celda */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // celda LSTM · sección transversal
          </div>
          <div className="flex items-start justify-center gap-5">
            <Iris label="olvido" symbol="f" value={live.f} color="#FB7185" />
            <Iris label="entrada" symbol="i" value={live.i} color="#A3E635" />
            <Iris label="salida" symbol="o" value={live.o} color="#22D3EE" />
          </div>

          {/* Tira del estado de celda */}
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between font-mono text-[10px] text-faint">
              <span>C_prev = {cPrev.toFixed(2)}</span>
              <span>C_t = <span className="text-ink">{live.C.toFixed(2)}</span></span>
            </div>
            <div className="relative h-9 overflow-hidden rounded-md border border-line bg-bg-1">
              {/* memoria vieja que sobrevive (cyan, atenuada por f) */}
              <motion.div
                className="absolute inset-y-0 left-0 bg-cyan/50"
                animate={{ width: `${Math.min(100, Math.abs(cPrev * live.f) * 45)}%`, opacity: 0.25 + 0.75 * live.f }}
                transition={{ duration: 0.3 }}
              />
              {/* escritura nueva (lime, ∝ i·C̃) */}
              <motion.div
                className="absolute inset-y-0 right-0 bg-lime/50"
                animate={{ width: `${Math.min(100, Math.abs(live.i * live.g) * 45)}%` }}
                transition={{ duration: 0.3 }}
              />
              {/* partículas de flujo */}
              {Array.from({ length: 5 }).map((_, p) => (
                <motion.span
                  key={p}
                  className="absolute top-1/2 h-1 w-1 rounded-full bg-cyan"
                  animate={{ x: [0, 260], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: p * 0.5, ease: 'linear' }}
                  style={{ left: 8 }}
                />
              ))}
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-ink/80">
                f·C_prev <span className="text-cyan">(conservar)</span> + i·C̃ <span className="text-lime">(escribir)</span>
              </span>
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs">
              <span className="text-muted">h_t = o·tanh(C_t)</span>
              <span className="text-cyan">{live.h.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Trayectoria 20 pasos */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              // memoria tras 20 pasos (pulso en t=2)
            </span>
            <span className="font-mono text-[10px] text-faint">
              <span className="text-lime">— LSTM C_t</span>&nbsp;&nbsp;
              <span className="text-rose">— RNN h_t</span>
            </span>
          </div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" aria-hidden>
            <line x1="0" y1={toY(0)} x2={chartW} y2={toY(0)} stroke="#1C2440" strokeWidth="1" />
            {SCRIPT.map((v, t) =>
              v !== 0 ? (
                <line key={t} x1={toX(t)} y1="8" x2={toX(t)} y2={chartH - 8} stroke="#55618A" strokeDasharray="3 4" strokeWidth="1" />
              ) : null,
            )}
            <motion.path d={path(trajectory.lstm)} fill="none" stroke="#A3E635" strokeWidth="2.5" />
            <motion.path d={path(trajectory.rnn)} fill="none" stroke="#FB7185" strokeWidth="2.5" strokeDasharray="6 4" />
            {playStep >= 0 && (
              <circle cx={toX(Math.min(playStep, STEPS - 1))} cy={toY(trajectory.lstm[Math.min(playStep, STEPS - 1)])} r="4" fill="#A3E635" />
            )}
          </svg>
          <p className={cn('mt-3 text-xs leading-relaxed text-muted')}>
            La RNN olvida el pulso en pocos pasos (<span className="font-mono text-rose">h_t</span> cae
            a ruido). La LSTM mantiene <span className="font-mono text-lime">C_t</span> casi intacto:
            cuando <span className="font-mono text-rose">f ≈ 1</span> la cinta transportadora conserva
            la memoria y el gradiente puede fluir 20, 50, 200 pasos atrás.
          </p>
        </div>
      </div>
    </DemoFrame>
  )
}
