/**
 * Demo S2 · Pooling — mapa 8×8 con un blob brillante; ventana 2×2 que barre
 * automáticamente; toggle max/avg muestra cómo max preserva el blob y avg lo difumina.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const N = 8
const POOL = 2
const OUT = N / POOL
const CELL = 40

function makeMap(): number[][] {
  return Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c) => {
      const blob = 9 * Math.exp(-((r - 2.6) ** 2 + (c - 4.8) ** 2) / 2.4)
      const noise = ((r * 31 + c * 17) % 7) * 0.14
      return Math.min(10, 0.4 + noise + blob)
    }),
  )
}

const heat = (v: number) => `rgba(34,211,238,${0.04 + (v / 10) * 0.85})`

type Mode = 'max' | 'avg'

export default function PoolingDemo() {
  const map = useMemo(makeMap, [])
  const [mode, setMode] = useState<Mode>('max')
  const [winIdx, setWinIdx] = useState(OUT * OUT) // todas computadas por defecto
  const [sweeping, setSweeping] = useState(false)
  const intRef = useRef<number | null>(null)

  const poolVal = (or: number, oc: number, m: Mode) => {
    const vals = [map[or * 2][oc * 2], map[or * 2][oc * 2 + 1], map[or * 2 + 1][oc * 2], map[or * 2 + 1][oc * 2 + 1]]
    return m === 'max' ? Math.max(...vals) : vals.reduce((a, b) => a + b, 0) / 4
  }

  useEffect(() => {
    if (!sweeping) return
    intRef.current = window.setInterval(() => {
      setWinIdx((i) => {
        if (i >= OUT * OUT) {
          setSweeping(false)
          return i
        }
        return i + 1
      })
    }, 200)
    return () => {
      if (intRef.current) clearInterval(intRef.current)
    }
  }, [sweeping])

  const startSweep = () => {
    setWinIdx(0)
    setSweeping(true)
  }

  const activeOr = Math.floor(Math.min(winIdx, OUT * OUT - 1) / OUT)
  const activeOc = Math.min(winIdx, OUT * OUT - 1) % OUT
  const isMaxCell = (r: number, c: number) => {
    if (mode !== 'max' || r >> 1 !== activeOr || c >> 1 !== activeOc) return false
    const maxV = poolVal(activeOr, activeOc, 'max')
    return map[r][c] === maxV
  }

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={startSweep}
        disabled={sweeping}
        className="flex items-center gap-1.5 rounded-md bg-lime/15 px-3 py-1.5 font-mono text-xs font-bold text-lime transition-colors hover:bg-lime/25 disabled:opacity-40"
      >
        <Play className="h-3.5 w-3.5" aria-hidden />
        Barrido
      </button>
      <button
        onClick={() => {
          setSweeping(false)
          setWinIdx(OUT * OUT)
        }}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 font-mono text-xs text-muted hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Mostrar todo
      </button>
      <div className="flex overflow-hidden rounded-md border border-line">
        {(['max', 'avg'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'px-3 py-1.5 font-mono text-xs font-bold transition-colors',
              mode === m ? (m === 'max' ? 'bg-cyan/15 text-cyan' : 'bg-violet/15 text-violet') : 'text-muted hover:text-ink',
            )}
          >
            {m === 'max' ? 'max-pool' : 'avg-pool'}
          </button>
        ))}
      </div>
      <span className="ml-auto font-mono text-xs text-faint">8×8 → 4×4 (ventana 2×2, stride 2)</span>
    </div>
  )

  return (
    <DemoFrame title="pooling.py" controls={controls}>
      <div className="flex flex-wrap items-start gap-6 p-4">
        {/* Entrada */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">mapa de entrada (8×8)</div>
          <div className="relative inline-block rounded-lg border border-line bg-bg-0 p-1.5">
            <div className="relative" style={{ width: N * CELL, height: N * CELL }}>
              {map.map((row, r) =>
                row.map((v, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="absolute flex items-center justify-center border border-line/50 font-mono text-[10px]"
                    style={{
                      left: c * CELL, top: r * CELL, width: CELL, height: CELL,
                      background: heat(v),
                      color: v > 5 ? '#04060D' : '#8E9AB8',
                      boxShadow: isMaxCell(r, c) ? 'inset 0 0 0 2px #A3E635' : 'none',
                    }}
                  >
                    {v.toFixed(1)}
                  </div>
                )),
              )}
              {/* ventana activa */}
              {winIdx < OUT * OUT && (
                <div
                  className="pointer-events-none absolute rounded-sm border-2 border-violet bg-violet/10 transition-all duration-200"
                  style={{ left: activeOc * 2 * CELL - 1, top: activeOr * 2 * CELL - 1, width: 2 * CELL + 2, height: 2 * CELL + 2 }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Salida */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
            salida {mode === 'max' ? 'max' : 'avg'} (4×4)
          </div>
          <div className="inline-block rounded-lg border border-line bg-bg-0 p-1.5">
            <div className="relative" style={{ width: OUT * CELL, height: OUT * CELL }}>
              {Array.from({ length: OUT }, (_, r) =>
                Array.from({ length: OUT }, (_, c) => {
                  const idx = r * OUT + c
                  const computed = idx < winIdx
                  const active = idx === winIdx
                  const v = poolVal(r, c, mode)
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="absolute flex items-center justify-center border font-mono text-[11px] transition-all duration-200"
                      style={{
                        left: c * CELL, top: r * CELL, width: CELL, height: CELL,
                        borderColor: active ? '#A3E635' : '#1C2440',
                        background: computed || active ? (mode === 'max' ? heat(v) : `rgba(139,92,246,${0.04 + (v / 10) * 0.85})`) : 'transparent',
                        color: computed || active ? (v > 5 ? '#04060D' : '#EDF1FA') : '#55618A',
                        fontWeight: active ? 700 : 400,
                        transform: active ? 'scale(1.08)' : 'scale(1)',
                        zIndex: active ? 2 : 1,
                      }}
                    >
                      {computed || active ? v.toFixed(1) : '·'}
                    </div>
                  )
                }),
              )}
            </div>
          </div>
          <div className="mt-3 max-w-[240px] text-xs leading-relaxed text-muted">
            {mode === 'max'
              ? 'max-pool conserva la activación más fuerte: el blob sobrevive intacto. La celda ganadora se marca en lime.'
              : 'avg-pool promedia la ventana: el blob se difumina con su entorno. Útil como suavizado, menos para preservar picos.'}
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
