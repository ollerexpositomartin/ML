/**
 * DemoZoo — el zoo clásico en 4 pestañas: KNN, SVM, Árboles y Ensembles.
 * Cada pestaña es una demo canvas interactiva sobre datos 2D.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import DemoFrame from '@/components/DemoFrame'
import { COLORS, gaussian, mulberry32, pointerPos, setupCanvas } from './utils'

const W = 620
const H = 400
const R = 7

type Pt = [number, number]

const toCanvas = (x: number, y: number) => ({ x: (x / R) * W, y: H - (y / R) * H })

function makeBlobs(seed: number, sep = 2.6, n = 30): { X: Pt[]; Y: number[] } {
  const rng = mulberry32(seed)
  const X: Pt[] = []
  const Y: number[] = []
  for (let i = 0; i < n; i++) { X.push([gaussian(rng, 2.2, 0.85), gaussian(rng, 2.4, 0.85)]); Y.push(0) }
  for (let i = 0; i < n; i++) { X.push([gaussian(rng, 2.2 + sep, 0.85), gaussian(rng, 2.4 + sep * 0.9, 0.85)]); Y.push(1) }
  return { X, Y }
}

function makeMoons(seed: number): { X: Pt[]; Y: number[] } {
  const rng = mulberry32(seed)
  const X: Pt[] = []
  const Y: number[] = []
  for (let i = 0; i < 45; i++) {
    const t = rng() * Math.PI
    X.push([3.5 + 2.3 * Math.cos(t) + gaussian(rng, 0, 0.18), 2.4 + 1.7 * Math.sin(t) + gaussian(rng, 0, 0.18)])
    Y.push(0)
  }
  for (let i = 0; i < 45; i++) {
    const t = rng() * Math.PI
    X.push([3.5 + 2.3 * Math.cos(t) + 0.9 + gaussian(rng, 0, 0.18), 4.6 - 1.7 * Math.sin(t) + gaussian(rng, 0, 0.18)])
    Y.push(1)
  }
  return { X, Y }
}

function makeXOR(seed: number): { X: Pt[]; Y: number[] } {
  const rng = mulberry32(seed)
  const X: Pt[] = []
  const Y: number[] = []
  for (let i = 0; i < 120; i++) {
    const x = 0.4 + rng() * 6.2
    const y = 0.4 + rng() * 6.2
    X.push([x, y])
    Y.push((x - 3.5) * (y - 3.5) > 0 ? 1 : 0)
  }
  return { X, Y }
}

/* ---------------- KNN ---------------- */

function knnLabel(X: Pt[], Y: number[], p: Pt, k: number): number {
  const dist = X.map((x, i) => ({ d: (x[0] - p[0]) ** 2 + (x[1] - p[1]) ** 2, y: Y[i] }))
  dist.sort((a, b) => a.d - b.d)
  let s0 = 0
  let s1 = 0
  for (let i = 0; i < Math.min(k, dist.length); i++) {
    if (dist[i].y === 1) s1++
    else s0++
  }
  return s1 >= s0 ? 1 : 0
}

