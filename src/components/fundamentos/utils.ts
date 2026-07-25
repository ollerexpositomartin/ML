/**
 * utils.ts — utilidades compartidas de las demos de Fundamentos.
 */

/** RNG determinista (mulberry32) para datasets reproducibles. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Muestra gaussiana vía Box–Muller a partir de un RNG uniforme. */
export function gaussian(rng: () => number, mu = 0, sigma = 1): number {
  const u = Math.max(rng(), 1e-12)
  const v = rng()
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Configura un canvas nítido (devicePixelRatio ×2) y devuelve el ctx escalado. */
export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = 2
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

/** Convierte coordenadas de puntero (CSS px) a coordenadas del canvas lógico. */
export function pointerPos(e: React.PointerEvent<HTMLCanvasElement>, w: number, h: number) {
  const rect = e.currentTarget.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * w,
    y: ((e.clientY - rect.top) / rect.height) * h,
  }
}

/** Dibuja una flecha de (x0,y0) a (x1,y1) en coordenadas de canvas. */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  color: string, width = 2.5,
) {
  const ang = Math.atan2(y1 - y0, x1 - x0)
  const head = 9
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - head * Math.cos(ang - 0.45), y1 - head * Math.sin(ang - 0.45))
  ctx.lineTo(x1 - head * Math.cos(ang + 0.45), y1 - head * Math.sin(ang + 0.45))
  ctx.closePath()
  ctx.fill()
}

export const COLORS = {
  violet: '#8B5CF6',
  cyan: '#22D3EE',
  lime: '#A3E635',
  rose: '#FB7185',
  amber: '#FBBF24',
  ink: '#EDF1FA',
  muted: '#8E9AB8',
  faint: '#55618A',
  line: '#1C2440',
}
