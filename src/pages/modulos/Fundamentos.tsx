/**
 * Fundamentos — /modulos/fundamentos · Nivel N0.
 * BLOQUE 0 «Matemáticas desde cero absoluto» (función, pendiente, notación,
 * vectores, derivada, probabilidad) + matemáticas esenciales + regresión
 * lineal + descenso del gradiente. Teoría con KaTeX, 5 demos canvas,
 * 10 ejercicios autocorregidos + quizzes conceptuales.
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
import { getExercise, registerExercises } from '@/lib/exercises'
import { FUNDAMENTOS_EXERCISES } from '@/data/exercises/fundamentos'
import { cn } from '@/lib/utils'

registerExercises(FUNDAMENTOS_EXERCISES)

const SECTIONS: ChapterSection[] = [
  { id: 'cero-funcion', label: '0.01 ¿Qué es una función?' },
  { id: 'cero-pendiente', label: '0.02 La pendiente' },
  { id: 'cero-notacion', label: '0.03 Notación sin miedo' },
  { id: 'cero-vectores', label: '0.04 Vectores y matrices' },
  { id: 'cero-derivada', label: '0.05 La derivada' },
  { id: 'cero-probabilidad', label: '0.06 Probabilidad desde cero' },
  { id: 'aprender', label: '0.1 Qué es aprender' },
  { id: 'algebra', label: '0.2 Álgebra lineal' },
  { id: 'calculo', label: '0.3 Cálculo' },
  { id: 'probabilidad', label: '0.4 Probabilidad' },
  { id: 'regresion', label: '0.5 Regresión lineal' },
  { id: 'gradiente', label: '0.6 Gradiente descendente' },
  { id: 'ejercicios', label: '0.7 Ejercicios' },
  { id: 'proyecto', label: '0.8 Proyecto: vivienda' },
  { id: 'siguiente', label: '0.9 Siguiente nivel' },
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

/** Traducción sin notación de la fórmula que viene a continuación. */
function EnClaro({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-2 border-lime/60 bg-lime/5 px-4 py-3 text-[0.9rem] leading-[1.7] text-muted">
      <span className="mr-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-lime">
        En castellano llano:
      </span>
      {children}
    </p>
  )
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
        kicker="// NIVEL 0 · FUNDAMENTOS"
        title="Fundamentos: matemáticas y tu primer modelo"
        abstract="Antes de las redes neuronales: un Bloque 0 que empieza desde cero absoluto (¿qué es una función? ¿y una pendiente? ¿y ese símbolo Σ?), y después vectores, derivadas, probabilidad y el modelo que lo empezó todo: la regresión lineal, con su solución exacta y su algoritmo universal."
        meta={{ duration: '≈ 4 h', demos: 5, exercises: 17, xp: 590 }}
        art="/art-fundamentos.png"
        color="#22D3EE"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 py-14 md:px-6">
        <ChapterNav sections={SECTIONS} />

        <main className="min-w-0 max-w-[860px] flex-1">
          {/* ==========================================================
              BLOQUE 0 · MATEMÁTICAS DESDE CERO ABSOLUTO
              ========================================================== */}

          {/* B0.1 · función */}
          <Section id="cero-funcion" kicker="// BLOQUE 0 · MATES DESDE CERO — 1/6" title="¿Qué es una función? Una máquina entrada → salida">
            <P>
              Empieza aquí, de verdad. Una <b className="text-ink">función</b> es una máquina: le metes un
              número por un lado y sale otro por el otro. Se escribe <TeX content="$f(x)$" /> y se lee
              «efe de equis»: <i>la salida de la máquina f cuando la entrada es x</i>. Ojo con una trampa
              clásica: <TeX content="$f(x)$" /> <b className="text-ink">no es «f por x»</b> — no hay ninguna
              multiplicación ahí; es el nombre de la máquina aplicado a su entrada.
            </P>
            <P>
              Si ya programas, esto te suena: una función matemática es <b className="text-cyan">exactamente
              una función de programación</b> — recibe un parámetro, devuelve un resultado. La única
              diferencia es de estilo: en matemáticas las bautizamos con letras sueltas (
              <TeX content="$f$" />, <TeX content="$g$" />, <TeX content="$L$" />) en lugar de nombres
              largos como <code className="font-mono text-cyan">calcularPrecio()</code>.
            </P>
            <FormulaBlock
              formula="f(x) = 2x + 3 \quad\Longrightarrow\quad f(2) = 2\cdot 2 + 3 = 7"
              caption="«f(2)» significa: coge la receta y sustituye cada x por un 2"
              breakdown={[
                { symbol: 'f', color: '#8B5CF6', explanation: 'el nombre de la máquina; no es un número, no hace nada por sí solo' },
                { symbol: 'x', color: '#22D3EE', explanation: 'el hueco de entrada: el parámetro que vas a rellenar' },
                { symbol: '2x + 3', color: '#FBBF24', explanation: 'la receta: multiplica la entrada por 2 y súmale 3 (2x significa 2 · x)' },
                { symbol: 'f(2)', color: '#A3E635', explanation: 'la máquina en marcha: entrada 2 → salida 7' },
              ]}
            />
            <P>
              Probemos la máquina con varias entradas. Cada fila es una llamada: cambia la entrada, cambia
              la salida, pero la receta es siempre la misma.
            </P>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                    <th className="px-4 py-3">entrada x</th>
                    <th className="px-4 py-3">cálculo</th>
                    <th className="px-4 py-3">salida f(x)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-muted">
                  <tr><td className="px-4 py-2.5 font-mono text-cyan">0</td><td className="px-4 py-2.5 font-mono">2·0 + 3</td><td className="px-4 py-2.5 font-mono text-ink">3</td></tr>
                  <tr><td className="px-4 py-2.5 font-mono text-cyan">1</td><td className="px-4 py-2.5 font-mono">2·1 + 3</td><td className="px-4 py-2.5 font-mono text-ink">5</td></tr>
                  <tr><td className="px-4 py-2.5 font-mono text-cyan">2</td><td className="px-4 py-2.5 font-mono">2·2 + 3</td><td className="px-4 py-2.5 font-mono text-ink">7</td></tr>
                  <tr><td className="px-4 py-2.5 font-mono text-cyan">10</td><td className="px-4 py-2.5 font-mono">2·10 + 3</td><td className="px-4 py-2.5 font-mono text-ink">23</td></tr>
                </tbody>
              </table>
            </div>
            <P>
              ¿Y en machine learning? <b className="text-ink">El modelo es una función</b>: entran los datos
              de una casa (metros, habitaciones, antigüedad) y sale un precio. «Entrenar» no es otra cosa
              que ajustar esa máquina hasta que sus salidas se parezcan a la realidad. Todo lo que viene
              después en este curso son máquinas de este tipo, cada vez más grandes.
            </P>
          </Section>

          {/* B0.2 · pendiente */}
          <Section id="cero-pendiente" kicker="// BLOQUE 0 · MATES DESDE CERO — 2/6" title="La pendiente: cuánto sube, cuánto baja">
            <P>
              Una recta queda completamente descrita con solo <b className="text-ink">dos números</b>: la{' '}
              <b className="text-cyan">pendiente</b> <TeX content="$m$" /> — cuánto sube la recta por cada
              paso que das a la derecha — y el <b className="text-violet">intercepto</b>{' '}
              <TeX content="$b$" /> — el valor cuando <TeX content="$x = 0$" />, es decir, dónde corta la
              recta al eje vertical.
            </P>
            <FormulaBlock
              formula="y = mx + b, \qquad m = \frac{\text{lo que sube}}{\text{lo que avanza}} = \frac{y_2 - y_1}{x_2 - x_1}"
              caption="La recta y su pendiente (rise over run)"
              breakdown={[
                { symbol: 'm', color: '#22D3EE', explanation: 'la pendiente: si m = 2, cada paso a la derecha sube 2; si m = −1, baja 1; si m = 0, la recta es plana' },
                { symbol: 'b', color: '#8B5CF6', explanation: 'el intercepto: el punto de partida, el valor de y cuando x = 0' },
                { symbol: 'y_2 - y_1', color: '#FBBF24', explanation: 'cuánto ha subido entre dos puntos cualesquiera de la recta' },
                { symbol: 'x_2 - x_1', color: '#FBBF24', explanation: 'cuánto ha avanzado horizontalmente entre esos mismos dos puntos' },
              ]}
            />
            <P>
              Con números: toma la recta <TeX content="$y = 2x + 1$" />. En <TeX content="$x = 1$" /> sale{' '}
              <TeX content="$y = 3$" />; en <TeX content="$x = 3$" /> sale <TeX content="$y = 7$" />. Entre
              esos dos puntos la recta ha <b className="text-ink">subido 4</b> mientras{' '}
              <b className="text-ink">avanzaba 2</b>: pendiente = 4 ÷ 2 = 2. Fíjate en que no hace falta
              ninguna fórmula nueva: la pendiente es una división entre dos diferencias.
            </P>
            <P>
              Guárdate esto, porque es la conexión más importante del módulo: la{' '}
              <b className="text-lime">regresión lineal</b> que verás al final es exactamente esto — encontrar
              la <TeX content="$m$" /> y la <TeX content="$b$" /> que mejor resumen una nube de datos. La
              única diferencia es que los puntos reales no caen perfectamente sobre la recta, y habrá que
              decidir qué significa «mejor».
            </P>
            <QuizCard
              quizId="fund-cero-quiz-pendiente"
              xp={10}
              question="En la recta $y = 3x + 2$, ¿cuánto vale $y$ cuando $x = 4$?"
              options={[
                { text: '9', correct: false, explanation: 'Quizá sumaste 3 + 4 + 2. Pero 3x significa 3 · x: primero multiplica.' },
                { text: '14', correct: true, explanation: 'Exacto: y = 3·4 + 2 = 12 + 2 = 14. Sustituir x por su valor es todo lo que hay que hacer.' },
                { text: '24', correct: false, explanation: 'Eso sería (3+2)·4 + algo más. Recuerda: 3x es una multiplicación y el +2 se suma al final.' },
                { text: '2', correct: false, explanation: 'El 2 es b, el valor cuando x = 0. Aquí x = 4, así que la pendiente sí actúa.' },
              ]}
            />
          </Section>

          {/* B0.3 · notación */}
          <Section id="cero-notacion" kicker="// BLOQUE 0 · MATES DESDE CERO — 3/6" title="Notación sin miedo: una fórmula es un bucle compacto">
            <P>
              El símbolo que más asusta y menos debería: <TeX content="$\\Sigma$" /> (sigma mayúscula). Solo
              significa <b className="text-ink">«suma todo esto»</b>. El numerito de abajo indica por dónde
              empezar a contar y el de arriba dónde parar: es literalmente el rango de un bucle{' '}
              <code className="font-mono text-cyan">for</code>.
            </P>
            <FormulaBlock
              formula="\sum_{i=1}^{3} x_i = x_1 + x_2 + x_3 = 1 + 2 + 3 = 6"
              caption="Σ desempaquetada, con la lista x = [1, 2, 3]"
              breakdown={[
                { symbol: '\\sum', color: '#8B5CF6', explanation: '«suma»: crea un total en 0 y ve acumulando' },
                { symbol: 'i=1', color: '#22D3EE', explanation: 'el contador empieza en 1 (en matemáticas se cuenta desde 1, no desde 0)' },
                { symbol: '3', color: '#22D3EE', explanation: 'el contador termina en 3: son las vueltas del bucle' },
                { symbol: 'x_i', color: '#FBBF24', explanation: '«el elemento i-ésimo de la lista x»: lo que se suma en cada vuelta' },
              ]}
            />
            <P>
              Los <b className="text-cyan">subíndices</b> <TeX content="$x_1, x_2, \\dots, x_n$" /> son los
              elementos de una lista — piensa en los índices de un array. Si{' '}
              <code className="font-mono text-cyan">x = [1, 2, 3]</code>, entonces{' '}
              <TeX content="$x_1 = 1$" />, <TeX content="$x_2 = 2$" />, <TeX content="$x_3 = 3$" />. La única
              diferencia con tu array de siempre es que en notación matemática el primero es el 1.
            </P>
            <P>
              Y aquí va la idea clave de todo el curso: <b className="text-lime">una fórmula es solo un
              bucle escrito en compacto</b>. Cuando veas una fórmula con Σ, tradúcela mentalmente a{' '}
              <code className="font-mono text-cyan">total = 0; for i in range(n): total += x[i]</code> y el
              miedo desaparece.
            </P>
            <P>
              Último trámite: las letras griegas. No son magia, son solo nombres de variables. Este es el
              reparto que usarás en el curso:
            </P>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                    <th className="px-4 py-3">letra</th>
                    <th className="px-4 py-3">se lee</th>
                    <th className="px-4 py-3">en este curso significa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-muted">
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-violet"><TeX content="$\\theta$" /></td>
                    <td className="px-4 py-2.5">theta</td>
                    <td className="px-4 py-2.5">los <b className="text-ink">parámetros del modelo</b>: las «perillas» que el entrenamiento ajusta</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-cyan"><TeX content="$\\eta$" /></td>
                    <td className="px-4 py-2.5">eta</td>
                    <td className="px-4 py-2.5">la <b className="text-ink">tasa de aprendizaje</b> (learning rate): el tamaño de cada paso</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-amber"><TeX content="$\\lambda$" /></td>
                    <td className="px-4 py-2.5">lambda</td>
                    <td className="px-4 py-2.5">fuerza de la <b className="text-ink">regularización</b>: cuánto castigamos la complejidad</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-amber"><TeX content="$\\sigma$" /></td>
                    <td className="px-4 py-2.5">sigma</td>
                    <td className="px-4 py-2.5">la <b className="text-ink">desviación típica</b> (dispersión); también la sigmoide, la curva en forma de S</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-rose"><TeX content="$\\epsilon$" /></td>
                    <td className="px-4 py-2.5">epsilon</td>
                    <td className="px-4 py-2.5">un error o un número <b className="text-ink">muy pequeño</b> (ruido, tolerancia)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-rose"><TeX content="$\\mu$" /></td>
                    <td className="px-4 py-2.5">mu</td>
                    <td className="px-4 py-2.5">la <b className="text-ink">media</b>: el centro de los datos</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-rose"><TeX content="$\\nabla$" /></td>
                    <td className="px-4 py-2.5">nabla</td>
                    <td className="px-4 py-2.5">el <b className="text-ink">gradiente</b>: el vector de pendientes (lo verás en 0.05)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <QuizCard
              quizId="fund-cero-quiz-sumatoria"
              xp={10}
              question="Si la lista es $x = [2, 4, 6]$, ¿cuánto vale $\\sum_{i=1}^{3} x_i$?"
              options={[
                { text: '12', correct: true, explanation: '¡Eso es! 2 + 4 + 6 = 12. La Σ solo pedía sumar los tres elementos.' },
                { text: '48', correct: false, explanation: 'Eso sería multiplicarlos (2·4·6). Σ es SUMA; el producto tiene otro símbolo (Π).' },
                { text: '6', correct: false, explanation: 'Ese es solo el último elemento. La Σ acumula TODOS: 2 + 4 + 6.' },
                { text: '3', correct: false, explanation: 'Ese es el número de elementos, no su suma. La Σ suma los valores.' },
              ]}
            />
          </Section>

          {/* B0.4 · vectores */}
          <Section id="cero-vectores" kicker="// BLOQUE 0 · MATES DESDE CERO — 4/6" title="Vectores y matrices: listas y tablas de números">
            <P>
              Un <b className="text-cyan">vector</b> es una lista ordenada de números — tu array 1D de
              siempre. Una <b className="text-violet">matriz</b> es una tabla de números — un array 2D, o
              una lista de listas. Nada más exótico que eso. Y son ubicuos en ML: un dato real es un vector
              (una casa = <code className="font-mono text-cyan">[85, 3, 12]</code> → metros, habitaciones,
              antigüedad), y el dataset entero es una matriz con una fila por casa.
            </P>
            <P>
              Sumar vectores es sumar elemento a elemento. Pero la operación estrella, la que aparecerá
              cientos de veces en el curso, es el <b className="text-ink">producto escalar</b>: multiplica
              las parejas que ocupan la misma posición y suma los resultados. Visto con números no tiene
              ningún misterio:
            </P>
            <FormulaBlock
              formula="[1,\,2,\,3] \cdot [4,\,5,\,6] = 1{\cdot}4 \,+\, 2{\cdot}5 \,+\, 3{\cdot}6 = 4 + 10 + 18 = 32"
              caption="Producto escalar, paso a paso"
              breakdown={[
                { symbol: '1{\cdot}4', color: '#22D3EE', explanation: 'primera pareja: posición 1 de cada vector, multiplicadas' },
                { symbol: '2{\cdot}5', color: '#22D3EE', explanation: 'segunda pareja: 10' },
                { symbol: '3{\cdot}6', color: '#22D3EE', explanation: 'tercera pareja: 18' },
                { symbol: '32', color: '#A3E635', explanation: 'un único número: el producto escalar SIEMPRE devuelve un escalar, no un vector' },
              ]}
            />
            <P>
              ¿Y multiplicar una matriz por un vector? Es simplemente <b className="text-ink">un producto
              escalar por cada fila</b>: cada fila de la matriz se «enfrenta» al vector y produce un número;
              esos números forman el vector resultado.
            </P>
            <FormulaBlock
              formula="\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} \begin{bmatrix} 5 \\ 6 \end{bmatrix} = \begin{bmatrix} 1{\cdot}5 + 2{\cdot}6 \\ 3{\cdot}5 + 4{\cdot}6 \end{bmatrix} = \begin{bmatrix} 17 \\ 39 \end{bmatrix}"
              caption="Matriz × vector = un producto escalar por fila"
              breakdown={[
                { symbol: '1{\cdot}5 + 2{\cdot}6', color: '#8B5CF6', explanation: 'la fila 1 de la matriz, [1, 2], hace su producto escalar con el vector [5, 6]: 17' },
                { symbol: '3{\cdot}5 + 4{\cdot}6', color: '#22D3EE', explanation: 'la fila 2, [3, 4], hace lo mismo: 39' },
              ]}
            />
            <P>
              Esto, literalmente, es lo que hace un modelo lineal: la predicción{' '}
              <TeX content="$\\hat{y} = w \\cdot x + b$" /> es un producto escalar entre los pesos del modelo
              y tu dato, más un ajuste. En la sección 0.2 lo verás con una demo donde podrás arrastrar los
              vectores; por ahora quédate con la mecánica: <b className="text-lime">parejas multiplicadas y
              sumadas</b>.
            </P>
          </Section>

          {/* B0.5 · derivada */}
          <Section id="cero-derivada" kicker="// BLOQUE 0 · MATES DESDE CERO — 5/6" title="La derivada: la pendiente de una curva">
            <P>
              En una recta la pendiente es la misma en todas partes. En una curva, no: la parábola{' '}
              <TeX content="$x^2$" /> baja a la izquierda del todo, sube a la derecha y en el fondo está
              plana. La <b className="text-rose">derivada</b> es «la pendiente justo en este punto». ¿Y cómo
              se mide sin teoría de límites? Con el truco de siempre: toma dos puntos{' '}
              <b className="text-ink">muy cercanos</b> y calcula la pendiente entre ellos (subida ÷ avance),
              como hicimos con la recta.
            </P>
            <P>
              Con números: para <TeX content="$f(x) = x^2$" /> en <TeX content="$x = 2$" />, tenemos{' '}
              <TeX content="$f(2) = 4$" /> y <TeX content="$f(2.001) = 4.004001$" />. La pendiente entre
              ambos es <TeX content="$(4.004001 - 4) / 0.001 = 4.001 \\approx 4$" />. Y la regla de la
              potencia — una regla de tres líneas que se demuestra en cualquier curso de cálculo — dice que
              la derivada de <TeX content="$x^2$" /> es <TeX content="$2x$" />, que en{' '}
              <TeX content="$x = 2$" /> vale exactamente 4. Los números confirman la regla: cuanto más
              cercanos los dos puntos, mejor la aproximación.
            </P>
            <FormulaBlock
              formula="\frac{d}{dx}\,x^2 = 2x \qquad \text{comprobación: } \frac{f(2.001) - f(2)}{0.001} = \frac{4.004001 - 4}{0.001} = 4.001 \approx 2 \cdot 2"
              caption="La regla de la potencia, verificada a mano"
              breakdown={[
                { symbol: '\\frac{d}{dx}', color: '#FB7185', explanation: '«la pendiente de … respecto a x»: se lee «derivada de»' },
                { symbol: '2x', color: '#22D3EE', explanation: 'la pendiente de x² en cada punto: en x=2 vale 4, en x=−3 vale −6 (la curva baja), en x=0 vale 0 (punto plano)' },
                { symbol: '0.001', color: '#FBBF24', explanation: 'el pasito h: cuanto más pequeño, más se acerca la secante a la pendiente verdadera' },
              ]}
            />
            <P>
              Cuando la función depende de <b className="text-ink">varias letras</b> (en ML: la pérdida
              depende de miles de pesos), derivamos <b className="text-cyan">una letra a la vez</b> tratando
              las demás como si fueran números fijos — «congeladas». Eso es la derivada parcial, que se
              escribe con una <TeX content="$\\partial$" /> redonda en vez de <TeX content="$d$" />.
            </P>
            <FormulaBlock
              formula="f(w, b) = w^2 + 3b \quad\Longrightarrow\quad \frac{\partial f}{\partial w} = 2w, \qquad \frac{\partial f}{\partial b} = 3"
              caption="Derivadas parciales: una letra a la vez, el resto congeladas"
              breakdown={[
                { symbol: '\\frac{\\partial f}{\\partial w}', color: '#8B5CF6', explanation: '«¿cuánto cambia f si muevo SOLO w?»: b se congela como un número fijo, así que 3b desaparece y queda 2w' },
                { symbol: '\\frac{\\partial f}{\\partial b}', color: '#22D3EE', explanation: '«¿y si muevo SOLO b?»: w² se congela (derivada 0) y 3b deriva a 3' },
              ]}
            />
            <P>
              Última conexión: el <b className="text-lime">gradiente</b> es simplemente el vector que junta
              todas las derivadas parciales: <TeX content="$\\nabla L = (\\partial L/\\partial w,\\; \\partial L/\\partial b)$" />.
              Entrenar un modelo es bajar por la montaña de la pérdida usando ese vector como brújula — lo
              verás con demos en las secciones 0.3 y 0.6.
            </P>
            <QuizCard
              quizId="fund-cero-quiz-derivada"
              xp={10}
              question="¿Cuál es la pendiente (la derivada) de $x^2$ en el punto $x = 5$?"
              options={[
                { text: '25', correct: false, explanation: 'Ese es el VALOR de la función (5² = 25), no su pendiente. La derivada mide cuánto sube, no dónde estás.' },
                { text: '10', correct: true, explanation: 'Exacto: la derivada de x² es 2x, y en x = 5 vale 2·5 = 10. La curva sube rápido ahí.' },
                { text: '5', correct: false, explanation: 'Casi: la pendiente es 2x (el doble de x), no x. En x = 5 → 10.' },
                { text: '0', correct: false, explanation: 'Pendiente 0 solo hay en el fondo de la parábola (x = 0). En x = 5 la curva sube con fuerza.' },
              ]}
            />
          </Section>

          {/* B0.6 · probabilidad */}
          <Section id="cero-probabilidad" kicker="// BLOQUE 0 · MATES DESDE CERO — 6/6" title="Probabilidad desde cero: media, varianza y la campana">
            <P>
              Un <b className="text-cyan">experimento aleatorio</b> es algo cuyo resultado no puedes
              predecir: lanzar un dado, la próxima medición de un sensor, la altura de la siguiente persona
              que cruce la puerta. Si lo repites muchas veces y anotas los resultados, puedes resumir esa
              montaña de números con solo dos: dónde se centran y qué tan dispersos están.
            </P>
            <FormulaBlock
              formula="\bar{x} = \frac{1}{N}\sum_{i=1}^{N} x_i, \qquad \mathrm{Var}(x) = \frac{1}{N}\sum_{i=1}^{N} \left( x_i - \bar{x} \right)^2"
              caption="Media (el centro) y varianza (la dispersión)"
              breakdown={[
                { symbol: '\\bar{x}', color: '#FB7185', explanation: 'la media: «suma ÷ cuenta». Se lee «equis barra»' },
                { symbol: 'N', color: '#FBBF24', explanation: 'cuántos datos hay' },
                { symbol: 'x_i - \\bar{x}', color: '#22D3EE', explanation: 'la distancia de cada dato a la media (puede ser negativa)' },
                { symbol: '(\\cdot)^2', color: '#8B5CF6', explanation: 'al cuadrado: convierte las distancias en positivas y castiga más las grandes' },
                { symbol: '\\mathrm{Var}(x)', color: '#A3E635', explanation: 'la varianza: la media de esas distancias al cuadrado — «qué tan disperso»' },
              ]}
            />
            <P>
              Con números: para los datos <code className="font-mono text-cyan">[2, 4, 6]</code> la media es{' '}
              <TeX content="$(2+4+6)/3 = 4$" />. Las distancias a la media son −2, 0 y +2; al cuadrado, 4, 0
              y 4; y su media es <TeX content="$8/3 \\approx 2.67$" />: esa es la varianza. Su raíz cuadrada
              es la <b className="text-ink">desviación típica</b> <TeX content="$\\sigma = \\sqrt{2.67} \\approx 1.63$" />,
              que tiene las mismas unidades que los datos: una distancia «típica» a la media.
            </P>
            <P>
              Muchos fenómenos reales se apilan alrededor de un centro con forma de campana: es la{' '}
              <b className="text-violet">gaussiana</b> <TeX content="$\\mathcal{N}(\\mu, \\sigma^2)$" />,
              descrita por dos parámetros: <TeX content="$\\mu$" /> (la media: dónde se centra la campana)
              y <TeX content="$\\sigma$" /> (la desviación típica: cuánto se ensancha). Y tiene una regla de
              oro que te permite leer cualquier campana de un vistazo:
            </P>
            <FormulaBlock
              formula="P(\mu - \sigma \le x \le \mu + \sigma) \approx 68\%, \qquad P(\mu - 2\sigma \le x \le \mu + 2\sigma) \approx 95\%, \qquad P(\mu - 3\sigma \le x \le \mu + 3\sigma) \approx 99.7\%"
              caption="La regla 68-95-99.7"
              breakdown={[
                { symbol: 'P(\\dots)', color: '#22D3EE', explanation: '«la probabilidad de que ocurra …»: un número entre 0 y 1 (aquí en porcentaje)' },
                { symbol: '\\mu - \\sigma \\le x \\le \\mu + \\sigma', color: '#8B5CF6', explanation: '«x cae a lo sumo a una desviación típica de la media»' },
                { symbol: '68\\%', color: '#FBBF24', explanation: '≈ 2 de cada 3 datos caen a ±1σ; 95 % a ±2σ; casi todos (99.7 %) a ±3σ' },
              ]}
            />
            <P>
              Ejemplo completo: si las alturas siguen una campana con <TeX content="$\\mu = 170$" /> cm y{' '}
              <TeX content="$\\sigma = 10$" /> cm, entonces ≈ 68 % de la gente mide entre 160 y 180 cm, y ≈
              95 % entre 150 y 190 cm. Medir 2.10 m (a 4σ) es rarísimo. Por eso σ importa tanto:{' '}
              <b className="text-ink">te dice qué es normal y qué es raro</b>. En la sección 0.4 usaremos
              esta campana para modelar el ruido de los datos — con una demo interactiva.
            </P>
          </Section>

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
            <EnClaro>
              Recorre todos los ajustes posibles de las perillas y quédate con el que menos se equivoca,
              de media, sobre tus ejemplos. Todo el aprendizaje supervisado — de la regresión lineal a
              GPT — es esta misma frase, cambiando solo la máquina y el medidor de error.
            </EnClaro>
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
            <EnClaro>
              Todas las predicciones de golpe: cada fila de la tabla de datos hace su producto escalar
              con los pesos y se le suma el ajuste. Sale una lista con una predicción por ejemplo.
            </EnClaro>
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
            <EnClaro>
              Empaqueta en una lista el efecto de cada perilla sobre la pérdida. Esa lista señala cuesta
              arriba — hacia donde el error crece más rápido — así que para aprender caminaremos justo
              en dirección contraria.
            </EnClaro>
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
            <EnClaro>
              Multiplica la probabilidad que tu modelo asignaba a cada respuesta correcta y haz ese
              producto lo más grande posible. Como multiplicar miles de probabilidades es incómodo, se
              toman logaritmos (el producto se convierte en suma) y se minimiza el negativo: mismo
              objetivo, cuentas más fáciles.
            </EnClaro>
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
            <EnClaro>
              La predicción es la recta de la sección 0.02: multiplica la entrada por un peso y súmale un
              valor base. Entrenar es elegir esos dos números de la mejor manera posible.
            </EnClaro>
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
            <EnClaro>
              Para cada punto, mide la distancia vertical entre lo que decía la recta y lo que valía de
              verdad, elévala al cuadrado (para que todo sea positivo) y haz la media de todos los puntos.
              Un solo número: cuánto se equivoca la recta, de media.
            </EnClaro>
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
            <EnClaro>
              Para la recta existe una fórmula cerrada: metes todos tus datos en una tabla, haces unas
              cuantas multiplicaciones de matrices y sale directamente la mejor recta posible, sin
              iteraciones ni prueba y error.
            </EnClaro>
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
            <EnClaro>
              Estás en una montaña con niebla (la pérdida). Palpas el suelo para ver hacia dónde baja la
              pendiente y das un paso en esa dirección. Repites muchas veces. El tamaño del paso lo decides
              tú: pasos pequeños, lento pero seguro; pasos enormes, te pasas el valle de largo.
            </EnClaro>
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
              de una larga lista que culmina en Adam (Nivel 2).
            </P>
          </Section>

          {/* S7 · ejercicios */}
          <Section id="ejercicios" kicker="// 0.7 · PRÁCTICA" title="Ejercicios autocorregidos">
            <P>
              Tu código corre en <b className="text-ink">Python real (Pyodide)</b> dentro de esta página —
              solo numpy, sin sklearn. Pulsa <b className="text-ink">Corregir</b> para evaluarlo con tests
              ocultos; cada ejercicio superado suma XP a tu ruta. La rampa empieza suave: los ejercicios{' '}
              <b className="text-cyan">E0</b> traducen a código, bucle a bucle, las fórmulas del Bloque 0
              (la recta, la Σ, la media, el producto escalar y la derivada numérica).
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

          {/* S7b · proyecto práctico */}
          <Section id="proyecto" kicker="// 0.8 · PROYECTO PRÁCTICO" title="Proyecto: predice el precio de una vivienda">
            <P>
              Todo lo que has aprendido en este módulo —vectores, la función de pérdida, el descenso del
              gradiente— es exactamente lo que hace falta para un encargo real: una inmobiliaria quiere
              estimar el precio de sus anuncios a partir de la superficie, las habitaciones, la distancia
              al centro y la antigüedad. Es el mismo trabajo que harías con datos de un portal
              inmobiliario, solo que aquí el dataset lo genera una función con semilla fija (Pyodide no
              descarga archivos), con unidades y magnitudes realistas: precios en miles de euros.
            </P>
            <P>
              Lo importante es el <b className="text-ink">pipeline profesional</b>, no el dato en sí:
              explorar y medir correlaciones antes de modelar, separar train y test, normalizar usando
              solo las estadísticas del train para no contaminar la evaluación, y entrenar una regresión
              lineal multivariante con el mismo descenso del gradiente que programaste en los ejercicios.
              La prueba de fuego no es un número abstracto: es tasar una vivienda concreta de 100 m² y
              defender el precio que da tu modelo.
            </P>
            <P>
              Y como los datos reales nunca vienen limpios, la última parte ensucia el dataset a
              propósito —un 8 % de anuncios con el precio multiplicado por error— para que compruebes por
              ti mismo cómo el MSE se deja arrastrar y por qué en producción se usan pérdidas robustas
              como la de Huber. Es la conversación que tendrás en cualquier equipo de datos serio.
            </P>
            <div className="space-y-6">
              <ExerciseCard exercise={getExercise('fundamentos-housing-data')!} />
              <ExerciseCard exercise={getExercise('fundamentos-housing-gd')!} />
              <ExerciseCard exercise={getExercise('fundamentos-housing-outliers')!} />
            </div>
          </Section>

          {/* S8 · siguiente */}
          <section id="siguiente" className="scroll-mt-24 border-t border-line/60 py-14">
            <Link
              to="/modulos/ml-clasico"
              className="group block rounded-2xl border border-line bg-panel p-7 transition-all hover:-translate-y-1 hover:border-cyan/50 hover:shadow-glow-cyan"
            >
              <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
                // SIGUIENTE · NIVEL 1
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
