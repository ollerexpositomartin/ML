/**
 * PageStub — placeholder de las páginas en construcción.
 * Los agentes de contenido reemplazan estas páginas por la versión completa.
 */

import { Link } from 'react-router'
import { Construction, ArrowRight } from 'lucide-react'

export default function PageStub({
  kicker,
  title,
  description,
  art,
  color,
}: {
  kicker: string
  title: string
  description: string
  art?: string
  color: string
}) {
  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 50% 60% at 50% 0%, ${color}1a, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-[860px] flex-col items-center px-4 py-24 text-center md:py-32">
        <span
          className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[0.78rem] uppercase tracking-[0.14em]"
          style={{ color, borderColor: `${color}44`, background: `${color}11` }}
        >
          <Construction className="h-3.5 w-3.5" aria-hidden />
          {kicker} · en construcción
        </span>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-tight tracking-[-0.03em] text-ink">
          {title}
        </h1>
        <p className="mt-4 max-w-[560px] text-base leading-[1.75] text-muted">{description}</p>
        {art && (
          <img
            src={art}
            alt=""
            className="mt-10 w-full max-w-[520px] rounded-2xl border border-line opacity-80"
            style={{ boxShadow: `0 0 50px ${color}1a` }}
          />
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 font-mono text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            Volver al inicio
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link to="/ruta" className="font-mono text-sm text-muted transition-colors hover:text-ink">
            Ver la ruta completa
          </Link>
        </div>
      </div>
    </div>
  )
}
