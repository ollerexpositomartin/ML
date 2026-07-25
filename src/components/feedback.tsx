/**
 * feedback.tsx — Primitivas compartidas de feedback:
 *   StatChip      → chip mono con icono + valor (XP, demos, ejercicios…)
 *   XPToastHost   → contenedor de toasts (montar una vez en Layout)
 *   toastXP()     → dispara un toast "+50 XP · Ejercicio superado"
 *   fireConfetti()→ ráfaga de confetti de marca (lime/violet/cyan)
 *   ConfettiBurst → componente que dispara confetti al montar (o con `fire`)
 */

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Zap, type LucideIcon } from 'lucide-react'
import { create } from 'zustand'

/* ---------------- StatChip ---------------- */

export function StatChip({
  icon: Icon = Zap,
  value,
  label,
  color = '#FBBF24',
  className = '',
}: {
  icon?: LucideIcon
  value: ReactNode
  label?: string
  color?: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 font-mono text-xs ${className}`}
      style={{ color }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="font-semibold">{value}</span>
      {label && <span className="text-muted">{label}</span>}
    </span>
  )
}

/* ---------------- Confetti ---------------- */

export const BRAND_CONFETTI_COLORS = ['#A3E635', '#8B5CF6', '#22D3EE', '#EDF1FA']

export function fireConfetti(options: confetti.Options = {}) {
  const defaults: confetti.Options = {
    particleCount: 120,
    spread: 75,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: BRAND_CONFETTI_COLORS,
    disableForReducedMotion: true,
  }
  confetti({ ...defaults, ...options })
  // Segunda ráfaga lateral para el "full pass"
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 60,
      angle: 60,
      origin: { x: 0, y: 0.8 },
      ...options,
    })
    confetti({
      ...defaults,
      particleCount: 60,
      angle: 120,
      origin: { x: 1, y: 0.8 },
      ...options,
    })
  }, 180)
}

export function ConfettiBurst({ fire = true }: { fire?: boolean }) {
  useEffect(() => {
    if (fire) fireConfetti()
  }, [fire])
  return null
}

/* ---------------- XPToast ---------------- */

interface XPToast {
  id: number
  xp: number
  message: string
}

interface ToastState {
  toasts: XPToast[]
  push: (t: Omit<XPToast, 'id'>) => void
  dismiss: (id: number) => void
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => {
      const id = Date.now() + Math.random()
      setTimeout(() => {
        useToastStore.getState().dismiss(id)
      }, 3200)
      return { toasts: [...s.toasts.slice(-2), { ...t, id }] }
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Dispara un toast de XP desde cualquier parte de la app. */
export function toastXP(xp: number, message: string) {
  useToastStore.getState().push({ xp, message })
}

export function XPToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-4 py-3 shadow-glow-violet"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand">
              <Zap className="h-4 w-4 text-white" aria-hidden />
            </span>
            <div>
              <div className="font-mono text-sm font-bold text-amber">
                {t.xp >= 0 ? `+${t.xp}` : t.xp} XP
              </div>
              <div className="text-xs text-muted">{t.message}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
