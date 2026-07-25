/**
 * Demo S4 · ResNet — pulso de gradiente en una red plana de 12 bloques vs una
 * residual. En la plana el pulso (rose) decae exponencialmente hasta morir;
 * en la residual el atajo lo mantiene vivo. Magnitud = opacidad del pulso.
 */

import { useEffect, useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { TeX } from '@/lib/katex-content'
import { cn } from '@/lib/utils'

const BLOCKS = 12
const DECAY = 0.78

// magnitud del gradiente en el bloque i (0 = más cercano a la entrada)
const plainMag = (i: number) => DECAY ** (BLOCKS - 1 - i)
const resMag = (i: number) => Math.max(plainMag(i), 0.42)

export default function ResnetDemo() {
  const [head, setHead] = useState<number | null>(null) // índice del bloque donde está el pulso
  const [running, setRunning] = useState(false)
  const intRef = useRef<number | null>(null)

  const start = () => {
    if (intRef.current) clearInterval(intRef.current)
    setRunning(true)
    setHead(BLOCKS - 1)
    let i = BLOCKS - 1
    intRef.current = window.setInterval(() => {
      i -= 1
      if (i < 0) {
        if (intRef.current) clearInterval(intRef.current)
        setRunning(false)
        setHead(null)
        return
      }
      setHead(i)
    }, 200)
  }

  useEffect(
    () => () => {
      if (intRef.current) clearInterval(intRef.current)
    },
    [],
  )

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={start}
        disabled={running}
        className="flex items-center gap-1.5 rounded-md bg-rose/15 px-3.5 py-1.5 font-mono text-xs font-bold text-rose transition-colors hover:bg-rose/25 disabled:opacity-40"
      >
        <Play className="h-3.5 w-3.5" aria-hidden />
        Propagar gradiente ←
      </button>
      <button
        onClick={() => {
          if (intRef.current) clearInterval(intRef.current)
          setHead(null)
          setRunning(false)
        }}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 font-mono text-xs text-muted hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Reiniciar
      </button>
      <span className="ml-auto font-mono text-[11px] text-faint">
        <TeX content="$y = F(x) + x$" /> — el gradiente viaja por el atajo sin atenuarse
      </span>
    </div>
  )

  const row = (residual: boolean) => {
    const mag = residual ? resMag : plainMag
    return (
      <div className="relative">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs font-bold" style={{ color: residual ? '#A3E635' : '#FB7185' }}>
            {residual ? 'Red residual (ResNet)' : 'Red plana (sin atajos)'}
          </span>
          <span className="font-mono text-[10px] text-faint">
            {residual ? '∂L/∂x llega casi intacta a la primera capa' : '∂L/∂x muere antes de llegar'}
          </span>
        </div>
        <div className="relative flex gap-1.5">
          {/* arcos de atajo */}
          {residual &&
            Array.from({ length: BLOCKS }, (_, i) => (
              <svg key={i} className="pointer-events-none absolute" style={{ left: i * 46 - 6, top: -14, width: 58, height: 20 }}>
                <path d="M 6 20 Q 29 0 52 20" fill="none" stroke="#A3E635" strokeWidth={1.4} opacity={head !== null && head <= i ? 0.9 : 0.25} />
              </svg>
            ))}
          {Array.from({ length: BLOCKS }, (_, i) => {
            const active = head !== null && head <= i
            const m = active ? mag(i) : 0
            const isHead = head === i
            return (
              <div key={i} className="flex w-10 flex-col items-center gap-1">
                <div
                  className="h-14 w-full rounded-md border transition-all duration-200"
                  style={{
                    borderColor: active ? `rgba(251,113,133,${0.3 + m * 0.7})` : '#1C2440',
                    background: active ? `rgba(251,113,133,${0.06 + m * 0.5})` : '#0A0E1A',
                    boxShadow: isHead ? '0 0 16px rgba(251,113,133,0.7)' : 'none',
                    transform: isHead ? 'scale(1.08)' : 'scale(1)',
                  }}
                />
                <span className="font-mono text-[9px]" style={{ color: active ? '#FB7185' : '#55618A' }}>
                  {active ? m.toFixed(2) : '·'}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-faint">
          <span>← entrada (capa 1)</span>
          <span>salida / pérdida (capa {BLOCKS}) →</span>
        </div>
      </div>
    )
  }

  return (
    <DemoFrame title="resnet_skip.py" controls={controls}>
      <div className="flex flex-col gap-8 p-6 pt-10">
        {row(false)}
        {row(true)}
        <div className={cn('rounded-lg border border-line bg-bg-0 px-4 py-3 text-xs leading-relaxed text-muted')}>
          Cada multiplicación por una derivada &lt; 1 atenúa el gradiente: tras 12 bloques queda{' '}
          <span className="font-mono text-rose">0.78¹² ≈ 0.05</span> (red plana). Con el atajo, la derivada de{' '}
          <TeX content="$y = F(x) + x$" /> respecto a $x$ es $F'(x) + 1$: el{' '}
          <span className="font-mono text-lime">+1</span> garantiza un camino directo para el gradiente,
          por muy profunda que sea la red.
        </div>
      </div>
    </DemoFrame>
  )
}
