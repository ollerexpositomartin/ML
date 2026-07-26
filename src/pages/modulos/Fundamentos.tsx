/**
 * Fundamentos.tsx — Nivel 0: mates mínimas + regresión lineal + descenso
 * del gradiente. Demos: VectorDemo, DerivadaDemo, ProbDemo, GDPlayground.
 * Ejercicios: 8 (fund-*), quiz: 4. Layout con TOC lateral (ChapterNav).
 */

import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import ChapterNav from '@/components/ChapterNav'
import ModuleHero from '@/components/ModuleHero'
import Section, { P, TeX } from '@/components/Section'
import FormulaBlock from '@/components/FormulaBlock'
import Callout from '@/components/Callout'
import DemoFrame from '@/components/DemoFrame'
import ExerciseCard from '@/components/ExerciseCard'
import QuizCard from '@/components/QuizCard'
import { EnClaro, RepasoExpress, Simbolo, GlosarioSimbolos, MiniTabla, TriadDiagram } from '@/components/pedagogy'
import VectorDemo from '@/components/fundamentos/VectorDemo'
import DerivadaDemo from '@/components/fundamentos/DerivadaDemo'
import ProbDemo from '@/components/fundamentos/ProbDemo'
import GDPlayground from '@/components/fundamentos/GDPlayground'
import MSEDemo from '@/components/fundamentos/MSEDemo'
import { getExercise } from '@/lib/exercises'

const SECTIONS = [
  { id: 'cero-notacion', label: 'B0.1 Notación: cómo se leen las fórmulas' },
  { id: 'cero-numeros', label: 'B0.2 Números, ejes y funciones' },
  { id: 'cero-sumatorios', label: 'B0.3 Sumatorios y letras griegas' },
  { id: 'cero-potencias', label: 'B0.4 Potencias, raíces y logaritmos' },
  { id: 'cero-derivadas', label: 'B0.5 Derivadas desde cero' },
  { id: 'cero-probabilidad', label: 'B0.6 Probabilidad desde cero' },
  { id: 'aprender', label: '0.1 ¿Qué es aprender?' },
  { id: 'algebra', label: '0.2 Álgebra lineal' },
  { id: 'calculo', label: '0.3 Cálculo y gradiente' },
  { id: 'probabilidad', label: '0.4 Probabilidad y MLE' },
  { id: 'regresion', label: '0.5 Regresión lineal y MSE' },
  { id: 'gradiente', label: '0.6 Descenso del gradiente' },
  { id: 'ejercicios', label: '0.7 Ejercicios' },
  { id: 'proyecto', label: '0.8 Proyecto: vivienda' },
  { id: 'siguiente', label: '0.9 Siguiente nivel' },
]

