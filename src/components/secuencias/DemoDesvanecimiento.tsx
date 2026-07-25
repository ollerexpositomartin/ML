/**
 * DemoDesvanecimiento — dependencia a largo plazo + producto de Jacobianos.
 * Una señal en t=0 debe influir en la salida en t=29. El slider controla ‖W_h‖:
 * <1 → gradiente que se desvanece exponencialmente (rose),
 * >1 → explosión (amber flash + aviso).
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

const T = 30

export default function DemoDesvanecimiento() {
  const [w, setW] = useState(0.9)
  const exploding = w > 1.05
  const stable = w >= 0.95 && w <= 1.05

  // |∂h_T/∂h_k| ≈ ‖W_h‖^(T−k) — normalizado para visualizar
  const grads = useMemo(() => {
    const raw = Array.from({ length: T }, (_, k) => Math.pow(w, T - 1 - k))
    const max = Math.max(...raw)
    return raw.map((v) => v / max)
  }, [w])

  const farGrad = Math.pow(w, T - 1) // influencia de t=0 en t=29

  return (
    <DemoFrame
      title="vanishing_gradient.py"
      controls={
        <>
          <label htmlFor="wh-slider" className="font-mono text-xs text-faint">
            ‖W_h‖ = <span className="text-cyan">{w.toFixed(2)}</span>
          </label>
          <input
            id="wh-slider"
            type="range"
            min={0.7}
            max={1.3}
            step={0.01}
            value={w}
            onChange={(e) => setW(parseFloat(e.target.value))}
            className="w-56 accent-cyan"
          />
          <span className="font-mono text-xs text-muted">
            ‖W_h‖<sup>29</sup> ={' '}
            <span className={cn(exploding ? 'text-amber' : farGrad < 0.01 ? 'text-rose' : 'text-lime')}>
              {farGrad >= 1000 ? farGrad.toExponential(1) : farGrad.toFixed(4)}
            </span>
          </span>
          <AnimatePresence>
            {exploding && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 rounded-md border border-amber/50 bg-amber/10 px-2.5 py-1 font-mono text-xs font-bold text-amber"
              >
                <TriangleAlert className="h-3.5 w-3.5" />
                explosión
              </motion.span>
            )}
            {stable && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-md border border-lime/50 bg-lime/10 px-2.5 py-1 font-mono text-xs text-lime"
              >
                gradiente vivo ✓
              </motion.span>
            )}
          </AnimatePresence>
        </>
      }
    >
      <motion.div
        key={exploding ? 'boom' : 'ok'}
        animate={exploding ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
        transition={{ duration: 0.3 }}
        className="relative p-6"
      >
        {/* flash amber en explosión */}
        <AnimatePresence>
          {exploding && (
            <motion.div
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none absolute inset-0 bg-amber/20"
              aria-hidden
            />
          )}
        </AnimatePresence>

        {/* barra de secuencia: señal en t=0 → salida en t=29 */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            <span className="text-cyan">señal en t=0</span>
            <span>la dependencia viaja 29 pasos</span>
            <span className="text-violet">salida en t=29</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: T }).map((_, k) => (
              <div
                key={k}
                className={cn(
                  'h-3 flex-1 rounded-sm',
                  k === 0 && 'bg-cyan shadow-[0_0_10px_rgba(34,211,238,0.8)]',
                  k === T - 1 && 'bg-violet shadow-[0_0_10px_rgba(139,92,246,0.8)]',
                  k > 0 && k < T - 1 && 'bg-line',
                )}
              />
            ))}
          </div>
        </div>

        {/* barras de magnitud del gradiente ∂h_T/∂h_k */}
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          // |∂h<sub>29</sub>/∂h<sub>k</sub>| ≈ ‖W_h‖<sup>29−k</sup> (normalizado)
        </div>
        <div className="flex h-44 items-end gap-1">
          {grads.map((g, k) => (
            <motion.div
              key={k}
              className="flex flex-1 flex-col items-center gap-1"
              initial={false}
            >
              <motion.div
                className={cn(
                  'w-full rounded-t-sm',
                  exploding ? 'bg-amber' : g < 0.05 ? 'bg-rose/70' : 'bg-rose',
                )}
                animate={{ height: `${Math.max(2, g * 150)}px` }}
                transition={{ type: 'spring', stiffness: 260, damping: 28, delay: k * 0.012 }}
                style={{
                  boxShadow: g > 0.5 ? '0 0 8px rgba(251,113,133,0.5)' : undefined,
                  opacity: 0.35 + 0.65 * g,
                }}
              />
              {k % 5 === 0 && <span className="font-mono text-[9px] text-faint">{k}</span>}
            </motion.div>
          ))}
        </div>

        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
          {exploding ? (
            <>
              Con ‖W_h‖ &gt; 1 el producto de Jacobianos <span className="font-mono text-amber">crece
              exponencialmente</span>: el gradiente explota y el entrenamiento se desestabiliza. La
              solución práctica: <span className="text-ink">gradient clipping</span>.
            </>
          ) : (
            <>
              Con ‖W_h‖ &lt; 1 cada Jacobiano multiplica por algo menor que 1: tras 29 pasos queda{' '}
              <span className="font-mono text-rose">{w.toFixed(2)}<sup>29</sup> ≈{' '}
              {Math.pow(w, 29) < 0.0001 ? Math.pow(w, 29).toExponential(1) : Math.pow(w, 29).toFixed(4)}</span>.
              La señal de t=0 ya <span className="text-ink">no puede enseñar</span> a la salida: la RNN
              olvida las dependencias largas.
            </>
          )}
        </p>
      </motion.div>
    </DemoFrame>
  )
}
