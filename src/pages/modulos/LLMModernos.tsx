/**
 * Módulo LLMs modernos (N8) — /modulos/llm-modernos
 * Del Transformer de 2017 a hoy: RoPE/ALiBi → KV cache · GQA · FlashAttention
 * → MoE (y Mamba) → pretrain → SFT → RLHF/DPO → RAG · LoRA/QLoRA → ejercicios.
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
import { LLM_EXERCISES } from '@/data/exercises/llm'
import KVCacheDemo from '@/components/llm/KVCacheDemo'
import MoEDemo from '@/components/llm/MoEDemo'
import RAGDemo from '@/components/llm/RAGDemo'

const SECTIONS = [
  { id: 'idea', label: '8.A La idea sin fórmulas' },
  { id: 'repaso', label: '8.B Repaso exprés' },
  { id: 'glosario', label: '8.C Glosario de símbolos' },
  { id: 'posicion', label: '8.1 RoPE y ALiBi' },
  { id: 'eficiencia', label: '8.2 Atención eficiente' },
  { id: 'moe', label: '8.3 Mixture of Experts' },
  { id: 'pipeline', label: '8.4 Pipeline de entrenamiento' },
  { id: 'rag', label: '8.5 RAG y fine-tuning ligero' },
  { id: 'ejercicios', label: '8.6 Ejercicios' },
  { id: 'siguiente', label: '8.7 Siguiente' },
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

export default function LLMModernos() {
  const [eRope, eKv, eGqa, eDpo, eRag, eLora] = LLM_EXERCISES

  return (
    <div>
      <ModuleHero
        level="N8"
        kicker="// NIVEL 8 · LA ERA DE LOS LLM"
        title="LLMs modernos: el Transformer, esteroides incluidos"
        abstract="Entre el «Attention is all you need» y los modelos que usas a diario hay seis mejoras apiladas y un pipeline de entrenamiento nuevo: RoPE, KV cache y GQA, MoE, RLHF/DPO, RAG y LoRA. Aquí las implementas todas, con numpy y sin humo."
        meta={{ duration: '≈ 4 h', demos: 3, exercises: 6, xp: 580 }}
        art="/art-llm.svg"
        color="#FB7185"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 md:px-6">
        <ChapterNav sections={SECTIONS} />

        <div className="min-w-0 max-w-[860px] flex-1">
          {/* 8.A · La idea sin fórmulas */}
          <Section id="idea" kicker="8.A · ANTES DE EMPEZAR" title="La idea sin fórmulas">
            <Prose
              content={[
                'Ya conoces el Transformer de 2017: la reunión donde cada palabra pregunta a las demás cuánto le importan. Un LLM moderno (GPT-4, Llama, DeepSeek, Qwen…) es **ese mismo esqueleto** — atención multi-cabeza, capas apiladas, predecir el siguiente token — con medio docena de mejoras de ingeniería encima y una dieta de entrenamiento completamente distinta. No hay magia nueva: hay muy buena fontanería.',
                '',
                'Las mejoras resuelven tres dolores concretos. **Dolor 1 · la posición**: la etiqueta sinusoidal de 2017 se queda corta cuando quieres ventanas de 128 000 tokens, así que hoy la posición se *gira* dentro de los vectores (RoPE) o se resta directamente de las puntuaciones (ALiBi). **Dolor 2 · la memoria**: generar texto token a token recomputando todo es ruinoso; se cachean las K y V ya calculadas (KV cache), se comparten entre cabezas (MQA/GQA), se reordenan los bucles para no pisar memoria lenta (FlashAttention) o se mira solo a una ventana local (sliding window). **Dolor 3 · el coste de crecer**: en vez de hacer el modelo entero más gordo, se multiplican las capas feed-forward en «expertos» y cada token visita solo un par (MoE) — capacidad de gigante, factura de enano.',
                '',
                'Y luego está el **pipeline**: primero *pretraining* (trillones de tokens, predecir el siguiente; aquí nace el conocimiento), después *SFT* (unos miles de ejemplos instrucción→respuesta; aquí nace el modito de asistente), y al final *alineación* con preferencias humanas: RLHF (un reward model + PPO) o su versión directa y mucho más barata, **DPO**. Por último, dos trucos del día a día profesional: **RAG** (buscar documentos y pegarlos en el prompt, en vez de re-entrenar) y **LoRA** (congelar el gigante y entrenar un parchecito de bajo rango). Todo eso vas a programarlo aquí, pieza a pieza.',
              ].join('\n')}
            />
          </Section>

          {/* 8.B · Repaso exprés */}
          <Section id="repaso" kicker="8.B · PRERREQUISITOS EN 1 MINUTO" title="Repaso exprés">
            <Prose content="Este módulo asume el Transformer clásico fresco. Cuatro piezas y dónde repasarlas si cojean." />
            <Repaso items={[
              { q: '¿Qué son Q, K y V?', d: 'Las tres proyecciones de cada token: qué busca, qué ofrece y qué reparte. Todo lo de hoy (KV cache, GQA, RoPE) manipula estos tensores.', to: '/modulos/transformers', toLabel: 'repásalo en Transformers' },
              { q: '¿Y el PE sinusoidal?', d: 'La etiqueta de posición de 2017: senos y cosenos de frecuencias decrecientes sumados al embedding. Es la pieza que RoPE jubila.', to: '/modulos/transformers', toLabel: 'repásalo en Transformers' },
              { q: '¿BERT vs GPT?', d: 'Misma máquina, dos reglas: bidireccional para entender vs causal para generar. Los LLM son todos del bando causal.', to: '/modulos/transformers', toLabel: 'repásalo en Transformers' },
              { q: '¿Qué es una softmax y una sigmoide?', d: 'Softmax reparte porcentajes entre opciones; la sigmoide σ(z) = 1/(1+e^-z) comprime un número a (0,1) — aparece en DPO.', to: '/modulos/ml-clasico', toLabel: 'repásalo en ML Clásico' },
              { q: '¿Qué es el rango de una matriz?', d: 'Cuántas direcciones independientes tiene. LoRA apuesta a que el ajuste necesario es de rango bajo: pocas direcciones bastan.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
            ]} />
          </Section>

          {/* 8.C · Glosario */}
          <Section id="glosario" kicker="8.C · DICCIONARIO DEL MÓDULO" title="Glosario de símbolos">
            <Prose content="Los símbolos nuevos de este nivel, traducidos en una línea cada uno." />
            <Glosario items={[
              [String.raw`\theta_i`, 'frecuencia RoPE del par de dimensiones i: base^(−2i/d); las primeras parejas giran rápido, las últimas despacio'],
              [String.raw`m, n`, 'posiciones absolutas de dos tokens; RoPE hace que solo importe su distancia m − n'],
              [String.raw`KV`, 'la KV cache: filas K y V ya proyectadas que se reutilizan en cada paso de generación'],
              [String.raw`H, G`, 'nº de cabezas de query y nº de grupos K/V en GQA (G=1 es MQA, G=H es multi-head clásico)'],
              [String.raw`S`, 'ventana deslizante: cada token solo mira a los S anteriores'],
              [String.raw`\pi_\theta`, 'la política: tu modelo con pesos θ que estás alineando'],
              [String.raw`\pi_{ref}`, 'el modelo de referencia congelado (copia de π antes de alinear): el ancla que evita desastres'],
              [String.raw`y_w, y_l`, 'respuesta ganadora (preferida) y perdedora (rechazada) de un par de preferencias'],
              [String.raw`\beta`, 'temperatura de DPO: cuánto dejas alejarse a π_θ de π_ref'],
              [String.raw`\sigma`, 'sigmoide: comprime el margen a una probabilidad entre 0 y 1'],
              [String.raw`A, B`, 'las dos matrices pequeñas de LoRA: A baja a dimensión r, B sube de vuelta'],
              [String.raw`\Delta W = \frac{\alpha}{r}BA`, 'el parche de bajo rango que LoRA suma a la W congelada'],
              [String.raw`r`, 'rango de LoRA (típicamente 4–64): cuántas direcciones de ajuste aprendes'],
              [String.raw`\cos(q, d)`, 'similitud coseno entre el embedding de la query y el de cada documento en RAG'],
            ]} />
          </Section>

          {/* 8.1 · RoPE y ALiBi */}
          <Section id="posicion" kicker="8.1 · POSICIÓN MODERNA" title="RoPE y ALiBi: la posición se gira, no se pega">
            <Prose
              content={[
                'El PE sinusoidal de 2017 **suma** una etiqueta posicional al embedding y reza para que la red aprenda a usarla. Funciona, pero tiene dos grietas: la posición queda mezclada con el contenido (la red debe desenredarlas) y, sobre todo, **extrapola fatal**: entrena con frases de 2 048 tokens y en el token 5 000 las etiquetas ya no se parecen a nada visto en entrenamiento.',
                '',
                '**RoPE** (Rotary Position Embedding, usado por Llama, Qwen, DeepSeek y casi todos) cambia sumar por **girar**: agrupa las $d$ dimensiones de cada query y key en $d/2$ parejas y rota cada pareja un ángulo proporcional a la posición del token. La gracia está en el álgebra de rotaciones: al hacer el producto punto de una query en posición $m$ con una key en posición $n$, los dos giros se componen y el resultado **solo depende de la distancia $m - n$** — exactamente lo que la atención necesita saber («¿a qué distancia está esta palabra?»), no dónde empieza la frase.',
              ].join('\n')}
            />
            <Llano>
              Imagina que cada pareja de dimensiones es una aguja de reloj. RoPE gira la aguja un ángulo
              proporcional a la posición del token: la primera aguja gira rápido (detalle fino), la última
              despacísimo (contexto largo). Cuando dos tokens se comparan, lo único que ve la atención es
              el ángulo *entre* sus agujas — es decir, cuántas posiciones los separan.
            </Llano>
            <FormulaBlock
              formula={String.raw`\mathrm{RoPE}(x, m)_{2i} = x_{2i}\cos(m\theta_i) - x_{2i+1}\sin(m\theta_i), \qquad \mathrm{RoPE}(x, m)_{2i+1} = x_{2i}\sin(m\theta_i) + x_{2i+1}\cos(m\theta_i), \qquad \theta_i = \mathrm{base}^{-2i/d}`}
              caption="RoPE: cada par de dimensiones rota el ángulo m·θᵢ — y RoPE(q,m)·RoPE(k,n) = f(q, k, m−n)"
              breakdown={[
                { symbol: String.raw`x_{2i}, x_{2i+1}`, color: '#22D3EE', explanation: 'una pareja de dimensiones del vector query o key: la unidad mínima que se rota' },
                { symbol: String.raw`m`, color: '#22D3EE', explanation: 'posición absoluta del token en la secuencia (0, 1, 2, …)' },
                { symbol: String.raw`\theta_i = \mathrm{base}^{-2i/d}`, color: '#8B5CF6', explanation: 'frecuencia de la pareja i: con base 10 000, la primera pareja gira ~1 radian por token y la última casi no se mueve' },
                { symbol: String.raw`m - n`, color: '#FB7185', explanation: 'la propiedad estrella: el producto punto entre dos vectores rotados solo ve la distancia relativa' },
                { symbol: String.raw`d`, color: '#8E9AB8', explanation: 'dimensión de cada cabeza (64–128 típico); d/2 parejas rotando a distintas velocidades' },
              ]}
            />
            <Prose
              content={[
                '**ALiBi** toma el camino opuesto, brutalmente simple: no toca los vectores; **resta** de la puntuación de atención una penalización proporcional a la distancia, $\\mathrm{score}(i,j) = q_i \\cdot k_j - \\lambda_h |i - j|$, con una pendiente $\\lambda_h$ distinta por cabeza (unas cabezas miran cerca, otras lejos). Sin parámetros nuevos y extrapolación excelente: entrenas con 1 024 tokens y sirves con 8 000.',
                '',
                '¿Y si quieres estirar un modelo RoPE ya entrenado a contextos más largos? **YaRN** (y su prima NTK-scaling) «reescala» las frecuencias $\\theta_i$ — es como cambiar la caja de cambios del reloj para que las agujas rápidas no den vueltas de campana en posiciones nunca vistas — y con un fine-tuning cortito multiplicas la ventana ×4. Es la técnica detrás de los contextos de 128k de los modelos open-weight.',
              ].join('\n')}
            />
          </Section>

          {/* 8.2 · Atención eficiente */}
          <Section id="eficiencia" kicker="8.2 · ATENCIÓN EFICIENTE" title="KV cache, GQA y FlashAttention">
            <Prose
              content={[
                'Generar el token $t+1$ exige las $K, V$ de los $t$ anteriores. Recomputarlas cada paso cuesta $O(t^2)$ proyecciones… para obtener **exactamente los mismos números**: los tokens viejos no cambian. La **KV cache** los guarda: cada paso proyecta solo el token nuevo (1 fila) y atiende contra lo cacheado. Coste por token: $O(t)$ de atención y $O(1)$ de proyecciones. Es la diferencia entre un chat usable y uno que se arrastra.',
              ].join('\n')}
            />
            <KVCacheDemo />
            <Prose
              content={[
                'La cache tiene un precio: **memoria**. Con $H$ cabezas, $L$ capas y contexto $T$, ocupa $2 \\cdot L \\cdot T \\cdot H \\cdot d_h$ valores — en un modelo grande con contexto largo, decenas de GB por usuario. **MQA/GQA** la recortan compartiendo: en vez de un par $K,V$ por cabeza, las $H$ cabezas de query se agrupan en $G$ grupos que comparten sus $K,V$. La memoria de caché baja por el factor $H/G$ (¡×8 en Llama-3!) con una pérdida de calidad mínima. MQA ($G=1$) es el extremo: todas las cabezas comparten un único $K,V$.',
                '',
                '**FlashAttention** ataca otro cuello de botella: la matriz $QK^{\\top}$ de $n \\times n$ no cabe (ni conviene) en la memoria rápida de la GPU. La idea —concepto, no kernel— es *IO-aware tiling*: trocear $Q$, $K$, $V$ en bloques que sí caben en SRAM, ir acumulando la softmax **online** (con el truco del máximo y la suma reescaladas sobre la marcha) y nunca materializar la matriz completa en HBM. Resultado: misma atención exacta, ×2–4 más rápida y memoria $O(n)$ en vez de $O(n^2)$.',
                '',
                'Y la opción perezosa que funciona sorprendentemente bien: **sliding window attention** (Mistral). Cada token solo mira a los $S$ anteriores (p. ej. 4 096); la información lejana viaja capa a capa como en una CNN — con $L$ capas, el alcance efectivo es $L \\cdot S$. La caché pasa a ser un buffer circular de tamaño fijo.',
              ].join('\n')}
            />
          </Section>

          {/* 8.3 · MoE */}
          <Section id="moe" kicker="8.3 · CAPACIDAD SIN FACTURA" title="Mixture of Experts">
            <Prose
              content={[
                'Quieres más capacidad pero no más cómputo por token. **MoE** sustituye cada capa feed-forward por $E$ copias («expertos») y pone delante un **router**: una softmax sobre las puntuaciones de cada experto que elige el **top-k** (típicamente 2 de 8, o 8 de 256). Cada token solo pasa por sus $k$ expertos elegidos y la salida es la mezcla ponderada. Mixtral 8×7B tiene ~47B parámetros pero gasta ~13B por token; DeepSeek-V3 llega a 671B totales con 37B activos.',
                '',
                'El router tiene un vicio: la **ley del rico**. Un experto que gana por azar recibe más tokens, se entrena más, y acaba ganando siempre — colapso de expertos. Por eso se añade una **auxiliary load balancing loss**: un término que penaliza la correlación entre «fracción de tokens que recibe cada experto» y «probabilidad media que el router le asigna», empujando el reparto hacia el equilibrio. Activa el toggle de la demo y mira las barras.',
              ].join('\n')}
            />
            <MoEDemo />
            <Prose
              content={[
                'Paréntesis: existe otra vía para escapar del $O(n^2)$ — cambiar de arquitectura. **Mamba y los State-Space Models (SSM)** sustituyen la atención por una recurrencia con estado comprimido y *selectivo* (los parámetros de transición dependen del token): coste $O(n)$ en secuencia, $O(1)$ por token al generar, sin KV cache. En la práctica los modelos punteros suelen ser híbridos (capas SSM + algunas de atención), pero la atención sigue siendo la reina del recall exacto.',
              ].join('\n')}
            />
          </Section>

          {/* 8.4 · Pipeline de entrenamiento */}
          <Section id="pipeline" kicker="8.4 · CÓMO NACE UN ASISTENTE" title="El pipeline: pretrain → SFT → RLHF/DPO">
            <Prose
              content={[
                '**1 · Pretraining.** El 99% del cómputo y del mérito: next-token prediction sobre trillones de tokens de web, libros y código. Los detalles que separan un buen modelo de uno mediocre no son la arquitectura (todas iguales) sino los **datos**: deduplicación agresiva (el mismo texto repetido envenena), filtros de calidad (clasificadores que puntúan «¿esto parece Wikipedia o granja de spam?»), mezcla de dominios y *annealing* final con datos de máxima calidad. Lo que sale de aquí es un *base model*: sabe de todo, pero no sabe ser asistente — si le escribes una pregunta, lo más probable es que continúe con otra pregunta.',
                '',
                '**2 · SFT (Supervised Fine-Tuning).** Unos miles de ejemplos curados de (instrucción → buena respuesta) en formato de chat. Mismo objetivo de next-token, pero enmascarando el prompt (solo se aprende de los tokens de la respuesta). Es barato y el cambio de comportamiento es espectacular: aquí nace el «claro, aquí tienes…».',
                '',
                '**3 · Alineación con preferencias.** Humanos comparan pares de respuestas («esta es mejor»). **RLHF** clásico: entrenas un *reward model* que predice qué respuesta preferirá un humano, y luego PPO empuja la política a maximizar esa recompensa sin alejarse demasiado del modelo SFT (restricción KL a $\\pi_{ref}$). Funciona (ChatGPT) pero es un infierno operativo: cuatro modelos en memoria, hiperparámetros delicados, trucos de RL por todas partes.',
                '',
                '**DPO** (Direct Preference Optimization) demuestra que el reward model era prescindible: la política óptima del problema KL-restringido tiene forma cerrada, así que puedes entrenar **directamente** sobre los pares de preferencias con una pérdida de clasificación binaria. Misma idea, una fracción del dolor: hoy es el estándar en modelos open (Zephyr, Llama-Instruct, Qwen…).',
              ].join('\n')}
            />
            <Llano>
              Para cada ejemplo tienes dos respuestas: la que un humano prefirió (ganadora) y la otra
              (perdedora). DPO sube la probabilidad que tu modelo da a la ganadora y baja la de la
              perdedora, pero *medido en relación* al modelo de referencia: si ya preferías la buena,
              no hay nada que aprender; si prefieres la mala, el tirón es fuerte. La referencia congelada
              es el freno que impide que el modelo haga trampas (respuestas larguísimas, sycophancy).
            </Llano>
            <FormulaBlock
              formula={String.raw`\mathcal{L}_{DPO} = -\log \sigma\!\left( \beta \left[ \log \frac{\pi_\theta(y_w \mid x)}{\pi_{ref}(y_w \mid x)} - \log \frac{\pi_\theta(y_l \mid x)}{\pi_{ref}(y_l \mid x)} \right] \right)`}
              caption="Pérdida DPO: regresión logística sobre el margen de preferencia relativo a la referencia"
              breakdown={[
                { symbol: String.raw`\pi_\theta(y \mid x)`, color: '#8B5CF6', explanation: 'probabilidad que tu modelo (pesos θ, entrenándose) asigna a la respuesta y dado el prompt x' },
                { symbol: String.raw`\pi_{ref}(y \mid x)`, color: '#8E9AB8', explanation: 'la misma probabilidad según el modelo de referencia congelado (el SFT): el ancla' },
                { symbol: String.raw`y_w, y_l`, color: '#22D3EE', explanation: 'respuesta ganadora (winner, la que el humano prefirió) y perdedora (loser)' },
                { symbol: String.raw`\log \frac{\pi_\theta}{\pi_{ref}}`, color: '#FB7185', explanation: 'cuánto más (o menos) le gusta esa respuesta a tu modelo que a la referencia, en log-odds' },
                { symbol: String.raw`\beta`, color: '#FBBF24', explanation: 'temperatura: cuánto margen exiges antes de saturar; típicamente 0.1–0.5. A mayor β, más cerca te quedas de π_ref' },
                { symbol: String.raw`\sigma`, color: '#A3E635', explanation: 'sigmoide: convierte el margen en probabilidad de «preferir la ganadora»; −log σ es la cross-entropy de esa decisión' },
              ]}
            />
            <Prose
              content={[
                'Fíjate en la estructura: es una **clasificación binaria** donde la «puntuación» es la diferencia de log-ratios. Si tu modelo ya prefiere la ganadora mucho más que la referencia, $\\sigma \\to 1$ y la pérdida $\\to 0$. Y como todo son cocientes, subir ambas respuestas a la vez no engaña a la pérdida: solo cuenta el **margen**. En el ejercicio E4 la implementas en cinco líneas.',
              ].join('\n')}
            />
          </Section>

          {/* 8.5 · RAG y fine-tuning ligero */}
          <Section id="rag" kicker="8.5 · EL DÍA A DÍA PROFESIONAL" title="RAG y fine-tuning ligero (LoRA)">
            <Prose
              content={[
                'Tu empresa quiere un chatbot que responda sobre *sus* documentos. Dos caminos. **RAG** (Retrieval-Augmented Generation): embebe cada documento con un modelo de embeddings, guárdalos en un índice vectorial; ante cada pregunta, recupera los $k$ más afines por **similitud coseno** y pégalos en el prompt como contexto. **Fine-tuning**: re-entrenar el modelo con tus datos. La regla práctica: RAG para **conocimiento** (cambiante, trazable, con citas; alucina menos porque lee la fuente), fine-tune para **comportamiento** (formato, tono, jerga, tareas). Y lo habitual en producción es combinar ambos.',
              ].join('\n')}
            />
            <RAGDemo />
            <Prose
              content={[
                '¿Y cómo se fine-tunea un modelo de 70B sin un datacenter? **LoRA**: congela todas las $W$ y, junto a cada capa, añade un desvío entrenable de **bajo rango**. Si el ajuste que necesita tu tarea vive en unas pocas direcciones (hipótesis empírica que se cumple sorprendentemente bien), aprender $\\Delta W$ completo es un desperdicio: basta factorizarlo como $BA$ con $r \\ll d$. Parámetros entrenables: de miles de millones a unos pocos millones (~0.1–1%), cabe en una GPU de consumo, y los «adaptadores» se guardan/intercambian como archivos de unos pocos MB.',
              ].join('\n')}
            />
            <Llano>
              Piensa en W como una carretera de mil carriles ya asfaltada (congelada). Fine-tunar sería
              reasfaltarla entera. LoRA construye una callejuela lateral de r carriles (B·A) por donde
              pasa el ajuste fino: con que aprendas esos pocos carriles basta, porque casi todos los
              cambios útiles caben en muy pocas direcciones. Al servir el modelo, sumas la callejuela a
              la carretera y queda una sola matriz: cero latencia extra.
            </Llano>
            <FormulaBlock
              formula={String.raw`y = xW^{\top} + \frac{\alpha}{r}\, x A^{\top} B^{\top}, \qquad \Delta W = \frac{\alpha}{r} BA, \qquad \mathrm{rango}(\Delta W) \le r`}
              caption="LoRA: W congelada + desvío de bajo rango entrenable (A: r×d_in, B: d_out×r)"
              breakdown={[
                { symbol: String.raw`W`, color: '#8E9AB8', explanation: 'la matriz original del modelo preentrenado: congelada, nunca recibe gradiente' },
                { symbol: String.raw`A`, color: '#22D3EE', explanation: 'proyección hacia abajo (r × d_in): comprime la activación a r dimensiones; se inicializa con ruido pequeño' },
                { symbol: String.raw`B`, color: '#8B5CF6', explanation: 'proyección hacia arriba (d_out × r): vuelve al espacio de salida; se inicializa a CERO (al arrancar, ΔW = 0 y el modelo intacto)' },
                { symbol: String.raw`r`, color: '#FBBF24', explanation: 'el rango: 4–64 típico. Número de direcciones de ajuste que te permites aprender' },
                { symbol: String.raw`\frac{\alpha}{r}`, color: '#FB7185', explanation: 'escala del desvío: α/r estabiliza el entrenamiento al cambiar r sin retocar el learning rate' },
                { symbol: String.raw`\Delta W`, color: '#A3E635', explanation: 'el parche efectivo: al servir puedes fundirlo en W (W\' = W + ΔW) sin coste extra de inferencia' },
              ]}
            />
            <Prose
              content={[
                '**QLoRA** estira el truco hasta el límite: el modelo base congelado se **cuantiza a 4 bits** (formato NF4, pensado para pesos ~gaussianos, con doble cuantización de las constantes) y los adaptadores LoRA se entrenan en bf16 encima. Resultado: fine-tuning de un 65B en una sola GPU de 48 GB, con calidad prácticamente idéntica al fine-tuning completo en 16 bits. Es la técnica que democratizó el fine-tuning casero.',
              ].join('\n')}
            />
          </Section>

          {/* 8.6 · Ejercicios */}
          <Section id="ejercicios" kicker="8.6 · MANOS A LA OBRA" title="Ejercicios autocorregidos">
            <Prose
              content={[
                'Seis ejercicios, de la rotación de RoPE al entrenamiento de un adaptador LoRA completo. Todo con numpy, todo corregido al instante en tu navegador. Total: **540 XP** en ejercicios + **40 XP** en quizzes.',
              ].join('\n')}
            />
            <div className="space-y-8">
              <ExerciseCard exercise={eRope} />
              <ExerciseCard exercise={eKv} />
              <ExerciseCard exercise={eGqa} />
              <ExerciseCard exercise={eDpo} />
              <ExerciseCard exercise={eRag} />
              <ExerciseCard exercise={eLora} />
            </div>

            <div className="space-y-5 pt-4">
              <QuizCard
                quizId="llm-quiz-1"
                xp={10}
                question="¿Por qué RoPE ha sustituido al PE sinusoidal en los LLM modernos?"
                options={[
                  { text: 'Porque es más barato de computar', correct: false, explanation: 'El coste es comparable; la ventaja no es de precio sino de geometría.' },
                  { text: 'Porque codifica la posición RELATIVA directamente en el producto punto q·k, y escala mejor a contextos largos', correct: true, explanation: '¡Exacto! Al rotar q y k, su producto punto solo depende de m−n: la atención ve distancias, no etiquetas absolutas. Además, con reescalados tipo YaRN se estira a contextos enormes.' },
                  { text: 'Porque elimina la necesidad de softmax', correct: false, explanation: 'RoPE no toca la softmax: actúa sobre q y k antes de calcular las puntuaciones.' },
                  { text: 'Porque añade parámetros entrenables extra', correct: false, explanation: 'Al contrario: RoPE no tiene parámetros — es una rotación fija determinada por la posición.' },
                ]}
              />
              <QuizCard
                quizId="llm-quiz-2"
                xp={10}
                question="¿Qué reduce exactamente GQA (Grouped-Query Attention)?"
                options={[
                  { text: 'El número de FLOPs de la atención', correct: false, explanation: 'Las Q siguen siendo H cabezas atendiendo: el cómputo de scores apenas cambia. Lo que cae es la MEMORIA de la KV cache (y el ancho de banda al generar).' },
                  { text: 'La memoria de la KV cache, compartiendo K/V entre grupos de cabezas', correct: true, explanation: '¡Correcto! Con G grupos en vez de H cabezas K/V, la caché se divide por H/G. En contextos largos, eso es la diferencia entre caber o no caber en la GPU.' },
                  { text: 'El número de capas del modelo', correct: false, explanation: 'GQA no toca la profundidad: cambia cuántos pares K/V mantiene cada capa.' },
                  { text: 'El tamaño del vocabulario', correct: false, explanation: 'El vocabulario es independiente: GQA actúa sobre las proyecciones K/V de la atención.' },
                ]}
              />
              <QuizCard
                quizId="llm-quiz-3"
                xp={10}
                question="¿Qué problema resuelve la auxiliary load balancing loss en un MoE?"
                options={[
                  { text: 'El colapso de expertos: que el router mande todos los tokens a unos pocos', correct: true, explanation: '¡Eso es! Sin balanceo, el experto que gana por azar se entrena más y acapara todo (ley del rico). La pérdida auxiliar penaliza el reparto desigual y mantiene a todos los expertos útiles.' },
                  { text: 'La divergencia del gradiente en el router', correct: false, explanation: 'El router entrena con gradientes estándar; el problema no es numérico sino de reparto de carga.' },
                  { text: 'El sobreajuste de los expertos a sus datos', correct: false, explanation: 'No va de generalización: va de que ningún experto se quede sin trabajo (ni ninguno se sature).' },
                  { text: 'La latencia de inferencia del top-k', correct: false, explanation: 'La latencia se gestiona con top-k fijo y capacidad por experto; la aux loss es un tema de ENTRENAMIENTO.' },
                ]}
              />
              <QuizCard
                quizId="llm-quiz-4"
                xp={10}
                question="¿Cuándo elegir RAG y cuándo fine-tuning (LoRA)?"
                options={[
                  { text: 'RAG para cambiar el estilo del modelo; fine-tune para datos que cambian a diario', correct: false, explanation: 'Justo al revés: el estilo se graba con fine-tuning; los datos volátiles se sirven frescos con RAG.' },
                  { text: 'RAG para conocimiento cambiante y trazable; fine-tune para comportamiento, formato y jerga', correct: true, explanation: '¡Correcto! RAG lee la fuente en tiempo real (y puedes citarla); LoRA moldea cómo responde el modelo. En producción se combinan: LoRA para el cómo, RAG para el qué.' },
                  { text: 'Da igual: ambos re-entrenan el modelo', correct: false, explanation: 'RAG no toca ni un peso: recupera documentos y los pega en el prompt en tiempo de inferencia.' },
                  { text: 'Fine-tune siempre: RAG es solo un parche', correct: false, explanation: 'Fine-tunar conocimiento que cambia cada semana es carísimo y frágil (y el modelo no puede citar sus fuentes). RAG gana ahí por goleada.' },
                ]}
              />
            </div>
          </Section>

          {/* 8.7 · Siguiente */}
          <Section id="siguiente" kicker="8.7 · SIGUIENTE" title="El tercer paradigma: aprender actuando">
            <Link
              to="/modulos/rl"
              className="group flex items-center justify-between gap-6 rounded-2xl border border-line bg-panel p-8 transition-all hover:-translate-y-1 hover:border-cyan/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            >
              <div>
                <div className="mb-2 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
                  // SIGUIENTE · N9 REINFORCEMENT LEARNING
                </div>
                <div className="font-display text-2xl font-bold text-ink md:text-3xl">
                  Reinforcement Learning: bandidos, Q-learning y policy gradients
                </div>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                  <TeX content="Has visto cómo se alinea un LLM con RLHF. En el siguiente nivel aprendes el paradigma completo que hay debajo: agentes, recompensas, la ecuación de Bellman y el PPO que usaste como caja negra." />
                </p>
              </div>
              <ArrowRight className="h-8 w-8 shrink-0 text-cyan transition-transform group-hover:translate-x-2" aria-hidden />
            </Link>
          </Section>
        </div>
      </div>
    </div>
  )
}
