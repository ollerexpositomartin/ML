/**
 * progress.ts — Store global de progreso (zustand + localStorage).
 *
 * Persiste: XP total, ejercicios completados, pistas usadas.
 * Niveles N0–N6 + BOSS se desbloquean por umbral de XP (gating visual).
 *
 * API principal:
 *   useProgress()                 → hook con todo el estado y acciones
 *   addXP(n)                      → suma XP (puede ser negativo: pistas)
 *   completeExercise(id, xp)      → marca completado y suma XP (idempotente)
 *   useHint(id, cost)             → registra pista y descuenta XP
 *   isLevelUnlocked(levelId)      → bool
 *   currentLevel()                → Level actual según XP
 *   LEVELS                        → metadatos de niveles (Ruta / Navbar)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LevelDef {
  id: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'N8' | 'N9' | 'N10' | 'BOSS'
  name: string
  xpThreshold: number
  color: string
}

export const LEVELS: LevelDef[] = [
  { id: 'N0', name: 'Fundamentos matemáticos', xpThreshold: 0, color: '#22D3EE' },
  { id: 'N1', name: 'ML clásico', xpThreshold: 100, color: '#22D3EE' },
  { id: 'N2', name: 'Redes neuronales', xpThreshold: 250, color: '#8B5CF6' },
  { id: 'N3', name: 'CNN', xpThreshold: 450, color: '#8B5CF6' },
  { id: 'N4', name: 'Secuencias', xpThreshold: 700, color: '#8B5CF6' },
  { id: 'N5', name: 'Transformers', xpThreshold: 1000, color: '#FBBF24' },
  { id: 'N6', name: 'Modelos generativos', xpThreshold: 1400, color: '#FBBF24' },
  { id: 'N7', name: 'PyTorch práctico', xpThreshold: 1800, color: '#A3E635' },
  { id: 'N8', name: 'LLMs modernos', xpThreshold: 2200, color: '#FB7185' },
  { id: 'N9', name: 'Reinforcement Learning', xpThreshold: 2600, color: '#22D3EE' },
  { id: 'N10', name: 'MLOps y producción', xpThreshold: 3000, color: '#8B5CF6' },
  { id: 'BOSS', name: 'Proyecto final', xpThreshold: 3500, color: '#FB7185' },
]

export interface ExerciseCompletion {
  score: number
  xp: number
  at: string // ISO date
}

interface ProgressState {
  xp: number
  completed: Record<string, ExerciseCompletion>
  hintsUsed: Record<string, number>
  addXP: (n: number) => void
  completeExercise: (id: string, xp: number, score?: number) => void
  useHint: (id: string, cost?: number) => void
  isCompleted: (id: string) => boolean
  isLevelUnlocked: (levelId: LevelDef['id']) => boolean
  currentLevel: () => LevelDef
  resetProgress: () => void
}

export const HINT_COST = 5

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      completed: {},
      hintsUsed: {},

      addXP: (n) => set((s) => ({ xp: Math.max(0, s.xp + n) })),

      completeExercise: (id, xp, score = 1) =>
        set((s) => {
          if (s.completed[id]) return s // idempotente: XP solo la primera vez
          return {
            xp: s.xp + xp,
            completed: {
              ...s.completed,
              [id]: { score, xp, at: new Date().toISOString() },
            },
          }
        }),

      useHint: (id, cost = HINT_COST) =>
        set((s) => ({
          xp: Math.max(0, s.xp - cost),
          hintsUsed: { ...s.hintsUsed, [id]: (s.hintsUsed[id] ?? 0) + 1 },
        })),

      isCompleted: (id) => Boolean(get().completed[id]),

      isLevelUnlocked: (levelId) => {
        const def = LEVELS.find((l) => l.id === levelId)
        if (!def) return false
        return get().xp >= def.xpThreshold
      },

      currentLevel: () => {
        const xp = get().xp
        let current = LEVELS[0]
        for (const l of LEVELS) {
          if (xp >= l.xpThreshold) current = l
        }
        return current
      },

      resetProgress: () => set({ xp: 0, completed: {}, hintsUsed: {} }),
    }),
    { name: 'sinapsis-progress' },
  ),
)

/** Helper no-reactivo para usar fuera de componentes. */
export function getXP(): number {
  return useProgress.getState().xp
}

export function formatXP(xp: number): string {
  return xp.toLocaleString('es-ES')
}
