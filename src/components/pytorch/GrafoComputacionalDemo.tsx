/**
 * GrafoComputacionalDemo — el grafo de L = tanh(a·b + a) cobra vida.
 * Paso a paso: el forward (pulsos lime, izquierda → derecha) rellena el
 * VALOR de cada nodo; el backward (pulsos rose, derecha → izquierda)
 * rellena el GRADIENTE ∂L/∂nodo. Sliders para mover a y b y ver cómo
 * cambian los gradientes. Es exactamente lo que hace loss.backward().
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { StepForward, RotateCcw, Play, Pause } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, setupCanvas } from './utils'
import { cn } from '@/lib/utils'

const W = 640
const H = 330

type NodeId = 'a' | 'b' | 'c' | 'd' | 'L'

const NODES: Record<NodeId, { x: number; y: number; label: string; op: string }> = {
  a: { x: 70, y: 85, label: 'a', op: 'entrada' },
  b: { x: 70, y: 250, label: 'b', op: 'entrada' },
  c: { x: 235, y: 168, label: 'c = a · b', op: '*' },
  d: { x: 400, y: 110, label: 'd = c + a', op: '+' },
  L: { x: 555, y: 110, label: 'L = tanh(d)', op: 'tanh' },
}

/** Aristas dirigidas (forward). */
const EDGES: Array<[NodeId, NodeId]> = [
  ['a', 'c'],
  ['b', 'c'],
  ['c', 'd'],
  ['a', 'd'],
  ['d', 'L'],
]

/** Qué se revela en cada paso y qué aristas pulsan. */
const STEPS: Array<{
  title: string
  note: string
  pulses: Array<[NodeId, NodeId]>
  color: string
  revealValues?: NodeId[]
  revealGrads?: NodeId[]
}> = [
  { title: 'Listo', note: 'El grafo está construido: cada nodo es una operación y recuerda a sus padres. Pulsa Paso ▸ para lanzar el forward.', pulses: [], color: COLORS.lime },
  { title: 'Forward · c = a · b', note: 'Los valores viajan por las aristas: a y b se multiplican. En PyTorch, cada operación crea un nodo nuevo con su grad_fn.', pulses: [['a', 'c'], ['b', 'c']], color: COLORS.lime, revealValues: ['c'] },
  { title: 'Forward · d = c + a', note: 'La suma mezcla dos caminos: a llega por DOS aristas al grafo. Esto importará en el backward (sus gradientes se suman).', pulses: [['c', 'd'], ['a', 'd']], color: COLORS.lime, revealValues: ['d'] },
  { title: 'Forward · L = tanh(d)', note: 'La salida: un solo número. Hasta aquí es lo que hace cualquier calculadora — lo especial es lo que viene.', pulses: [['d', 'L']], color: COLORS.lime, revealValues: ['L'] },
  { title: 'Backward · ∂L/∂L = 1', note: 'Se siembra un 1 en la raíz y se aplica la regla local de tanh: (1 − L²). Empieza el viaje de vuelta.', pulses: [['L', 'd']], color: COLORS.rose, revealGrads: ['L', 'd'] },
  { title: 'Backward · el + copia el gradiente', note: 'La suma reparte el gradiente intacto a sus dos padres: c y a (¡a ya tiene una contribución!).', pulses: [['d', 'c'], ['d', 'a']], color: COLORS.rose, revealGrads: ['c'] },
  { title: 'Backward · el · multiplica cruzado', note: 'c = a·b: a recibe b·∂L/∂c y b recibe a·∂L/∂c. a ACUMULA sus dos contribuciones: ∂L/∂a = ∂L/∂d + b·∂L/∂c.', pulses: [['c', 'a'], ['c', 'b']], color: COLORS.rose, revealGrads: ['a', 'b'] },
]

const PULSE_MS = 550