function TabKNN() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const base = useMemo(() => makeBlobs(41), [])
  const [extra, setExtra] = useState<{ X: Pt[]; Y: number[] }>({ X: [], Y: [] })
  const [k, setK] = useState(5)
  const [cls, setCls] = useState(0)
  const X = useMemo(() => [...base.X, ...extra.X], [base, extra])
  const Y = useMemo(() => [...base.Y, ...extra.Y], [base, extra])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)
    const GX = 26
    const GY = 17
    for (let i = 0; i < GX; i++) {
      for (let j = 0; j < GY; j++) {
        const p: Pt = [((i + 0.5) / GX) * R, ((j + 0.5) / GY) * R]
        const label = knnLabel(X, Y, p, k)
        ctx.fillStyle = label === 1 ? 'rgba(34,211,238,0.22)' : 'rgba(139,92,246,0.22)'
        ctx.fillRect((i * W) / GX, H - ((j + 1) * H) / GY, W / GX + 1, H / GY + 1)
      }
    }
    for (let i = 0; i < X.length; i++) {
      const pc = toCanvas(X[i][0], X[i][1])
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = Y[i] === 1 ? COLORS.cyan : COLORS.violet
      ctx.fill()
    }
  }, [X, Y, k])

  const addPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e, W, H)
    setExtra((prev) => ({
      X: [...prev.X, [(p.x / W) * R, (1 - p.y / H) * R]],
      Y: [...prev.Y, cls],
    }))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-panel px-4 py-2.5">
        <div className="flex gap-1.5">
          {([0, 1] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCls(c)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                cls === c
                  ? c === 0 ? 'border-violet/60 bg-violet/15 text-violet' : 'border-cyan/60 bg-cyan/15 text-cyan'
                  : 'border-line text-muted hover:text-ink'
              }`}
            >
              clase {c === 0 ? 'violet' : 'cyan'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 font-mono text-xs text-muted">
          k
          <input type="range" min={1} max={15} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-24 accent-cyan" />
          <span className="w-6 text-cyan">{k}</span>
        </label>
        <button onClick={() => setExtra({ X: [], Y: [] })} className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted hover:text-ink">
          Limpiar
        </button>
        <span className="ml-auto font-mono text-[11px] text-faint">
          {k === 1 ? 'k=1: frontera irregular → sobreajuste' : `k=${k}: voto de los ${k} vecinos`}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={addPoint}
      />
    </div>
  )
}

/* ---------------- SVM ---------------- */

function trainSVM(X: Pt[], Ypm: number[], C: number, kernel: boolean): number[] {
  // w en R^d (+ bias). y ∈ {-1,+1}. Subgradiente: ½‖w‖² + C·Σ hinge
  const phi = (p: Pt) => (kernel ? [p[0], p[1], p[0] * p[1] * 0.25] : [p[0], p[1]])
  const d = kernel ? 3 : 2
  const w = Array(d).fill(0)
  let b = 0
  const rng = mulberry32(5)
  const order = Array.from({ length: X.length }, (_, i) => i)
  for (let epoch = 0; epoch < 12; epoch++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    const lr = 0.02 / (1 + epoch * 0.3)
    for (const i of order) {
      const f = phi(X[i])
      const s = Ypm[i] * (f.reduce((a, v, k2) => a + v * w[k2], 0) + b)
      const scale = kernel ? 0.05 : 1
      if (s < 1) {
        for (let k2 = 0; k2 < d; k2++) w[k2] -= lr * (w[k2] * scale - C * Ypm[i] * f[k2] * scale)
        b -= lr * (-C * Ypm[i] * 0.1 * scale)
      } else {
        for (let k2 = 0; k2 < d; k2++) w[k2] -= lr * w[k2] * scale
      }
    }
  }
  return [...w, b]
}

function TabSVM() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cLog, setCLog] = useState(0) // C = 10^v
  const [kernel, setKernel] = useState(false)
  const C = Math.pow(10, cLog)

  const data = useMemo(() => (kernel ? makeXOR(44) : makeBlobs(43, 3.0, 26)), [kernel])
  const model = useMemo(() => {
    const Ypm = data.Y.map((y) => (y === 1 ? 1 : -1))
    return trainSVM(data.X, Ypm, C, kernel)
  }, [data, C, kernel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)

    const score = (p: Pt) =>
      kernel
        ? model[0] * p[0] + model[1] * p[1] + model[2] * p[0] * p[1] * 0.25 + model[3]
        : model[0] * p[0] + model[1] * p[1] + model[2]

    if (kernel) {
      // sombreado por signo (frontera no lineal)
      const GX = 30
      const GY = 20
      for (let i = 0; i < GX; i++) {
        for (let j = 0; j < GY; j++) {
          const p: Pt = [((i + 0.5) / GX) * R, ((j + 0.5) / GY) * R]
          ctx.fillStyle = score(p) >= 0 ? 'rgba(34,211,238,0.18)' : 'rgba(139,92,246,0.18)'
          ctx.fillRect((i * W) / GX, H - ((j + 1) * H) / GY, W / GX + 1, H / GY + 1)
        }
      }
    } else {
      // frontera + banda de margen (w·x+b = 0, ±1)
      const [w0, w1, b] = model
      if (Math.abs(w1) > 1e-9) {
        const yAt = (x: number, t: number) => (t - b - w0 * x) / w1
        ctx.fillStyle = 'rgba(163, 230, 53, 0.08)'
        ctx.beginPath()
        ctx.moveTo(0, toCanvas(0, yAt(0, 1)).y)
        ctx.lineTo(W, toCanvas(R, yAt(R, 1)).y)
        ctx.lineTo(W, toCanvas(R, yAt(R, -1)).y)
        ctx.lineTo(0, toCanvas(0, yAt(0, -1)).y)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = COLORS.ink
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(0, toCanvas(0, yAt(0, 0)).y); ctx.lineTo(W, toCanvas(R, yAt(R, 0)).y); ctx.stroke()
        ctx.setLineDash([6, 5])
        ctx.strokeStyle = COLORS.lime
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(0, toCanvas(0, yAt(0, 1)).y); ctx.lineTo(W, toCanvas(R, yAt(R, 1)).y); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, toCanvas(0, yAt(0, -1)).y); ctx.lineTo(W, toCanvas(R, yAt(R, -1)).y); ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // puntos (vectores soporte con anillo lima)
    for (let i = 0; i < data.X.length; i++) {
      const pc = toCanvas(data.X[i][0], data.X[i][1])
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = data.Y[i] === 1 ? COLORS.cyan : COLORS.violet
      ctx.fill()
      if (!kernel && Math.abs(score(data.X[i])) <= 1.08) {
        ctx.strokeStyle = COLORS.lime
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(pc.x, pc.y, 9, 0, Math.PI * 2); ctx.stroke()
      }
    }
  }, [model, data, kernel])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-panel px-4 py-2.5">
        <label className="flex items-center gap-2 font-mono text-xs text-muted">
          C
          <input type="range" min={-2} max={2} step={0.05} value={cLog} onChange={(e) => setCLog(Number(e.target.value))} className="w-28 accent-cyan" />
          <span className="w-10 text-cyan">{C.toFixed(2)}</span>
        </label>
        <button
          onClick={() => setKernel((v) => !v)}
          className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
            kernel ? 'border-violet/60 bg-violet/15 text-violet' : 'border-line text-muted hover:text-ink'
          }`}
        >
          {kernel ? 'kernel x₁·x₂: ON (XOR)' : 'probar kernel (XOR)'}
        </button>
        <span className="ml-auto font-mono text-[11px] text-faint">
          {kernel ? 'un plano en (x₁, x₂, x₁·x₂) separa el XOR' : 'C pequeña → margen ancho, más violaciones'}
        </span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}

