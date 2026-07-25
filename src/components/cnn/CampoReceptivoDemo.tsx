/**
 * Demo S5 · Campo receptivo + augmentation — selector de pila de capas 3×3
 * (1–5, stride 1–2), rejilla de entrada que ilumina en amber el RF de la celda
 * de salida central (anillo a anillo), lectura RF y comparación de parámetros,
 * y tira de augmentation con previews en hover.
 */

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const GRID = 15
const CELL = 26
const CENTER = Math.floor(GRID / 2)

export default function CampoReceptivoDemo() {
  const [layers, setLayers] = useState(3)
  const [stride, setStride] = useState(1)

  // RF acumulado por capa (para el stagger por anillos usamos el RF final)
  let rf = 1
  let jump = 1
  const rfPerLayer: number[] = []
  for (let l = 0; l < layers; l++) {
    rf += 2 * jump // kernel 3×3
    jump *= stride
    rfPerLayer.push(rf)
  }
  const half = Math.floor(rf / 2)

  const inRF = (r: number, c: number) => Math.max(Math.abs(r - CENTER), Math.abs(c - CENTER)) <= half
  const ringOf = (r: number, c: number) => Math.max(Math.abs(r - CENTER), Math.abs(c - CENTER))

  const paramsStacked = layers * 9 // L capas 3×3 (por canal)
  const paramsSingle = rf * rf // una sola kernel rf×rf

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-1 rounded-md border border-line bg-bg-1 px-1.5 py-1">
        <span className="px-1 font-mono text-[10px] uppercase tracking-wider text-faint">capas 3×3</span>
        <button onClick={() => setLayers((v) => Math.max(1, v - 1))} disabled={layers <= 1} className="p-0.5 text-muted hover:text-ink disabled:opacity-30" aria-label="menos capas">
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-4 text-center font-mono text-xs font-bold text-cyan">{layers}</span>
        <button onClick={() => setLayers((v) => Math.min(5, v + 1))} disabled={layers >= 5} className="p-0.5 text-muted hover:text-ink disabled:opacity-30" aria-label="más capas">
          <Plus className="h-3 w-3" />
        </button>
      </span>
      <span className="flex items-center gap-1 rounded-md border border-line bg-bg-1 px-1.5 py-1">
        <span className="px-1 font-mono text-[10px] uppercase tracking-wider text-faint">stride</span>
        {[1, 2].map((s) => (
          <button
            key={s}
            onClick={() => setStride(s)}
            className={cn('rounded px-2 py-0.5 font-mono text-xs font-bold', stride === s ? 'bg-violet/20 text-violet' : 'text-muted hover:text-ink')}
          >
            {s}
          </button>
        ))}
      </span>
      <span className="ml-auto font-mono text-sm font-bold text-amber">RF = {rf}×{rf}</span>
    </div>
  )

  const augments = [
    { id: 'flip', label: 'flip horizontal', style: 'scaleX(-1)' },
    { id: 'rot', label: 'rotación ±20°', style: 'rotate(18deg) scale(1.15)' },
    { id: 'crop', label: 'crop aleatorio', style: 'scale(1.45) translate(8%, 6%)' },
    { id: 'jitter', label: 'color jitter', style: 'hue-rotate(40deg) saturate(1.6)' },
  ]

  return (
    <DemoFrame title="campo_receptivo.py" controls={controls}>
      <div className="grid gap-6 p-4 lg:grid-cols-[auto_1fr]">
        {/* Rejilla */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
            entrada (15×15) — RF de la celda de salida central
          </div>
          <div className="inline-block rounded-lg border border-line bg-bg-0 p-1.5">
            <div className="relative" style={{ width: GRID * CELL, height: GRID * CELL }}>
              {Array.from({ length: GRID }, (_, r) =>
                Array.from({ length: GRID }, (_, c) => {
                  const inside = inRF(r, c)
                  const ring = ringOf(r, c)
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="absolute border transition-all"
                      style={{
                        left: c * CELL,
                        top: r * CELL,
                        width: CELL,
                        height: CELL,
                        borderColor: inside ? 'rgba(251,191,36,0.45)' : '#141B31',
                        background: inside ? `rgba(251,191,36,${0.28 - ring * 0.02})` : 'transparent',
                        transitionDelay: `${ring * 60}ms`,
                        transitionDuration: '300ms',
                      }}
                    />
                  )
                }),
              )}
              {/* celda centro */}
              <div
                className="absolute rounded-sm border-2 border-amber"
                style={{
                  left: (CENTER - half) * CELL - 1,
                  top: (CENTER - half) * CELL - 1,
                  width: (2 * half + 1) * CELL + 2,
                  height: (2 * half + 1) * CELL + 2,
                  boxShadow: '0 0 14px rgba(251,191,36,0.35)',
                }}
              />
            </div>
          </div>
          <div className="mt-2 font-mono text-[10px] text-faint">
            {rfPerLayer.map((v, i) => (
              <span key={i} className="mr-2 text-amber/80">
                capa {i + 1}: {v}×{v}
              </span>
            ))}
          </div>
        </div>

        {/* Lecturas + augmentation */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-line bg-bg-0 px-4 py-3 text-xs leading-relaxed text-muted">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-faint">3×3 apiladas vs una kernel grande</div>
            {layers} capas 3×3 ven <span className="font-mono text-amber">{rf}×{rf}</span> píxeles con{' '}
            <span className="font-mono text-cyan">{paramsStacked}</span> pesos por canal y {layers} no-linealidades.
            Una sola kernel {rf}×{rf} necesitaría <span className="font-mono text-rose">{paramsSingle}</span> pesos y solo 1 no-linealidad.
            {paramsStacked < paramsSingle
              ? ' Apilar gana: más expresividad con menos parámetros.'
              : ' Con stride 2 el RF crece mucho más rápido (salta de 2 en 2).'}
          </div>

          <div>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
              augmentation en vivo (hover)
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {augments.map((a) => (
                <div key={a.id} className="group overflow-hidden rounded-lg border border-line bg-bg-0">
                  <div className="h-24 overflow-hidden">
                    <img
                      src="/kernels-photo.png"
                      alt={a.label}
                      className="h-full w-full object-cover transition-transform duration-250 group-hover:[transform:var(--aug)]"
                      style={{ ['--aug' as string]: a.style, transitionProperty: 'transform, filter' }}
                    />
                  </div>
                  <div className="px-2 py-1.5 text-center font-mono text-[9px] uppercase tracking-wider text-faint group-hover:text-cyan">
                    {a.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              La augmentation multiplica los datos gratis: cada época ve variantes que enseñan invariancia sin tocar el modelo.
            </p>
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
