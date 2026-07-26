/**
 * Página · Redes Neuronales — /modulos/redes-neuronales (N2)
 * Perceptrón → MLP → activaciones → backpropagation → playground TF.js → optimizadores.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { InlineMath } from 'react-katex'
import ModuleHero from '@/components/ModuleHero'
import ChapterNav from '@/components/ChapterNav'
import FormulaBlock from '@/components/FormulaBlock'
import ExerciseCard from '@/components/ExerciseCard'
import QuizCard from '@/components/QuizCard'
import { TeXParagraphs } from '@/lib/katex-content'
import { getExercise, registerExercises } from '@/lib/exercises'
import { REDES_NEURONALES_EXERCISES } from '@/data/exercises/redes-neuronales'
import NeuronaDemo from '@/components/redes/NeuronaDemo'
import ActivacionesDemo from '@/components/redes/ActivacionesDemo'
import ArquitectoDemo from '@/components/redes/ArquitectoDemo'
import BackpropDemo from '@/components/redes/BackpropDemo'
import PlaygroundDemo from '@/components/redes/PlaygroundDemo'
import CarreraDemo from '@/components/redes/CarreraDemo'

registerExercises(REDES_NEURONALES_EXERCISES)

const SECTIONS = [
  { id: 'idea', label: '2.A La idea sin fórmulas' },
  { id: 'repaso', label: '2.B Repaso exprés' },
  { id: 'glosario', label: '2.C Glosario de símbolos' },
  { id: 'neurona', label: '2.1 La neurona' },
  { id: 'activaciones', label: '2.2 Activaciones' },
  { id: 'forward', label: '2.3 Forward pass' },
  { id: 'backprop', label: '2.4 Backpropagation' },
  { id: 'playground', label: '2.5 El patio de juegos' },
  { id: 'optimizadores', label: '2.6 Optimizadores' },
  { id: 'ejercicios', label: '2.7 Ejercicios' },
  { id: 'proyecto', label: '2.8 Proyecto: mini-MNIST' },
]

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <span className="mb-3 inline-block rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
        {kicker}
      </span>
      <h2 className="font-display text-[clamp(2rem,3.6vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-ink">
        {title}
      </h2>
    </div>
  )
}

function Prose({ content }: { content: string }) {
  return <TeXParagraphs content={content} className="mb-6 max-w-[720px] text-base leading-[1.75] text-muted" />
}

/** Aviso antes de una fórmula: qué hace, sin notación. */
function Llano({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 max-w-[720px] rounded-lg border-l-2 border-lime/60 bg-lime/5 px-4 py-3">
      <div className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-lime">// en castellano llano</div>
      <p className="text-sm leading-relaxed text-muted">{children}</p>
    </div>
  )
}

/** Checklist de prerrequisitos con enlace al módulo donde se explican. */
function Repaso({ items }: { items: { q: string; d: string; to: string; toLabel: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((r) => (
        <div key={r.q} className="rounded-xl border border-line bg-panel px-5 py-4 transition-all hover:-translate-y-1 hover:border-cyan/50">
          <div className="mb-1.5 font-display text-sm font-semibold text-ink">{r.q}</div>
          <p className="mb-2 text-xs leading-relaxed text-muted">{r.d}</p>
          <Link to={r.to} className="font-mono text-xs text-cyan transition-colors hover:text-ink">
            → {r.toLabel}
          </Link>
        </div>
      ))}
    </div>
  )
}

/** Tarjetas símbolo → significado en una línea. */
function Glosario({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([sym, desc]) => (
        <div key={sym} className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          <span className="inline-flex min-w-[2.75rem] shrink-0 justify-center rounded-md border border-violet/40 bg-violet/10 px-2 py-1 font-mono text-sm text-violet">
            <InlineMath math={sym} />
          </span>
          <span className="text-xs leading-relaxed text-muted">{desc}</span>
        </div>
      ))}
    </div>
  )
}

