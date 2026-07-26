import { Routes, Route, Navigate } from 'react-router'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Ruta from '@/pages/Ruta'
import ModuloFundamentos from '@/pages/modulos/Fundamentos'
import ModuloMLClasico from '@/pages/modulos/MLClasico'
import ModuloRedesNeuronales from '@/pages/modulos/RedesNeuronales'
import ModuloCNN from '@/pages/modulos/CNN'
import ModuloSecuencias from '@/pages/modulos/Secuencias'
import ModuloTransformers from '@/pages/modulos/Transformers'
import ModuloGenerativos from '@/pages/modulos/Generativos'
import ModuloPyTorch from '@/pages/modulos/PyTorch'
import ModuloLLMModernos from '@/pages/modulos/LLMModernos'
import ModuloRL from '@/pages/modulos/RL'
import ModuloMLOps from '@/pages/modulos/MLOps'
import Laboratorio from '@/pages/Laboratorio'
// Side-effect: registra todos los ejercicios de todos los módulos
import '@/data/exercises/all'

/**
 * Patrón de rutas ANIDADAS: Layout renderiza <Outlet/>.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="ruta" element={<Ruta />} />
        <Route path="modulos/fundamentos" element={<ModuloFundamentos />} />
        <Route path="modulos/ml-clasico" element={<ModuloMLClasico />} />
        <Route path="modulos/redes-neuronales" element={<ModuloRedesNeuronales />} />
        <Route path="modulos/cnn" element={<ModuloCNN />} />
        <Route path="modulos/secuencias" element={<ModuloSecuencias />} />
        <Route path="modulos/transformers" element={<ModuloTransformers />} />
        <Route path="modulos/generativos" element={<ModuloGenerativos />} />
        <Route path="modulos/pytorch" element={<ModuloPyTorch />} />
        <Route path="modulos/llm-modernos" element={<ModuloLLMModernos />} />
        <Route path="modulos/rl" element={<ModuloRL />} />
        <Route path="modulos/mlops" element={<ModuloMLOps />} />
        <Route path="laboratorio" element={<Laboratorio />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
