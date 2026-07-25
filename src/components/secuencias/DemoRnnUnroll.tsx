/**
 * DemoRnnUnroll — celda RNN plegada ↔ desplegada en el tiempo.
 * Escribe una palabra: los caracteres entran uno cada 500 ms, el estado h
 * (barras) se actualiza por paso y pulsos cyan viajan por las aristas.
 * El toggle plegada/desplegada es un layout spring de Framer Motion.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FoldVertical, UnfoldVertical } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const HDIM = 8

/** Paso RNN determinista: h' = tanh(0.55·h + x_t·codebook) */
function rnnStep(h: number[], ch: string): number[] {
  const code = ch.charCodeAt(0)
  const x = Array.from({ length: HDIM }, (_, i) => Math.sin(code * (i + 1) * 0.37) * 0.9)
  return h.map((v, i) => Math.tanh(0.55 * v + x[i] + 0.15 * Math.cos(i * 1.7 + code)))
}

function useSequence(word: string) {
  return useMemo(() => {
    const states: number[][] = [new Array(HDIM).fill(0)]
    for (const ch of word) states.push(rnnStep(states[states.length - 1], ch))
    return states // states[0] = h0, states[i+1] = tras char i
  }, [word])
}

function Cell({ ch, active, folded }: { ch: string | null; active: boolean; folded?: boolean }) {
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={cn(
        'relative flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-xl border font-mono',
        active
          ? 'border-cyan/70 bg-cyan/10 shadow-[0_0_18px_rgba(34,211,238,0.35)]'
          : 'border-line bg-panel-2',
      )}
    >
      <span className="text-[9px] uppercase tracking-wider text-faint">{folded ? 'RNN' : 'celda'}</span>
      <span className={cn('text-lg font-bold', active ? 'text-cyan' : 'text-muted')}>
        {ch ?? '·'}
      </span>
      <span className="text-[9px] text-faint">tanh</span>
    </motion.div>
  )
}

function HBars({ h, activeIdx }: { h: number[]; activeIdx: number }) {
  return (
    <div className="flex h-24 items-end gap-1.5">
      {h.map((v, i) => (
        <div key={i} className="flex h-full w-4 flex-col items-center justify-end gap-0.5">
          <div className="relative h-full w-full overflow-hidden rounded-sm bg-line/60">
            <motion.div
              className="absolute bottom-1/2 left-0 w-full bg-violet"
              animate={{
                height: `${Math.min(50, Math.abs(v) * 50)}%`,
                y: v >= 0 ? '0%' : '100%',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ originY: 0 }}
            />
          </div>
          <span className={cn('font-mono text-[8px]', i === activeIdx ? 'text-cyan' : 'text-faint')}>
            {i}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DemoRnnUnroll() {
  const [word, setWord] = useState('sinapsis')
  const [step, setStep] = useState(0) // nº de caracteres procesados
  const [unrolled, setUnrolled] = useState(true)
  const [playing, setPlaying] = useState(false)
  const states = useSequence(word.slice(0, 12).toLowerCase().replace(/[^a-záéíóúñü]/g, ''))
  const cleanWord = word.slice(0, 12).toLowerCase().replace(/[^a-záéíóúñü]/g, '')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const play = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStep(0)
    setPlaying(true)
    let s = 0
    timerRef.current = setInterval(() => {
      s += 1
      setStep(s)
      if (s >= cleanWord.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setPlaying(false)
      }
    }, 500)
  }

  useEffect(() => {
    play()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanWord])

  const currentH = states[Math.min(step, states.length - 1)]

  return (
    <DemoFrame
      title="rnn_unroll.py"
      controls={
        <>
          <label className="font-mono text-xs text-faint">palabra:</label>
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            maxLength={12}
            className="w-36 rounded-md border border-line bg-bg-1 px-2 py-1.5 font-mono text-sm text-cyan outline-none focus:border-cyan/60"
            aria-label="Palabra de entrada"
          />
          <button
            onClick={play}
            disabled={playing || cleanWord.length === 0}
            className="rounded-md bg-lime/15 px-3 py-1.5 font-mono text-xs font-bold text-lime transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40"
          >
            ▶ Reproducir
          </button>
          <button
            onClick={() => setUnrolled((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-violet/40 bg-violet/10 px-3 py-1.5 font-mono text-xs text-violet transition-colors hover:bg-violet/20"
          >
            {unrolled ? <FoldVertical className="h-3.5 w-3.5" /> : <UnfoldVertical className="h-3.5 w-3.5" />}
            {unrolled ? 'Plegar' : 'Desplegar'}
          </button>
          <span className="ml-auto font-mono text-[10px] text-faint">
            paso {step}/{cleanWord.length}
          </span>
        </>
      }
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto]">
        {/* Diagrama plegado / desplegado */}
        <motion.div layout className="flex min-h-32 flex-wrap items-center gap-3">
          {!unrolled ? (
            <motion.div layout key="folded" className="flex items-center gap-4">
              <Cell ch={step > 0 ? cleanWord[step - 1] : null} active={playing} folded />
              {/* lazo de recurrencia */}
              <svg width="120" height="90" viewBox="0 0 120 90" aria-hidden>
                <motion.path
                  d="M 10 70 C 10 10, 110 10, 110 70"
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth="2"
                  strokeDasharray="6 5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8 }}
                />
                <polygon points="110,70 104,60 116,60" fill="#22D3EE" />
                <text x="60" y="16" textAnchor="middle" fill="#8E9AB8" fontSize="10" fontFamily="JetBrains Mono">
                  h (compartido)
                </text>
              </svg>
            </motion.div>
          ) : (
            <motion.div layout key="unrolled" className="flex flex-wrap items-center gap-0">
              {Array.from({ length: Math.max(cleanWord.length, 1) }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <Cell ch={i < step ? cleanWord[i] : i < cleanWord.length ? cleanWord[i] : null} active={i === step - 1} />
                  {i < cleanWord.length - 1 && (
                    <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden>
                      <line x1="0" y1="10" x2="30" y2="10" stroke="#1C2440" strokeWidth="2" />
                      <polygon points="30,10 23,6 23,14" fill={i < step - 1 ? '#22D3EE' : '#1C2440'} />
                      {i < step - 1 && (
                        <motion.circle
                          key={`p-${step}-${i}`}
                          cx="15"
                          cy="10"
                          r="3"
                          fill="#22D3EE"
                          initial={{ opacity: 0, cx: 2 }}
                          animate={{ opacity: [0, 1, 0], cx: 30 }}
                          transition={{ duration: 0.45 }}
                        />
                      )}
                    </svg>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Estado oculto */}
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            // estado oculto h<sub>{Math.min(step, cleanWord.length)}</sub>
          </div>
          <HBars h={currentH} activeIdx={step % HDIM} />
          <p className="mt-2 max-w-56 text-[11px] leading-relaxed text-muted">
            Los mismos pesos <span className="font-mono text-violet">W</span> se aplican en cada
            paso: <span className="font-mono text-cyan">h</span> acumula la «memoria» de los
            caracteres vistos.
          </p>
        </div>
      </div>
    </DemoFrame>
  )
}
