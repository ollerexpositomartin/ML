/**
 * Módulo Secuencias (N5a) — /modulos/secuencias
 * Embeddings → RNN → vanishing gradient → puertas LSTM/GRU → seq2seq + atención.
 * Dos raíles: ChapterNav sticky + contenido (máx 860px).
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
import { SECUENCIAS_EXERCISES } from '@/data/exercises/secuencias'
import DemoEmbeddings from '@/components/secuencias/DemoEmbeddings'
import DemoRnnUnroll from '@/components/secuencias/DemoRnnUnroll'
import DemoDesvanecimiento from '@/components/secuencias/DemoDesvanecimiento'
import DemoPuertas from '@/components/secuencias/DemoPuertas'
import DemoSeq2seq from '@/components/secuencias/DemoSeq2seq'

const SECTIONS = [
  { id: 'embeddings', label: '5.1 Embeddings' },
  { id: 'rnn', label: '5.2 La RNN' },
  { id: 'vanishing', label: '5.3 Gradiente que se desvanece' },
  { id: 'lstm', label: '5.4 Puertas LSTM y GRU' },
  { id: 'atencion', label: '5.5 Seq2seq y atención' },
  { id: 'ejercicios', label: '5.6 Ejercicios' },
  { id: 'siguiente', label: '5.7 Siguiente nivel' },
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

export default function Secuencias() {
  const [eCoseno, eSoftmax, eRnn, eAtencion, eLstm] = SECUENCIAS_EXERCISES

  return (
    <div>
      <ModuleHero
        level="N4"
        kicker="// NIVEL 5 · SECUENCIAS Y LENGUAJE"
        title="Secuencias: modelos con memoria"
        abstract="El lenguaje, el audio y las series temporales tienen orden. Las RNN lo procesan paso a paso cargando un estado — hasta que el gradiente se desvanece. Las puertas de LSTM lo arreglan, y la atención lo cambiará todo."
        meta={{ duration: '≈ 4 h', demos: 5, exercises: 6, xp: 520 }}
        art="/art-secuencias.png"
        color="#8B5CF6"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 md:px-6">
        <ChapterNav sections={SECTIONS} />

        <div className="min-w-0 max-w-[860px] flex-1">
          {/* S1 · Embeddings */}
          <Section id="embeddings" kicker="5.1 · EMBEDDINGS" title="Palabras como geometría">
            <Prose
              content={[
                'Una red no entiende letras: entiende números. La primera idea, el vector **one-hot**, pone un 1 en la posición de la palabra y ceros en las otras $V-1$. Dos problemas fatales: la dimensión explota con el vocabulario ($V$ puede ser 50.000) y, peor aún, **no hay noción de similitud**: `perro` y `gato` son tan distintos entre sí como `perro` y `semáforo` — todos los productos punto son cero.',
                '',
                'Los **embeddings densos** resuelven ambos: cada palabra es un punto en $\\mathbb{R}^d$ con $d \\ll V$ (típicamente 100–768), aprendido de modo que palabras que aparecen en contextos similares quedan cerca. Es la **hipótesis distribucional**: «conocerás a una palabra por la compañía que mantiene».',
              ].join('\n')}
            />
            <FormulaBlock
              formula="\cos(a, b) = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert}"
              caption="Similitud coseno: la métrica estándar entre embeddings"
              breakdown={[
                { symbol: 'a \\cdot b', color: '#22D3EE', explanation: 'producto punto: cuánto apuntan en la misma dirección' },
                { symbol: '\\lVert a \\rVert', color: '#8B5CF6', explanation: 'norma (longitud) del vector; al dividir, la escala deja de importar' },
                { symbol: '\\cos(a,b)', color: '#A3E635', explanation: '1 = sinónimos perfectos · 0 = sin relación · −1 = antónimos' },
              ]}
            />
            <Prose
              content="Y la propiedad que hizo famosos a los word2vec: las relaciones semánticas se convierten en **direcciones**. El vector «rey − hombre» captura la idea de *realeza*; sumárselo a «mujer» aterriza junto a «reina»: $$\\vec{rey} - \\vec{hombre} + \\vec{mujer} \\approx \\vec{reina}$$"
            />
            <DemoEmbeddings />
          </Section>

          {/* S2 · RNN */}
          <Section id="rnn" kicker="5.2 · LA RNN" title="Procesar el orden, paso a paso">
            <Prose
              content={[
                'Una **red neuronal recurrente** mantiene un **estado oculto** $h$ que actúa como memoria: lee la entrada $x_t$ de cada paso, la combina con lo que recuerda ($h_{t-1}$) y actualiza su recuerdo. La misma celda — **los mismos pesos** — se aplica en cada posición: eso es el *weight sharing* en el tiempo, y es lo que le permite manejar secuencias de cualquier longitud.',
              ].join('\n')}
            />
            <FormulaBlock
              formula="h_t = \varphi\!\left(W_h\, h_{t-1} + W_x\, x_t + b\right), \qquad \hat{y}_t = W_y\, h_t"
              caption="La recurrencia: una celda, desplegada en el tiempo"
              breakdown={[
                { symbol: 'x_t', color: '#22D3EE', explanation: 'entrada del paso t (p. ej. el embedding de un carácter o palabra)' },
                { symbol: 'h_{t-1}', color: '#8B5CF6', explanation: 'memoria de todo lo visto hasta el paso anterior' },
                { symbol: 'W_h, W_x, b', color: '#8B5CF6', explanation: 'pesos compartidos: idénticos en todos los pasos' },
                { symbol: '\\varphi', color: '#A3E635', explanation: 'activación no lineal, típicamente tanh' },
                { symbol: '\\hat{y}_t', color: '#FB7185', explanation: 'salida del paso t (opcional: a veces solo interesa la última)' },
              ]}
            />
            <DemoRnnUnroll />
            <Prose
              content="Según cuántas entradas y salidas conectes, la misma celda sirve para tareas distintas: **muchos-a-uno** (análisis de sentimiento: frase → etiqueta), **uno-a-muchos** (descripción de imagen: vector → secuencia de palabras) y **muchos-a-muchos** (traducción, etiquetado por posición). Para entrenarla se despliega en el tiempo y se aplica backpropagation a través de la cadena — es **BPTT** (*backpropagation through time*)."
            />
          </Section>

          {/* S3 · Vanishing */}
          <Section id="vanishing" kicker="5.3 · VANISHING GRADIENT" title="El gradiente que se desvanece">
            <Prose
              content={[
                'Aquí está el problema que casi mata a las RNN. En BPTT, el gradiente que llega del paso $T$ al paso $k$ atraviesa $T-k$ celdas, y en cada una se multiplica por el Jacobiano de la recurrencia:',
              ].join('\n')}
            />
            <FormulaBlock
              formula="\frac{\partial h_T}{\partial h_k} = \prod_{t=k+1}^{T} \mathrm{diag}\!\left(\varphi'(z_t)\right) W_h"
              caption="Producto de Jacobianos: la causa matemática del olvido"
              breakdown={[
                { symbol: '\\prod', color: '#FB7185', explanation: 'un producto de T−k matrices: los efectos se multiplican' },
                { symbol: "\\varphi'(z_t)", color: '#FBBF24', explanation: 'derivada de la activación; con tanh vale como mucho 1' },
                { symbol: 'W_h', color: '#8B5CF6', explanation: 'si su norma espectral es < 1, cada factor encoge el gradiente' },
              ]}
            />
            <Prose
              content="Si cada factor «encoge» un poco (norma $\\approx 0.9$), tras 50 pasos queda $0.9^{50} \\approx 0.005$: el gradiente de la primera palabra es 200 veces más pequeño. La red **no puede aprender dependencias largas**: olvida el sujeto antes de llegar al verbo. El gemelo opuesto —norma mayor que 1— hace el gradiente **explotar**, y se mitiga con *gradient clipping*. Pero para el desvanecimiento no basta un parche: hace falta otra arquitectura."
            />
            <DemoDesvanecimiento />
          </Section>

          {/* S4 · LSTM */}
          <Section id="lstm" kicker="5.4 · LSTM Y GRU" title="Puertas: memoria con llave">
            <Prose
              content={[
                'La **LSTM** (*Long Short-Term Memory*, 1997) añade una segunda autopista de información: el **estado de celda** $C_t$, una cinta transportadora que atraviesa toda la secuencia casi sin transformaciones — solo sumas y productos elemento a elemento, así que el gradiente fluye sin desvanecerse. Tres **puertas** (sigmoides entre 0 y 1) deciden qué se borra, qué se escribe y qué se lee:',
              ].join('\n')}
            />
            <FormulaBlock
              formula="f_t = \sigma\!\left(W_f [h_{t-1}, x_t] + b_f\right) \qquad i_t = \sigma\!\left(W_i [h_{t-1}, x_t] + b_i\right) \qquad o_t = \sigma\!\left(W_o [h_{t-1}, x_t] + b_o\right)"
              caption="Las tres puertas: olvido, entrada y salida"
              breakdown={[
                { symbol: 'f_t', color: '#FB7185', explanation: 'puerta de olvido: 1 = conserva la memoria vieja, 0 = bórrala' },
                { symbol: 'i_t', color: '#A3E635', explanation: 'puerta de entrada: cuánto de lo nuevo se escribe en la cinta' },
                { symbol: 'o_t', color: '#22D3EE', explanation: 'puerta de salida: cuánto de la memoria se expone como h_t' },
                { symbol: '[h_{t-1}, x_t]', color: '#8B5CF6', explanation: 'concatenación de memoria y entrada: las puertas miran ambas' },
              ]}
            />
            <FormulaBlock
              formula="\tilde{C}_t = \tanh(W_c [h_{t-1}, x_t] + b_c) \qquad C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t \qquad h_t = o_t \odot \tanh(C_t)"
              caption="Escritura y lectura de la cinta transportadora"
              breakdown={[
                { symbol: '\\tilde{C}_t', color: '#A3E635', explanation: 'candidato: el contenido nuevo que podría escribirse' },
                { symbol: 'f_t \\odot C_{t-1}', color: '#FB7185', explanation: 'la memoria vieja, filtrada por la puerta de olvido' },
                { symbol: 'i_t \\odot \\tilde{C}_t', color: '#22D3EE', explanation: 'lo nuevo que realmente se escribe' },
                { symbol: '\\odot', color: '#8B5CF6', explanation: 'producto elemento a elemento (no matricial): cada dimensión decide por sí sola' },
              ]}
            />
            <DemoPuertas />
            <Prose
              content="Su hermana ligera, la **GRU** (2014), fusiona la puerta de olvido y la de entrada en una sola **puerta de actualización** y elimina el estado de celda separado: 2 puertas en vez de 3, ~25% menos parámetros, y en la práctica un rendimiento casi idéntico. Regla práctica: empieza con GRU; si necesitas exprimir el último punto de precisión, prueba LSTM."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-violet/40 bg-violet/5 p-5">
                <div className="mb-2 font-mono text-xs font-bold text-violet">LSTM · 3 puertas</div>
                <p className="text-sm leading-relaxed text-muted">
                  Dos estados ($C_t$ y $h_t$), control fino de escritura/lectura. Más parámetros, máximo
                  control sobre la memoria.
                </p>
              </div>
              <div className="rounded-xl border border-cyan/40 bg-cyan/5 p-5">
                <div className="mb-2 font-mono text-xs font-bold text-cyan">GRU · 2 puertas</div>
                <p className="text-sm leading-relaxed text-muted">
                  Un solo estado $h_t$, puertas de actualización y reset. Más rápida de entrenar, casi
                  igual de precisa.
                </p>
              </div>
            </div>
          </Section>

          {/* S5 · Seq2seq + atención */}
          <Section id="atencion" kicker="5.5 · SEQ2SEQ Y ATENCIÓN" title="El cuello de botella y la primera atención">
            <Prose
              content={[
                'Para traducir, la arquitectura **encoder-decoder** (seq2seq, 2014) lee toda la frase fuente con una RNN y comprime *todo su significado* en un único vector $h$; otra RNN genera la traducción a partir de él. Funciona… hasta que la frase supera las ~15 palabras: un solo vector no puede retenerlo todo.',
                '',
                'La solución de **Bahdanau et al. (2015)** es elegante: no comprimas. Guarda *todos* los estados del encoder y deja que el decoder, en cada paso, decida **dónde mirar** con una combinación ponderada:',
              ].join('\n')}
            />
            <FormulaBlock
              formula="c_i = \sum_{j} \alpha_{ij}\, h_j, \qquad \alpha_{ij} = \mathrm{softmax}(e_{ij})"
              caption="Atención de Bahdanau: un contexto a medida en cada paso"
              breakdown={[
                { symbol: 'h_j', color: '#22D3EE', explanation: 'estado del encoder en la posición j (anotación de esa palabra)' },
                { symbol: 'e_{ij}', color: '#FBBF24', explanation: 'afinidad entre lo que el decoder necesita y h_j (una mini-red)' },
                { symbol: '\\alpha_{ij}', color: '#8B5CF6', explanation: 'peso de atención: cuánto mira el paso i a la posición j' },
                { symbol: 'c_i', color: '#A3E635', explanation: 'contexto: la mezcla de anotaciones que el decoder usa ahora' },
              ]}
            />
            <DemoSeq2seq />
            <Prose
              content="Fíjate en lo que acaba de pasar: la atención convirtió una mezcla ponderada diferenciable en el mecanismo de acceso a la memoria. ¿Y si quitáramos la recurrencia por completo y nos quedáramos **solo con atención**? Esa es la pregunta del siguiente nivel — y la respuesta cambió la historia del deep learning."
            />
          </Section>

          {/* S6 · Ejercicios */}
          <Section id="ejercicios" kicker="5.6 · EJERCICIOS" title="Demuestra lo aprendido">
            <div className="space-y-6">
              <ExerciseCard exercise={eCoseno} />
              <ExerciseCard exercise={eSoftmax} />
              <ExerciseCard exercise={eRnn} />
              <ExerciseCard exercise={eAtencion} />
              <ExerciseCard exercise={eLstm} />
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-display text-xl font-semibold text-ink">Quiz relámpago</h3>
              <QuizCard
                quizId="secuencias-quiz-1"
                xp={40}
                question="¿Por qué un embedding denso es mejor que un vector one-hot?"
                options={[
                  { text: 'Porque usa menos memoria y nada más', correct: false, explanation: 'También, pero la clave es semántica: el one-hot no codifica ninguna relación entre palabras.' },
                  { text: 'Porque captura similitud: palabras de contextos parecidos quedan cerca en el espacio', correct: true, explanation: '¡Exacto! La hipótesis distribucional: el contexto define el significado, y la geometría lo refleja (similitud coseno, aritmética de analogías).' },
                  { text: 'Porque tiene valores entre 0 y 1', correct: false, explanation: 'Los embeddings no están acotados; lo importante es la estructura geométrica que aprenden.' },
                  { text: 'Porque se puede dibujar en 2D', correct: false, explanation: 'La visualización 2D es solo una proyección didáctica; los embeddings reales viven en cientos de dimensiones.' },
                ]}
              />
              <QuizCard
                quizId="secuencias-quiz-2"
                xp={40}
                question="En una RNN, ¿qué se comparte a lo largo del tiempo?"
                options={[
                  { text: 'El estado oculto $h_t$, que se copia sin cambios', correct: false, explanation: 'El estado se *actualiza* en cada paso; no se copia. Lo que se reutiliza son los parámetros.' },
                  { text: 'Los mismos pesos $W_h, W_x, b$ en todos los pasos', correct: true, explanation: 'Correcto: una única celda aplicada repetidamente. Por eso la RNN maneja secuencias de cualquier longitud y aprende patrones temporales generales.' },
                  { text: 'La entrada $x_t$', correct: false, explanation: 'Cada paso recibe su propia entrada (un token, un frame…).' },
                  { text: 'El gradiente', correct: false, explanation: 'El gradiente se propaga a través del tiempo (BPTT), pero no se «comparte» entre pasos.' },
                ]}
              />
              <QuizCard
                quizId="secuencias-quiz-3"
                xp={40}
                question="¿Cuál es la causa matemática directa del vanishing gradient en una RNN?"
                options={[
                  { text: 'La función tanh, que se satura', correct: false, explanation: 'Contribuye ($\\varphi\' \\le 1$), pero no es la causa estructural: incluso con otras activaciones el producto de matrices encadena el problema.' },
                  { text: 'El learning rate demasiado alto', correct: false, explanation: 'Eso causa inestabilidad, no el decaimiento exponencial sistemático del gradiente hacia el pasado.' },
                  { text: 'El producto de $T-k$ Jacobianos con norma < 1 al retropropagar', correct: true, explanation: '¡Eso es! $\\partial h_T / \\partial h_k$ es un producto de muchas matrices; si cada una encoge, el total decae exponencialmente con la distancia temporal.' },
                  { text: 'Que la secuencia sea demasiado corta', correct: false, explanation: 'Al revés: cuanto más larga la secuencia, más factores en el producto y peor el problema.' },
                ]}
              />
              <QuizCard
                quizId="secuencias-quiz-4"
                xp={40}
                question="En una LSTM, si la puerta de olvido vale $f_t \\approx 1$ en todos los pasos…"
                options={[
                  { text: 'La celda borra toda su memoria anterior', correct: false, explanation: 'Eso ocurriría con $f_t \\approx 0$. Con $f_t \\approx 1$ pasa exactamente lo contrario.' },
                  { text: 'El estado de celda $C_t$ se conserva casi intacto y el gradiente fluye', correct: true, explanation: 'Exacto: $C_t = f_t \\odot C_{t-1} + \\dots$ con $f_t \\approx 1$ convierte la cinta en una autopista casi identidad — la memoria (y el gradiente) viajan decenas de pasos.' },
                  { text: 'La salida $h_t$ se hace cero', correct: false, explanation: '$h_t$ depende de la puerta de salida $o_t$, no directamente de $f_t$.' },
                  { text: 'La red deja de aprender', correct: false, explanation: 'Al contrario: es la configuración que permite aprender dependencias largas.' },
                ]}
              />
              <QuizCard
                quizId="secuencias-quiz-5"
                xp={40}
                question="¿Por qué la atención de Bahdanau rompe el cuello de botella del seq2seq?"
                options={[
                  { text: 'Porque el decoder consulta todos los estados del encoder en cada paso, en vez de un único vector', correct: true, explanation: '¡Correcto! Ya no hay que comprimir toda la frase en un vector: cada paso del decoder construye su propio contexto $c_i = \\sum \\alpha_{ij} h_j$ mirando donde necesita.' },
                  { text: 'Porque hace la red más profunda', correct: false, explanation: 'La atención no añade capas de recurrencia; añade un acceso directo y diferenciable a la memoria del encoder.' },
                  { text: 'Porque usa convoluciones', correct: false, explanation: 'No hay convolución: es una combinación ponderada de estados con pesos softmax.' },
                  { text: 'Porque elimina la necesidad de entrenar', correct: false, explanation: 'Los pesos de atención también se aprenden por gradiente descendente, end-to-end.' },
                ]}
              />
            </div>
          </Section>

          {/* S7 · Siguiente nivel */}
          <Section id="siguiente" kicker="5.7 · SIGUIENTE" title="A por la cumbre">
            <Link
              to="/modulos/transformers"
              className="group flex items-center justify-between gap-6 rounded-2xl border border-line bg-panel p-8 transition-all hover:-translate-y-1 hover:border-amber/60 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]"
            >
              <div>
                <div className="mb-2 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-amber">
                  // SIGUIENTE · NIVEL 6
                </div>
                <div className="font-display text-2xl font-bold text-ink md:text-3xl">
                  Transformers: solo atención
                </div>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                  <TeX content="$Q$, $K$, $V$, codificación posicional y la arquitectura que parió a BERT y GPT. Ya tienes la atención escalada medio hecha." />
                </p>
              </div>
              <ArrowRight className="h-8 w-8 shrink-0 text-amber transition-transform group-hover:translate-x-2" aria-hidden />
            </Link>
          </Section>
        </div>
      </div>
    </div>
  )
}
