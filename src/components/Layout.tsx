/**
 * Layout — patrón de rutas ANIDADAS (Outlet). App.tsx usa:
 *   <Route element={<Layout/>}> <Route index element={<Home/>}/> … </Route>
 * El Navbar es fixed (h-16): Layout añade pt-16 para que toda página empiece
 * bajo el nav. Las páginas NO deben añadir su propio offset superior.
 * Incluye: Lenis (smooth scroll), scroll-to-top al cambiar de ruta, XPToastHost.
 */

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Lenis from 'lenis'
import Navbar from './Navbar'
import Footer from './Footer'
import { XPToastHost } from './feedback'

export default function Layout() {
  const location = useLocation()

  // Lenis smooth scrolling (site-wide)
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true })
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  // Scroll al inicio al navegar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="min-h-[100dvh] bg-bg-0 text-ink">
      <Navbar />
      {/* pt-16 = offset del navbar fijo (h-16) */}
      <main className="pt-16">
        <Outlet />
      </main>
      <Footer />
      <XPToastHost />
    </div>
  )
}
