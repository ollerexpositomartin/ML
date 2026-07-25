/**
 * utils.ts — utilidades compartidas de las demos de ML Clásico.
 * Reexporta las primitivas de canvas de fundamentos y añade álgebra en JS.
 */

export { mulberry32, gaussian, setupCanvas, pointerPos, drawArrow, COLORS } from '../fundamentos/utils'

/** Resuelve A·x = b (A simétrica definida positiva o casi) por eliminación gaussiana con pivoteo. */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = A.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    ;[M[col], M[piv]] = [M[piv], M[col]]
    const d = M[col][col] || 1e-12
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / d
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12))
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

/** Entrena una regresión logística 2D con GD batch (determinista). */
export function trainLogistic(
  X: Array<[number, number]>,
  y: number[],
  lr: number,
  epochs: number,
): { w: [number, number]; b: number } {
  const w: [number, number] = [0, 0]
  let b = 0
  const n = X.length
  for (let e = 0; e < epochs; e++) {
    let g0 = 0
    let g1 = 0
    let gb = 0
    for (let i = 0; i < n; i++) {
      const p = sigmoid(w[0] * X[i][0] + w[1] * X[i][1] + b)
      const err = p - y[i]
      g0 += X[i][0] * err
      g1 += X[i][1] * err
      gb += err
    }
    w[0] -= (lr * g0) / n
    w[1] -= (lr * g1) / n
    b -= (lr * gb) / n
  }
  return { w, b }
}

/** Autovalores/autovectores de una matriz simétrica 3×3 (iteración de Jacobi). */
export function jacobiEigen3(Ain: number[][]): { values: number[]; vectors: number[][] } {
  const A = Ain.map((r) => [...r])
  let V = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
  for (let sweep = 0; sweep < 50; sweep++) {
    // elemento fuera de la diagonal más grande
    let p = 0
    let q = 1
    let max = Math.abs(A[0][1])
    if (Math.abs(A[0][2]) > max) { p = 0; q = 2; max = Math.abs(A[0][2]) }
    if (Math.abs(A[1][2]) > max) { p = 1; q = 2; max = Math.abs(A[1][2]) }
    if (max < 1e-12) break
    const app = A[p][p]
    const aqq = A[q][q]
    const apq = A[p][q]
    const theta = 0.5 * Math.atan2(2 * apq, aqq - app)
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    for (let k = 0; k < 3; k++) {
      const akp = A[k][p]
      const akq = A[k][q]
      A[k][p] = c * akp - s * akq
      A[k][q] = s * akp + c * akq
    }
    for (let k = 0; k < 3; k++) {
      const apk = A[p][k]
      const aqk = A[q][k]
      A[p][k] = c * apk - s * aqk
      A[q][k] = s * apk + c * aqk
    }
    const newV = V.map((row) => [...row])
    for (let k = 0; k < 3; k++) {
      newV[k][p] = c * V[k][p] - s * V[k][q]
      newV[k][q] = s * V[k][p] + c * V[k][q]
    }
    V = newV
  }
  const values = [A[0][0], A[1][1], A[2][2]]
  // ordenar desc
  const order = [0, 1, 2].sort((i, j) => values[j] - values[i])
  return {
    values: order.map((i) => values[i]),
    vectors: order.map((i) => [V[0][i], V[1][i], V[2][i]]),
  }
}