export default function RedesNeuronales() {
  return (
    <>
      <ModuleHero
        level="N2"
        kicker="// NIVEL 2 · DEEP LEARNING I"
        title="Redes neuronales: de una neurona al aprendizaje profundo"
        abstract="Apila neuronas y aparece la magia: cualquier función puede aproximarse. Pero entrenarla exige el algoritmo más importante del siglo: backpropagation. Aquí lo derivas, lo ves fluir y lo implementas."
        meta={{ duration: '≈ 5 h', demos: 6, exercises: 9, xp: 820 }}
        art="/art-redes.png"
        color="#8B5CF6"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 py-16 md:px-6 md:py-20">
        <ChapterNav sections={SECTIONS} />

        <div className="min-w-0 max-w-[860px] flex-1 space-y-28">
          {/* S0a · La idea sin fórmulas */}
          <section id="idea">
            <SectionHead kicker="// 2.A · antes de empezar" title="La idea sin fórmulas" />
            <Prose content={String.raw`Una red neuronal es, en el fondo, **una función gigante construida encadenando muchas funciones pequeñas** — como cuando en tu código haces «f(g(h(x)))». Cada "neurona" es una operación de lo más simple: multiplica cada entrada por un número que indica cuánto le importa (su **peso**), suma todo, le añade un pequeño ajuste y decide cuánta señal deja pasar. Apilar neuronas en capas es componer esas funciones una tras otra.

¿Y "aprender"? Los pesos son **tornillos ajustables**. Entrenar es girar esos tornillos una y otra vez, poquito a poco, hasta que la salida de la red se acerca a la respuesta correcta en todos los ejemplos que le enseñas. No hay magia: es prueba y error guiada.

La pieza genial es **backpropagation**: cuando la red se equivoca, ¿cómo sabes qué tornillo tiene la culpa y cuánto? Backprop reparte la culpa del error hacia atrás, capa por capa, como quien revisa una cadena de montaje desde el final buscando dónde se estropeó la pieza. Y el "descenso de gradiente" no es más que la regla de girar cada tornillo en la dirección que baja el error. Todo lo demás de este módulo son detalles — importantes, pero detalles — de esta idea.`} />
          </section>

          {/* S0b · Repaso exprés */}
          <section id="repaso">
            <SectionHead kicker="// 2.B · prerrequisitos en 1 minuto" title="Repaso exprés" />
            <Prose content={String.raw`No necesitas más matemáticas que estas cinco ideas. Si alguna te suena a chino, pulsa el enlace: el módulo Fundamentos la explica desde cero.`} />
            <Repaso items={[
              { q: '¿Qué es un vector?', d: 'Una lista ordenada de números: literalmente un array. Los datos de entrada de la red son eso.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué es una matriz?', d: 'Una tabla de números. Multiplicar una matriz por un vector es "combinar sus filas con pesos": lo que hace cada capa.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué es una derivada?', d: 'Cuánto cambia la salida si mueves la entrada un poquitín. Es la brújula que dice en qué dirección baja el error.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué significa Σ (sumatorio)?', d: 'Un bucle for que acumula una suma. Σᵢ wᵢxᵢ es: for i: total += w[i]*x[i].', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Recuerdas el descenso de gradiente?', d: 'Ajustar los tornillos bajando por la pendiente del error, paso a paso. Ya lo usaste para ajustar una recta.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Y la regresión lineal?', d: 'Predecir un número combinando las entradas con pesos. Una neurona es casi eso, más una decisión no lineal al final.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
            ]} />
          </section>

          {/* S0c · Glosario */}
          <section id="glosario">
            <SectionHead kicker="// 2.C · diccionario del módulo" title="Glosario de símbolos" />
            <Prose content={String.raw`Cada letra griega o símbolo raro que verás en esta página, traducido en una línea. Vuelve aquí cuando te pierdas.`} />
            <Glosario items={[
              [String.raw`\sigma`, 'sigmoide: aplasta cualquier número al rango 0–1 (útil como probabilidad o interruptor suave)'],
              [String.raw`\varphi`, 'función de activación: la "decisión" no lineal de la neurona (ReLU, tanh, GELU…)'],
              [String.raw`w,\ W`, 'pesos: los tornillos ajustables; cuánto importa cada conexión'],
              [String.raw`b`, 'sesgo: un ajuste fijo que desplaza el punto de disparo de la neurona'],
              [String.raw`z`, 'la suma ponderada ANTES de aplicar la activación'],
              [String.raw`a`, 'la salida de la neurona o capa, ya con la activación aplicada'],
              [String.raw`\delta`, 'culpa: cuánto contribuye cada neurona al error final'],
              [String.raw`\eta`, 'learning rate: el tamaño de cada giro de tornillo'],
              [String.raw`\nabla L`, 'gradiente: la dirección en la que el error sube más rápido (se usa para ir en dirección contraria)'],
              [String.raw`\odot`, 'multiplicar dos listas elemento a elemento (como zip con * en Python)'],
              [String.raw`\beta`, 'factor de memoria del optimizador: cuánto pesa el pasado reciente'],
              [String.raw`\sum`, 'sumatorio: un bucle que suma; ∏ (productorio) es un bucle que multiplica'],
            ]} />
          </section>

          {/* S1 · La neurona */}
          <section id="neurona">
            <SectionHead kicker="// 2.1 · teoría + demo" title="La neurona" />
            <Prose content={String.raw`La inspiración biológica es solo eso, una inspiración: una neurona artificial no imita al cerebro, es una **máquina matemática** minimalista. Toma unas entradas, las combina linealmente con unos pesos, añade un sesgo y pasa el resultado por una función no lineal. Nada más — y sin embargo, es suficiente.

La fórmula completa cabe en una línea: $z = \sum_i w_i x_i + b$ y $a = \varphi(z)$. Una neurona es un **modelo lineal seguido de una no-linealidad**. Lo extraordinario llega al apilarlas: el teorema de aproximación universal garantiza que con una sola capa oculta suficientemente ancha puedes aproximar cualquier función continua. La pregunta del millón no es si puede, sino cómo encontrar los pesos.`} />
            <Llano>
              Una neurona hace solo dos cosas: multiplica cada entrada por su importancia y suma todo (eso es z);
              después decide cuánta señal deja pasar (eso es a). La fórmula de abajo dice exactamente eso, ni más ni menos.
            </Llano>
            <FormulaBlock
              formula={String.raw`z = \sum_{i=1}^{d} w_i x_i + b, \qquad a = \varphi(z)`}
              caption="La neurona: combinación lineal + no-linealidad"
              breakdown={[
                { symbol: 'x_i', color: '#22D3EE', explanation: 'entradas (los datos)' },
                { symbol: 'w_i', color: '#8B5CF6', explanation: 'pesos: cuánto importa cada entrada' },
                { symbol: 'b', color: '#8B5CF6', explanation: 'sesgo: desplaza el umbral de disparo' },
                { symbol: '\\varphi', color: '#A3E635', explanation: 'activación no lineal (ReLU, tanh, σ…)' },
                { symbol: 'a', color: '#A3E635', explanation: 'salida de la neurona' },
              ]}
            />
            <div className="mt-8">
              <NeuronaDemo />
            </div>
          </section>

          {/* S2 · Activaciones */}
          <section id="activaciones">
            <SectionHead kicker="// 2.2 · la chispa no lineal" title="Funciones de activación" />
            <Prose content={String.raw`Sin no-linealidad, una red de 100 capas es exactamente equivalente a una de una: la composición de funciones lineales es lineal. La activación es lo que rompe esa trivialidad y permite que cada capa construya representaciones más abstractas.

La **sigmoide** y **tanh** dominaron los 90, pero saturan: con $|z|$ grande su gradiente se desvanece y el aprendizaje se congela. **ReLU** ($\max(0, z)$) lo arregló con una derivada que vale 1 en todo el semieje positivo — a costa del riesgo de *ReLU moribunda* (si una neurona queda siempre en zona cero, nunca recibe gradiente; Leaky ReLU la resucita con una pendiente pequeña). **GELU**, $z \cdot \Phi(z)$, es hoy la estándar en Transformers: una ReLU suavizada con puerta probabilística. **Swish** ($z \cdot \sigma(z)$), descubierta por búsqueda automática, compite con ella.`} />
            <Llano>
              En vez de cortar la señal de golpe como hace ReLU (todo lo negativo se apaga), GELU la atenúa
              suavemente según su tamaño: las señales grandes pasan casi enteras y las negativas se van
              apagando poco a poco. Es una ReLU con modales.
            </Llano>
            <FormulaBlock
              formula={String.raw`\mathrm{GELU}(z) = z \cdot \Phi(z) \approx z \cdot \sigma(1.702\,z)`}
              caption="GELU: la activación de los Transformers (Φ = CDF de la normal)"
              breakdown={[
                { symbol: '\\Phi(z)', color: '#22D3EE', explanation: 'probabilidad acumulada: puerta suave en vez de corte duro' },
                { symbol: 'z \\cdot \\Phi(z)', color: '#A3E635', explanation: 'la entrada se modula a sí misma' },
              ]}
            />
            <div className="mt-8">
              <ActivacionesDemo />
            </div>
          </section>

          {/* S3 · Forward */}
          <section id="forward">
            <SectionHead kicker="// 2.3 · la red completa" title="Forward pass" />
            <Prose content={String.raw`Apilar capas es componer transformaciones. En notación matricial, cada capa es un producto de matrices más una activación elemento a elemento. La **disciplina de formas** es tu mejor amiga: si $a^{(l-1)} \in \mathbb{R}^{n_{l-1}}$, entonces $W^{(l)} \in \mathbb{R}^{n_l \times n_{l-1}}$ y $b^{(l)} \in \mathbb{R}^{n_l}$. Cualquier bug de dimensiones se detecta en 10 segundos contando formas.

La profundidad no es solo más potencia bruta: es **composicionalidad**. Las primeras capas aprenden features simples (bordes, frecuencias), las intermedias las combinan (formas, fonemas) y las profundas, conceptos. Contar parámetros también es fácil: cada capa aporta $(n_{l-1} + 1) \cdot n_l$ pesos — el +1 es el sesgo por neurona.`} />
            <Llano>
              Es la misma operación de la neurona, pero hecha para todas las neuronas de la capa a la vez:
              cada fila de la tabla W guarda las importancias de una neurona. Lo que sería un bucle sobre
              neuronas se convierte en una sola multiplicación de matriz por vector.
            </Llano>
            <FormulaBlock
              formula={String.raw`z^{(l)} = W^{(l)} a^{(l-1)} + b^{(l)}, \qquad a^{(l)} = \varphi\!\left(z^{(l)}\right)`}
              caption="Una capa densa en forma matricial"
              breakdown={[
                { symbol: 'W^{(l)} \\in \\mathbb{R}^{n_l \\times n_{l-1}}', color: '#8B5CF6', explanation: 'matriz de pesos de la capa l' },
                { symbol: 'a^{(l-1)}', color: '#22D3EE', explanation: 'activaciones de la capa anterior' },
                { symbol: 'z^{(l)}', color: '#FBBF24', explanation: 'pre-activación (antes de φ)' },
                { symbol: '\\varphi', color: '#A3E635', explanation: 'activación, aplicada elemento a elemento' },
              ]}
            />
            <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-faint">
                    <th className="px-4 py-2.5 uppercase tracking-wider">objeto</th>
                    <th className="px-4 py-2.5 uppercase tracking-wider">forma</th>
                    <th className="px-4 py-2.5 uppercase tracking-wider">ejemplo (3→4)</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  {[
                    ['a⁽ˡ⁻¹⁾', 'n_{l-1}', '3'],
                    ['W⁽ˡ⁾', 'n_l × n_{l-1}', '4 × 3 = 12'],
                    ['b⁽ˡ⁾', 'n_l', '4'],
                    ['z⁽ˡ⁾, a⁽ˡ⁾', 'n_l', '4'],
                    ['parámetros de la capa', '(n_{l-1}+1)·n_l', '16'],
                  ].map(([o, s, e]) => (
                    <tr key={o} className="border-b border-line/50 last:border-0">
                      <td className="px-4 py-2 text-ink">{o}</td>
                      <td className="px-4 py-2 text-cyan">{s}</td>
                      <td className="px-4 py-2 text-violet">{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8">
              <ArquitectoDemo />
            </div>
          </section>

          {/* S4 · Backprop */}
          <section id="backprop">
            <SectionHead kicker="// 2.4 · el algoritmo del siglo" title="Backpropagation" />
            <Prose content={String.raw`Backpropagation no es más que la **regla de la cadena aplicada con inteligencia**: en vez de derivar la pérdida respecto a cada peso por separado (coste exponencial), calcula el error de cada capa una sola vez y lo reutiliza hacia atrás. El error de salida $\delta^{(L)}$ se propaga multiplicando por las matrices transpuestas y por la derivada local de cada activación.

El resultado: el coste de calcular TODOS los gradientes es comparable a UN solo forward. Esa eficiencia es la razón por la que el deep learning es posible.`} />
            <Llano>
              Dos reglas que se repiten capa a capa, de atrás hacia delante: la segunda reparte la culpa
              del error a cada capa según lo que aportó, y la primera convierte esa culpa en el ajuste
              concreto de cada peso. Con eso, cada tornillo sabe exactamente cuánto girar.
            </Llano>
            <FormulaBlock
              formula={String.raw`\frac{\partial L}{\partial W^{(l)}} = \delta^{(l)} \left(a^{(l-1)}\right)^{\top}, \qquad \delta^{(l)} = \left(W^{(l+1)\top} \delta^{(l+1)}\right) \odot \varphi'\!\left(z^{(l)}\right)`}
              caption="Las dos ecuaciones de backprop"
              breakdown={[
                { symbol: '\\delta^{(l)}', color: '#FB7185', explanation: 'error de la capa l: ∂L/∂z⁽ˡ⁾' },
                { symbol: 'W^{(l+1)\\top} \\delta^{(l+1)}', color: '#FB7185', explanation: 'el error heredado de la capa siguiente' },
                { symbol: "\\varphi'(z^{(l)})", color: '#A3E635', explanation: 'la derivada local filtra cuánto error pasa' },
                { symbol: '\\odot', color: '#FBBF24', explanation: 'producto elemento a elemento' },
              ]}
            />
            <details className="group mt-6 rounded-xl border border-line bg-panel">
              <summary className="cursor-pointer px-6 py-4 font-mono text-sm text-cyan transition-colors hover:text-ink">
                ▸ Ejemplo numérico completo (red 2-2-1, 6 pasos)
              </summary>
              <div className="border-t border-line px-6 py-5 text-sm leading-relaxed text-muted">
                <TeXParagraphs content={String.raw`Con $x = (0.8, -0.4)$, $y = 1$, activación tanh en la oculta y sigmoide en la salida, $L = \tfrac{1}{2}(\hat{y} - y)^2$:

**1.** $z^{(1)} = W^{(1)\top}x + b^{(1)}$ — cada neurona oculta calcula su suma ponderada.

**2.** $a^{(1)} = \tanh(z^{(1)})$ — la no-linealidad produce las activaciones.

**3.** $z^{(2)} = W^{(2)\top}a^{(1)} + b^{(2)}$, $\hat{y} = \sigma(z^{(2)})$ — la salida predice una probabilidad.

**4.** $L = \tfrac{1}{2}(\hat{y} - 1)^2$ — medimos el error contra el objetivo.

**5.** $\delta^{(2)} = (\hat{y} - y)\,\sigma'(z^{(2)})$ — el error nace en la salida.

**6.** $\delta^{(1)} = (W^{(2)}\delta^{(2)}) \odot (1 - (a^{(1)})^2)$, y con los δ calculamos $\partial L/\partial W^{(l)} = a^{(l-1)}\delta^{(l)}$.

La demo de abajo ejecuta exactamente estos seis pasos, con los números reales apareciendo nodo a nodo. Termina con la actualización $\theta \leftarrow \theta - \eta \nabla_\theta L$.

**Truco profesional — gradient check**: para depurar tu propio backprop, compara cada gradiente analítico con la aproximación numérica $dW \approx \frac{L(\theta+\varepsilon) - L(\theta-\varepsilon)}{2\varepsilon}$. Si coinciden a ~$10^{-4}$, tu derivación es correcta. El ejercicio E4 te corrige exactamente así.`} />
              </div>
            </details>
            <div className="mt-8">
              <BackpropDemo />
            </div>
          </section>

          {/* S5 · Playground */}
          <section id="playground">
            <SectionHead kicker="// 2.5 · demo estrella" title="El patio de juegos" />
            <Prose content={String.raw`Todo lo anterior cobra vida aquí: una red real entrenándose **en tu navegador con TensorFlow.js**. Elige un dataset, diseña la arquitectura, ajusta η y la regularización L2, y observa cómo la frontera de decisión se esculpe época a época.

Experimentos que merecen la pena: XOR con 1 capa oculta de 2 neuronas (justo en el límite), la espiral con ReLU y pocas neuronas (fronteras angulosas que no generalizan), demasiado L2 (la frontera se aplana y no clasifica nada), y η grande (la pérdida oscila).`} />
            <PlaygroundDemo />
          </section>

          {/* S6 · Optimizadores */}
          <section id="optimizadores">
            <SectionHead kicker="// 2.6 · bajar la montaña con estilo" title="Optimizadores y trucos" />
            <Prose content={String.raw`SGD puro es frágil: en valles alargados oscila de pared a pared y avanza lentísimo. **Momentum** acumula una velocidad que suaviza las oscilaciones y acelera en las direcciones consistentes — como una bola con inercia. **Adam** va más allá: mantiene una media del gradiente ($m$) y de su cuadrado ($v$), corrige el sesgo de inicialización y divide cada coordenada por su escala típica. Es el optimizador por defecto del deep learning moderno.`} />
            <Llano>
              En vez de moverte solo según la pendiente de hoy, guarda inercia: como una bola rodando cuesta
              abajo, los empujones en la misma dirección se acumulan y el zigzag lateral se cancela solo.
            </Llano>
            <FormulaBlock
              formula={String.raw`v \leftarrow \beta v - \eta \nabla L, \qquad \theta \leftarrow \theta + v`}
              caption="Momentum: el gradiente se convierte en aceleración, no en paso"
              breakdown={[
                { symbol: 'v', color: '#8B5CF6', explanation: 'velocidad acumulada (β ≈ 0.9)' },
                { symbol: '\\eta', color: '#22D3EE', explanation: 'learning rate' },
                { symbol: '\\nabla L', color: '#FB7185', explanation: 'gradiente actual' },
              ]}
            />
            <Llano>
              Adam lleva dos promedios móviles: hacia dónde sopla el viento (m) y cuánto de racheado es (v).
              Con ellos ajusta cada tornillo a su ritmo: pasos grandes donde la señal es estable, pasos
              pequeños donde es caótica. Los sombreros (^) solo corrigen que esos promedios empiezan en cero.
            </Llano>
            <FormulaBlock
              formula={String.raw`\hat{m} = \frac{m}{1-\beta_1^t}, \quad \hat{v} = \frac{v}{1-\beta_2^t}, \qquad \theta \leftarrow \theta - \eta \frac{\hat{m}}{\sqrt{\hat{v}} + \varepsilon}`}
              caption="Adam con corrección de sesgo"
              breakdown={[
                { symbol: 'm', color: '#8B5CF6', explanation: 'media exponencial del gradiente (β₁=0.9)' },
                { symbol: 'v', color: '#22D3EE', explanation: 'media exponencial del gradiente² (β₂=0.999)' },
                { symbol: '\\hat{m}, \\hat{v}', color: '#A3E635', explanation: 'corregidos: al inicio m y v están sesgados a 0' },
              ]}
              className="mt-6"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { t: 'Inicialización He / Xavier', d: String.raw`Arrancar con $\mathrm{Var}(w) = 2/n_{in}$ (He, para ReLU) o $1/n_{in}$ (Xavier, para tanh) mantiene la varianza de las activaciones estable a lo largo de la profundidad — sin explosiones ni desvanecimientos desde el paso 0.` },
                { t: 'Gradientes que se desvanecen o explotan', d: String.raw`Multiplicar decenas de derivadas < 1 mata la señal; > 1 la hace estallar. Curas: buenas inicializaciones, activaciones bien portadas, gradient clipping y conexiones residuales (las verás en CNN).` },
                { t: 'Dropout', d: String.raw`En cada paso de entrenamiento apaga neuronas al azar con probabilidad $p$: fuerza redundancia y evita co-adaptaciones. En inferencia se usa la red completa con las salidas escaladas.` },
                { t: 'Learning rate schedules', d: String.raw`η no es eterno: decay por pasos, coseno o warmup. Empezar alto explora el paisaje; terminar bajo refina el mínimo. BatchNorm, además, re-normaliza activaciones entre capas y permite η mayores.` },
              ].map((c) => (
                <div key={c.t} className="rounded-xl border border-line bg-panel px-5 py-4 transition-all hover:-translate-y-1 hover:border-violet/50">
                  <div className="mb-1.5 font-display text-sm font-semibold text-ink">{c.t}</div>
                  <TeXParagraphs content={c.d} className="text-xs leading-relaxed text-muted" />
                </div>
              ))}
            </div>
            <div className="mt-8">
              <CarreraDemo />
            </div>
          </section>

          {/* S7 · Ejercicios */}
          <section id="ejercicios">
            <SectionHead kicker="// 2.7 · demuestra lo aprendido" title="Ejercicios autocorregidos" />
            <Prose content={String.raw`Python real (numpy) ejecutándose en tu navegador. Escribe la solución, pulsa **Corregir** y un harness de tests ocultos la evalúa al instante. El ejercicio E4 es el jefe del nivel: tu backprop se valida con gradient check numérico, parámetro a parámetro.`} />
            <div className="space-y-6">
              {REDES_NEURONALES_EXERCISES.map((ex) => (
                <ExerciseCard key={ex.id} exercise={getExercise(ex.id)!} />
              ))}
            </div>

            <h3 className="mb-4 mt-12 font-display text-xl font-semibold text-ink">
              Q1 · Chequeo conceptual
            </h3>
            <div className="space-y-4">
              <QuizCard
                quizId="redes-quiz-1"
                xp={10}
                question="¿Por qué una red sin activaciones no lineales no gana expresividad al apilar capas?"
                options={[
                  { text: 'Porque el gradiente se desvanece con muchas capas', correct: false, explanation: 'El desvanecimiento es un problema de entrenamiento, no el motivo por el que apilar lineales no aporta. La composición de funciones lineales sigue siendo lineal.' },
                  { text: "Porque la composición de funciones lineales es una función lineal", correct: true, explanation: String.raw`Exacto: $W_2(W_1 x) = (W_2 W_1)x = W'x$. Sin $\varphi$ no lineal, 100 capas equivalen a 1.` },
                  { text: 'Porque sin activación no hay sesgo', correct: false, explanation: 'El sesgo existe igualmente en una red lineal. Lo que falta sin φ es la capacidad de representar funciones no lineales.' },
                  { text: 'Porque las activaciones reducen el número de parámetros', correct: false, explanation: 'Las activaciones no cambian el número de parámetros; cambian la clase de funciones que la red puede representar.' },
                ]}
              />
              <QuizCard
                quizId="redes-quiz-2"
                xp={10}
                question="¿Qué problema del SGD clásico alivia principalmente el momentum?"
                options={[
                  { text: 'El overfitting en datasets pequeños', correct: false, explanation: 'Momentum no es un regularizador: acelera la optimización. Para overfitting están L2, dropout o augmentation.' },
                  { text: 'Las oscilaciones en valles estrechos (barrancos)', correct: true, explanation: 'Correcto: la velocidad acumulada promedia las direcciones de los gradientes, cancelando el zigzag y acelerando a lo largo del valle.' },
                  { text: 'La elección del learning rate', correct: false, explanation: 'η sigue siendo necesario con momentum. Adam es quien adapta la escala por coordenada.' },
                  { text: 'El desvanecimiento del gradiente', correct: false, explanation: 'El desvanecimiento se ataca con activaciones adecuadas, inicialización y conexiones residuales, no con momentum.' },
                ]}
              />
              <QuizCard
                quizId="redes-quiz-3"
                xp={10}
                question={String.raw`¿Por qué la inicialización de He usa $\mathrm{Var}(w) = 2/n_{in}$ específicamente con ReLU?`}
                options={[
                  { text: 'Porque ReLU duplica la varianza de las activaciones', correct: false, explanation: 'Al contrario: ReLU pone a cero aproximadamente la mitad de las activaciones, reduciendo la varianza a la mitad. El factor 2 lo compensa.' },
                  { text: 'Porque ReLU anula la mitad de las activaciones y el factor 2 compensa la varianza perdida', correct: true, explanation: String.raw`Exacto. Con tanh o sigmoide se usa Xavier ($1/n_{in}$), porque no anulan salidas.` },
                  { text: 'Porque evita que la ReLU muera en el primer paso', correct: false, explanation: 'He-init no previene directamente la ReLU moribunda; mantiene la varianza de activaciones y gradientes estable en profundidad.' },
                  { text: 'Es solo una convención histórica sin justificación', correct: false, explanation: 'Tiene una derivación exacta: igualar la varianza de la salida de cada capa con la de su entrada asumiendo ReLU.' },
                ]}
              />
              <QuizCard
                quizId="redes-quiz-4"
                xp={10}
                question="¿Qué hace dropout durante la inferencia?"
                options={[
                  { text: 'Apaga las mismas neuronas que en el último paso de entrenamiento', correct: false, explanation: 'No: en inferencia se usa la red COMPLETA. Lo que se hace es escalar las activaciones (o escalar los pesos en entrenamiento, “inverted dropout”).' },
                  { text: 'Se desactiva: se usa toda la red con las activaciones escaladas', correct: true, explanation: 'Correcto. Apagar neuronas en test haría la predicción estocástica; en su lugar se escala para que la esperanza coincida con el entrenamiento.' },
                  { text: 'Apaga el 50% de las neuronas siempre', correct: false, explanation: 'Eso degradaría el modelo y haría las predicciones no deterministas. Dropout solo actúa en entrenamiento.' },
                  { text: 'Multiplica los gradientes por p', correct: false, explanation: 'En inferencia no hay gradientes. Dropout es una técnica de entrenamiento; en test la red funciona normal (con el escalado correspondiente).' },
                ]}
              />
              <QuizCard
                quizId="redes-quiz-5"
                xp={10}
                question={String.raw`En backpropagation, ¿qué representa exactamente $\delta^{(l)}$?`}
                options={[
                  { text: 'El gradiente de la pérdida respecto a los pesos de la capa l', correct: false, explanation: String.raw`Eso es $\partial L/\partial W^{(l)} = a^{(l-1)}\delta^{(l)}$. δ es un paso intermedio: el error respecto a la pre-activación.` },
                  { text: String.raw`La derivada de la pérdida respecto a la pre-activación $z^{(l)}$`, correct: true, explanation: String.raw`Exacto: $\delta^{(l)} = \partial L / \partial z^{(l)}$. Todo lo demás (gradientes de pesos y de capas anteriores) se construye a partir de δ.` },
                  { text: 'La activación de la capa l tras aplicar φ', correct: false, explanation: 'Eso es $a^{(l)}$. δ mide sensibilidad del error, no el valor de la activación.' },
                  { text: 'El learning rate adaptativo de la capa l', correct: false, explanation: 'Nada que ver: δ pertenece al cálculo de gradientes, no al optimizador. Adam sí adapta η por parámetro, pero usando m y v.' },
                ]}
              />
            </div>
          </section>

          {/* S7b · Proyecto práctico */}
          <section id="proyecto">
            <SectionHead kicker="// 2.8 · proyecto práctico" title="Proyecto: reconoce dígitos escritos a mano (mini-MNIST)" />
            <Prose content={String.raw`MNIST —70.000 dígitos manuscritos de 28×28 píxeles— es el "hola mundo" del deep learning: la tarea con la que Yann LeCun demostró en los 90 que una red entrenada con gradiente podía leer códigos postales de verdad. Aquí no podemos descargar 55 MB, así que generamos un mini-MNIST procedural: los dígitos 0, 1 y 7 dibujados como fuentes de píxeles sobre un lienzo 8×8, con traslaciones, ruido y píxeles muertos. Es sintético, pero el pipeline es el real: batch, forward, softmax, entropía cruzada y backpropagation.

La arquitectura es la mínima que merece llamarse "profunda": 64 entradas, 16 neuronas ocultas con ReLU y 3 salidas con softmax. Todo lo que has derivado en este módulo —la regla de la cadena capa a capa, la máscara de la ReLU, el gradiente softmax + entropía cruzada que se simplifica en $P - Y$— se junta en un único entrenamiento que tarda segundos y supera el 95 % de accuracy en test. Cuando lo tengas, habrás escrito a mano el mismo bucle que frameworks como PyTorch automatizan.

Y terminarás donde termina cualquier trabajo serio de visión: mirando los errores. La matriz de confusión te dirá qué dígitos se parecen demasiado (pista: el anillo del 0 contiene casi todos los píxeles del 7) — el mismo análisis que harías sobre el MNIST real antes de proponer una arquitectura mejor.`} />
            <div className="space-y-6">
              <ExerciseCard exercise={getExercise('redes-digits-forward')!} />
              <ExerciseCard exercise={getExercise('redes-digits-train')!} />
              <ExerciseCard exercise={getExercise('redes-digits-errors')!} />
            </div>
          </section>

          {/* S8 · Siguiente nivel */}
          <section>
            <Link
              to="/modulos/cnn"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-8 transition-all hover:-translate-y-1 hover:border-violet/60 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
            >
              <div>
                <div className="mb-2 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-violet">
                  // SIGUIENTE · NIVEL 3
                </div>
                <div className="font-display text-2xl font-bold text-ink">CNN: ver con convoluciones</div>
                <p className="mt-1 text-sm text-muted">
                  Tu red apila neuronas… pero una imagen necesita estructura espacial. Convolución, kernels y 25 años de arquitecturas.
                </p>
              </div>
              <ArrowRight className="h-8 w-8 shrink-0 text-violet transition-transform group-hover:translate-x-2" aria-hidden />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