/* ---------------- Árboles ---------------- */

interface TreeNode {
  feature?: number
  threshold?: number
  left?: TreeNode
  right?: TreeNode
  label?: number
  counts: [number, number]
}

const entropy = (c0: number, c1: number) => {
  const n = c0 + c1
  if (n === 0 || c0 === 0 || c1 === 0) return 0
  const p0 = c0 / n
  const p1 = c1 / n
  return -(p0 * Math.log2(p0) + p1 * Math.log2(p1))
}

function buildTree(X: Pt[], Y: number[], depth: number, maxDepth: number): TreeNode {
  const c0 = Y.filter((y) => y === 0).length
  const c1 = Y.length - c0
  const node: TreeNode = { counts: [c0, c1] }
  if (c0 === 0 || c1 === 0 || depth >= maxDepth || X.length < 5) {
    node.label = c1 >= c0 ? 1 : 0
    return node
  }
  const H0 = entropy(c0, c1)
  let best = { ig: 0.01, feature: 0, threshold: 0 }
  for (let f = 0; f < 2; f++) {
    const vals = X.map((x) => x[f]).sort((a, b) => a - b)
    for (let q = 1; q < 10; q++) {
      const t = vals[Math.floor((q / 10) * (vals.length - 1))]
      let l0 = 0
      let l1 = 0
      for (let i = 0; i < X.length; i++) {
        if (X[i][f] <= t) { if (Y[i] === 0) l0++; else l1++ }
      }
      const r0 = c0 - l0
      const r1 = c1 - l1
      const ig = H0 - ((l0 + l1) / X.length) * entropy(l0, l1) - ((r0 + r1) / X.length) * entropy(r0, r1)
      if (ig > best.ig) best = { ig, feature: f, threshold: t }
    }
  }
  if (best.ig <= 0.011) {
    node.label = c1 >= c0 ? 1 : 0
    return node
  }
  const LX: Pt[] = []
  const LY: number[] = []
  const RX: Pt[] = []
  const RY: number[] = []
  for (let i = 0; i < X.length; i++) {
    if (X[i][best.feature] <= best.threshold) { LX.push(X[i]); LY.push(Y[i]) }
    else { RX.push(X[i]); RY.push(Y[i]) }
  }
  node.feature = best.feature
  node.threshold = best.threshold
  node.left = buildTree(LX, LY, depth + 1, maxDepth)
  node.right = buildTree(RX, RY, depth + 1, maxDepth)
  return node
}

