/**
 * Demo S4 · Backpropagation paso a paso — la pieza central del módulo.
 * Red fija 2-2-1 (tanh oculta, sigmoide salida, L = ½(ŷ−y)², η = 0.5).
 * `Paso ▸` avanza una secuencia de 8 pasos: forward (pulsos lime), loss,
 * backward (pulsos rose) y actualización de pesos. Panel lateral sincronizado
 * con la fórmula que aplica en cada paso. `Auto` reproduce a 1 paso/s.
 */

import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { TeX } from '@/lib/katex-content'
import { cn } from '@/lib/utils'

const X = [0.8, -0.4]
const Y = 1
const LR = 0.5

interface Net {
  W1: number[][] // [in][hidden]
  b1: number[]
  W2: number[] // [hidden]
  b2: number
}

const INIT: Net = {
  W1: [
    [0.5, -0.3],
    [0.2, 0.8],
  ],
  b1: [0.1, -0.1],
  W2: [0.6, -0.5],
  b2: 0.2,
}

const tanh = Math.tanh
const sig = (z: number) => 1 / (1 + Math.exp(-z))

function forward(net: Net) {
  const z1 = [0, 1].map((j) => X[0] * net.W1[0][j] + X[1] * net.W1[1][j] + net.b1[j])
  const a1 = z1.map(tanh)
  const z2 = a1[0] * net.W2[0] + a1[1] * net.W2[1] + net.b2
  const yh = sig(z2)
  const loss = 0.5 * (yh - Y) ** 2
  // backward
  const dz2 = (yh - Y) * yh * (1 - yh)
  const dW2 = a1.map((a) => a * dz2)
  const db2 = dz2
  const dz1 = [0, 1].map((j) => dz2 * net.W2[j] * (1 - a1[j] ** 2))
  const dW1 = [
    [X[0] * dz1[0], X[0] * dz1[1]],
    [X[1] * dz1[0], X[1] * dz1[1]],
  ]
  const db1 = dz1
  return { z1, a1, z2, yh, loss, dz2, dW2, db2, dz1, dW1, db1 }
}

function update(net: Net, g: ReturnType<typeof forward>): Net {
  return {
    W1: net.W1.map((row, i) => row.map((w, j) => w - LR * g.dW1[i][j])),
    b1: net.b1.map((b, j) => b - LR * g.db1[j]),
    W2: net.W2.map((w, j) => w - LR * g.dW2[j]),
    b2: net.b2 - LR * g.db2,
  }
}

const STEPS: { title: string; formula: string; note: string }[] = [
  { title: '0 · Inicio', formula: '$x = (0.8,\\,-0.4), \\quad y = 1$', note: 'Red 2-2-1 lista. Pulsa Paso ▸ para lanzar el forward.' },
  { title: '1 · z⁽¹⁾ en la capa oculta', formula: '$z^{(1)} = W^{(1)\\top} x + b^{(1)}$', note: 'Cada neurona oculta combina las entradas con sus pesos (pulsos lime).' },
  { title: '2 · Activaciones a⁽¹⁾', formula: '$a^{(1)} = \\tanh(z^{(1)})$', note: 'La no-linealidad aplasta z a (−1, 1).' },
  { title: '3 · Salida ŷ', formula: '$z^{(2)} = W^{(2)\\top} a^{(1)} + b^{(2)}, \\quad \\hat{y} = \\sigma(z^{(2)})$', note: 'La señal llega a la salida: la sigmoide la convierte en probabilidad.' },
  { title: '4 · La pérdida', formula: '$L = \\tfrac{1}{2}(\\hat{y} - y)^2$', note: 'Comparamos con el objetivo y = 1 (nodo rose).' },
  { title: '5 · Error en la salida', formula: '$\\delta^{(2)} = (\\hat{y} - y)\\,\\sigma\'(z^{(2)})$', note: 'Cuánto contribuye z⁽²⁾ al error. Empieza el viaje de vuelta (rose).' },
  { title: '6 · δ viaja a la capa oculta', formula: '$\\delta^{(1)} = \\big(W^{(2)} \\delta^{(2)}\\big) \\odot \\big(1 - (a^{(1)})^2\\big)$', note: 'La regla de la cadena: cada δ hereda el de la capa siguiente, filtrado por la derivada local.' },
  { title: '7 · Gradientes de los pesos', formula: '$\\frac{\\partial L}{\\partial W^{(l)}} = a^{(l-1)} \\delta^{(l)}$', note: 'Cada arista conoce ahora su responsabilidad en el error.' },
  { title: '8 · Actualización', formula: '$\\theta \\leftarrow \\theta - \\eta\\, \\nabla_\\theta L, \\quad \\eta = 0.5$', note: 'Los pesos se mueven contra el gradiente. La pérdida baja: un paso de entrenamiento completo.' },
]

