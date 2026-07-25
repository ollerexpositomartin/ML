/**
 * Demo S5 · El patio de juegos (flagship) — entrenamiento en vivo con TensorFlow.js.
 * Datasets (círculos, XOR, espiral, dos lunas), arquitectura configurable,
 * activación, η, L2 y ruido. La frontera de decisión evoluciona por época,
 * la curva de pérdida hace streaming y el contador de épocas gira.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import * as tf from '@tensorflow/tfjs'
import { Play, Pause, RotateCcw, Minus, Plus } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

type DatasetId = 'circulos' | 'xor' | 'espiral' | 'lunas'
type Act = 'relu' | 'tanh' | 'sigmoid'

const DATASETS: { id: DatasetId; label: string }[] = [
  { id: 'circulos', label: 'Círculos' },
  { id: 'xor', label: 'XOR' },
  { id: 'espiral', label: 'Espiral' },
  { id: 'lunas', label: 'Dos lunas' },
]

function makeData(ds: DatasetId, n: number, noise: number): { X: number[][]; y: number[] } {
  const X: number[][] = []
  const y: number[] = []
  const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * noise * 2
  for (let i = 0; i < n; i++) {
    let px = 0
    let py = 0
    let c = 0
    if (ds === 'circulos') {
      const r = Math.sqrt(Math.random()) * 5
      const t = Math.random() * 2 * Math.PI
      px = r * Math.cos(t)
      py = r * Math.sin(t)
      c = r < 2.5 ? 1 : 0
    } else if (ds === 'xor') {
      px = Math.random() * 10 - 5
      py = Math.random() * 10 - 5
      c = px * py > 0 ? 1 : 0
    } else if (ds === 'espiral') {
      const cls = i % 2
      const t = (i / n) * 2.4 * Math.PI + Math.random() * 0.25
      const r = 0.6 + (t / (2.4 * Math.PI)) * 4
      px = r * Math.cos(t + cls * Math.PI)
      py = r * Math.sin(t + cls * Math.PI)
      c = cls
    } else {
      const cls = i % 2
      const t = Math.random() * Math.PI
      px = Math.cos(t) * 3.4 + (cls === 1 ? 1.7 : -1.7)
      py = Math.sin(t) * 3.4 * (cls === 1 ? -1 : 1) + (cls === 1 ? 1.1 : -1.1)
      c = cls
    }
    X.push([px + g(), py + g()])
    y.push(c)
  }
  return { X, y }
}

const W = 560
const H = 400
const GRID = 40
const RANGE = 6

function toCanvas(px: number, py: number): [number, number] {
  return [((px + RANGE) / (2 * RANGE)) * W, H - ((py + RANGE) / (2 * RANGE)) * H]
}

// mezcla rose (clase 1) ↔ cyan (clase 0)
function colorFor(p: number): [number, number, number] {
  const r = Math.round(34 + p * (251 - 34))
  const gch = Math.round(211 + p * (113 - 211))
  const b = Math.round(238 + p * (133 - 238))
  return [r, gch, b]
}

export default function PlaygroundDemo() {
  const [dataset, setDataset] = useState<DatasetId>('circulos')
  const [layers, setLayers] = useState(2)
  const [neurons, setNeurons] = useState(4)
  const [act, setAct] = useState<Act>('tanh')
  const [lr, setLr] = useState(0.05)
  const [l2, setL2] = useState(0)
  const [noise, setNoise] = useState(0.15)
  const [training, setTraining] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [loss, setLoss] = useState<number | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lossCanvasRef = useRef<HTMLCanvasElement>(null)
  const modelRef = useRef<tf.LayersModel | null>(null)
  const dataRef = useRef<{ xs: tf.Tensor2D; ys: tf.Tensor2D; X: number[][]; y: number[] } | null>(null)
  const rafRef = useRef(0)
  const cfgRef = useRef({ lr, l2, act })
  const lossHistRef = useRef<number[]>([])
  const trainingRef = useRef(false)
  const epochRef = useRef(0)

  cfgRef.current = { lr, l2, act }
  trainingRef.current = training

  const disposeAll = () => {
    modelRef.current?.dispose()
    modelRef.current = null
    if (dataRef.current) {
      dataRef.current.xs.dispose()
      dataRef.current.ys.dispose()
      dataRef.current = null
    }
  }

  const rebuild = useCallback(() => {
    disposeAll()
    const { X, y } = makeData(dataset, 160, noise)
    const xs = tf.tensor2d(X)
    const ys = tf.tensor2d(y.map((v) => [v]))
    dataRef.current = { xs, ys, X, y }
    const model = tf.sequential()
    model.add(tf.layers.dense({ inputShape: [2], units: neurons, activation: cfgRef.current.act }))
    for (let l = 1; l < layers; l++) model.add(tf.layers.dense({ units: neurons, activation: cfgRef.current.act }))
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
    modelRef.current = model
    lossHistRef.current = []
    epochRef.current = 0
    setEpoch(0)
    setLoss(null)
  }, [dataset, layers, neurons, noise])

  // rebuild al cambiar arquitectura/dataset/ruido
  useEffect(() => {
    rebuild()
    return () => cancelAnimationFrame(rafRef.current)
  }, [rebuild])
  // dispose al desmontar
  useEffect(() => () => disposeAll(), [])

  // Dibuja frontera + puntos
  const draw = useCallback(async () => {
    const model = modelRef.current
    const data = dataRef.current
    const canvas = canvasRef.current
    if (!model || !data || !canvas) return
    const ctx = canvas.getContext('2d')!
    // grid de predicción
    const pts: number[][] = []
    for (let gy = 0; gy < GRID; gy++)
      for (let gx = 0; gx < GRID; gx++)
        pts.push([(gx / (GRID - 1)) * 2 * RANGE - RANGE, (gy / (GRID - 1)) * 2 * RANGE - RANGE])
    const probs = tf.tidy(() => (model.predict(tf.tensor2d(pts)) as tf.Tensor).dataSync())
    const img = ctx.createImageData(W, H)
    const cw = W / GRID
    const ch = H / GRID
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        // gy=0 es py=-RANGE (abajo) → fila inferior del canvas
        const p = probs[(GRID - 1 - gy) * GRID + gx]
        const [r, g, b] = colorFor(p)
        const alpha = 34 + Math.abs(p - 0.5) * 90
        for (let yy = Math.floor(gy * ch); yy < Math.floor((gy + 1) * ch); yy++) {
          for (let xx = Math.floor(gx * cw); xx < Math.floor((gx + 1) * cw); xx++) {
            const idx = (yy * W + xx) * 4
            img.data[idx] = r
            img.data[idx + 1] = g
            img.data[idx + 2] = b
            img.data[idx + 3] = alpha
          }
        }
      }
    }
    ctx.fillStyle = '#04060D'
    ctx.fillRect(0, 0, W, H)
    ctx.putImageData(img, 0, 0)
    // puntos
    for (let i = 0; i < data.X.length; i++) {
      const [cx, cy] = toCanvas(data.X[i][0], data.X[i][1])
      ctx.beginPath()
      ctx.arc(cx, cy, 3.4, 0, 2 * Math.PI)
      ctx.fillStyle = data.y[i] === 1 ? '#FB7185' : '#22D3EE'
      ctx.fill()
      ctx.strokeStyle = 'rgba(4,6,13,0.9)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }, [])

  const drawLoss = useCallback(() => {
    const canvas = lossCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    ctx.fillStyle = '#04060D'
    ctx.fillRect(0, 0, w, h)
    const hist = lossHistRef.current
    if (hist.length < 2) return
    const max = Math.max(...hist, 0.1)
    ctx.beginPath()
    hist.forEach((v, i) => {
      const x = (i / Math.max(1, hist.length - 1)) * (w - 8) + 4
      const y = h - 6 - (v / max) * (h - 14)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    const grad = ctx.createLinearGradient(0, 0, w, 0)
    grad.addColorStop(0, '#FB7185')
    grad.addColorStop(1, '#FBBF24')
    ctx.strokeStyle = grad
    ctx.lineWidth = 1.8
    ctx.stroke()
  }, [])

  // Bucle de entrenamiento
  useEffect(() => {
    if (!training) return
    let alive = true
    const step = () => {
      if (!alive) return
      const model = modelRef.current
      const data = dataRef.current
      if (model && data) {
        const opt = tf.train.adam(cfgRef.current.lr)
        const lambda = cfgRef.current.l2
        for (let s = 0; s < 4; s++) {
          const cost = opt.minimize(() => {
            const pred = model.apply(data.xs) as tf.Tensor
            const eps = 1e-7
            const bce = tf.neg(
              tf.mean(
                tf.add(
                  tf.mul(data.ys, tf.log(tf.add(pred, eps))),
                  tf.mul(tf.sub(1, data.ys), tf.log(tf.sub(1 + eps, pred))),
                ),
              ),
            )
            if (lambda > 0) {
              let reg = tf.scalar(0)
              for (const wv of model.trainableWeights) {
                const v = wv.read()
                if (v.shape.length === 2) reg = tf.add(reg, tf.sum(tf.square(v)))
              }
              return tf.add(bce, tf.mul(lambda, reg)) as tf.Scalar
            }
            return bce as tf.Scalar
          }, true)
          const v = cost?.dataSync()[0]
          cost?.dispose()
          if (v !== undefined && Number.isFinite(v)) lossHistRef.current.push(v)
        }
        opt.dispose()
        epochRef.current += 4
        if (epochRef.current % 8 === 0) void draw()
        if (epochRef.current % 4 === 0) {
          setEpoch(epochRef.current)
          setLoss(lossHistRef.current[lossHistRef.current.length - 1] ?? null)
          drawLoss()
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      alive = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [training, draw, drawLoss])

  // dibujo inicial
  useEffect(() => {
    if (!training) void draw()
  }, [training, draw, epoch === 0])

  const stepper = (label: string, val: number, set: (v: number) => void, min: number, max: number) => (
    <span className="flex items-center gap-1 rounded-md border border-line bg-bg-1 px-1.5 py-1">
      <span className="px-1 font-mono text-[10px] uppercase tracking-wider text-faint">{label}</span>
      <button onClick={() => set(Math.max(min, val - 1))} disabled={val <= min} className="p-0.5 text-muted hover:text-ink disabled:opacity-30" aria-label={`menos ${label}`}>
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-4 text-center font-mono text-xs font-bold text-cyan">{val}</span>
      <button onClick={() => set(Math.min(max, val + 1))} disabled={val >= max} className="p-0.5 text-muted hover:text-ink disabled:opacity-30" aria-label={`más ${label}`}>
        <Plus className="h-3 w-3" />
      </button>
    </span>
  )

  const controls = (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        onClick={() => setTraining((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3.5 py-1.5 font-mono text-xs font-bold transition-all',
          training ? 'animate-pulse bg-lime/25 text-lime' : 'bg-lime/15 text-lime hover:bg-lime/25',
        )}
      >
        {training ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
        {training ? 'Pausar' : '▶ Entrenar'}
      </button>
      <button
        onClick={() => {
          setTraining(false)
          rebuild()
        }}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 font-mono text-xs text-muted hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Reiniciar
      </button>
      <select value={dataset} onChange={(e) => { setTraining(false); setDataset(e.target.value as DatasetId) }} className="rounded-md border border-cyan/40 bg-bg-1 px-2 py-1.5 font-mono text-xs text-cyan">
        {DATASETS.map((d) => (
          <option key={d.id} value={d.id}>{d.label}</option>
        ))}
      </select>
      {stepper('capas', layers, setLayers, 1, 3)}
      {stepper('neuronas', neurons, setNeurons, 2, 8)}
      <select value={act} onChange={(e) => setAct(e.target.value as Act)} className="rounded-md border border-violet/40 bg-bg-1 px-2 py-1.5 font-mono text-xs text-violet">
        <option value="tanh">tanh</option>
        <option value="relu">ReLU</option>
        <option value="sigmoid">sigmoid</option>
      </select>
      <label className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
        η
        <input type="range" min={0.005} max={0.3} step={0.005} value={lr} onChange={(e) => setLr(Number(e.target.value))} className="w-20 accent-cyan" />
        <span className="w-10 text-cyan">{lr.toFixed(3)}</span>
      </label>
      <label className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
        L2
        <input type="range" min={0} max={0.01} step={0.001} value={l2} onChange={(e) => setL2(Number(e.target.value))} className="w-16 accent-cyan" />
        <span className="w-10 text-cyan">{l2.toFixed(3)}</span>
      </label>
      <label className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
        ruido
        <input type="range" min={0} max={0.5} step={0.05} value={noise} onChange={(e) => { setTraining(false); setNoise(Number(e.target.value)) }} className="w-16 accent-cyan" />
        <span className="w-8 text-cyan">{noise.toFixed(2)}</span>
      </label>
    </div>
  )

  return (
    <DemoFrame title="playground_tfjs.py" controls={controls}>
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_220px]">
        <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto' }} className="rounded-lg border border-line" />
        <div className="flex flex-row gap-3 lg:flex-col">
          <div className="rounded-lg border border-line bg-bg-0 p-3 text-center">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">época</div>
            <div className="font-mono text-2xl font-bold text-ink">{epoch}</div>
          </div>
          <div className="rounded-lg border border-line bg-bg-0 p-3 text-center">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">pérdida</div>
            <div className="font-mono text-2xl font-bold text-rose">{loss !== null ? loss.toFixed(4) : '—'}</div>
          </div>
          <div className="flex-1 rounded-lg border border-line bg-bg-0 p-2">
            <div className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-faint">loss(t)</div>
            <canvas ref={lossCanvasRef} width={200} height={70} style={{ width: '100%', height: '70px' }} />
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