function treePredict(node: TreeNode, p: Pt): number {
  if (node.label !== undefined) return node.label
  return p[node.feature!] <= node.threshold! ? treePredict(node.left!, p) : treePredict(node.right!, p)
}

function TabArboles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const treeRef = useRef<HTMLCanvasElement>(null)
  const [depth, setDepth] = useState(3)
  const data = useMemo(() => makeMoons(45), [])
  const tree = useMemo(() => buildTree(data.X, data.Y, 0, depth), [data, depth])

  const acc = useMemo(
    () => data.X.filter((x, i) => treePredict(tree, x) === data.Y[i]).length / data.X.length,
    [data, tree],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)
    const GX = 26
    const GY = 17
    for (let i = 0; i < GX; i++) {
      for (let j = 0; j < GY; j++) {
        const p: Pt = [((i + 0.5) / GX) * R, ((j + 0.5) / GY) * R]
        ctx.fillStyle = treePredict(tree, p) === 1 ? 'rgba(34,211,238,0.22)' : 'rgba(139,92,246,0.22)'
        ctx.fillRect((i * W) / GX, H - ((j + 1) * H) / GY, W / GX + 1, H / GY + 1)
      }
    }
    for (let i = 0; i < data.X.length; i++) {
      const pc = toCanvas(data.X[i][0], data.X[i][1])
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = data.Y[i] === 1 ? COLORS.cyan : COLORS.violet
      ctx.fill()
    }
  }, [data, tree])

  // diagrama del árbol
  useEffect(() => {
    const canvas = treeRef.current
    if (!canvas) return
    const TW = 230
    const TH = 300
    const ctx = setupCanvas(canvas, TW, TH)
    ctx.clearRect(0, 0, TW, TH)
    const leaves = (n: TreeNode): number => (n.label !== undefined ? 1 : leaves(n.left!) + leaves(n.right!))
    const totalLeaves = leaves(tree)
    const drawNode = (n: TreeNode, xLo: number, xHi: number, y: number) => {
      const cx = (xLo + xHi) / 2
      if (n.label !== undefined) {
        ctx.beginPath(); ctx.arc(cx, y, 9, 0, Math.PI * 2)
        ctx.fillStyle = n.label === 1 ? COLORS.cyan : COLORS.violet
        ctx.fill()
        ctx.font = 'bold 8px "JetBrains Mono", monospace'
        ctx.fillStyle = '#04060D'
        ctx.fillText(String(n.counts[0] + n.counts[1]), cx - 3, y + 3)
        return
      }
      ctx.fillStyle = '#111830'
      ctx.strokeStyle = COLORS.faint
      ctx.lineWidth = 1
      const bw = 74
      ctx.fillRect(cx - bw / 2, y - 9, bw, 18)
      ctx.strokeRect(cx - bw / 2, y - 9, bw, 18)
      ctx.font = '8.5px "JetBrains Mono", monospace'
      ctx.fillStyle = COLORS.ink
      ctx.fillText(`x${n.feature! + 1} ≤ ${n.threshold!.toFixed(1)}`, cx - bw / 2 + 5, y + 3)
      const lh = (leaves(n.left!) / totalLeaves) * (xHi - xLo)
      const rh = (leaves(n.right!) / totalLeaves) * (xHi - xLo)
      const ly = y + 44
      ctx.strokeStyle = COLORS.faint
      ctx.beginPath(); ctx.moveTo(cx, y + 9); ctx.lineTo(xLo + lh / 2, ly - 9); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, y + 9); ctx.lineTo(xHi - rh / 2, ly - 9); ctx.stroke()
      drawNode(n.left!, xLo, xLo + lh, ly)
      drawNode(n.right!, xHi - rh, xHi, ly)
    }
    drawNode(tree, 6, TW - 6, 18)
  }, [tree])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-panel px-4 py-2.5">
        <label className="flex items-center gap-2 font-mono text-xs text-muted">
          profundidad
          <input type="range" min={1} max={8} step={1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-24 accent-cyan" />
          <span className="w-5 text-cyan">{depth}</span>
        </label>
        <span className="font-mono text-[11px] text-faint">
          accuracy train: <b className={acc > 0.99 ? 'text-rose' : 'text-lime'}>{(acc * 100).toFixed(0)} %</b>
          {acc > 0.99 && depth > 5 ? ' · 100 % en train = sobreajuste' : ''}
        </span>
        <span className="ml-auto font-mono text-[11px] text-faint">cortes axis-aligned por ganancia de información</span>
      </div>
      <div className="grid md:grid-cols-[1fr_235px]">
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        <div className="border-t border-line p-2 md:border-l md:border-t-0">
          <div className="px-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-faint">el árbol aprendido</div>
          <canvas ref={treeRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      </div>
    </div>
  )
}

