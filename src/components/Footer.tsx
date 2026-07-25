/**
 * Footer — 3 columnas: marca, índice del currículo, colofón.
 * Hairline superior en gradiente + mini canvas de pulso neuronal (2D ligero).
 */

import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { MODULES } from '@/data/modules'

/** Decoración: pulso viajando por una curva (canvas 2D, no Three.js). */
function NeuralPulse() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (t: number) => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      // curva axon
      ctx.beginPath()
      ctx.moveTo(0, h * 0.5)
      ctx.bezierCurveTo(w * 0.3, h * 0.05, w * 0.7, h * 0.95, w, h * 0.5)
      ctx.strokeStyle = 'rgba(28,36,64,0.9)'
      ctx.lineWidth = 1.5 * dpr
      ctx.stroke()
      // nodos
      for (const [fx, col] of [
        [0.02, '#8B5CF6'],
        [0.98, '#22D3EE'],
      ] as const) {
        ctx.beginPath()
        ctx.arc(w * fx, h * 0.5, 4 * dpr, 0, Math.PI * 2)
        ctx.fillStyle = col
        ctx.fill()
      }
      // pulso viajero (bezier point)
      const u = (t / 2600) % 1
      const x =
        Math.pow(1 - u, 3) * 0 +
        3 * Math.pow(1 - u, 2) * u * w * 0.3 +
        3 * (1 - u) * u * u * w * 0.7 +
        u * u * u * w
      const y =
        Math.pow(1 - u, 3) * h * 0.5 +
        3 * Math.pow(1 - u, 2) * u * h * 0.05 +
        3 * (1 - u) * u * u * h * 0.95 +
        u * u * u * h * 0.5
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 8 * dpr)
      grad.addColorStop(0, 'rgba(163,230,53,0.9)')
      grad.addColorStop(1, 'rgba(163,230,53,0)')
      ctx.beginPath()
      ctx.arc(x, y, 8 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="h-16 w-full" style={{ display: 'block' }} aria-hidden />
}

export default function Footer() {
  return (
    <footer className="relative border-t border-line bg-bg-1">
      <div className="hairline-gradient absolute left-0 top-0 w-full" aria-hidden />
      <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6">
        <NeuralPulse />
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {/* Marca */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="" className="h-6 w-12" />
              <span className="font-display text-lg font-bold tracking-tight text-ink">SINAPSIS</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              De la regresión lineal a los Transformers, sin salir de tu navegador.
            </p>
          </div>

          {/* Índice del currículo */}
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
              // Currículo
            </div>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/ruta" className="text-sm text-muted transition-colors hover:text-cyan">
                  La Ruta completa
                </Link>
              </li>
              {MODULES.map((m) => (
                <li key={m.slug}>
                  <Link
                    to={m.path}
                    className="group flex items-center gap-2 text-sm text-muted transition-colors hover:text-cyan"
                  >
                    <span className="font-mono text-[10px] uppercase" style={{ color: m.color }}>
                      {m.level}
                    </span>
                    {m.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colofón */}
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
              // Colofón
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Python real en tu navegador gracias a{' '}
              <a
                href="https://pyodide.org"
                target="_blank"
                rel="noreferrer"
                className="text-cyan hover:underline"
              >
                Pyodide
              </a>
              . Fórmulas con KaTeX, demos con Three.js, D3 y TensorFlow.js.
            </p>
            <p className="mt-6 font-mono text-xs text-faint">
              SINAPSIS · DE 0 A EXPERTO · ML &amp; DL — {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
