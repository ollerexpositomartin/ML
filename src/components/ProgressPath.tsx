/**
 * ProgressPath — camino serpenteante SVG con nodos brillantes (usado en /ruta).
 * Los nodos desbloqueados pulsan; los bloqueados aparecen apagados.
 *
 * Uso:
 *   <ProgressPath
 *     nodes={[{ id: 'N0', label: 'Fundamentos', unlocked: true, color: '#22D3EE', onClick: … }]}
 *   />
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ProgressNode {
  id: string
  label: string
  sublabel?: string
  unlocked: boolean
  color: string
  onClick?: () => void
}

const ROW_H = 150
const W = 800
const CXS = [140, 400, 660] // columnas de la serpentina

export default function ProgressPath({ nodes, className }: { nodes: ProgressNode[]; className?: string }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const { points, path } = useMemo(() => {
    const pts = nodes.map((n, i) => {
      const row = Math.floor(i / 3)
      const col = i % 3
      const dir = row % 2 === 0 ? col : 2 - col // serpentina
      return { node: n, x: CXS[dir], y: 70 + row * ROW_H }
    })
    let d = `M ${pts[0]?.x ?? 0} ${pts[0]?.y ?? 0}`
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const sameRow = Math.abs(a.y - b.y) < 1
      if (sameRow) {
        d += ` L ${b.x} ${b.y}`
      } else {
        // curva suave para el cambio de fila
        const midY = (a.y + b.y) / 2
        d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`
      }
    }
    return { points: pts, path: d }
  }, [nodes])

  const height = 70 + (Math.ceil(nodes.length / 3) - 1) * ROW_H + 70

  return (
    <div className={cn('relative mx-auto w-full max-w-[800px]', className)}>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="list" aria-label="Camino de progreso">
        <defs>
          <linearGradient id="pp-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        {/* raíl base */}
        <path d={path} fill="none" stroke="#1C2440" strokeWidth="3" strokeLinecap="round" />
        {/* raíl brillante por encima (tramo desbloqueado) */}
        {points.map((p, i) => {
          if (!p.node.unlocked || i === 0) return null
          const a = points[i - 1]
          const sameRow = Math.abs(a.y - p.y) < 1
          const dSeg = sameRow
            ? `M ${a.x} ${a.y} L ${p.x} ${p.y}`
            : `M ${a.x} ${a.y} C ${a.x} ${(a.y + p.y) / 2}, ${p.x} ${(a.y + p.y) / 2}, ${p.x} ${p.y}`
          const bothUnlocked = a.node.unlocked && p.node.unlocked
          return (
            <path
              key={`seg-${i}`}
              d={dSeg}
              fill="none"
              stroke={bothUnlocked ? 'url(#pp-grad)' : '#1C2440'}
              strokeWidth="3"
              strokeLinecap="round"
              opacity={bothUnlocked ? 0.9 : 0.5}
            />
          )
        })}
        {points.map((p) => (
          <g
            key={p.node.id}
            transform={`translate(${p.x}, ${p.y})`}
            onClick={p.node.onClick}
            onMouseEnter={() => setHovered(p.node.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: p.node.onClick ? 'pointer' : 'default' }}
            role="listitem"
            aria-label={`${p.node.label}${p.node.unlocked ? ' (desbloqueado)' : ' (bloqueado)'}`}
          >
            {p.node.unlocked && (
              <motion.circle
                r="26"
                fill={p.node.color}
                opacity="0.18"
                animate={{ r: [22, 30, 22], opacity: [0.22, 0.08, 0.22] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <circle
              r="17"
              fill="#0D1322"
              stroke={p.node.unlocked ? p.node.color : '#1C2440'}
              strokeWidth="3"
            />
            <text
              textAnchor="middle"
              dy="4"
              fontSize={p.node.id === 'BOSS' ? 8 : 11}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fill={p.node.unlocked ? p.node.color : '#55618A'}
            >
              {p.node.id}
            </text>
            <text
              textAnchor="middle"
              dy="42"
              fontSize="12"
              fontFamily="Inter, sans-serif"
              fill={p.node.unlocked ? '#EDF1FA' : '#55618A'}
            >
              {p.node.label}
            </text>
            {p.node.sublabel && hovered === p.node.id && (
              <text textAnchor="middle" dy="58" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#8E9AB8">
                {p.node.sublabel}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
