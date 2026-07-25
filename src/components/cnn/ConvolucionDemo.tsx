/**
 * Demo S1 · Convolución hands-on — rejilla de entrada 6×6 con valores
 * aleatorios, kernel 3×3 (Sobel) arrastrable, barrido automático, selectores
 * de stride/padding y lectura de la fórmula de tamaño de salida en vivo.
 * La aritmética (9 productos + suma) es visible celda a celda.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Dices } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { TeX } from '@/lib/katex-content'
import { cn } from '@/lib/utils'

const N = 6
const K = 3
const KERNEL = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
]
const CELL = 46

function randomGrid(seed: number): number[][] {
  let t = seed
  const rand = () => {
    t = (t * 1103515245 + 12345) & 0x7fffffff
    return t / 0x7fffffff
  }
  return Array.from({ length: N }, () => Array.from({ length: N }, () => Math.floor(rand() * 10)))
}

export default function ConvolucionDemo() {
  const [seed, setSeed] = useState(42)
  const [stride, setStride] = useState(1)
  const [pad, setPad] = useState(0)
  const [pos, setPos] = useState({ r: 0, c: 0 }) // posición en coordenadas de SALIDA
  const [sweep, setSweep] = useState(false)
  const grid = useMemo(() => randomGrid(seed), [seed])

  const outN = Math.floor((N + 2 * pad - K) / stride) + 1
  useEffect(() => {
    setPos((p) => ({ r: Math.min(p.r, outN - 1), c: Math.min(p.c, outN - 1) }))
  }, [outN])

  // valor de entrada con padding
  const at = (r: number, c: number) => {
    const rr = r - pad
    const cc = c - pad
    return rr >= 0 && rr < N && cc >= 0 && cc < N ? grid[rr][cc] : 0
  }

  const windowVals = (or: number, oc: number) => {
    const base_r = or * stride
    const base_c = oc * stride
    const vals: number[][] = []
    for (let u = 0; u < K; u++) {
      const row: number[] = []
      for (let v = 0; v < K; v++) row.push(at(base_r + u, base_c + v))
      vals.push(row)
    }
    return vals
  }

  const outValue = (or: number, oc: number) => {
    const w = windowVals(or, oc)
    let s = 0
    for (let u = 0; u < K; u++) for (let v = 0; v < K; v++) s += w[u][v] * KERNEL[u][v]
    return s
  }

  const curWindow = windowVals(pos.r, pos.c)
  const curSum = outValue(pos.r, pos.c)

  // Barrido automático
  const sweepRef = useRef<number | null>(null)
  useEffect(() => {
    if (!sweep) return
    sweepRef.current = window.setInterval(() => {
      setPos((p) => {
        const nc = p.c + 1
        if (nc < outN) return { r: p.r, c: nc }
        const nr = p.r + 1
        if (nr < outN) return { r: nr, c: 0 }
        setSweep(false)
        return { r: 0, c: 0 }
      })
    }, 160)
    return () => {
      if (sweepRef.current) clearInterval(sweepRef.current)
    }
  }, [sweep, outN])

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => setSweep((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-bold transition-colors',
          sweep ? 'bg-lime/25 text-lime' : 'bg-lime/15 text-lime hover:bg-lime/25',
        )}
      >
        {sweep ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
        Barrido automático
      </button>
      <label className="flex items-center gap-1.5 font-mono text-xs text-muted">
        stride
        <select value={stride} onChange={(e) => setStride(Number(e.target.value))} className="rounded-md border border-cyan/40 bg-bg-1 px-2 py-1 font-mono text-xs text-cyan">
          <option value={1}>s = 1</option>
          <option value={2}>s = 2</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5 font-mono text-xs text-muted">
        padding
        <select value={pad} onChange={(e) => setPad(Number(e.target.value))} className="rounded-md border border-violet/40 bg-bg-1 px-2 py-1 font-mono text-xs text-violet">
          <option value={0}>p = 0</option>
          <option value={1}>p = 1</option>
        </select>
      </label>
      <button onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1 rounded-md px-2 py-1.5 font-mono text-xs text-muted hover:text-ink">
        <Dices className="h-3.5 w-3.5" aria-hidden />
        nueva imagen
      </button>
      <span className="ml-auto font-mono text-xs text-cyan">
        n={N}, k={K}, p={pad}, s={stride} → <span className="font-bold text-ink">{outN}×{outN}</span>
      </span>
    </div>
  )

  // ventana activa en coords de la imagen con pad (tamaño N+2p)
  const winR = pos.r * stride
  const winC = pos.c * stride
  const total = N + 2 * pad

  return (
    <DemoFrame title="convolucion.py" controls={controls}>
      <div className="grid gap-4 p-4 lg:grid-cols-[auto_auto_1fr]">
        {/* Entrada */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">entrada I (6×6)</div>
          <div className="relative inline-block rounded-lg border border-line bg-bg-0 p-2">
            <div
              className="relative"
              style={{ width: total * CELL, height: total * CELL }}
              onMouseLeave={() => undefined}
            >
              {Array.from({ length: total }, (_, r) =>
                Array.from({ length: total }, (_, c) => {
                  const ghost = r < pad || r >= N + pad || c < pad || c >= N + pad
                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseEnter={() => {
                        // colocar la ventana para que este píxel sea su centro (si es válido)
                        const or = Math.round((r - 1) / stride)
                        const oc = Math.round((c - 1) / stride)
                        if (or >= 0 && or < outN && oc >= 0 && oc < outN && !sweep) setPos({ r: or, c: oc })
                      }}
                      className={cn(
                        'absolute flex items-center justify-center font-mono text-xs transition-colors',
                        ghost ? 'border border-dashed border-faint/50 text-faint/60' : 'border border-line text-ink',
                      )}
                      style={{
                        left: c * CELL,
                        top: r * CELL,
                        width: CELL,
                        height: CELL,
                        background: ghost ? 'rgba(28,36,64,0.15)' : `rgba(34,211,238,${0.03 + (at(r, c) / 10) * 0.25})`,
                      }}
                    >
                      {ghost ? 0 : at(r, c)}
                    </div>
                  )
                }),
              )}
              {/* kernel overlay */}
              <motion.div
                animate={{ left: winC * CELL - 2, top: winR * CELL - 2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="pointer-events-none absolute rounded-md border-2 border-violet bg-violet/15"
                style={{ width: K * CELL + 4, height: K * CELL + 4, boxShadow: '0 0 18px rgba(139,92,246,0.45)' }}
              />
            </div>
          </div>
        </div>

        {/* Aritmética */}
        <div className="min-w-[190px]">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">ventana ⊙ kernel</div>
          <div className="rounded-lg border border-line bg-bg-0 p-3">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-3 gap-0.5">
                {curWindow.flat().map((v, i) => (
                  <span key={i} className="flex h-8 w-8 items-center justify-center rounded border border-cyan/40 bg-cyan/5 font-mono text-xs text-cyan">
                    {v}
                  </span>
                ))}
              </div>
              <span className="font-mono text-sm text-muted">⊙</span>
              <div className="grid grid-cols-3 gap-0.5">
                {KERNEL.flat().map((v, i) => (
                  <span key={i} className="flex h-8 w-8 items-center justify-center rounded border border-violet/40 bg-violet/5 font-mono text-xs text-violet">
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 border-t border-line pt-2 font-mono text-[11px] leading-relaxed text-muted">
              Σ ={' '}
              <motion.span key={curSum + pos.r * 31 + pos.c} initial={{ scale: 1.25, color: '#A3E635' }} animate={{ scale: 1, color: '#A3E635' }} className="inline-block text-base font-bold">
                {curSum}
              </motion.span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-faint">
              <TeX content="$\\mathrm{out}[i,j] = \\sum_{u,v} I[si{+}u, sj{+}v]\\,K[u,v]$" />
            </div>
          </div>
        </div>

        {/* Salida */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">mapa de salida ({outN}×{outN})</div>
          <div className="inline-block rounded-lg border border-line bg-bg-0 p-2">
            <div className="relative" style={{ width: outN * CELL, height: outN * CELL }}>
              {Array.from({ length: outN }, (_, r) =>
                Array.from({ length: outN }, (_, c) => {
                  const v = outValue(r, c)
                  const active = r === pos.r && c === pos.c
                  return (
                    <button
                      key={`${r}-${c}`}
                      onMouseEnter={() => !sweep && setPos({ r, c })}
                      className={cn('absolute flex items-center justify-center border font-mono text-xs transition-all')}
                      style={{
                        left: c * CELL,
                        top: r * CELL,
                        width: CELL,
                        height: CELL,
                        borderColor: active ? '#A3E635' : '#1C2440',
                        background: active ? 'rgba(163,230,53,0.18)' : 'rgba(163,230,53,0.04)',
                        color: active ? '#A3E635' : '#8E9AB8',
                        fontWeight: active ? 700 : 400,
                        transform: active ? 'scale(1.06)' : 'scale(1)',
                        zIndex: active ? 2 : 1,
                      }}
                    >
                      {v}
                    </button>
                  )
                }),
              )}
            </div>
          </div>
          <div className="mt-2 max-w-[220px] font-mono text-[10px] leading-relaxed text-faint">
            pasa el ratón por la entrada o la salida para colocar el kernel; el padding dibuja celdas fantasma de ceros
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
