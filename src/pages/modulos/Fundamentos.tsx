/**
 * Fundamentos — /modulos/fundamentos · Nivel N0–N1.
 * Matemáticas esenciales (álgebra lineal, cálculo, probabilidad) + regresión
 * lineal + descenso del gradiente. Teoría con KaTeX, 5 demos canvas,
 * 5 ejercicios autocorregidos + quiz conceptual.
 */

import { useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown, FlaskConical } from 'lucide-react'
import ChapterNav, { type ChapterSection } from '@/components/ChapterNav'
import ModuleHero from '@/components/ModuleHero'
import FormulaBlock from '@/components/FormulaBlock'
import ExerciseCard from '@/components/ExerciseCard'
import QuizCard from '@/components/QuizCard'
import DemoVectores from '@/components/fundamentos/DemoVectores'
import DemoTangente from '@/components/fundamentos/DemoTangente'
import DemoGaussiana from '@/components/fundamentos/DemoGaussiana'
import DemoAjustaRecta from '@/components/fundamentos/DemoAjustaRecta'
import DemoGradiente from '@/components/fundamentos/DemoGradiente'
import { TeX } from '@/lib/katex-content'
import { registerExercises } from '@/lib/exercises'
import { FUNDAMENTOS_EXERCISES } from '@/data/exercises/fundamentos'
import { cn } from '@/lib/utils'

registerExercises(FUNDAMENTOS_EXERCISES)

const SECTIONS: ChapterSection[] = [
  { id: 'aprender', label: '0.1 Qué es aprender' },
  { id: 'algebra', label: '0.2 Álgebra lineal' },
  { id: 'calculo', label: '0.3 Cálculo' },
  { id: 'probabilidad', label: '0.4 Probabilidad' },
  { id: 'regresion', label: '0.5 Regresión lineal' },
  { id: 'gradiente', label: '0.6 Gradiente descendente' },
  { id: 'ejercicios', label: '0.7 Ejercicios' },
  { id: 'siguiente', label: '0.8 Siguiente nivel' },
]

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id: string
  kicker: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line/60 py-14 first:border-t-0 first:pt-4">
      <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">{kicker}</span>
      <h2 className="mb-6 mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] text-ink">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.95rem] leading-[1.8] text-muted">{children}</p>
}

/** Diagrama de la tríada: hipótesis → pérdida → optimizador. */
function TriadDiagram() {
  const items = [
    { label: 'hipótesis', tex: '\\hat{y} = f_\\theta(x)', color: '#22D3EE', x: 50, y: 14 },
    { label: 'pérdida', tex: 'L(\\theta)', color: '#FB7185', x: 12, y: 74 },
    { label: 'optimizador', tex: '\\theta \\leftarrow \\theta - \\eta\\nabla L', color: '#A3E635', x: 88, y: 74 },
  ]
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-panel p-4">
      <svg viewBox="0 0 100 92" className="mx-auto w-full max-w-[420px]" aria-hidden>
        <defs>
          <marker id="tri-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#55618A" />
          </marker>
        </defs>
        <motion.path
          d="M 38 20 L 20 66"
          stroke="#55618A" strokeWidth="0.8" fill="none" markerEnd="url(#tri-arrow)"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
        />
        <motion.path
          d="M 28 80 L 72 80"
          stroke="#55618A" strokeWidth="0.8" fill="none" markerEnd="url(#tri-arrow)"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
        />
        <motion.path
          d="M 80 66 L 62 20"
          stroke="#55618A" strokeWidth="0.8" fill="none" markerEnd="url(#tri-arrow)"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.6 }}
        />
        {items.map((it, i) => (
          <motion.g
            key={it.label}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 * i, type: 'spring', stiffness: 240, damping: 16 }}
          >
            <circle cx={it.x} cy={it.y} r="13" fill="#0D1322" stroke={it.color} strokeWidth="0.9" />
            <text x={it.x} y={it.y - 1} textAnchor="middle" fontSize="4.6" fill={it.color} fontFamily="JetBrains Mono, monospace" fontWeight="700">
              {it.label}
            </text>
          </motion.g>
        ))}
      </svg>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border border-line bg-bg-1 px-3 py-2 text-center">
            <TeX content={`$${it.tex}$`} className="text-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Acordeón con la derivación de la ecuación normal. */