export default function Fundamentos() {
  return (
    <>
      <ModuleHero
        level="N0"
        kicker="// NIVEL 0 · FUNDAMENTOS"
        title="Las mates que necesitas, sin relleno"
        abstract="Vectores, derivadas, probabilidad y tu primer modelo completo: la regresión lineal ajustada por descenso del gradiente. Cero matemáticas previas necesarias: construimos cada idea desde el suelo, con demos que puedes tocar."
        meta={{ duration: '3 h', demos: 5, exercises: 17, xp: 590 }}
        art="/art-fundamentos.png"
        color="#22D3EE"
      />

      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
          <ChapterNav sections={SECTIONS} />

          <div className="min-w-0 space-y-24">
            {/* ======== BLOQUE 0 · MATES DESDE CERO ======== */}
            <div className="relative">
              <div className="mb-8 rounded-2xl border border-cyan/25 bg-cyan/5 p-6">
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">// BLOQUE 0 · PRE-CARGA</div>
                <h2 className="mt-2 font-display text-2xl font-bold text-ink">Mates desde cero</h2>
                <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-muted">
                  ¿Hace años que no ves una fórmula — o nunca las viste? Este bloque es tu punto de partida real:
                  seis mini-secciones que construyen todo el lenguaje que usa el curso, suponiendo{' '}
                  <b className="text-ink">cero matemáticas previas</b>. Si ya las tienes frescas, salta directo a la 0.1.
                </p>
              </div>
            </div>

            {/* B0.1 · notacion */}
            <Section id="cero-notacion" kicker="// BLOQUE 0 · MATES DESDE CERO — 1/6" title="Cómo se lee una fórmula (y por qué no muerde)">
              <P>
                Una fórmula no es un conjuro: es una <b className="text-ink">frase comprimida</b>. Donde en
                castellano escribirías «suma todos los errores, divídelos entre cuántos hay y quédate con el
                promedio», las mates escriben <TeX content="$\frac{1}{N}\sum_{i=1}^{N} e_i$" />. Misma frase,
                menos tinta. Tu único trabajo aquí es aprender a <b className="text-cyan">descomprimirla</b>.
              </P>
              <P>
                Todo lo que verás en este curso usa cuatro piezas: <b className="text-ink">letras</b> que
                representan cantidades, <b className="text-ink">subíndices</b> que dicen «cuál en concreto»,
                <b className="text-ink">símbolos</b> que dicen qué hacer con ellas, y{' '}
                <b className="text-ink">letras griegas</b> para cantidades especiales. Vamos a ver cada una.
              </P>
              <MiniTabla
                title="Las 4 piezas de cualquier fórmula"
                rows={[
                  { cols: ['Letra (x, y, w…)', 'Una cantidad con nombre. Las primeras letras (a, b, w) suelen ser parámetros fijos; las últimas (x, y, z), datos.', '«w = 2» significa: la pendiente vale 2'] },
                  { cols: ['Subíndice (x₁, wᵢ…)', 'Cuál de varios. x₁ es «el primer dato», wᵢ es «el peso número i».', '«error₃» es el error del tercer ejemplo'] },
                  { cols: ['Símbolo (=, ≈, ≤…)', 'Qué relación hay. = es «es exactamente», ≈ es «vale aproximadamente», ≤ es «como mucho».', '«loss ≈ 0» es: el error es casi cero'] },
                  { cols: ['Griega (θ, σ, μ…)', 'Lo mismo que una letra normal, pero reservada por costumbre para ciertos papeles.', 'θ (theta): parámetros del modelo · σ (sigma): dispersión · μ (mu): media'] },
                ]}
              />
              <EnClaro>
                Cuando veas una fórmula, léela en voz alta por partes, de izquierda a derecha. «θ* = argmin…»
                se lee: «theta estrella es el valor de theta que hace mínimo…». Con eso ya has entendido el
                80 %. El resto es práctica.
              </EnClaro>
            </Section>

            {/* B0.2 · numeros */}
            <Section id="cero-numeros" kicker="// BLOQUE 0 · MATES DESDE CERO — 2/6" title="Números, ejes y funciones: el mapa del juego">
              <P>
                <b className="text-cyan">ℝ</b> es el conjunto de todos los números reales: enteros,
                decimales, negativos… cualquier punto de la recta numérica. <TeX content="$\mathbb{R}^2$" />{' '}
                son pares de números (un punto del plano) y <TeX content="$\mathbb{R}^d$" />, listas de d
                números. Cuando leas «x ∈ ℝ», lee «x es un número, de los de siempre».
              </P>
              <P>
                Una <b className="text-violet">función</b> <TeX content="$f$" /> es una máquina: le metes un
                número y devuelve otro. <TeX content="$f(x) = 2x$" /> significa «la máquina f, cuando recibe
                x, devuelve el doble». <TeX content="$f(3) = 6$" /> se lee «f de 3 es 6»: le metimos un 3 y
                salió un 6. Nada más.
              </P>
              <P>
                Dibujar una función es marcar, para cada entrada posible, qué salida da: el resultado es una{' '}
                <b className="text-ink">curva sobre los ejes</b>. En ML, «el error de mi modelo según el valor
                de un peso» es una función, y minimizarla es encontrar el punto más bajo de su curva.
              </P>
              <EnClaro>
                f(x) no es «f por x»: es «lo que devuelve la máquina f cuando le metes x». Y una gráfica es
                simplemente el listado completo de entradas y salidas, dibujado.
              </EnClaro>
            </Section>

            {/* B0.3 · sumatorios */}
            <Section id="cero-sumatorios" kicker="// BLOQUE 0 · MATES DESDE CERO — 3/6" title="Sumatorios, medias y letras griegas">
              <P>
                El símbolo <TeX content="$\sum$" /> (sigma mayúscula) significa <b className="text-cyan">«suma
                todo lo que sigue, cambiando el subíndice»</b>. Se lee en voz alta como un bucle:
                «suma, para i desde 1 hasta N, de x sub i». Es exactamente un <code className="font-mono text-cyan">for</code> que acumula.
              </P>
              <FormulaBlock
                formula="\sum_{i=1}^{N} x_i = x_1 + x_2 + \dots + x_N"
                caption="El sumatorio descomprimido: es un bucle for escrito bonito"
                breakdown={[
                  { symbol: '\\sum', color: '#22D3EE', explanation: '«suma todo lo siguiente»' },
                  { symbol: 'i=1 \; (abajo)', color: '#8B5CF6', explanation: 'el contador empieza en 1' },
                  { symbol: 'N \; (arriba)', color: '#FBBF24', explanation: '…y termina en N' },
                  { symbol: 'x_i', color: '#FB7185', explanation: 'lo que se suma en cada vuelta: el elemento i-ésimo' },
                ]}
              />
              <P>
                Con números de verdad: si tus datos son <code className="font-mono text-cyan">[4, 8, 6]</code>, entonces{' '}
                <TeX content="$\sum_{i=1}^{3} x_i = 4 + 8 + 6 = 18$" />. Y su <b className="text-lime">media</b> es esa suma
                dividida entre cuántos hay: <TeX content="$\bar{x} = \frac{1}{N}\sum_{i=1}^{N} x_i = 18 / 3 = 6$" />.
                Esa fórmula de la media, con la barra encima de la x, aparecerá cientos de veces.
              </P>
              <MiniTabla
                title="Griegas que verás constantemente"
                rows={[
                  { cols: ['Σ (sigma mayúscula)', 'Sumatorio: «suma todo esto»', 'Σxᵢ = suma de todos los datos'] },
                  { cols: ['σ (sigma minúscula)', 'Desviación típica: cuánto se dispersan los datos', 'σ = 2 → los datos varían «alrededor de 2»'] },
                  { cols: ['μ (mu)', 'La media de una distribución teórica', 'μ = 0 → campana centrada en cero'] },
                  { cols: ['θ (theta)', 'Los parámetros del modelo, todos juntos', 'θ = (w, b) en una recta'] },
                  { cols: ['η (eta)', 'Learning rate: el tamaño de cada paso', 'η = 0.1 → pasos pequeños'] },
                  { cols: ['ε (epsilon)', 'Un número pequeñísimo o el ruido', 'error ε ≈ 0'] },
                  { cols: ['λ (lambda)', 'Fuerza de la regularización (N1)', 'λ grande → pesos pequeños'] },
                  { cols: ['∂ (delta redonda)', 'Derivada parcial: pendiente respecto a UNA variable', '∂L/∂w: cómo cambia L si mueves w'] },
                ]}
              />
              <EnClaro>
                Σ es un bucle for disfrazado de letra griega. x̄ (x con barra) es la media de toda la vida:
                suma todo y divide entre cuántos hay.
              </EnClaro>
            </Section>

            {/* B0.4 · potencias */}
            <Section id="cero-potencias" kicker="// BLOQUE 0 · MATES DESDE CERO — 4/6" title="Potencias, raíces, exponenciales y logaritmos">
              <P>
                <b className="text-cyan">Potencias.</b> <TeX content="$x^2$" /> es «x multiplicada por sí
                misma». <TeX content="$x^3$" />, tres veces. <TeX content="$x^{-1} = 1/x$" /> (un exponente
                negativo significa «entre uno») y <TeX content="$x^{1/2} = \sqrt{x}$" /> (un exponente
                fraccionario es una raíz). La potencia estrella del ML es el cuadrado: elevar al cuadrado{' '}
                <b className="text-ink">convierte todo en positivo y castiga mucho más los errores grandes</b> —
                por eso el error cuadrático es el rey.
              </P>
              <P>
                <b className="text-violet">La exponencial</b> <TeX content="$e^x$" /> (también escrita{' '}
                <code className="font-mono text-cyan">exp(x)</code>) es la función que crece de forma
                proporcional a sí misma: aparece siempre que algo crece o decae suavemente (probabilidades,
                activaciones, difusión). <TeX content="$e \approx 2.718$" /> es solo un número, como π.
              </P>
              <P>
                <b className="text-rose">El logaritmo</b> es la pregunta inversa: <TeX content="$\ln(x)$" />{' '}
                significa «¿a qué potencia hay que elevar e para obtener x?». Si <TeX content="$e^2 \approx 7.39$" />,
                entonces <TeX content="$\ln(7.39) = 2$" />. Su superpoder en ML: convierte multiplicaciones en
                sumas (<TeX content="$\ln(a \cdot b) = \ln a + \ln b$" />) — y por eso la «log-verosimilitud» de
                la sección 0.4 hace los cálculos manejables. Además, log de un número entre 0 y 1 es{' '}
                <b className="text-ink">negativo</b>, y cuanto más cerca de 0, más negativo:{' '}
                <TeX content="$\ln(1) = 0$" />, <TeX content="$\ln(0.5) \approx -0.69$" />,{' '}
                <TeX content="$\ln(0.01) \approx -4.6$" />.
              </P>
              <MiniTabla
                title="Chuleta rápida"
                rows={[
                  { cols: ['x²', 'x por x; siempre ≥ 0', '3² = 9 y (−3)² = 9'] },
                  { cols: ['√x', 'lo inverso del cuadrado', '√9 = 3'] },
                  { cols: ['eˣ', 'crecimiento exponencial', 'e⁰ = 1, e¹ ≈ 2.72'] },
                  { cols: ['ln x', '¿e elevado a qué da x?', 'ln 1 = 0, ln e = 1'] },
                  { cols: ['|x|', 'valor absoluto: quita el signo', '|−5| = 5'] },
                ]}
              />
              <EnClaro>
                Elevar al cuadrado: todo positivo, los grandes más castigados. exp y ln son dos botones
                opuestos: uno infla, otro desinfla. Con eso ya entiendes el 90 % de las fórmulas de ML.
              </EnClaro>
            </Section>

            {/* B0.5 · derivadas */}
            <Section id="cero-derivadas" kicker="// BLOQUE 0 · MATES DESDE CERO — 5/6" title="Derivadas desde cero: la pendiente de una curva">
              <P>
                Imagina que subes una colina con los ojos vendados. No ves la cima, pero con los pies sientes
                si el suelo <b className="text-cyan">sube o baja, y con qué inclinación</b>. Esa inclinación
                en cada punto es la <b className="text-violet">derivada</b>: la pendiente de la curva en ese
                punto exacto. Si la pendiente es positiva, la curva sube hacia la derecha; si es negativa,
                baja; si es cero, estás en un punto llano (¡quizá el fondo del valle!).
              </P>
              <FormulaBlock
                formula="f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}"
                caption="La definición: la pendiente entre dos puntos, cuando están infinitamente juntos"
                breakdown={[
                  { symbol: 'f(x + h) - f(x)', color: '#22D3EE', explanation: 'cuánto sube la curva entre dos puntos cercanos' },
                  { symbol: 'h', color: '#8B5CF6', explanation: 'la distancia horizontal entre esos dos puntos' },
                  { symbol: '\\lim_{h \\to 0}', color: '#FBBF24', explanation: '«cuando h se hace microscópico»: la pendiente instantánea, en un punto' },
                  { symbol: "f'(x)", color: '#FB7185', explanation: 'así se escribe la derivada de f: «efe prima de equis»' },
                ]}
              />
              <P>
                La buena noticia: no hace falta calcular límites. Hay <b className="text-ink">reglas
                mecánicas</b> que te dan la derivada directamente, y en este curso solo necesitas tres:
              </P>
              <MiniTabla
                title="Las 3 reglas de derivación que usa todo el ML"
                rows={[
                  { cols: ['Potencia: (xⁿ)′ = n·xⁿ⁻¹', 'Baja el exponente y réstale 1', '(x²)′ = 2x · (x³)′ = 3x² · (x)′ = 1'] },
                  { cols: ['Constante: (c)′ = 0', 'Lo que no cambia no tiene pendiente', '(7)′ = 0 · (b)′ = 0 (si b es fija)'] },
                  { cols: ['Suma: (f + g)′ = f′ + g′', 'Deriva cada trozo por separado', '(x² + x)′ = 2x + 1'] },
                ]}
              />
              <P>
                Ejemplo completo: <TeX content="$f(x) = x^2$" /> tiene derivada <TeX content="$f'(x) = 2x$" />.
                En <TeX content="$x = 3$" /> la pendiente es 6 (sube fuerte); en <TeX content="$x = -1$" /> es{' '}
                −2 (baja suave); en <TeX content="$x = 0$" /> es 0: fondo del valle, mínimo de la parábola.{' '}
                <b className="text-ink">Encontrar dónde la derivada vale 0 es encontrar mínimos</b> — y
                minimizar funciones de error es TODO en machine learning.
              </P>
              <QuizCard
                quizId="fund-b0-derivada-1"
                xp={10}
                question="Si f(x) = x², ¿cuánto vale la pendiente de la curva en x = 5?"
                options={[
                  { text: '10', correct: true, explanation: "La regla de la potencia: (x²)' = 2x, así que en x = 5 la pendiente es 2 · 5 = 10." },
                  { text: '25', correct: false, explanation: 'Ese es f(5) = 5², la altura de la curva, no su pendiente. La derivada es 2x = 10.' },
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
                y 4; y su media es <TeX content="$8/3 \approx 2.67$" />: esa es la varianza. Su raíz cuadrada
                es la <b className="text-ink">desviación típica</b> <TeX content="$\sigma = \sqrt{2.67} \approx 1.63$" />,
                que tiene las mismas unidades que los datos: una distancia «típica» a la media.
              </P>
              <P>
                Muchos fenómenos reales se apilan alrededor de un centro con forma de campana: es la{' '}
                <b className="text-violet">gaussiana</b> <TeX content="$\mathcal{N}(\mu, \sigma^2)$" />,
                descrita por dos parámetros: <TeX content="$\mu$" /> (la media: dónde se centra la campana)
                y <TeX content="$\sigma$" /> (la desviación típica: cuánto se ensancha). Y tiene una regla de
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
                Ejemplo completo: si las alturas siguen una campana con <TeX content="$\mu = 170$" /> cm y{' '}
                <TeX content="$\sigma = 10$" /> cm, entonces ≈ 68 % de la gente mide entre 160 y 180 cm, y ≈
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
                (la forma del modelo, con parámetros <TeX content="$\theta$" />), una{' '}
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
                matriz <TeX content="$X \in \mathbb{R}^{N \times d}$" /> donde cada fila es un ejemplo y cada
                columna una característica.
              </P>
              <P>
                La operación estrella es el <b className="text-violet">producto escalar</b>: mide cuánto se
                parecen dos vectores. Si <TeX content="$w$" /> son los pesos de un modelo y{' '}
                <TeX content="$x$" /> un dato, <TeX content="$w \cdot x$" /> es literalmente «cuánto vota cada
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