/* ---------------- Ensembles (bagging de stumps) ---------------- */

interface Stump { feature: number; threshold: number; leftLabel: number; rightLabel: number }

function trainStump(X: Pt[], Y: number[], rng: () => number): Stump {
  // bootstrap
  const idx = Array.from({ length: X.length }, () => Math.floor(rng() * X.length))
  const gini = (c0: number, c1: number) => {
    const n = c0 + c1
    if (n === 0) return 0
    return 1 - (c0 / n) ** 2 - (c1 / n) ** 2
  }
  let best: Stump & { score: number } = { feature: 0, threshold: 3.5, leftLabel: 0, rightLabel: 1, score: Infinity }
  for (let f = 0; f < 2; f++) {
    for (let q = 1; q < 12; q++) {
      const t = 0.5 + (q / 12) * 6
      let l0 = 0
      let l1 = 0
      let r0 = 0
      let r1 = 0
      for (const i of idx) {
        if (X[i][f] <= t) { if (Y[i] === 0) l0++; else l1++ }
        else { if (Y[i] === 0) r0++; else r1++ }
      }
      const score = (l0 + l1) * gini(l0, l1) + (r0 + r1) * gini(r0, r1)
      if (score < best.score) {
        best = {
          feature: f, threshold: t,
          leftLabel: l1 >= l0 ? 1 : 0,
          rightLabel: r1 >= r0 ? 1 : 0,
          score,
        }
      }
    }
  }
  return best
}

