/**
 * LevelBadge — insignia hexagonal N0–N6 + BOSS con anillo en gradiente
 * por nivel; estado bloqueado en escala de grises con candado.
 *
 * Uso: <LevelBadge level="N3" unlocked size="md" />
 */

import { Lock } from 'lucide-react'
import { LEVELS } from '@/lib/progress'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: { box: 40, text: 'text-[11px]', lock: 10 },
  md: { box: 56, text: 'text-sm', lock: 14 },
  lg: { box: 72, text: 'text-base', lock: 18 },
} as const

export default function LevelBadge({
  level,
  unlocked = true,
  size = 'md',
  className,
}: {
  level: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'N8' | 'N9' | 'N10' | 'BOSS'
  unlocked?: boolean
  size?: keyof typeof SIZES
  className?: string
}) {
  const def = LEVELS.find((l) => l.id === level)
  const color = def?.color ?? '#8B5CF6'
  const s = SIZES[size]
  const gradId = `lb-${level}-${size}`

  // Hexágono pointy-top dentro de viewBox 100x100
  const hex = '50 4 91.3 27 91.3 73 50 96 8.7 73 8.7 27'

  return (
    <span
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: s.box, height: s.box, filter: unlocked ? undefined : 'grayscale(1)' }}
      title={`${level} · ${def?.name ?? ''}${unlocked ? '' : ' (bloqueado)'}`}
    >
      <svg width={s.box} height={s.box} viewBox="0 0 100 100" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={unlocked ? color : '#55618A'} />
            <stop offset="1" stopColor={unlocked ? '#22D3EE' : '#1C2440'} />
          </linearGradient>
        </defs>
        <polygon points={hex} fill="#0D1322" stroke={`url(#${gradId})`} strokeWidth="5" />
      </svg>
      {unlocked ? (
        <span
          className={cn('absolute font-mono font-bold', s.text, level === 'BOSS' && 'text-[0.62em]')}
          style={{ color }}
        >
          {level}
        </span>
      ) : (
        <Lock className="absolute text-faint" style={{ width: s.lock + 4, height: s.lock + 4 }} aria-hidden />
      )}
    </span>
  )
}
