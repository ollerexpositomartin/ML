/**
 * Módulo Transformers (N5b) — /modulos/transformers
 * Self-attention Q/K/V → multi-head + PE → arquitectura (scroll-story pinned GSAP)
 * → BERT vs GPT → tokenización → ejercicios.
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
import { TeXParagraphs, TeX } from '@/lib/katex-content'
import { TRANSFORMERS_EXERCISES } from '@/data/exercises/transformers'
import DemoAtencion from '@/components/transformers/DemoAtencion'
import DemoPosicional from '@/components/transformers/DemoPosicional'
import ScrollStoryArquitectura from '@/components/transformers/ScrollStoryArquitectura'
import DemoCausalMask from '@/components/transformers/DemoCausalMask'
import DemoTokenizador from '@/components/transformers/DemoTokenizador'

const SECTIONS = [
  { id: 'idea', label: '6.A La idea sin fórmulas' },
  { id: 'repaso', label: '6.B Repaso exprés' },
  { id: 'glosario', label: '6.C Glosario de símbolos' },
  { id: 'atencion', label: '6.1 Self-attention Q·K·V' },
  { id: 'multihead', label: '6.2 Multi-head y posición' },
  { id: 'arquitectura', label: '6.3 Arquitectura completa' },
  { id: 'bertgpt', label: '6.4 BERT, GPT y escala' },
  { id: 'tokenizacion', label: '6.5 Tokenización' },
  { id: 'ejercicios', label: '6.6 Ejercicios' },
  { id: 'siguiente', label: '6.7 Siguiente nivel' },
]

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-line/50 py-14 last:border-b-0 md:py-20">
      <div className="mb-3 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">// {kicker}</div>
      <h2 className="mb-7 font-display text-[clamp(1.8rem,3.2vw,2.6rem)] font-bold leading-tight tracking-[-0.03em] text-ink">
        {title}
      </h2>
      <div className="space-y-7">{children}</div>
    </section>
  )
}

function Prose({ content }: { content: string }) {
  return <TeXParagraphs content={content} className="max-w-[720px] text-[0.95rem] leading-[1.75] text-muted" />
}

/** Aviso antes de una fórmula: qué hace, sin notación. */
function Llano({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-l-2 border-lime/60 bg-lime/5 px-4 py-3">
      <div className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-lime">// en castellano llano</div>
      <p className="max-w-[720px] text-sm leading-relaxed text-muted">{children}</p>
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

export default function Transformers() {
  const [eAtencion, ePE, eMascara, eFFN, eMultihead] = TRANSFORMERS_EXERCISES

  return (
    <div>
      <ModuleHero
        level="N5"
        kicker="// NIVEL 6 · LA ARQUITECTURA QUE LO CAMBIÓ TODO"
        title="Transformers: la atención es todo lo que necesitas"
        abstract="En 2017, un paper eliminó la recurrencia y la convolución y dejó solo atención. El resultado: BERT, GPT y la era de los LLM. Aquí derivas Q, K y V, recorres la arquitectura capa a capa y implementas la atención tú mismo."
        meta={{ duration: '≈ 5 h', demos: 6, exercises: 6, xp: 600 }}
        art="/art-transformers.png"
        color="#FBBF24"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 md:px-6">
        <ChapterNav sections={SECTIONS} />

        <div className="min-w-0 max-w-[860px] flex-1">
          {/* S0a · La idea sin fórmulas */}
          <Section id="idea" kicker="6.A · ANTES DE EMPEZAR" title="La idea sin fórmulas">
            <Prose
              content={[
                'La RNN del módulo anterior leía la frase en fila india: palabra a palabra, empujando toda la memoria en una sola nota. El Transformer propone algo radicalmente distinto: **una reunión**. Todas las palabras se sientan a la mesa a la vez, y cada una le pregunta a todas las demás: «¿cuánto me importas para entender mi papel en esta frase?». «La perra perseguía al gato porque estaba hambrienta» — la palabra «estaba» necesita mirar a «perra» para saber quién tenía hambre.',
                '',
                'Esa ronda de preguntas es la **atención**, y funciona con tres papeles que aprende la red: cada palabra anuncia **qué busca** (query), **qué ofrece** (key) y **qué información reparte si la eligen** (value). El parecido entre lo que una busca y lo que otra ofrece se convierte en un porcentaje, y cada palabra sale de la reunión con un cóctel de información de las demás, mezclado según esos porcentajes.',
                '',
                'Dos detalles lo completan. Primero: como todo ocurre a la vez (no hay fila ni nota mental), las GPUs pueden hacerlo masivamente en paralelo — es la razón por la que estos modelos escalaron hasta los LLM de hoy. Segundo: en la reunión nadie ve el orden de las sillas, así que hay que pegarle a cada palabra una **etiqueta con su posición**. Y en vez de una sola reunión se hacen varias en paralelo (multi-head), cada una fijándose en relaciones distintas. BERT y GPT son la misma máquina con dos reglas de juego: leer la frase entera para entenderla, o predecir la siguiente palabra sin mirar el futuro.',
              ].join('\n')}
            />
          </Section>

          {/* S0b · Repaso exprés */}
          <Section id="repaso" kicker="6.B · PRERREQUISITOS EN 1 MINUTO" title="Repaso exprés">
            <Prose content="Cuatro ideas básicas y el módulo que te deja a las puertas de este. Pulsa el enlace si algo necesita repaso." />
            <Repaso items={[
              { q: '¿Qué es un embedding?', d: 'Convertir cada palabra en un vector: un punto en un mapa donde las palabras parecidas quedan cerca.', to: '/modulos/secuencias', toLabel: 'repásalo en Secuencias' },
              { q: '¿Qué es el producto punto?', d: 'Multiplicar dos listas elemento a elemento y sumar: mide parecido. Es el «¿cuánto me importas?» de la atención.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué hace softmax?', d: 'Convierte una lista de puntuaciones en porcentajes que suman 100%. Así se reparte la atención.', to: '/modulos/secuencias', toLabel: 'repásalo en Secuencias' },
              { q: '¿Qué es una multiplicación de matrices?', d: 'Aplicar la misma transformación a muchos vectores a la vez: es lo que hace que todo vaya en paralelo.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Recuerdas la atención de Bahdanau?', d: 'La idea de «mirar atrás y repartir porcentajes» nació para traducir. Aquí se quita la RNN y se queda solo eso.', to: '/modulos/secuencias', toLabel: 'repásalo en Secuencias' },
            ]} />
          </Section>

          {/* S0c · Glosario */}
          <Section id="glosario" kicker="6.C · DICCIONARIO DEL MÓDULO" title="Glosario de símbolos">
            <Prose content="Los símbolos que aparecerán en esta página, traducidos en una línea." />
            <Glosario items={[
              [String.raw`Q`, 'queries: lo que cada palabra está buscando en las demás'],
              [String.raw`K`, 'keys: lo que cada palabra anuncia que ofrece'],
              [String.raw`V`, 'values: la información que cada palabra reparte si la eligen'],
              [String.raw`X`, 'la tabla con todos los embeddings de la frase, uno por fila'],
              [String.raw`W^Q, W^K, W^V`, 'tablas de pesos aprendidas que transforman cada embedding en su query, key y value'],
              [String.raw`\mathrm{softmax}`, 'convierte puntuaciones en porcentajes que suman 1: el reparto de atención'],
              [String.raw`d_k`, 'tamaño de cada vector query/key; dividir entre su raíz evita números gigantes'],
              [String.raw`QK^{\top}`, 'la tabla n×n de «cuánto le importa a cada palabra cada otra»'],
              [String.raw`{}^{\top}`, 'transponer: girar una tabla cambiando filas por columnas'],
              [String.raw`PE`, 'codificación posicional: la etiqueta que dice a cada palabra en qué posición va'],
              [String.raw`O(n^2)`, 'el coste crece al cuadrado de la longitud: doble de texto = 4× de cómputo'],
              [String.raw`p(x_t \mid x_{<t})`, '«la probabilidad de la siguiente palabra dadas las anteriores»: el juego de GPT'],
            ]} />
          </Section>

          {/* S1 · Self-attention */}
          <Section id="atencion" kicker="6.1 · SELF-ATTENTION" title="Q, K, V: preguntar, ofrecer, contar">
            <Prose
              content={[
                'La recurrencia procesa la secuencia como una cola: un token cada vez, memoria embutida en un solo estado. La **self-attention** rompe la cola: todos los tokens se hablan *a la vez*. La metáfora operativa es una base de datos diferenciable:',
                '',
                '- **Query** $Q$ — «qué estoy buscando»: cada token formula su pregunta.\n- **Key** $K$ — «qué ofrezco»: cada token anuncia su contenido.\n- **Value** $V$ — «qué digo si me eliges»: el contenido que se mezcla.',
                '',
                'La afinidad entre una query y todas las keys (un producto punto) decide cuánto valor de cada token entra en la mezcla. Y todo son proyecciones lineales aprendidas de la misma matriz de embeddings $X$:',
              ].join('\n')}
            />
            <Llano>
              Cada palabra compara su pregunta (Q) con las ofertas (K) de todas: ese parecido se convierte en
              porcentajes vía softmax, y con esos porcentajes se mezclan los contenidos (V). El resultado de
              cada palabra es un cóctel de las demás. Dividir entre la raíz solo evita que los porcentajes se
              vuelvan extremos cuando los vectores son largos.
            </Llano>
            <FormulaBlock
              formula="\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right) V, \qquad Q = XW^Q,\; K = XW^K,\; V = XW^V"
              caption="Scaled dot-product attention: el corazón del Transformer"
              breakdown={[
                { symbol: 'QK^{\\top}', color: '#22D3EE', explanation: 'matriz de afinidades n×n: cuánto le importa a cada token cada otro' },
                { symbol: '\\sqrt{d_k}', color: '#FBBF24', explanation: 'la varianza del producto punto crece con d_k; dividir mantiene la softmax fuera de saturación' },
                { symbol: '\\mathrm{softmax}', color: '#8B5CF6', explanation: 'convierte afinidades en pesos que suman 1 por fila' },
                { symbol: 'V', color: '#A3E635', explanation: 'los valores se mezclan con esos pesos: la salida es información de otros tokens' },
              ]}
            />
            <Prose
              content="Coste: la matriz $QK^{\\top}$ es $n \\times n$ — complejidad $O(n^2)$ en la longitud de la secuencia, el precio que se paga por eliminar la cola secuencial $O(n)$ de la RNN. A cambio, todo se paraleliza en GPU: es la razón por la que los Transformers escalaron a lo que son hoy."
            />
            <DemoAtencion />
          </Section>

          {/* S2 · Multi-head + PE */}
          <Section id="multihead" kicker="6.2 · MULTI-HEAD Y POSICIÓN" title="Muchas miradas y un reloj">
            <Prose
              content={[
                'Una sola atención promedia demasiado. **Multi-head attention** parte las proyecciones en $h$ sub-espacios independientes que atienden en paralelo — una cabeza puede especializarse en sintaxis, otra en posición, otra en correferencia — y concatena el resultado:',
              ].join('\n')}
            />
            <Llano>
              En vez de una sola ronda de preguntas, se hacen varias en paralelo (las cabezas), cada una
              fijándose en relaciones distintas — una en gramática, otra en posiciones, otra en quién se
              refiere a quién. Al final se apilan las conclusiones de todas y se mezclan en una sola.
            </Llano>
            <FormulaBlock
              formula="\mathrm{MultiHead}(X) = \mathrm{Concat}(\mathrm{head}_1, \dots, \mathrm{head}_h)\, W^O"
              caption="h cabezas en paralelo, una proyección de salida"
              breakdown={[
                { symbol: '\\mathrm{head}_j', color: '#22D3EE', explanation: 'atención escalada sobre su propio trozo de dimensiones (d_k = d/h)' },
                { symbol: '\\mathrm{Concat}', color: '#8B5CF6', explanation: 'las h salidas se apilan por columnas de vuelta a dimensión d' },
                { symbol: 'W^O', color: '#FBBF24', explanation: 'proyección final que mezcla lo aprendido por todas las cabezas' },
              ]}
            />
            <Prose
              content="Pero hay un detalle demoledor: la atención es una **operación sobre conjuntos** — no ve el orden. «El perro muerde al hombre» y «el hombre muerde al perro» producen exactamente la misma salida. El paper original lo arregla sumando a cada embedding una firma sinusoidal de su posición:"
            />
            <Llano>
              Como la atención no ve el orden, a cada palabra se le suma una «firma» calculada de su posición:
              ondas de distinta velocidad, como las rayas de un código de barras que dice «soy la palabra
              número 7». No se aprende nada aquí: la firma sale de una receta fija.
            </Llano>
            <FormulaBlock
              formula="PE_{(pos,\, 2i)} = \sin\!\left(\frac{pos}{10000^{2i/d}}\right), \qquad PE_{(pos,\, 2i+1)} = \cos\!\left(\frac{pos}{10000^{2i/d}}\right)"
              caption="Codificación posicional: longitudes de onda de ~2π a ~2π·10000"
              breakdown={[
                { symbol: 'pos', color: '#22D3EE', explanation: 'la posición del token en la secuencia (0, 1, 2, …)' },
                { symbol: '2i, 2i+1', color: '#8B5CF6', explanation: 'canales pares con sin, impares con cos: cada dimensión, otra frecuencia' },
                { symbol: '10000^{2i/d}', color: '#FBBF24', explanation: 'la frecuencia cae geométricamente: canales rápidos y canales casi constantes' },
                { symbol: 'PE', color: '#A3E635', explanation: 'función fija (nada que aprender); las posiciones relativas son lineales en ella' },
              ]}
            />
            <DemoPosicional />
          </Section>

          {/* S3 · Scroll story pinned (GSAP) */}
          <section id="arquitectura" className="scroll-mt-16 border-b border-line/50 py-10">
            <div className="mb-3 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
              // 6.3 · ARQUITECTURA COMPLETA
            </div>
            <h2 className="mb-2 font-display text-[clamp(1.8rem,3.2vw,2.6rem)] font-bold leading-tight tracking-[-0.03em] text-ink">
              La máquina completa, capa a capa
            </h2>
            <p className="max-w-[720px] text-[0.95rem] leading-[1.75] text-muted">
              Baja despacio: el scroll recorre el flujo de datos del Transformer desde los embeddings
              hasta la variante decoder. Cada bloque se ilumina cuando el flujo llega a él.
            </p>
            <ScrollStoryArquitectura />
          </section>

          {/* S4 · BERT vs GPT */}
          <Section id="bertgpt" kicker="6.4 · BERT, GPT Y ESCALA" title="Dos religiones: entender o generar">
            <Prose
              content={[
                'La misma arquitectura da dos familias opuestas según qué mitad uses y qué máscara apliques. **BERT** (2018) se queda el *encoder*: atención bidireccional, pre-entrenado tapando palabras al azar (*masked language model*) — ve la frase entera y aprende a **entender**. **GPT** (2018→) se queda el *decoder*: máscara causal que prohíbe mirar el futuro, entrenado para predecir el siguiente token $p(x_t \\mid x_{<t})$ — aprende a **generar**. Los *encoder-decoder* (T5, los transformers de traducción) combinan ambos.',
              ].join('\n')}
            />
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel-2 font-mono text-xs uppercase tracking-wider text-faint">
                    <th className="px-4 py-3 text-left">Familia</th>
                    <th className="px-4 py-3 text-left">Máscara</th>
                    <th className="px-4 py-3 text-left">Objetivo</th>
                    <th className="px-4 py-3 text-left">Fuerte en…</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-line/60">
                    <td className="px-4 py-3 font-mono text-cyan">BERT · encoder</td>
                    <td className="px-4 py-3">ninguna (bidireccional)</td>
                    <td className="px-4 py-3">predecir tokens tapados</td>
                    <td className="px-4 py-3">clasificación, NER, búsqueda semántica</td>
                  </tr>
                  <tr className="border-b border-line/60">
                    <td className="px-4 py-3 font-mono text-amber">GPT · decoder</td>
                    <td className="px-4 py-3">causal (triangular)</td>
                    <td className="px-4 py-3">siguiente token</td>
                    <td className="px-4 py-3">diálogo, escritura, código, razonamiento</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-violet">T5 · enc-dec</td>
                    <td className="px-4 py-3">causal en el decoder</td>
                    <td className="px-4 py-3">texto → texto</td>
                    <td className="px-4 py-3">traducción, resumen</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Prose
              content="El pipeline moderno tiene tres actos: **pre-entrenamiento** (predecir texto de internet, semanas de cómputo), ***fine-tuning* / instrucciones** (especializar con ejemplos curados) y **RLHF** (humanos puntúan respuestas y el modelo se alinea). Y el fenómeno que financió la carrera actual: las **leyes de escala** — la pérdida cae como una ley de potencia suave y predecible con parámetros, datos y cómputo; a partir de ciertos umbrales emergen habilidades (aritmética, traducción few-shot) que nadie programó."
            />
            <DemoCausalMask />
          </Section>

          {/* S5 · Tokenización */}
          <Section id="tokenizacion" kicker="6.5 · TOKENIZACIÓN" title="El texto hecho números">
            <Prose
              content={[
                'Antes de tocar la arquitectura hay que trocear el texto. ¿Por caracteres? Secuencias eternas. ¿Por palabras? Vocabulario infinito y fuera de vocabulario en cuanto alguien escribe «transformacionéis». La solución universal es **BPE** (*Byte-Pair Encoding*): empieza con los caracteres y **fusiona el par más frecuente** del corpus una y otra vez hasta llenar un vocabulario de ~32k–128k piezas.',
                '',
                'Ejemplo de 4 merges: $\\texttt{u+n → un}$, $\\texttt{un+d → und}$… en la práctica: $\\texttt{de+l → del}$, $\\texttt{trans+form → transform}$, $\\texttt{ac+ión → ación}$, $\\texttt{transform+ación → transformación}$. Así, $\\texttt{transformación}$ no es un token ni catorce caracteres: son 2–3 piezas estadísticas. Un **token ≠ una palabra** — en inglés ~0.75 palabras/token, en español algo menos eficiente. Y el número de tokens que cabe en el $O(n^2)$ de la atención define la **ventana de contexto** del modelo.',
              ].join('\n')}
            />
            <DemoTokenizador />
          </Section>

          {/* S6 · Ejercicios */}
          <Section id="ejercicios" kicker="6.6 · EJERCICIOS" title="Implementa la atención tú mismo">
            <div className="space-y-6">
              <ExerciseCard exercise={eAtencion} />
              <ExerciseCard exercise={ePE} />
              <ExerciseCard exercise={eMascara} />
              <ExerciseCard exercise={eFFN} />
              <ExerciseCard exercise={eMultihead} />
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-display text-xl font-semibold text-ink">Quiz relámpago</h3>
              <QuizCard
                quizId="transformers-quiz-1"
                xp={40}
                question="¿Por qué se divide $QK^{\\top}$ entre $\\sqrt{d_k}$?"
                options={[
                  { text: 'Para que la matriz sea cuadrada', correct: false, explanation: '$QK^{\\top}$ ya es cuadrada (n×n); el escalado no tiene que ver con la forma.' },
                  { text: 'Porque la varianza del producto punto crece con $d_k$ y la softmax se saturaría', correct: true, explanation: '¡Exacto! Con componentes ~N(0,1), el producto punto de $d_k$ dimensiones tiene varianza $d_k$: valores enormes empujan la softmax a una región de gradiente casi nulo. Dividir por $\\sqrt{d_k}$ la devuelve a varianza ~1.' },
                  { text: 'Es solo una convención histórica sin efecto real', correct: false, explanation: 'Quítala y verás cómo el entrenamiento se degrada: la softmax colapsa a one-hot y el gradiente muere.' },
                  { text: 'Para acelerar el cálculo en GPU', correct: false, explanation: 'El coste es idéntico; es un tema puramente numérico/estadístico.' },
                ]}
              />
              <QuizCard
                quizId="transformers-quiz-2"
                xp={40}
                question="¿Qué aporta multi-head frente a una única cabeza grande?"
                options={[
                  { text: 'Reduce el coste computacional a la mitad', correct: false, explanation: 'El coste total es comparable: lo que cambia es la estructura, no el cómputo.' },
                  { text: 'Cada cabeza atiende en un sub-espacio distinto y puede especializarse en patrones diferentes', correct: true, explanation: 'Correcto: sintaxis, posición, correferencia… cada cabeza aprende su «canal» de relaciones en paralelo, y $W^O$ los integra.' },
                  { text: 'Permite secuencias más largas', correct: false, explanation: 'La complejidad sigue siendo $O(n^2)$ por cabeza; la longitud máxima no cambia.' },
                  { text: 'Elimina la necesidad de la softmax', correct: false, explanation: 'Cada cabeza lleva su propia softmax; multi-head no la sustituye.' },
                ]}
              />
              <QuizCard
                quizId="transformers-quiz-3"
                xp={40}
                question="¿Por qué el Transformer necesita codificación posicional?"
                options={[
                  { text: 'Porque la atención es invariante a permutaciones: sin PE no distingue el orden', correct: true, explanation: '¡Eso es! Atención pura trata la secuencia como un conjunto. PE suma a cada posición una firma única y recupera la noción de orden.' },
                  { text: 'Porque los embeddings tienen dimensión insuficiente', correct: false, explanation: 'La dimensión no es el problema: es la simetría de la operación de atención ante reordenaciones.' },
                  { text: 'Para normalizar las activaciones', correct: false, explanation: 'Eso es LayerNorm. PE inyecta información de posición, no normaliza.' },
                  { text: 'Para comprimir la secuencia', correct: false, explanation: 'PE no cambia la longitud; solo suma un vector por posición.' },
                ]}
              />
              <QuizCard
                quizId="transformers-quiz-4"
                xp={40}
                question="¿Cuál es la diferencia esencial entre BERT y GPT?"
                options={[
                  { text: 'BERT usa CNN y GPT usa RNN', correct: false, explanation: 'Ninguna de las dos: ambas son Transformers puros, sin convolución ni recurrencia.' },
                  { text: 'BERT es bidireccional (ve toda la frase, entrenado con tokens tapados) y GPT es causal (solo mira el pasado, entrenado a predecir el siguiente token)', correct: true, explanation: '¡Exacto! Misma arquitectura base, máscara y objetivo opuestos: por eso BERT brilla entendiendo y GPT generando.' },
                  { text: 'GPT es más pequeño que BERT', correct: false, explanation: 'Al contrario: los GPT modernos son órdenes de magnitud mayores.' },
                  { text: 'BERT no usa atención', correct: false, explanation: 'BERT es todo atención (multi-head, bidireccional).' },
                ]}
              />
              <QuizCard
                quizId="transformers-quiz-5"
                xp={40}
                question="¿Qué limita la ventana de contexto de un Transformer estándar?"
                options={[
                  { text: 'La memoria de la GPU solamente', correct: false, explanation: 'La memoria es un síntoma; la causa es estructural.' },
                  { text: 'La complejidad $O(n^2)$ de la matriz de atención', correct: true, explanation: 'Correcto: $QK^{\\top}$ crece al cuadrado de la longitud. Doblar contexto = 4× cómputo y memoria de atención. Por eso existen variantes sparse/flash/lineales.' },
                  { text: 'El tamaño del vocabulario', correct: false, explanation: 'El vocabulario afecta a la capa de embeddings y a la última proyección, no al coste cuadrático por longitud.' },
                  { text: 'La profundidad (número de capas)', correct: false, explanation: 'Las capas multiplican el coste linealmente; el cuello de botella del contexto es el término cuadrático.' },
                ]}
              />
              <QuizCard
                quizId="transformers-quiz-6"
                xp={30}
                question="¿Qué es un «token» en un LLM?"
                options={[
                  { text: 'Siempre una palabra completa', correct: false, explanation: 'No: «transformación» puede ser 2–3 tokens; palabras raras se rompen en piezas más pequeñas.' },
                  { text: 'Siempre un carácter', correct: false, explanation: 'Eso sería ineficiente: BPE agrupa secuencias frecuentes en piezas mayores.' },
                  { text: 'Una pieza estadística del corpus (sub-palabra) con un ID en el vocabulario', correct: true, explanation: '¡Correcto! El tokenizador BPE trocea el texto en las unidades más frecuentes: ni caracteres ni palabras, sino sub-palabras aprendidas del corpus.' },
                  { text: 'Un vector de embedding', correct: false, explanation: 'El token es el índice discreto; el embedding es el vector que le corresponde en la tabla $E$.' },
                ]}
              />
            </div>
          </Section>

          {/* S7 · Siguiente nivel */}
          <Section id="siguiente" kicker="6.7 · SIGUIENTE" title="El último tramo">
            <Link
              to="/modulos/generativos"
              className="group flex items-center justify-between gap-6 rounded-2xl border border-line bg-panel p-8 transition-all hover:-translate-y-1 hover:border-rose/60 hover:shadow-[0_0_30px_rgba(251,113,133,0.15)]"
            >
              <div>
                <div className="mb-2 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rose">
                  // SIGUIENTE · NIVEL 7
                </div>
                <div className="font-display text-2xl font-bold text-ink md:text-3xl">
                  Modelos generativos: VAE, GAN y difusión
                </div>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                  <TeX content="Ya dominas la arquitectura: ahora toca crear. Espacios latentes, dinámicas minimax y el proceso de difusión que dibuja imágenes desde ruido." />
                </p>
              </div>
              <ArrowRight className="h-8 w-8 shrink-0 text-rose transition-transform group-hover:translate-x-2" aria-hidden />
            </Link>
          </Section>
        </div>
      </div>
    </div>
  )
}