export default function GrafoComputacionalDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [av, setAv] = useState(2.0)
  const [bv, setBv] = useState(-3.0)
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(false)
  const [pulseT, setPulseT] = useState(1) // 1 = pulso terminado
  const pulseStart = useRef(0)
  const rafRef = useRef(0)

  // forward
  const cv = av * bv
  const dv = cv + av
  const Lv = Math.tanh(dv)
  // backward
  const gL = 1
  const gd = (1 - Lv * Lv) * gL
  const gc = gd
  const ga = gd + bv * gc
  const gb = av * gc

  const values: Record<NodeId, number> = { a: av, b: bv, c: cv, d: dv, L: Lv }
  const grads: Record<NodeId, number> = { a: ga, b: gb, c: gc, d: gd, L: gL }

  const cur = STEPS[step]
  const shownValues = new Set<NodeId>(['a', 'b'])
  const shownGrads = new Set<NodeId>()
  for (let i = 1; i <= step; i++) {
    STEPS[i].revealValues?.forEach((n) => shownValues.add(n))
    STEPS[i].revealGrads?.forEach((n) => shownGrads.add(n))
  }

  const nextStep = useCallback(() => {
    setStep((s) => {
      if (s >= STEPS.length - 1) {
        setAuto(false)
        return s
      }
      pulseStart.current = performance.now()
      setPulseT(0)
      return s + 1
    })
  }, [])

  const reset = useCallback(() => {
    setAuto(false)
    setStep(0)
    setPulseT(1)
  }, [])

  // autoplay
  useEffect(() => {
    if (!auto) return
    const id = window.setInterval(nextStep, 1400)
    return () => window.clearInterval(id)
  }, [auto, nextStep])

  // animación del pulso
  useEffect(() => {
    if (pulseT >= 1) return
    const tick = (now: number) => {
      const t = Math.min(1, (now - pulseStart.current) / PULSE_MS)
      setPulseT(t)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // dibujo
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    // aristas
    for (const [from, to] of EDGES) {
      const p0 = NODES[from]
      const p1 = NODES[to]
      const active = cur.pulses.some(([f, t]) => f === from && t === to)
      ctx.strokeStyle = active ? cur.color : COLORS.line
      ctx.lineWidth = active ? 2.5 : 1.5
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.stroke()
      // punta de flecha
      const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x)
      const hx = p1.x - 30 * Math.cos(ang)
      const hy = p1.y - 30 * Math.sin(ang)
      ctx.fillStyle = active ? cur.color : COLORS.faint
      ctx.beginPath()
      ctx.moveTo(hx + 8 * Math.cos(ang), hy + 8 * Math.sin(ang))
      ctx.lineTo(hx + 8 * Math.cos(ang + 2.6) - 0, hy + 8 * Math.sin(ang + 2.6))
      ctx.lineTo(hx + 8 * Math.cos(ang - 2.6), hy + 8 * Math.sin(ang - 2.6))
      ctx.closePath()
      ctx.fill()
      // pulso viajero
      if (active && pulseT < 1) {
        const px = p0.x + (p1.x - p0.x) * pulseT
        const py = p0.y + (p1.y - p0.y) * pulseT
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 12)
        grad.addColorStop(0, cur.color)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = COLORS.ink
        ctx.beginPath()
        ctx.arc(px, py, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // nodos
    for (const id of Object.keys(NODES) as NodeId[]) {
      const n = NODES[id]
      const isOut = id === 'L'
      const hasVal = shownValues.has(id)
      const hasGrad = shownGrads.has(id)
      const border = isOut ? COLORS.rose : hasVal ? COLORS.cyan : COLORS.line
      ctx.fillStyle = COLORS.panel
      ctx.strokeStyle = border
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(n.x, n.y, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // etiqueta
      ctx.font = '600 12px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = COLORS.muted
      ctx.fillText(n.label, n.x, n.y - 36)
      // valor
      ctx.font = '700 13px "JetBrains Mono", monospace'
      ctx.fillStyle = hasVal ? COLORS.lime : COLORS.faint
      ctx.fillText(hasVal ? values[id].toFixed(3) : '·', n.x, n.y + 5)
      // gradiente
      if (hasGrad) {
        ctx.font = '600 11px "JetBrains Mono", monospace'
        ctx.fillStyle = COLORS.rose
        ctx.fillText(`∂L/∂${id} = ${grads[id].toFixed(4)}`, n.x, n.y + 46)
      } else if (step >= 4) {
        ctx.font = '600 11px "JetBrains Mono", monospace'
        ctx.fillStyle = COLORS.faint
        ctx.fillText('∂ …', n.x, n.y + 46)
      }
    }
  })

  const btn =
    'inline-flex items-center gap-1.5 rounded-md border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-cyan/50 hover:text-ink'

  return (
    <DemoFrame
      title="grafo_computacional.py — L = tanh(a·b + a)"
      controls={
        <>
          <button onClick={nextStep} disabled={step >= STEPS.length - 1} className={cn(btn, 'disabled:opacity-40')}>
            <StepForward className="h-3.5 w-3.5" /> Paso ▸
          </button>
          <button onClick={() => setAuto((v) => !v)} className={btn}>
            {auto ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {auto ? 'Pausa' : 'Auto'}
          </button>
          <button onClick={reset} className={btn}>
            <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
          </button>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="text-cyan">a = {av.toFixed(1)}</span>
            <input
              type="range" min={-3} max={3} step={0.1} value={av}
              onChange={(e) => { setAv(+e.target.value); reset() }}
              className="w-20 accent-cyan"
            />
          </label>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="text-cyan">b = {bv.toFixed(1)}</span>
            <input
              type="range" min={-3} max={3} step={0.1} value={bv}
              onChange={(e) => { setBv(+e.target.value); reset() }}
              className="w-20 accent-cyan"
            />
          </label>
        </>
      }
    >
      <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: `${W}/${H}` }} />
      <div className="flex items-start gap-3 border-t border-line bg-panel px-4 py-3">
        <span
          className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: cur.color, boxShadow: `0 0 8px ${cur.color}` }}
        />
        <div>
          <div className="font-mono text-xs text-ink">{cur.title}</div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{cur.note}</p>
        </div>
      </div>
    </DemoFrame>
  )
}
