/**
 * Página · Aprendizaje por refuerzo — /modulos/rl (N9)
 * El tercer paradigma del ML: ni supervisado ni no supervisado — aprender actuando.
 * Bucle agente-entorno → bandidos → MDP/Bellman → Q-learning → policy gradients.
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
import { RL_EXERCISES } from '@/data/exercises/rl'
import GammaDemo from '@/components/rl/GammaDemo'
import BanditDemo from '@/components/rl/BanditDemo'
import GridworldDemo from '@/components/rl/GridworldDemo'

registerExercises(RL_EXERCISES)

const SECTIONS = [
  { id: 'idea', label: '9.A La idea sin fórmulas' },
  { id: 'repaso', label: '9.B Repaso exprés' },
  { id: 'glosario', label: '9.C Glosario de símbolos' },
  { id: 'bucle', label: '9.1 El bucle agente-entorno' },
  { id: 'bandidos', label: '9.2 Bandidos: explorar o explotar' },
  { id: 'mdp', label: '9.3 MDP y la ecuación de Bellman' },
  { id: 'qlearning', label: '9.4 Q-learning' },
  { id: 'policy', label: '9.5 Policy gradients' },
  { id: 'ejercicios', label: '9.6 Ejercicios' },
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

export default function RL() {
  return (
    <>
      <ModuleHero
        level="N9"
        kicker="// NIVEL 9 · APRENDER ACTUANDO"
        title="Aprendizaje por refuerzo: ni etiquetas ni clusters — consecuencias"
        abstract="El tercer paradigma del machine learning. Un agente actúa en un mundo, recibe premios y castigos, y descubre por prueba y error qué conviene hacer. De los bandidos de un casino a Q-learning y al truco que alinea a los chatbots."
        meta={{ duration: '≈ 4 h', demos: 3, exercises: 6, xp: 570 }}
        art="/art-rl.svg"
        color="#22D3EE"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 py-16 md:px-6 md:py-20">
        <ChapterNav sections={SECTIONS} />

        <div className="min-w-0 max-w-[860px] flex-1 space-y-28">
          {/* 9.A · La idea sin fórmulas */}
          <section id="idea">
            <SectionHead kicker="// 9.A · antes de empezar" title="La idea sin fórmulas" />
            <Prose content={String.raw`Todo lo que has hecho hasta ahora encajaba en dos moldes. En el **aprendizaje supervisado** tenías la respuesta correcta para cada ejemplo: el modelo predice, tú le dices en qué se equivocó, y se corrige. En el **no supervisado** no había respuestas, pero tampoco acciones: solo estructura que descubrir en los datos.

El aprendizaje por refuerzo (RL) rompe los dos moldes: **no hay respuesta correcta; hay consecuencias**. Un agente está metido en un mundo: hace algo, y el mundo le responde con un premio o un castigo (y con una nueva situación). Su trabajo es descubrir, probando, qué acciones le convienen en cada situación.

Es exactamente como entrenar a un perro. No le das un dataset de «postura correcta»: le das un premio cuando se sienta. El perro no sabe qué has querido decir; simplemente repite más lo que le salió bien. Todo el RL —de un juguete en una cuadrícula a AlphaGo o al ajuste de un chatbot— es esta idea con matemáticas serias detrás: **¿cómo repartir el mérito de un premio entre todas las decisiones que tomaste para llegar a él?**

La dificultad de verdad está en tres tensiones que verás una y otra vez en este módulo: **explorar** (probar cosas nuevas por si hay algo mejor) frente a **explotar** (hacer lo que ya sabes que funciona); el premio **inmediato** frente al premio **a largo plazo**; y **aprender de la experiencia** sin tener ni idea de cómo funciona el mundo por dentro.`} />
          </section>

          {/* 9.B · Repaso exprés */}
          <section id="repaso">
            <SectionHead kicker="// 9.B · prerrequisitos en 1 minuto" title="Repaso exprés" />
            <Prose content={String.raw`De verdad que no necesitas casi nada nuevo. Si estas seis ideas te suenan, puedes seguir.`} />
            <Repaso items={[
              { q: '¿Qué es una esperanza 𝔼?', d: 'La media a largo plazo de una cantidad aleatoria: lo que ganarías por tirada si jugaras un millón de veces.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué es argmax?', d: '«El índice del máximo». argmax_a Q(a) es la acción con mayor valor estimado: la jugada favorita del agente.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué es una distribución de probabilidad?', d: 'Unos pesos que suman 1 y dicen con qué frecuencia pasa cada cosa. Una política es eso sobre las acciones.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Recuerdas softmax?', d: 'Convierte una lista de números en una distribución: el más grande se lleva casi toda la probabilidad. Así una red neuronal puede "elegir" acciones.', to: '/modulos/redes-neuronales', toLabel: 'repásalo en Redes neuronales' },
              { q: '¿Recuerdas el descenso de gradiente?', d: 'Mover los parámetros en la dirección que mejora tu objetivo, paso a paso. En RL se usa igual, pero subiendo la recompensa en vez de bajar el error.', to: '/modulos/redes-neuronales', toLabel: 'repásalo en Redes neuronales' },
              { q: '¿Y la media incremental?', d: 'media_nueva = media_vieja + (x − media_vieja)/n. Así actualizas una estimación sin guardar el historial completo.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
            ]} />
          </section>

          {/* 9.C · Glosario */}
          <section id="glosario">
            <SectionHead kicker="// 9.C · diccionario del módulo" title="Glosario de símbolos" />
            <Prose content={String.raw`RL tiene su propio alfabeto. Son solo ocho letras; cada una, traducida en una línea.`} />
            <Glosario items={[
              [String.raw`s`, 'estado: la "foto" de la situación en la que está el agente (su celda, la pantalla del juego…)'],
              [String.raw`a`, 'acción: lo que el agente decide hacer (arriba, derecha, tirar de la palanca…)'],
              [String.raw`r`, 'recompensa: el número que el mundo devuelve tras cada acción (premio si es positivo, castigo si es negativo)'],
              [String.raw`\pi(a\,|\,s)`, 'política: la estrategia del agente; la probabilidad de hacer a estando en s'],
              [String.raw`\gamma`, 'descuento: cuánto vale mañana respecto a hoy (0 = solo importa ya; ~1 = el futuro importa casi igual)'],
              [String.raw`V(s)`, 'valor de un estado: cuánta recompensa total esperas cosechar desde s si sigues tu política'],
              [String.raw`Q(s,a)`, 'valor de una acción: lo mismo pero comprometiéndote primero a hacer a en s'],
              [String.raw`\varepsilon`, 'epsilon: la probabilidad de explorar (hacer algo al azar) en vez de explotar'],
              [String.raw`G_t`, 'retorno: la suma (descontada por γ) de todas las recompensas desde el instante t hasta el final'],
              [String.raw`\alpha`, 'learning rate: cuánto corrige cada experiencia a tus estimaciones'],
            ]} />
          </section>

          {/* 9.1 · El bucle agente-entorno */}
          <section id="bucle">
            <SectionHead kicker="// 9.1 · teoría + demo" title="El bucle agente-entorno" />
            <Prose content={String.raw`Todo el RL cabe en un bucle de cinco líneas mentales:

**observa** el estado $s_t$ → **elige** una acción $a_t$ según tu política $\pi$ → el mundo te da una **recompensa** $r_{t+1}$ y un **nuevo estado** $s_{t+1}$ → **aprende** de lo que acaba de pasar → repite.

Una partida completa, del inicio al estado terminal, se llama **episodio**. Al acabar, el agente se reinicia y vuelve a intentarlo — miles de veces. Piensa en cada episodio como una partida de prueba: barata, repetible y de la que se puede aprender.`} />
            <Llano>
              El agente no quiere el premio de ahora: quiere TODO el premio que queda por venir. A esa suma la llamamos retorno.
              Pero hay un matiz psicológico: un euro mañana vale menos que un euro hoy (¿y si mañana no llega?). El factor γ
              aplica ese descuento: cada paso hacia el futuro, la recompensa se multiplica por γ otra vez.
            </Llano>
            <FormulaBlock
              formula={String.raw`G_t = r_{t+1} + \gamma r_{t+2} + \gamma^2 r_{t+3} + \cdots = \sum_{k=0}^{\infty} \gamma^k \, r_{t+k+1}`}
              caption="Retorno descontado: el objetivo que el agente intenta maximizar"
              breakdown={[
                { symbol: String.raw`G_t`, color: '#22D3EE', explanation: 'retorno desde el instante t: toda la recompensa futura, convenientemente descontada' },
                { symbol: String.raw`r_{t+k+1}`, color: '#A3E635', explanation: 'la recompensa recibida k pasos después de ahora' },
                { symbol: String.raw`\gamma^k`, color: '#8B5CF6', explanation: 'factor de descuento: con γ=0.9, un premio a 10 pasos vale 0.35 veces uno inmediato' },
                { symbol: String.raw`\gamma`, color: '#8B5CF6', explanation: 'γ=0: agente totalmente miope. γ→1: el futuro importa casi tanto como el presente (y la paciencia se vuelve posible)' },
              ]}
            />
            <Prose content={String.raw`Con γ cercano a 1, un premio lejano apenas pierde valor: el agente aprende a planificar, a aguantar recompensas cero durante muchos pasos para llegar a la meta. Con γ pequeño, el agente se vuelve impaciente y solo persigue gratificación inmediata. Muévelo tú mismo:`} />
            <GammaDemo />
          </section>

          {/* 9.2 · Bandidos */}
          <section id="bandidos">
            <SectionHead kicker="// 9.2 · teoría + demo" title="Multi-armed bandits: explorar o explotar" />
            <Prose content={String.raw`El problema de RL más pequeño posible: un casino con $k$ máquinas tragaperras (**bandidos de $k$ brazos**). Cada máquina paga con una media distinta que no conoces. No hay estados, no hay consecuencias a largo plazo: solo la tensión pura entre **explotar** la máquina que crees mejor y **explorar** las demás por si te equivocas.

Tu única información son tus propias experiencias, así que mantienes una estimación $Q_i$ de lo que paga cada máquina — la media de los premios que te ha dado hasta ahora, actualizada incrementalmente: $Q_i \leftarrow Q_i + \frac{1}{N_i}(r - Q_i)$.

La estrategia más simple que funciona es **ε-greedy**: casi siempre tira de la mejor máquina conocida, pero con probabilidad $\varepsilon$ tira de una al azar, por si acaso.`} />
            <Llano>
              ε-greedy es el amigo que SIEMPRE pide lo mismo en el restaurante... salvo que un dado le obliga a probar un plato
              nuevo un 10% de las veces. UCB es más elegante: en vez de explorar a ciegas, prueba los platos sobre los que tiene
              más incertidumbre — "optimismo ante la duda". El bonus decrece con cada tirada: cuanto más has probado una máquina,
              menos te tienta "por si acaso".
            </Llano>
            <FormulaBlock
              formula={String.raw`a_t = \arg\max_i \underbrace{\left[ Q_i + c\sqrt{\frac{\ln t}{N_i}} \right]}_{\text{UCB}} \qquad\text{vs}\qquad a_t = \begin{cases} \arg\max_i Q_i & \text{con prob. } 1-\varepsilon \\ \text{brazo al azar} & \text{con prob. } \varepsilon \end{cases}`}
              caption="UCB (optimismo ante la duda) frente a ε-greedy (azar puro)"
              breakdown={[
                { symbol: String.raw`Q_i`, color: '#22D3EE', explanation: 'lo que crees que paga el brazo i: la media de tus premios con él' },
                { symbol: String.raw`N_i`, color: '#A3E635', explanation: 'cuántas veces has tirado del brazo i' },
                { symbol: String.raw`\ln t`, color: '#8B5CF6', explanation: 'crece con el tiempo: la presión por explorar baja despacio pero no desaparece' },
                { symbol: String.raw`c`, color: '#8B5CF6', explanation: 'cuánto optimismo: c alto = explora mucho antes de comprometerse' },
                { symbol: String.raw`\varepsilon`, color: '#FBBF24', explanation: 'la probabilidad de hacer una locura aleatoria en cada paso' },
              ]}
            />
            <Prose content={String.raw`UCB suele ganar porque su exploración es **dirigida**: el bonus es grande justo en los brazos que menos has probado (cuando $N_i$ es pequeño). En la demo puedes tirar de las palancas a mano, y luego dejar que cada estrategia juegue sola y comparar su **arrepentimiento** — lo que has dejado de ganar respecto a tirar siempre de la mejor máquina:`} />
            <BanditDemo />
          </section>

          {/* 9.3 · MDP y Bellman */}
          <section id="mdp">
            <SectionHead kicker="// 9.3 · teoría" title="MDP y la ecuación de Bellman" />
            <Prose content={String.raw`Para hablar de RL en serio necesitamos un modelo del problema: el **Proceso de Decisión de Markov** (MDP). Es el bucle agente-entorno formalizado: un conjunto de estados, unas acciones, unas recompensas y unas transiciones (a dónde te lleva cada acción, quizá con azar).

La **propiedad de Markov** es la licencia que nos tomamos: *el futuro solo depende del estado actual, no de cómo llegaste hasta aquí*. Como en el ajedrez: para jugar bien solo necesitas el tablero de ahora, no la historia de la partida. Si tu "foto" del mundo cumple eso, todo lo que sigue funciona.

Con eso definimos dos funciones de valor: $V(s)$ —cuánto retorno espero desde el estado $s$ siguiendo mi política— y $Q(s,a)$ —lo mismo pero atándome primero a la acción $a$. La genialidad de Bellman fue darse cuenta de que el valor se puede definir **en términos de sí mismo**:`} />
            <Llano>
              El valor de donde estás = el premio que cobras ya + el valor (descontado) de donde vas a aterrizar.
              Igual que tasar una casa: lo que vale = el alquiler de este año + lo que valdrá el año que viene.
              Es una definición circular... y de esa circularidad sale un algoritmo: value iteration, que aplica
              la regla una y otra vez hasta que los números dejan de moverse.
            </Llano>
            <FormulaBlock
              formula={String.raw`V^{*}(s) = \max_a \Big[ r(s,a) + \gamma \, V^{*}(s') \Big]`}
              caption="Ecuación de optimalidad de Bellman (versión determinista)"
              breakdown={[
                { symbol: String.raw`V^{*}(s)`, color: '#22D3EE', explanation: 'el mejor retorno posible desde el estado s' },
                { symbol: String.raw`\max_a`, color: '#FBBF24', explanation: 'elige la mejor acción: el agente manda' },
                { symbol: String.raw`r(s,a)`, color: '#A3E635', explanation: 'la recompensa inmediata por hacer a en s' },
                { symbol: String.raw`s'`, color: '#8B5CF6', explanation: 'el estado al que te lleva esa acción' },
                { symbol: String.raw`\gamma`, color: '#8B5CF6', explanation: 'el descuento: el valor del futuro, traído al presente' },
              ]}
            />
            <Prose content={String.raw`Si conoces las transiciones del mundo (sabes exactamente a dónde te lleva cada acción), la ecuación de Bellman se convierte en un algoritmo directo: **value iteration**. Empieza con $V=0$ en todas partes, aplica la regla de arriba a todas las celdas una y otra vez, y los valores se propagan hacia atrás desde la meta como una mancha de tinta hasta converger. Lo implementarás en el ejercicio E4.

¿Y si **no** conoces las transiciones? Entonces solo te queda aprender de la experiencia. Eso es Q-learning.`} />
          </section>

          {/* 9.4 · Q-learning */}
          <section id="qlearning">
            <SectionHead kicker="// 9.4 · teoría + demo estrella" title="Q-learning: aprender sin mapa" />
            <Prose content={String.raw`Q-learning responde a la pregunta práctica: ¿cómo encuentro $Q(s,a)$ si nadie me da el mapa del mundo? Respuesta: **prueba y anota**. Mantén una tabla $Q$ (una fila por estado, una columna por acción), juega episodios con una política ε-greedy sobre tu propia tabla, y tras cada paso corrige la entrada que acabas de usar:`} />
            <Llano>
              Cada experiencia te da una "predicción mejorada" de lo que valía tu jugada: el premio que cobraste + lo que tu
              tabla dice que vale lo mejor que puedes hacer desde donde aterrizaste. La diferencia entre esa predicción y lo
              que tenías apuntado es el error TD — y corriges tu tabla una fracción α de ese error. Es la media incremental
              del bandido, pero con el futuro incluido.
            </Llano>
            <FormulaBlock
              formula={String.raw`Q(s,a) \leftarrow Q(s,a) + \alpha \Big[ \underbrace{r + \gamma \max_{a'} Q(s',a')}_{\text{objetivo TD}} - Q(s,a) \Big]`}
              caption="La regla de actualización de Q-learning (diferencia temporal)"
              breakdown={[
                { symbol: String.raw`Q(s,a)`, color: '#22D3EE', explanation: 'tu estimación actual: lo que crees que vale hacer a en s' },
                { symbol: String.raw`r`, color: '#A3E635', explanation: 'la recompensa REAL que acabas de cobrar: la experiencia corrige a la teoría' },
                { symbol: String.raw`\max_{a'} Q(s',a')`, color: '#8B5CF6', explanation: 'lo mejor que podrías hacer desde donde aterrizaste (si s\' es terminal, esto es 0)' },
                { symbol: String.raw`\alpha`, color: '#FBBF24', explanation: 'learning rate: cuánto peso tiene la experiencia nueva frente a lo que ya creías' },
                { symbol: String.raw`[\,\cdots\,]`, color: '#FB7185', explanation: 'el error TD: diferencia entre la predicción mejorada y tu estimación vieja' },
              ]}
            />
            <Prose content={String.raw`¿Por qué funciona sin modelo del mundo? Porque el mundo se revela solo al jugar: las recompensas reales van filtrándose hacia atrás por la tabla, episodio a episodio, desde la meta hasta el inicio. Además Q-learning es **off-policy**: aprende el valor de la política *óptima* (por eso el $\max_{a'}$) aunque mientras tanto estés actuando con una política exploradora ε-greedy.

Y lo mejor: puedes verlo pasar. En la demo, el agente empieza sin saber NADA — las flechas son ruido y cae en los pozos constantemente. Dale a entrenar y observa cómo la recompensa de la meta se propaga hacia atrás por el mapa de calor y las flechas se afianzan en una autopista hacia la G:`} />
            <GridworldDemo />
          </section>

          {/* 9.5 · Policy gradients */}
          <section id="policy">
            <SectionHead kicker="// 9.5 · teoría" title="Policy gradients: cuando la tabla no cabe" />
            <Prose content={String.raw`La tabla de Q-learning es perfecta... para mundos de 25 celdas. El ajedrez tiene ~$10^{47}$ estados; un videojuego, uno por cada pantalla posible de píxeles. No hay tabla que quepa.

La salida ya la conoces de los módulos anteriores: **aproximar con una red neuronal**. En vez de tabular la política, la parametrizamos: una red $\pi_\theta(a\,|\,s)$ que recibe el estado y escupe una distribución softmax sobre las acciones. Ahora "aprender una política" es simplemente entrenar una red — y para eso necesitamos un gradiente.

El algoritmo **REINFORCE** juega episodios enteros con la política actual y, al final, aplica la regla más intuitiva del mundo:`} />
            <Llano>
              Haz más probable lo que salió bien y menos probable lo que salió mal. Si el episodio acabó con un retorno
              alto, sube la probabilidad de TODAS las acciones que tomaste (en proporción a lo bien que fue). Si acabó mal,
              bájasela. El término ∇log π es simplemente "la dirección en la que mover los pesos para que esa acción sea
              más probable" — backpropagation estándar con una etiqueta inventada: la acción que tomaste, ponderada por
              lo bien que salió.
            </Llano>
            <FormulaBlock
              formula={String.raw`\nabla_\theta J(\theta) = \mathbb{E}\Big[ \nabla_\theta \log \pi_\theta(a\,|\,s) \cdot \big(G_t - b\big) \Big]`}
              caption="El gradiente de política (REINFORCE con baseline)"
              breakdown={[
                { symbol: String.raw`J(\theta)`, color: '#22D3EE', explanation: 'el retorno esperado de la política: lo que queremos maximizar' },
                { symbol: String.raw`\log \pi_\theta(a\,|\,s)`, color: '#8B5CF6', explanation: 'la log-probabilidad de la acción tomada; su gradiente dice cómo hacerla más probable' },
                { symbol: String.raw`G_t`, color: '#A3E635', explanation: 'el retorno real obtenido: cuánto premio vino después de esa acción' },
                { symbol: String.raw`b`, color: '#FBBF24', explanation: 'baseline: lo que esperabas recibir. Solo se sube la probabilidad de lo que fue MEJOR de lo esperado' },
              ]}
            />
            <Prose content={String.raw`El **baseline** $b$ (típicamente una estimación de $V(s)$) no cambia el resultado en esperanza, pero reduce brutalmente la varianza: sin él, un episodio mediocre con retorno positivo reforzaría acciones malas. Con él, solo se refuerza lo **mejor de lo esperado** — la *ventaja*.

Dos escalones más arriba está **PPO** (Proximal Policy Optimization), el caballo de batalla actual: misma idea, pero con una red que estima $V(s)$ como baseline aprendido y un **clipping** que impide que cada actualización cambie la política más de un pequeño margen — entrenamiento estable por diseño.

¿Y por qué te suena todo esto? Porque **PPO es el algoritmo del RLHF**: el proceso que alinea a los chatbots. Las "acciones" son los tokens que el modelo genera, y la "recompensa" la da un modelo entrenado con preferencias humanas. El RL acaba de explicarte cómo se convierte un modelo de lenguaje en un asistente útil.`} />
          </section>

          {/* 9.6 · Ejercicios */}
          <section id="ejercicios">
            <SectionHead kicker="// 9.6 · demuestra lo aprendido" title="Ejercicios autocorregidos" />
            <Prose content={String.raw`Python real (numpy) ejecutándose en tu navegador. Escribe la solución, pulsa **Corregir** y un harness de tests ocultos la evalúa al instante. El ejercicio E5 es el jefe del nivel: tu Q-learning se evalúa jugando 200 episodios contra el gridworld.`} />
            <div className="space-y-6">
              {RL_EXERCISES.map((ex) => (
                <ExerciseCard key={ex.id} exercise={getExercise(ex.id)!} />
              ))}
            </div>

            <h3 className="mb-4 mt-12 font-display text-xl font-semibold text-ink">
              Q · Chequeo conceptual
            </h3>
            <div className="space-y-4">
              <QuizCard
                quizId="rl-quiz-1"
                xp={10}
                question="¿Por qué ε-greedy sigue explorando para siempre, y por qué eso puede ser un problema?"
                options={[
                  { text: 'Porque las estimaciones Q nunca convergen', correct: false, explanation: 'Las Q sí convergen (a las medias verdaderas). El problema es otro: incluso con Q perfectas, ε-greedy tira de un brazo al azar un ε de las veces.' },
                  { text: 'Porque ε es fija: desperdicia una fracción ε de los pasos en acciones aleatorias, incluso cuando ya sabe cuál es la mejor', correct: true, explanation: 'Exacto: su arrepentimiento crece linealmente para siempre. UCB lo evita: el bonus de exploración decrece con cada tirada, así que la exploración se apaga sola cuando ya no hay duda.' },
                  { text: 'Porque el argmax rompe los empates al azar', correct: false, explanation: 'Romper empates al azar solo afecta al principio; no es la causa de la exploración perpetua.' },
                  { text: 'Porque la recompensa es estocástica', correct: false, explanation: 'El ruido en la recompensa justifica explorar al principio, pero no explica por qué ε-greedy explora igual en el paso 1 y en el 100000: eso es culpa de la ε constante.' },
                ]}
              />
              <QuizCard
                quizId="rl-quiz-2"
                xp={10}
                question={String.raw`Con $\gamma = 0$, ¿cómo se comporta un agente que maximiza $G_t = \sum_k \gamma^k r_{t+k+1}$?`}
                options={[
                  { text: 'Planifica a largo plazo, porque γ=0 estabiliza la suma infinita', correct: false, explanation: 'Al contrario: con γ=0 todos los términos salvo el primero se anulan. El agente se vuelve incapaz de planificar.' },
                  { text: 'Es totalmente miope: solo le importa la recompensa inmediata', correct: true, explanation: String.raw`Exacto: $G_t = r_{t+1}$ y nada más. Nunca aceptaría un paso sin premio para alcanzar una gran recompensa futura — no aprendería a llegar a la meta del gridworld.` },
                  { text: 'Explora más, porque al no ver el futuro prueba más acciones', correct: false, explanation: 'γ y exploración son cosas independientes: la exploración la controla ε (o el bonus UCB), no el descuento.' },
                  { text: 'Se comporta igual que con γ=1 en episodios finitos', correct: false, explanation: String.raw`Ni de lejos: con γ=1 el retorno es la suma completa de recompensas futuras; con γ=0 es solo la siguiente.` },
                ]}
              />
              <QuizCard
                quizId="rl-quiz-3"
                xp={10}
                question={String.raw`¿Qué permite a Q-learning aprender la política óptima SIN conocer las transiciones del mundo?`}
                options={[
                  { text: 'Que construye internamente un modelo del mundo con las transiciones observadas', correct: false, explanation: 'Eso sería RL basado en modelo (como Dyna). Q-learning es model-free: nunca estima P(s\'|s,a); solo valores.' },
                  { text: String.raw`Que el objetivo TD $r + \gamma \max_{a'} Q(s',a')$ usa solo la experiencia directa: la recompensa real recibida y el valor ya aprendido del estado al que llegó`, correct: true, explanation: 'Exacto. Cada paso real es una muestra del mundo, y el max sobre a\' hace que Q converja a la política óptima aunque actúes explorando (off-policy). La recompensa de la meta se propaga hacia atrás por la tabla, episodio a episodio.' },
                  { text: 'Que explora con ε-greedy hasta memorizar todo el mapa', correct: false, explanation: 'Explorar es necesario, pero no suficiente: la clave matemática es la actualización TD con el max, que propaga el valor óptimo sin modelo.' },
                  { text: 'Que la tabla Q se inicializa con los valores verdaderos', correct: false, explanation: String.raw`La tabla empieza a cero (o con valores optimistas) y se va corrigiendo sola con el error TD. Si conocieras los valores verdaderos no haría falta aprender.` },
                ]}
              />
              <QuizCard
                quizId="rl-quiz-4"
                xp={10}
                question={String.raw`En REINFORCE, ¿qué efecto tiene restar un baseline $b$ al retorno, como en $\nabla \log \pi_\theta(a|s)\,(G_t - b)$?`}
                options={[
                  { text: 'Cambia la política óptima a la que converge el algoritmo', correct: false, explanation: 'No: en esperanza el término del baseline se cancela (E[∇log π] = 0), así que el gradiente esperado es el mismo. Converge a lo mismo.' },
                  { text: 'Reduce la varianza del gradiente sin sesgarlo: solo se refuerza lo que fue mejor de lo esperado', correct: true, explanation: 'Exacto. Sin baseline, un episodio con retorno positivo mediocre refuerza acciones malas solo porque el retorno era > 0. Con baseline, el signo lo marca la ventaja: mejor o peor DE LO ESPERADO.' },
                  { text: 'Hace que el aprendizaje sea off-policy', correct: false, explanation: 'REINFORCE con baseline sigue siendo on-policy: aprende de episodios generados por la política actual. El off-policy viene de otras técnicas (importance sampling, Q-learning).' },
                  { text: 'Sustituye a la función softmax de la política', correct: false, explanation: 'No: softmax sigue convirtiendo las preferencias en probabilidades. El baseline solo escala cuánto se refuerza cada acción.' },
                ]}
              />
            </div>
          </section>

          {/* Siguiente paso */}
          <section>
            <Link
              to="/modulos/mlops"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-8 transition-all hover:-translate-y-1 hover:border-violet/60 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
            >
              <div>
                <div className="mb-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-faint">
                  // siguiente paso · N10 MLOps
                </div>
                <h3 className="font-display text-xl font-bold text-ink">
                  MLOps: lleva todo esto a producción
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Bandidos, gridworlds y políticas: ya tienes el tercer paradigma. En el último nivel aprendes a comprimir, servir y monitorizar modelos como un profesional.
                </p>
              </div>
              <ArrowRight className="h-6 w-6 shrink-0 text-violet transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
