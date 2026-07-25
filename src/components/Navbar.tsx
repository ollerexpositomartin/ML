/**
 * Navbar — fija arriba (fixed top-0, h-16). El offset del contenido lo pone Layout.
 * Mega-dropdown de módulos, chip de XP, hairline de progreso de lectura,
 * drawer móvil a pantalla completa.
 */

import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, X, Zap } from 'lucide-react'
import { MODULES } from '@/data/modules'
import { useProgress, formatXP } from '@/lib/progress'
import { preloadPyodide } from '@/lib/pyodide'
import { cn } from '@/lib/utils'

export const NAVBAR_HEIGHT = 64 // px — Layout usa pt-16 (64px)

function useReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return progress
}

const linkBase =
  'px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink'
const linkActive = 'text-ink'

export default function Navbar() {
  const xp = useProgress((s) => s.xp)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const progress = useReadingProgress()
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <header className="fixed top-0 z-50 w-full border-b border-line bg-bg-0/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">
        {/* Logo + wordmark */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="SINAPSIS — inicio">
          <img src="/logo.svg" alt="" className="h-6 w-12" />
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            SINAPSIS
          </span>
        </Link>

        {/* Links desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={({ isActive }) => cn(linkBase, isActive && linkActive)}>
            Inicio
          </NavLink>
          <NavLink to="/ruta" className={({ isActive }) => cn(linkBase, isActive && linkActive)}>
            Ruta
          </NavLink>

          {/* Mega-dropdown Módulos */}
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              className={cn(linkBase, 'flex items-center gap-1', dropdownOpen && linkActive)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              Módulos
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', dropdownOpen && 'rotate-180')}
              />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-2"
                >
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-panel p-2 shadow-2xl shadow-black/60">
                    {MODULES.map((m) => (
                      <Link
                        key={m.slug}
                        to={m.path}
                        onMouseEnter={preloadPyodide}
                        className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-panel-2"
                      >
                        <m.icon
                          className="mt-0.5 h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
                          style={{ color: m.color }}
                          aria-hidden
                        />
                        <span>
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink">{m.title}</span>
                            <span
                              className="rounded border px-1 font-mono text-[10px] uppercase tracking-wider"
                              style={{ color: m.color, borderColor: `${m.color}55` }}
                            >
                              {m.level}
                            </span>
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">
                            {m.tagline}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavLink
            to="/laboratorio"
            className={({ isActive }) => cn(linkBase, isActive && linkActive)}
          >
            Laboratorio
          </NavLink>
        </div>

        {/* Derecha: XP chip + hamburguesa */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 font-mono text-xs font-bold text-amber">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            {formatXP(xp)} XP
          </span>
          <button
            className="rounded-lg p-2 text-muted hover:text-ink md:hidden"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Hairline de progreso de lectura */}
      <div
        className="hairline-gradient absolute bottom-0 left-0 w-full origin-left"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      {/* Drawer móvil */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 z-40 overflow-y-auto bg-bg-0/95 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col gap-1 p-6">
              {[
                { to: '/', label: 'Inicio' },
                { to: '/ruta', label: 'Ruta' },
              ].map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link to={l.to} className="block rounded-lg px-3 py-3 font-display text-2xl font-semibold text-ink">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-4 border-t border-line pt-4">
                <div className="mb-2 px-3 font-mono text-xs uppercase tracking-[0.14em] text-faint">
                  // Módulos
                </div>
                {MODULES.map((m, i) => (
                  <motion.div
                    key={m.slug}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * (i + 2) }}
                  >
                    <Link to={m.path} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-ink">
                      <m.icon className="h-4 w-4" style={{ color: m.color }} aria-hidden />
                      <span className="text-base">{m.title}</span>
                      <span className="ml-auto font-mono text-[10px] uppercase" style={{ color: m.color }}>
                        {m.level}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
