/**
 * Demo · Latencia — histograma de latencias de un servicio (log-normal).
 * Slider de carga (req/s): al subir, la cola se engorda y el P99 se dispara
 * mientras la media apenas se mueve. Líneas P50/P95/P99 + media y un SLA
 * de 120 ms con % de peticiones que lo violan. "La media miente, mira la cola."
 */

import { useMemo, useState } from 'react'
import { Dices } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'

const W = 860
const H = 300
const N = 500
const SLA = 120 // ms
const BINS = 40
const XMAX = 400 // ms

/** PRNG determinista (mulberry32) + gaussiana Box-Muller. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sampleLatencies(seed: number, carga: number): number[] {
  const rnd = mulberry32(seed)
  const gauss = () => {
    const u = Math.max(rnd(), 1e-9)
    const v = rnd()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  // con más carga: más contención de cola → mu sube un poco, sigma (cola) mucho
  const mu = 3.4 + carga * 0.35
  const sigma = 0.35 + carga * 0.45
  const out: number[] = []
  for (let i = 0; i < N; i++) out.push(Math.exp(mu + sigma * gauss()))
  return out.sort((a, b) => a - b)
}

const pct = (sorted: number[], p: number) => sorted[Math.min(N - 1, Math.floor((p / 100) * N))]

export default function LatencyDemo() {
  const [carga, setCarga] = useState(0.2)
  const [seed, setSeed] = useState(7)

  const samples = useMemo(() => sampleLatencies(seed, carga), [seed, carga])
  const stats = useMemo(() => {
    const p50 = pct(samples, 50)
    const p95 = pct(samples, 95)
    const p99 = pct(samples, 99)
    const mean = samples.reduce((a, b) => a + b, 0) / N
    const viol = samples.filter((v) => v > SLA).length / N
    return { p50, p95, p99, mean, viol }
  }, [samples])

  const bins = useMemo(() => {
    const b = new Array(BINS).fill(0)
    for (const v of samples) {
      const i = Math.min(BINS - 1, Math.floor((v / XMAX) * BINS))
      b[i]++
    }
    return b
  }, [samples])

  const maxBin = Math.max(...bins)
  const padL = 16
  const padR = 16
  const plotW = W - padL - padR
  const plotH = H - 54
  const xOf = (ms: number) => padL + (Math.min(ms, XMAX) / XMAX) * plotW
  const binW = plotW / BINS

  const lines = [
    { label: 'media', v: stats.mean, color: '#8E9AB8', dash: [3, 3] },
    { label: 'P50', v: stats.p50, color: '#22D3EE', dash: [] },
    { label: 'P95', v: stats.p95, color: '#FBBF24', dash: [] },
    { label: 'P99', v: stats.p99, color: '#FB7185', dash: [] },
  ]

  return (
    <DemoFrame
      title="latencia_servicio.py"
      controls={
        <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-3 font-mono text-xs text-muted">
            carga
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={carga}
              onChange={(e) => setCarga(Number(e.target.value))}
              className="h-1.5 w-40 cursor-pointer accent-cyan"
              aria-label="Carga del servicio"
            />
            <span className="w-14 text-cyan">{(carga * 100).toFixed(0)}%</span>
          </label>
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="flex items-center gap-1.5 rounded-md bg-cyan/15 px-3 py-1.5 font-mono text-xs font-bold text-cyan transition-colors hover:bg-cyan/25"
          >
            <Dices className="h-3.5 w-3.5" aria-hidden />
            Nuevo día
          </button>
          <span className="font-mono text-xs text-muted">
            media <span className="text-muted">{stats.mean.toFixed(0)} ms</span> · P50{' '}
            <span className="text-cyan">{stats.p50.toFixed(0)}</span> · P95{' '}
            <span className="text-amber">{stats.p95.toFixed(0)}</span> · P99{' '}
            <span className="text-rose">{stats.p99.toFixed(0)} ms</span>
          </span>
          <span className="ml-auto font-mono text-xs text-muted">
            violan SLA {SLA} ms:{' '}
            <span className={stats.viol > 0.01 ? 'text-rose' : 'text-lime'}>
              {(stats.viol * 100).toFixed(1)}%
            </span>
          </span>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Histograma de latencias con percentiles">
        {/* rejilla */}
        {[0, 1, 2, 3, 4].map((g) => (
          <line key={g} x1={padL} x2={W - padR} y1={14 + (g / 4) * plotH} y2={14 + (g / 4) * plotH} stroke="#1C2440" />
        ))}
        {/* barras */}
        {bins.map((b, i) => {
          const h = (b / maxBin) * plotH
          const binMs = ((i + 0.5) / BINS) * XMAX
          return (
            <rect
              key={i}
              x={padL + i * binW + 1}
              y={14 + plotH - h}
              width={binW - 2}
              height={h}
              fill={binMs > SLA ? 'rgba(251,113,133,0.45)' : 'rgba(34,211,238,0.35)'}
              stroke={binMs > SLA ? 'rgba(251,113,133,0.8)' : 'rgba(34,211,238,0.6)'}
              strokeWidth={0.5}
            />
          )
        })}
        {/* SLA */}
        <line x1={xOf(SLA)} x2={xOf(SLA)} y1={10} y2={14 + plotH} stroke="#EDF1FA" strokeWidth={1.5} strokeDasharray="6 4" />
        <text x={xOf(SLA) + 5} y={22} fill="#EDF1FA" fontSize={10} fontFamily="'JetBrains Mono', monospace">
          SLA {SLA} ms
        </text>
        {/* percentiles */}
        {lines.map((l) => (
          <g key={l.label}>
            <line
              x1={xOf(l.v)}
              x2={xOf(l.v)}
              y1={14}
              y2={14 + plotH}
              stroke={l.color}
              strokeWidth={l.label === 'P99' ? 2 : 1.2}
              strokeDasharray={l.dash.join(' ')}
            />
            <text
              x={Math.min(xOf(l.v), W - 60)}
              y={14 + plotH + 16 + (l.label === 'media' ? 14 : 0)}
              fill={l.color}
              fontSize={10}
              fontFamily="'JetBrains Mono', monospace"
              textAnchor="middle"
            >
              {l.label} {l.v.toFixed(0)}
            </text>
          </g>
        ))}
        {/* eje x */}
        {[0, 100, 200, 300, 400].map((v) => (
          <text key={v} x={xOf(v)} y={H - 2} fill="#55618A" fontSize={9} fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
            {v}
          </text>
        ))}
      </svg>
    </DemoFrame>
  )
}