// Geometría SVG (viewBox 640x300)
const POS = {
  x: [70, 70],
  xY: [80, 220],
  h: [250, 250],
  hY: [80, 220],
  o: [430, 150],
  loss: [575, 150],
}

export default function BackpropDemo() {
  const [net, setNet] = useState<Net>(INIT)
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(false)
  const [epoch, setEpoch] = useState(0)

  const g = useMemo(() => forward(net), [net])

  const advance = () => {
    setStep((s) => {
      if (s >= 8) {
        setNet((n) => update(n, forward(n)))
        setEpoch((e) => e + 1)
        return 1
      }
      return s + 1
    })
  }

  useEffect(() => {
    if (!auto) return
    const id = setInterval(advance, 1000)
    return () => clearInterval(id)
  }, [auto])

  const reset = () => {
    setNet(INIT)
    setStep(0)
    setEpoch(0)
    setAuto(false)
  }

  // Clases de pulso por arista según el paso
  const edgeClass = (kind: 'in-h' | 'h-out'): string => {
    if (kind === 'in-h' && step === 1) return 'bp-pulse-lime'
    if (kind === 'h-out' && step === 3) return 'bp-pulse-lime'
    if (kind === 'h-out' && (step === 5 || step === 6)) return 'bp-pulse-rose-rev'
    if (kind === 'in-h' && step === 6) return 'bp-pulse-rose-rev'
    if (step === 7) return 'bp-pulse-rose-rev'
    return ''
  }
  const edgeColor = (kind: 'in-h' | 'h-out'): string => {
    const c = edgeClass(kind)
    if (c.includes('lime')) return '#A3E635'
    if (c.includes('rose')) return '#FB7185'
    return '#2A3556'
  }
  const nodeGlow = (which: 'h0' | 'h1' | 'out' | 'loss'): string => {
    if (which.startsWith('h')) {
      if (step === 1 || step === 2) return 'drop-shadow(0 0 10px rgba(163,230,53,0.8))'
      if (step === 6) return 'drop-shadow(0 0 10px rgba(251,113,133,0.8))'
    }
    if (which === 'out') {
      if (step === 3) return 'drop-shadow(0 0 10px rgba(163,230,53,0.8))'
      if (step === 5) return 'drop-shadow(0 0 12px rgba(251,113,133,0.9))'
    }
    if (which === 'loss' && step === 4) return 'drop-shadow(0 0 12px rgba(251,113,133,0.9))'
    if (step === 8) return 'drop-shadow(0 0 10px rgba(163,230,53,0.8))'
    return 'none'
  }

  const mono = { fontFamily: 'JetBrains Mono, monospace' } as const

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={advance}
        className="flex items-center gap-1.5 rounded-md border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs font-bold text-cyan transition-colors hover:bg-cyan/20"
      >
        <StepForward className="h-3.5 w-3.5" aria-hidden />
        Paso ▸
      </button>
      <button
        onClick={() => setAuto((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors',
          auto ? 'border-lime/50 bg-lime/15 text-lime' : 'border-violet/40 bg-violet/10 text-violet hover:bg-violet/20',
        )}
      >
        {auto ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
        {auto ? 'Pausar' : 'Auto (1 paso/s)'}
      </button>
      <button
        onClick={reset}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Reiniciar
      </button>
      <span className="ml-auto font-mono text-xs text-muted">
        paso <span className="font-bold text-ink">{step}/8</span> · época <span className="font-bold text-ink">{epoch}</span> · L ={' '}
        <span className="font-bold text-rose">{g.loss.toFixed(5)}</span>
      </span>
    </div>
  )

  return (
    <DemoFrame title="backprop_paso_a_paso.py" controls={controls}>
      <style>{`
        @keyframes bp-fwd { to { stroke-dashoffset: -26; } }
        @keyframes bp-bwd { to { stroke-dashoffset: 26; } }
        .bp-pulse-lime { stroke-dasharray: 8 5; animation: bp-fwd 0.35s linear infinite; }
        .bp-pulse-rose-rev { stroke-dasharray: 8 5; animation: bp-bwd 0.35s linear infinite; }
      `}</style>
      <div className="grid gap-4 p-4 lg:grid-cols-[1.6fr_1fr]">
        <svg viewBox="0 0 640 300" className="w-full rounded-lg border border-line bg-bg-0">
          {/* Aristas entrada→oculta */}
          {[0, 1].map((i) =>
            [0, 1].map((j) => (
              <g key={`ih${i}${j}`}>
                <line
                  x1={POS.x[i]} y1={POS.xY[i]} x2={POS.h[j]} y2={POS.hY[j]}
                  stroke={edgeColor('in-h')} strokeWidth={step === 7 ? 2.6 : 1.8}
                  className={edgeClass('in-h')}
                />
                {step === 7 && (
                  <text
                    x={(POS.x[i] + POS.h[j]) / 2} y={(POS.xY[i] + POS.hY[j]) / 2 - 6}
                    textAnchor="middle" fill="#FB7185" fontSize={10} {...{ style: mono }}
                  >
                    {g.dW1[i][j].toFixed(3)}
                  </text>
                )}
              </g>
            )),
          )}
          {/* Aristas oculta→salida */}
          {[0, 1].map((j) => (
            <g key={`ho${j}`}>
              <line
                x1={POS.h[j]} y1={POS.hY[j]} x2={POS.o[0]} y2={POS.o[1]}
                stroke={edgeColor('h-out')} strokeWidth={step === 7 ? 2.6 : 1.8}
                className={edgeClass('h-out')}
              />
              {step === 7 && (
                <text
                  x={(POS.h[j] + POS.o[0]) / 2} y={(POS.hY[j] + POS.o[1]) / 2 - 6}
                  textAnchor="middle" fill="#FB7185" fontSize={10} {...{ style: mono }}
                >
                  {g.dW2[j].toFixed(3)}
                </text>
              )}
            </g>
          ))}
          {/* Arista salida→loss */}
          <line
            x1={POS.o[0]} y1={POS.o[1]} x2={POS.loss[0]} y2={POS.loss[1]}
            stroke={step >= 4 ? '#FB7185' : '#2A3556'} strokeWidth={1.8}
            className={step === 4 ? 'bp-pulse-lime' : ''}
          />

          {/* Nodos de entrada */}
          {[0, 1].map((i) => (
            <g key={`x${i}`}>
              <circle cx={POS.x[i]} cy={POS.xY[i]} r={20} fill="#0D1322" stroke="#22D3EE" strokeWidth={1.6} />
              <text x={POS.x[i]} y={POS.xY[i] + 4} textAnchor="middle" fill="#22D3EE" fontSize={12} {...{ style: mono }}>
                {X[i].toFixed(1)}
              </text>
              <text x={POS.x[i]} y={POS.xY[i] + 38} textAnchor="middle" fill="#55618A" fontSize={10} {...{ style: mono }}>
                x{i + 1}
              </text>
            </g>
          ))}
          {/* Nodos ocultos */}
          {[0, 1].map((j) => (
            <g key={`h${j}`} style={{ filter: nodeGlow(j === 0 ? 'h0' : 'h1') }}>
              <circle cx={POS.h[j]} cy={POS.hY[j]} r={24} fill="#0D1322" stroke="#8B5CF6" strokeWidth={1.8} />
              <text x={POS.h[j]} y={POS.hY[j] + 4} textAnchor="middle" fill="#EDF1FA" fontSize={11} {...{ style: mono }}>
                {step >= 2 ? g.a1[j].toFixed(3) : step >= 1 ? g.z1[j].toFixed(2) : '·'}
              </text>
              <text x={POS.h[j]} y={POS.hY[j] + 42} textAnchor="middle" fill="#55618A" fontSize={10} {...{ style: mono }}>
                {step >= 2 ? `a1${j + 1}` : step >= 1 ? `z1${j + 1}` : `h${j + 1}`}
                {step >= 6 ? `  δ=${g.dz1[j].toFixed(3)}` : ''}
              </text>
            </g>
          ))}
          {/* Nodo salida */}
          <g style={{ filter: nodeGlow('out') }}>
            <circle cx={POS.o[0]} cy={POS.o[1]} r={26} fill="#0D1322" stroke="#A3E635" strokeWidth={1.8} />
            <text x={POS.o[0]} y={POS.o[1] + 4} textAnchor="middle" fill="#A3E635" fontSize={12} {...{ style: mono }}>
              {step >= 3 ? g.yh.toFixed(3) : 'ŷ'}
            </text>
            <text x={POS.o[0]} y={POS.o[1] + 44} textAnchor="middle" fill="#55618A" fontSize={10} {...{ style: mono }}>
              {step >= 5 ? `δ2=${g.dz2.toFixed(3)}` : 'salida'}
            </text>
          </g>
          {/* Nodo pérdida */}
          <g style={{ filter: nodeGlow('loss') }} opacity={step >= 4 ? 1 : 0.35}>
            <rect x={POS.loss[0] - 34} y={POS.loss[1] - 22} width={68} height={44} rx={10} fill="#0D1322" stroke="#FB7185" strokeWidth={1.8} />
            <text x={POS.loss[0]} y={POS.loss[1] - 4} textAnchor="middle" fill="#FB7185" fontSize={10} {...{ style: mono }}>
              L
            </text>
            <text x={POS.loss[0]} y={POS.loss[1] + 12} textAnchor="middle" fill="#FB7185" fontSize={11} {...{ style: mono }}>
              {step >= 4 ? g.loss.toFixed(4) : '·'}
            </text>
          </g>
          {/* Etiquetas de fase */}
          <text x={20} y={24} fill={step <= 3 ? '#A3E635' : '#55618A'} fontSize={11} {...{ style: mono }}>
            → forward
          </text>
          <text x={530} y={24} fill={step >= 5 ? '#FB7185' : '#55618A'} fontSize={11} {...{ style: mono }}>
            backprop ←
          </text>
        </svg>

        {/* Panel de fórmula sincronizado */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-line bg-bg-0 px-4 py-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {STEPS[step].title}
            </div>
            <div className="text-sm text-ink">
              <TeX content={STEPS[step].formula} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{STEPS[step].note}</p>
          </div>
          {/* Barra de progreso de la secuencia */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Ir al paso ${i}`}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i < step ? 'bg-lime/60' : i === step ? (i <= 3 ? 'bg-lime' : 'bg-rose') : 'bg-line',
                )}
              />
            ))}
          </div>
          <div className="rounded-lg border border-line bg-bg-0 px-4 py-3 font-mono text-[11px] leading-relaxed text-muted">
            <div>ŷ = <span className="text-lime">{g.yh.toFixed(4)}</span> · y = {Y}</div>
            <div>δ⁽²⁾ = <span className="text-rose">{g.dz2.toFixed(4)}</span> · δ⁽¹⁾ = <span className="text-rose">[{g.dz1.map((v) => v.toFixed(3)).join(', ')}]</span></div>
            <div className="mt-1 text-faint">al llegar al paso 8 los pesos se actualizan y la secuencia reinicia con la nueva red</div>
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