function OLSDerivation() {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 font-mono text-xs text-cyan transition-colors hover:text-ink"
        aria-expanded={open}
      >
        Ver la derivación: de ∇L = 0 a la ecuación normal
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden border-t border-line bg-bg-1"
          >
            <div className="space-y-4 px-5 py-5 text-sm leading-[1.8] text-muted">
              <TeX content={'1. Escribe la pérdida en forma matricial, con $X \\in \\mathbb{R}^{N \\times d}$ e $y \\in \\mathbb{R}^N$:'} />
              <TeX content={'$$L(w) = \\frac{1}{N}\\|y - Xw\\|^2 = \\frac{1}{N}(y - Xw)^{\\top}(y - Xw)$$'} />
              <TeX content={'2. Desarrolla el producto y deriva respecto a $w$ (regla del gradiente para formas cuadráticas):'} />
              <TeX content={'$$\\nabla_w L = \\frac{2}{N}\\left(X^{\\top}Xw - X^{\\top}y\\right)$$'} />
              <TeX content={'3. En el mínimo el gradiente es cero. Iguala y despeja $w$:'} />
              <TeX content={'$$X^{\\top}Xw = X^{\\top}y \\quad\\Longrightarrow\\quad w = (X^{\\top}X)^{-1}X^{\\top}y$$'} />
              <TeX content={'La condición suficiente: que $X^{\\top}X$ sea invertible (columnas de $X$ linealmente independientes).'} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Fundamentos() {
  return (
    <>
      <ModuleHero
        level="N0"
        kicker="// NIVEL 0–1 · FUNDAMENTOS"
        title="Fundamentos: matemáticas y tu primer modelo"
        abstract="Antes de las redes neuronales: vectores, derivadas, probabilidad — y el modelo que lo empezó todo, la regresión lineal, con su solución exacta y su algoritmo universal."
        meta={{ duration: '≈ 3 h', demos: 5, exercises: 6, xp: 290 }}
        art="/art-fundamentos.png"
        color="#22D3EE"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 py-14 md:px-6">
        <ChapterNav sections={SECTIONS} />

        <main className="min-w-0 max-w-[860px] flex-1">
          {/* S1 · aprender */}
          <Section id="aprender" kicker="// 0.1 · EL PARADIGMA" title="¿Qué significa «aprender»?">
            <P>
              En la programación clásica escribes <b className="text-ink">reglas</b> y el ordenador
              produce respuestas a partir de datos. En machine learning inviertes el flujo: le das{' '}
              <b className="text-cyan">datos y respuestas</b>, y el algoritmo descubre las reglas.
              Aprender, en la práctica, es un problema de optimización.
            </P>
            <P>
              Todo modelo de ML se describe con tres piezas: una <b className="text-cyan">hipótesis</b>{' '}
              (la forma del modelo, con parámetros <TeX content="$\\theta$" />), una{' '}
              <b className="text-rose">función de pérdida</b> que mide cuánto se equivoca, y un{' '}
              <b className="text-lime">optimizador</b> que ajusta los parámetros para minimizarla.
            </P>
            <TriadDiagram />
            <FormulaBlock
              formula="\theta^{*} = \underset{\theta}{\mathrm{argmin}} \; \frac{1}{N} \sum_{i=1}^{N} L\!\left(f_\theta(x_i),\; y_i\right)"
              caption="El objetivo universal del aprendizaje supervisado"
              breakdown={[
                { symbol: '\\theta', color: '#8B5CF6', explanation: 'los parámetros del modelo (pesos y sesgos): las «perillas» que podemos girar' },
                { symbol: 'f_\\theta(x_i)', color: '#22D3EE', explanation: 'la predicción del modelo para el dato i-ésimo' },
                { symbol: 'L', color: '#FB7185', explanation: 'la pérdida: un número que crece cuanto peor es la predicción' },
                { symbol: 'N', color: '#FBBF24', explanation: 'número de ejemplos de entrenamiento; promediamos sobre todos ellos' },
                { symbol: '\\mathrm{argmin}', color: '#A3E635', explanation: '«el valor de θ que hace mínima la expresión» — no el valor mínimo, sino dónde se alcanza' },
              ]}
            />
          </Section>

          {/* S2 · algebra */}
          <Section id="algebra" kicker="// 0.2 · ÁLGEBRA LINEAL" title="Vectores: el idioma de los datos">
            <P>
              Un <b className="text-cyan">vector</b> es una lista de números — y también una flecha en el
              espacio. Un dato tabular (edad, altura, ingresos) es un vector; un dataset completo es una
              matriz <TeX content="$X \\in \\mathbb{R}^{N \\times d}$" /> donde cada fila es un ejemplo y cada
              columna una característica.
            </P>
            <P>
              La operación estrella es el <b className="text-violet">producto escalar</b>: mide cuánto se
              parecen dos vectores. Si <TeX content="$w$" /> son los pesos de un modelo y{' '}
              <TeX content="$x$" /> un dato, <TeX content="$w \\cdot x$" /> es literalmente «cuánto vota cada
              característica, ponderada por su importancia».
            </P>
            <FormulaBlock
              formula="w \cdot x = \sum_{i=1}^{d} w_i\, x_i = \|w\|\,\|x\|\cos\varphi"
              caption="Producto escalar: suma de productos, o geometría pura"
              breakdown={[
                { symbol: 'w_i x_i', color: '#8B5CF6', explanation: 'cada peso multiplica a su característica; la suma es la predicción' },
                { symbol: '\\|w\\|', color: '#22D3EE', explanation: 'la norma L2 (longitud): $\\sqrt{\\sum_i w_i^2}$' },
                { symbol: '\\cos\\varphi', color: '#FBBF24', explanation: 'el ángulo entre vectores: 1 si apuntan igual, 0 si son ortogonales, −1 si opuestos' },
              ]}
            />
            <FormulaBlock
              formula="\hat{y} = Xw + b"
              caption="Un modelo lineal es una multiplicación matriz–vector"
            />
            <DemoVectores />
            <P>
              Arrastra los vectores y observa: cuando apuntan en direcciones parecidas el producto escalar
              es grande y positivo; cuando son perpendiculares, es cero. La proyección (lima) es la sombra
              de <TeX content="$x$" /> sobre <TeX content="$w$" /> — la pieza con la que se construyen Gram–Schmidt,
              PCA y la atención de los Transformers.
            </P>
          </Section>

          {/* S3 · calculo */}
          <Section id="calculo" kicker="// 0.3 · CÁLCULO" title="La derivada: cuánto cambia todo">
            <P>
              La derivada es la pendiente de una curva en un punto: cuánto cambia la salida si mueves la
              entrada un poquito. Se define como el límite de la pendiente de la secante cuando los dos
              puntos se acercan:
            </P>
            <FormulaBlock
              formula="f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}"
              caption="Definición de derivada como límite de la secante"
            />
            <DemoTangente />
            <P>
              Con funciones de muchas variables (nuestro caso: la pérdida depende de miles de pesos),
              derivamos «a trozos»: la <b className="text-ink">derivada parcial</b>{' '}
              <TeX content="$\\partial L / \\partial \\theta_i$" /> mide el efecto de un solo parámetro
              manteniendo el resto fijos. El vector de todas ellas es el <b className="text-rose">gradiente</b>:
            </P>
            <FormulaBlock
              formula="\nabla L = \left( \frac{\partial L}{\partial \theta_1},\; \frac{\partial L}{\partial \theta_2},\; \dots,\; \frac{\partial L}{\partial \theta_k} \right)"
              caption="El gradiente apunta en la dirección de máximo ascenso"
              breakdown={[
                { symbol: '\\nabla L', color: '#FB7185', explanation: 'vector de pendientes: hacia dónde sube más rápido la pérdida (nosotros iremos al revés)' },
                { symbol: '\\theta_i', color: '#8B5CF6', explanation: 'cada parámetro del modelo aporta una componente' },
              ]}
            />
            <P>
              Y una joya que necesitarás en el Nivel 2: la <b className="text-ink">regla de la cadena</b>.
              Si la pérdida depende de la predicción y la predicción de un peso, sus efectos se multiplican:
            </P>
            <FormulaBlock
              formula="\frac{dL}{dw} = \frac{dL}{d\hat{y}} \cdot \frac{d\hat{y}}{dw}"
              caption="Regla de la cadena — esto, aplicado capa a capa, será backpropagation"
            />
          </Section>

          {/* S4 · probabilidad */}
          <Section id="probabilidad" kicker="// 0.4 · PROBABILIDAD" title="Probabilidad y máxima verosimilitud">
            <P>
              El mundo es ruidoso: dos casas idénticas no cuestan lo mismo. Modelamos ese ruido con{' '}
              <b className="text-cyan">variables aleatorias</b>. La más importante es la{' '}
              <b className="text-violet">gaussiana</b> <TeX content="$\\mathcal{N}(\\mu, \\sigma^2)$" />:
              campana centrada en <TeX content="$\\mu$" /> con anchura <TeX content="$\\sigma$" />.
            </P>
            <FormulaBlock
              formula="p(x) = \frac{1}{\sqrt{2\pi\sigma^2}}\; \exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)"
              caption="Densidad de la distribución normal"
              breakdown={[
                { symbol: '\\mu', color: '#FB7185', explanation: 'la media: dónde se centra la campana' },
                { symbol: '\\sigma', color: '#FBBF24', explanation: 'la desviación típica: cuánto se dispersan los datos' },
                { symbol: 'p(x)', color: '#22D3EE', explanation: 'densidad de probabilidad: zonas más altas = valores más probables' },
              ]}
            />
            <P>
              ¿Cómo elegimos <TeX content="$\\mu$" /> y <TeX content="$\\sigma$" /> para unos datos
              concretos? Por <b className="text-lime">máxima verosimilitud</b> (MLE): busca los parámetros
              que hacen <i>más probable</i> haber observado exactamente tus datos. Si los ejemplos son
              independientes, esa probabilidad es un producto — y maximizarlo equivale a minimizar su
              logaritmo negativo:
            </P>
            <FormulaBlock
              formula="\theta_{\mathrm{MLE}} = \underset{\theta}{\mathrm{argmax}} \prod_{i=1}^{N} p(y_i \mid x_i;\, \theta) \;=\; \underset{\theta}{\mathrm{argmin}} \; -\sum_{i=1}^{N} \log p(y_i \mid x_i;\, \theta)"
              caption="MLE = minimizar la log-verosimilitud negativa (NLL)"
            />
            <P>
              Este es <b className="text-ink">el puente entre probabilidad y funciones de pérdida</b>:
              minimizar el MSE <i>es</i> máxima verosimilitud si el ruido es gaussiano, y la entropía
              cruzada del siguiente nivel es MLE para un modelo Bernoulli.
            </P>
            <DemoGaussiana />
          </Section>

          {/* S5 · regresion */}
          <Section id="regresion" kicker="// 0.5 · EL PRIMER MODELO" title="Regresión lineal y el error cuadrático">
            <P>
              El modelo más simple que «aprende»: una recta. Con un peso{' '}
              <TeX content="$w$" /> (pendiente: cuánto cambia la predicción por unidad de entrada) y un
              sesgo <TeX content="$b$" /> (el valor base cuando <TeX content="$x = 0$" />):
            </P>
            <FormulaBlock
              formula="\hat{y} = wx + b"
              caption="Regresión lineal simple"
              breakdown={[
                { symbol: '\\hat{y}', color: '#22D3EE', explanation: 'la predicción (se lee «y sombrero»)' },
                { symbol: 'w', color: '#8B5CF6', explanation: 'peso o pendiente: el parámetro que aprende la relación' },
                { symbol: 'b', color: '#8B5CF6', explanation: 'sesgo o intercepto: desplaza la recta arriba/abajo' },
              ]}
            />
            <P>
              Para medir el error usamos el <b className="text-rose">MSE</b>: la media de los residuos
              al cuadrado. ¿Por qué al cuadrado y no el valor absoluto? Tres razones: elimina el signo,
              es <b className="text-ink">diferenciable en todas partes</b> (el valor absoluto no lo es en 0)
              y equivale a máxima verosimilitud bajo ruido gaussiano. Además, castiga los errores grandes
              mucho más que los pequeños.
            </P>
            <FormulaBlock
              formula="L(w, b) = \frac{1}{N}\sum_{i=1}^{N} \left( y_i - \hat{y}_i \right)^2 = \frac{1}{N}\sum_{i=1}^{N} \left( y_i - wx_i - b \right)^2"
              caption="Error cuadrático medio (MSE)"
              breakdown={[
                { symbol: 'y_i - \\hat{y}_i', color: '#FB7185', explanation: 'el residuo: distancia vertical del punto a la recta' },
                { symbol: '(\\cdot)^2', color: '#FBBF24', explanation: 'al cuadrado: positivo, suave y con MLE gaussiana detrás' },
                { symbol: '\\frac{1}{N}', color: '#22D3EE', explanation: 'la media hace la pérdida comparable entre datasets de distinto tamaño' },
              ]}
            />
            <P>
              Para este modelo la pérdida es un <b className="text-ink">cuenco convexo</b> con un único
              mínimo, y hay fórmula exacta para encontrarlo: la <b className="text-lime">ecuación normal</b>.
            </P>
            <FormulaBlock
              formula="w = \left( X^{\top} X \right)^{-1} X^{\top} y"
              caption="Solución analítica (OLS — ordinary least squares)"
            />
            <OLSDerivation />
            <P>
              ¿Por qué no usamos siempre la fórmula? Tres límites prácticos: necesita que{' '}
              <TeX content="$X^{\\top}X$" /> sea invertible (ojo si hay más características que datos,
              o columnas redundantes), cuesta <TeX content="$O(d^3)$" /> invertir la matriz (inviable con
              millones de parámetros), y solo existe para modelos lineales. La alternativa general es el
              siguiente tema.
            </P>
            <DemoAjustaRecta />
          </Section>

          {/* S6 · gradiente */}
          <Section id="gradiente" kicker="// 0.6 · EL ALGORITMO UNIVERSAL" title="Descenso del gradiente">
            <P>
              Si no hay fórmula cerrada, iteramos: calcula la pendiente, da un paso cuesta abajo, repite.
              El gradiente apunta hacia el máximo ascenso, así que restamos:
            </P>
            <FormulaBlock
              formula="\theta \leftarrow \theta - \eta\, \nabla L(\theta)"
              caption="Regla de actualización del descenso del gradiente"
              breakdown={[
                { symbol: '\\eta', color: '#FBBF24', explanation: 'la tasa de aprendizaje (learning rate): el tamaño del paso — el hiperparámetro más importante del ML' },
                { symbol: '\\nabla L', color: '#FB7185', explanation: 'la dirección de máximo ascenso; con el signo menos bajamos' },
                { symbol: '\\leftarrow', color: '#A3E635', explanation: 'actualización in place: el nuevo θ reemplaza al anterior' },
              ]}
            />
            <P>
              La elección de <TeX content="$\\eta$" /> es delicada: demasiado pequeña y el aprendizaje
              avanza a paso de tortuga; demasiado grande y el algoritmo salta de un lado a otro del cuenco
              hasta <b className="text-rose">diverger</b>. Pruébalo tú mismo en la demo: arrastra el punto
              de inicio, sube <TeX content="$\\eta$" /> por encima de 0.5 y observa la explosión.
            </P>
            <DemoGradiente />
            <P>
              Una variante crucial: ¿con cuántos datos calculamos el gradiente en cada paso?
            </P>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                    <th className="px-4 py-3">variante</th>
                    <th className="px-4 py-3">datos por paso</th>
                    <th className="px-4 py-3">ventaja</th>
                    <th className="px-4 py-3">coste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-muted">
                  <tr>
                    <td className="px-4 py-3 font-mono text-cyan">batch</td>
                    <td className="px-4 py-3">todo el dataset</td>
                    <td className="px-4 py-3">gradiente exacto, trayectoria suave</td>
                    <td className="px-4 py-3">lento con N grande</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-cyan">SGD</td>
                    <td className="px-4 py-3">1 muestra</td>
                    <td className="px-4 py-3">rapidísimo; el ruido ayuda a escapar de mínimos locales</td>
                    <td className="px-4 py-3">trayectoria errática</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-cyan">mini-batch</td>
                    <td className="px-4 py-3">32–512 muestras</td>
                    <td className="px-4 py-3">equilibrio: es lo que se usa en la práctica</td>
                    <td className="px-4 py-3">requiere elegir el tamaño de lote</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <P>
              Activa <b className="text-violet">momentum</b> en la demo: acumula una «velocidad» que
              amortigua las oscilaciones y acelera en las direcciones consistentes — es la primera mejora
              de una larga lista que culmina en Adam (Nivel 3).
            </P>
          </Section>

          {/* S7 · ejercicios */}
          <Section id="ejercicios" kicker="// 0.7 · PRÁCTICA" title="Ejercicios autocorregidos">
            <P>
              Tu código corre en <b className="text-ink">Python real (Pyodide)</b> dentro de esta página —
              solo numpy, sin sklearn. Pulsa <b className="text-ink">Corregir</b> para evaluarlo con tests
              ocultos; cada ejercicio superado suma XP a tu ruta.
            </P>
            <div className="space-y-6">
              {FUNDAMENTOS_EXERCISES.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-faint">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden />
                Q1 · Quiz conceptual (4 preguntas · 10 XP c/u)
              </div>
              <QuizCard
                quizId="fundamentos-quiz-1"
                xp={10}
                question="¿Qué minimiza exactamente la solución OLS $w = (X^{\\top}X)^{-1}X^{\\top}y$?"
                options={[
                  { text: 'La suma de errores absolutos $\\sum_i |y_i - \\hat{y}_i|$', correct: false, explanation: 'Eso sería regresión L1/mediana. OLS minimiza los errores **al cuadrado**: $\\sum_i (y_i - \\hat{y}_i)^2$.' },
                  { text: 'La suma de errores al cuadrado $\\sum_i (y_i - \\hat{y}_i)^2$', correct: true, explanation: 'Exacto: OLS (ordinary least squares) sale de igualar a cero el gradiente del MSE.' },
                  { text: 'El número de errores de signo', correct: false, explanation: 'El signo no es el objetivo: OLS minimiza la magnitud cuadrática de los residuos.' },
                  { text: 'La norma de los pesos $\\|w\\|$', correct: false, explanation: 'Eso sería regularización ridge pura. OLS no penaliza los pesos: solo ajusta los residuos.' },
                ]}
              />
              <QuizCard
                quizId="fundamentos-quiz-2"
                xp={10}
                question="¿Por qué el MSE y no el error absoluto? (la razón matemática clave)"
                options={[
                  { text: 'Porque elevar al cuadrado hace los errores positivos', correct: false, explanation: 'El valor absoluto también los hace positivos — esa no es la diferencia decisiva.' },
                  { text: 'Porque el cuadrado es diferenciable en todas partes (y el valor absoluto no lo es en 0)', correct: true, explanation: '¡Eso es! El gradiente del MSE existe siempre, lo que permite OLS y descenso del gradiente sin fricciones. Bonus: equivale a MLE con ruido gaussiano.' },
                  { text: 'Porque el cuadrado hace los cálculos más rápidos', correct: false, explanation: 'No es cuestión de velocidad: es cuestión de derivabilidad y de la conexión con la gaussiana.' },
                  { text: 'Porque penaliza menos los errores grandes', correct: false, explanation: 'Al revés: el cuadrado penaliza MÁS los errores grandes (un error doble cuesta cuádruple).' },
                ]}
              />
              <QuizCard
                quizId="fundamentos-quiz-3"
                xp={10}
                question="En el descenso del gradiente, ¿qué pasa si la tasa de aprendizaje $\\eta$ es demasiado grande?"
                options={[
                  { text: 'El modelo aprende más rápido y mejor', correct: false, explanation: 'Solo hasta un punto: pasado ese umbral, los pasos sobrepasan el mínimo en cada iteración.' },
                  { text: 'No pasa nada: el gradiente siempre apunta al mínimo', correct: false, explanation: 'El gradiente indica la dirección, pero el TAMAÑO del paso puede hacer que sobresaltes el cuenco.' },
                  { text: 'La pérdida puede oscilar y diverger', correct: true, explanation: 'Correcto: con η grande cada paso salta al lado opuesto del cuenco con más energía — la pérdida crece sin control. Lo viste en la demo con η > 0.5.' },
                  { text: 'El algoritmo se detiene automáticamente', correct: false, explanation: 'Nada lo detiene: seguirá dando pasos cada vez más grandes a menos que programes una parada.' },
                ]}
              />
              <QuizCard
                quizId="fundamentos-quiz-4"
                xp={10}
                question="En $\\hat{y} = wx + b$, ¿cómo se interpreta el peso $w$?"
                options={[
                  { text: 'El valor de $\\hat{y}$ cuando $x = 0$', correct: false, explanation: 'Eso es el sesgo b. El peso w describe el CAMBIO, no el punto de partida.' },
                  { text: 'El error medio del modelo', correct: false, explanation: 'El error lo mide la pérdida (MSE); w es un parámetro del modelo, no una métrica.' },
                  { text: 'Cuánto cambia $\\hat{y}$ por cada unidad que aumenta $x$', correct: true, explanation: 'Exacto: w es la pendiente. Si w = 2 y x sube 3 unidades, la predicción sube 6.' },
                  { text: 'La correlación entre $x$ e $y$', correct: false, explanation: 'Están relacionados pero no son lo mismo: w depende de las unidades de x, la correlación no.' },
                ]}
              />
            </div>
          </Section>

          {/* S8 · siguiente */}
          <section id="siguiente" className="scroll-mt-24 border-t border-line/60 py-14">
            <Link
              to="/modulos/ml-clasico"
              className="group block rounded-2xl border border-line bg-panel p-7 transition-all hover:-translate-y-1 hover:border-cyan/50 hover:shadow-glow-cyan"
            >
              <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
                // SIGUIENTE · NIVEL 1–2
              </span>
              <div className="mt-2 flex items-center justify-between gap-4">
                <h3 className="font-display text-2xl font-bold text-ink">
                  ML clásico: clasificar, medir y no sobreajustar
                </h3>
                <ArrowRight className="h-6 w-6 shrink-0 text-cyan transition-transform group-hover:translate-x-2" aria-hidden />
              </div>
              <p className="mt-2 text-sm text-muted">
                La regresión logística, las métricas que no mienten y el zoo de modelos tabulares.
              </p>
            </Link>
          </section>
        </main>
      </div>
    </>
  )
}
