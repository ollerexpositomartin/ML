/**
 * utils.ts — utilidades compartidas de las demos del módulo PyTorch (N7).
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

/** Configura un canvas nítido (devicePixelRatio ×2) y devuelve el ctx escalado. */
export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = 2
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
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
  panel: '#0D1322',
  bg1: '#0A0E1A',
}