const stumpPredict = (s: Stump, p: Pt) => (p[s.feature] <= s.threshold ? s.leftLabel : s.rightLabel)

function TabEnsembles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nStumps, setNStumps] = useState(1)
  const data = useMemo(() => makeMoons(46), [])

  const stumps = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => trainStump(data.X, data.Y, mulberry32(100 + i * 7))),
    [data],
  )

  const vote = (p: Pt, n: number) => {
    let s = 0
    for (let i = 0; i < n; i++) s += stumpPredict(stumps[i], p) === 1 ? 1 : -1
    return s >= 0 ? 1 : 0
  }

  const acc = useMemo(
    () => data.X.filter((x, i) => vote(x, nStumps) === data.Y[i]).length / data.X.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, nStumps, stumps],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)
    const GX = 26
    const GY = 17
    for (let i = 0; i < GX; i++) {
      for (let j = 0; j < GY; j++) {
        const p: Pt = [((i + 0.5) / GX) * R, ((j + 0.5) / GY) * R]
        // voto medio para sombreado suave
        let s = 0
        for (let k2 = 0; k2 < nStumps; k2++) s += stumpPredict(stumps[k2], p)
        const frac = s / nStumps
        ctx.fillStyle = `rgba(34, 211, 238, ${(frac * 0.26).toFixed(3)})`
        ctx.fillRect((i * W) / GX, H - ((j + 1) * H) / GY, W / GX + 1, H / GY + 1)
        ctx.fillStyle = `rgba(139, 92, 246, ${((1 - frac) * 0.26).toFixed(3)})`
        ctx.fillRect((i * W) / GX, H - ((j + 1) * H) / GY, W / GX + 1, H / GY + 1)
      }
    }
    for (let i = 0; i < data.X.length; i++) {
      const pc = toCanvas(data.X[i][0], data.X[i][1])
      ctx.beginPath(); ctx.arc(pc.x, pc.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = data.Y[i] === 1 ? COLORS.cyan : COLORS.violet
      ctx.fill()
    }
  }, [data, stumps, nStumps])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-panel px-4 py-2.5">
        <label className="flex items-center gap-2 font-mono text-xs text-muted">
          nº de stumps
          <input type="range" min={1} max={50} step={1} value={nStumps} onChange={(e) => setNStumps(Number(e.target.value))} className="w-32 accent-cyan" />
          <span className="w-7 text-cyan">{nStumps}</span>
        </label>
        <span className="font-mono text-[11px] text-faint">
          accuracy train: <b className="text-lime">{(acc * 100).toFixed(0)} %</b>
        </span>
        <span className="ml-auto font-mono text-[11px] text-faint">
          bagging: cada stump ve una muestra bootstrap; la mayoría suaviza la frontera
        </span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}

/* ---------------- Pestañas ---------------- */

const TABS = [
  { id: 'knn', label: 'KNN' },
  { id: 'svm', label: 'SVM' },
  { id: 'arboles', label: 'Árboles' },
  { id: 'ensembles', label: 'Ensembles' },
] as const

export default function DemoZoo() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('knn')
  return (
    <DemoFrame
      title={`zoo.py — ${TABS.find((t) => t.id === tab)!.label}`}
      controls={
        <>
          <div className="flex gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                  tab === t.id ? 'border-violet/60 bg-violet/15 text-violet' : 'border-line text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="ml-auto font-mono text-[11px] text-faint">
            {tab === 'knn' && 'haz clic para añadir puntos'}
            {tab === 'svm' && 'anillos lima = vectores soporte'}
            {tab === 'arboles' && 'regiones + diagrama del árbol'}
            {tab === 'ensembles' && 'la sabiduría de la multitud'}
          </span>
        </>
      }
    >
      {tab === 'knn' && <TabKNN />}
      {tab === 'svm' && <TabSVM />}
      {tab === 'arboles' && <TabArboles />}
      {tab === 'ensembles' && <TabEnsembles />}
    </DemoFrame>
  )
}
