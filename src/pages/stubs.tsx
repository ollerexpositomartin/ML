/**
 * Stubs de páginas — los agentes de contenido reemplazan estos archivos.
 */
import PageStub from '@/components/PageStub'
import { MODULES } from '@/data/modules'
import SecuenciasPage from '@/pages/modulos/Secuencias'
import TransformersPage from '@/pages/modulos/Transformers'

function stubFor(slug: string) {
  const m = MODULES.find((x) => x.slug === slug)!
  return (
    <PageStub
      kicker={`// NIVEL ${m.level}`}
      title={m.title}
      description={m.tagline}
      art={m.art}
      color={m.color}
    />
  )
}

export function Ruta() {
  return (
    <PageStub
      kicker="// RUTA"
      title="La Ruta · de 0 a experto"
      description="Mapa completo del currículo: camino serpenteante de progreso, nodos de módulos con su syllabus, estado de XP y el Boss Final."
      color="#8B5CF6"
    />
  )
}

export function ModuloFundamentos() {
  return stubFor('fundamentos')
}
export function ModuloMLClasico() {
  return stubFor('ml-clasico')
}
export function ModuloRedesNeuronales() {
  return stubFor('redes-neuronales')
}
export function ModuloCNN() {
  return stubFor('cnn')
}
export function ModuloSecuencias() {
  return <SecuenciasPage />
}
export function ModuloTransformers() {
  return <TransformersPage />
}
export function ModuloGenerativos() {
  return stubFor('generativos')
}
export function Laboratorio() {
  return stubFor('laboratorio')
}
