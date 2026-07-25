/**
 * Módulo Transformers (N5b) — /modulos/transformers
 * Self-attention Q/K/V → multi-head + PE → arquitectura (scroll-story pinned GSAP)
 * → BERT vs GPT → tokenización → ejercicios.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
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
