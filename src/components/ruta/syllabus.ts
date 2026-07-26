/**
 * syllabus.ts — temario detallado por módulo para la página Ruta.
 * Contenido abreviado; el detalle completo vive en cada página de módulo.
 */

export interface SyllabusTopic {
  idx: string
  name: string
  time: string
  /** número de bloques de teoría */
  teoria?: number
  /** número de demos */
  demos?: number
  /** número de ejercicios (incl. quiz) */
  ejercicios?: number
}

export interface SyllabusModule {
  level: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'N8' | 'N9' | 'N10' | 'BOSS'
  title: string
  path: string
  meta: string
  topics: SyllabusTopic[]
  prereqs: Array<{ label: string; path: string }>
}

export const SYLLABUS: SyllabusModule[] = [
  {
    level: 'N0',
    title: 'Fundamentos: matemáticas y regresión',
    path: '/modulos/fundamentos',
    meta: '5 demos · 14 ejercicios + 3 quiz · 590 XP',
    topics: [
      { idx: '0.1', name: '¿Qué significa "aprender"?', time: '15 min', teoria: 1 },
      { idx: '0.2', name: 'Álgebra lineal esencial', time: '30 min', teoria: 1, demos: 1 },
      { idx: '0.3', name: 'Cálculo: la derivada y el gradiente', time: '30 min', teoria: 1, demos: 1 },
      { idx: '0.4', name: 'Probabilidad y máxima verosimilitud', time: '25 min', teoria: 1, demos: 1 },
      { idx: '0.5', name: 'Regresión lineal, MSE y solución OLS', time: '30 min', teoria: 1, demos: 1 },
      { idx: '0.6', name: 'Descenso del gradiente', time: '30 min', teoria: 1, demos: 1 },
      { idx: '0.7', name: 'Ejercicios autocorregidos + quiz', time: '45 min', ejercicios: 6 },
      { idx: '0.8', name: 'Proyecto: predice el precio de una vivienda', time: '45 min', ejercicios: 3 },
    ],
    prereqs: [],
  },
  {
    level: 'N1',
    title: 'ML clásico: clasificar, medir y no sobreajustar',
    path: '/modulos/ml-clasico',
    meta: '7 demos · 9 ejercicios + quiz · 600 XP',
    topics: [
      { idx: '1.1', name: 'Sigmoide y log-loss', time: '30 min', teoria: 1, demos: 1 },
      { idx: '1.2', name: 'Métricas y matriz de confusión', time: '30 min', teoria: 1, demos: 1 },
      { idx: '1.3', name: 'Overfitting y regularización L1/L2', time: '30 min', teoria: 1, demos: 1 },
      { idx: '1.4', name: 'KNN: predicción por vecindad', time: '20 min', teoria: 1, demos: 1 },
      { idx: '1.5', name: 'SVM y márgenes máximos', time: '25 min', teoria: 1, demos: 1 },
      { idx: '1.6', name: 'Árboles y ensembles (bagging/boosting)', time: '30 min', teoria: 1, demos: 1 },
      { idx: '1.7', name: 'K-means y PCA', time: '30 min', teoria: 1, demos: 2 },
      { idx: '1.7', name: 'Proyecto: detector de spam', time: '45 min', ejercicios: 3 },
      { idx: '1.8', name: 'Ejercicios autocorregidos + quiz', time: '60 min', ejercicios: 7 },
    ],
    prereqs: [{ label: 'N0 · Fundamentos', path: '/modulos/fundamentos' }],
  },
  {
    level: 'N2',
    title: 'Redes neuronales',
    path: '/modulos/redes-neuronales',
    meta: '6 demos · 9 ejercicios · 820 XP',
    topics: [
      { idx: '2.1', name: 'La neurona y el perceptrón', time: '20 min', teoria: 1, demos: 1 },
      { idx: '2.2', name: 'Funciones de activación', time: '20 min', teoria: 1, demos: 1 },
      { idx: '2.3', name: 'Forward pass', time: '25 min', teoria: 1, demos: 1 },
      { idx: '2.4', name: 'Backpropagation', time: '40 min', teoria: 1, demos: 1 },
      { idx: '2.5', name: 'Optimizadores: SGD → Adam', time: '30 min', teoria: 1, demos: 1 },
      { idx: '2.6', name: 'Inicialización y regularización', time: '25 min', teoria: 1, demos: 1 },
      { idx: '2.8', name: 'Proyecto: mini-MNIST de dígitos', time: '50 min', ejercicios: 3 },
    ],
    prereqs: [{ label: 'N1 · ML clásico', path: '/modulos/ml-clasico' }],
  },
  {
    level: 'N3',
    title: 'Redes convolucionales (CNN)',
    path: '/modulos/cnn',
    meta: '6 demos · 10 ejercicios · 860 XP',
    topics: [
      { idx: '3.1', name: 'Convolución 2D y kernels', time: '30 min', teoria: 1, demos: 1 },
      { idx: '3.2', name: 'Stride y padding', time: '15 min', teoria: 1, demos: 1 },
      { idx: '3.3', name: 'Pooling', time: '15 min', teoria: 1, demos: 1 },
      { idx: '3.4', name: 'Mapas de características', time: '20 min', teoria: 1, demos: 1 },
      { idx: '3.5', name: 'Arquitecturas: LeNet → ResNet', time: '30 min', teoria: 1, demos: 1 },
      { idx: '3.6', name: 'Campo receptivo y data augmentation', time: '25 min', teoria: 1, demos: 1 },
      { idx: '3.7', name: 'Proyecto: clasificador de gatos y perros', time: '60 min', ejercicios: 4 },
    ],
    prereqs: [{ label: 'N2 · Redes neuronales', path: '/modulos/redes-neuronales' }],
  },
  {
    level: 'N4',
    title: 'Secuencias y atención',
    path: '/modulos/secuencias',
    meta: '5 demos · 9 ejercicios · 760 XP',
    topics: [
      { idx: '4.1', name: 'Embeddings', time: '25 min', teoria: 1, demos: 1 },
      { idx: '4.2', name: 'RNN y vanishing gradients', time: '30 min', teoria: 1, demos: 1 },
      { idx: '4.3', name: 'Puertas LSTM / GRU', time: '30 min', teoria: 1, demos: 1 },
      { idx: '4.4', name: 'Seq2seq', time: '25 min', teoria: 1, demos: 1 },
      { idx: '4.5', name: 'La intuición de la atención', time: '30 min', teoria: 1, demos: 1 },
      { idx: '4.7', name: 'Proyecto: forecasting de ventas', time: '50 min', ejercicios: 3 },
    ],
    prereqs: [{ label: 'N2 · Redes neuronales', path: '/modulos/redes-neuronales' }],
  },
  {
    level: 'N5',
    title: 'Transformers',
    path: '/modulos/transformers',
    meta: '6 demos · 9 ejercicios · 870 XP',
    topics: [
      { idx: '5.1', name: 'Self-attention: Q, K, V', time: '35 min', teoria: 1, demos: 1 },
      { idx: '5.2', name: 'Multi-head attention', time: '25 min', teoria: 1, demos: 1 },
      { idx: '5.3', name: 'Positional encoding', time: '20 min', teoria: 1, demos: 1 },
      { idx: '5.4', name: 'La arquitectura completa', time: '40 min', teoria: 1, demos: 1 },
      { idx: '5.5', name: 'BERT vs GPT', time: '25 min', teoria: 1, demos: 1 },
      { idx: '5.6', name: 'Tokenización BPE', time: '20 min', teoria: 1, demos: 1 },
      { idx: '5.7', name: 'Proyecto: sentimiento con self-attention', time: '50 min', ejercicios: 3 },
    ],
    prereqs: [{ label: 'N4 · Secuencias', path: '/modulos/secuencias' }],
  },
  {
    level: 'N6',
    title: 'Modelos generativos',
    path: '/modulos/generativos',
    meta: '5 demos · 6 ejercicios',
    topics: [
      { idx: '6.1', name: 'VAE y el ELBO', time: '30 min', teoria: 1, demos: 1 },
      { idx: '6.2', name: 'GAN: el juego minimax', time: '30 min', teoria: 1, demos: 1 },
      { idx: '6.3', name: 'Dinámicas de entrenamiento', time: '25 min', teoria: 1, demos: 1 },
      { idx: '6.4', name: 'Difusión', time: '30 min', teoria: 1, demos: 1 },
      { idx: '6.5', name: 'Ética de la IA generativa', time: '20 min', teoria: 1 },
    ],
    prereqs: [{ label: 'N5 · Transformers', path: '/modulos/transformers' }],
  },
  {
    level: 'N7',
    title: 'PyTorch práctico',
    path: '/modulos/pytorch',
    meta: '3 demos · 6 ejercicios + quiz · 550 XP',
    topics: [
      { idx: '7.1', name: 'Autograd: el motor que deriva solo', time: '35 min', teoria: 1, demos: 1 },
      { idx: '7.2', name: 'Tensores y broadcasting', time: '30 min', teoria: 1, demos: 1 },
      { idx: '7.3', name: 'El training loop real', time: '40 min', teoria: 1, demos: 1 },
      { idx: '7.4', name: 'GPU y buenas prácticas', time: '25 min', teoria: 1 },
      { idx: '7.5', name: 'Ejercicios autocorregidos + quiz', time: '70 min', ejercicios: 7 },
    ],
    prereqs: [{ label: 'N2 · Redes neuronales', path: '/modulos/redes-neuronales' }],
  },
  {
    level: 'N8',
    title: 'LLMs modernos',
    path: '/modulos/llm-modernos',
    meta: '3 demos · 6 ejercicios + quiz · 580 XP',
    topics: [
      { idx: '8.1', name: 'RoPE y ALiBi: la posición moderna', time: '30 min', teoria: 1 },
      { idx: '8.2', name: 'KV cache, GQA y FlashAttention', time: '35 min', teoria: 1, demos: 1 },
      { idx: '8.3', name: 'Mixture of Experts', time: '25 min', teoria: 1, demos: 1 },
      { idx: '8.4', name: 'Pipeline: pretrain → SFT → RLHF/DPO', time: '40 min', teoria: 1 },
      { idx: '8.5', name: 'RAG y fine-tuning ligero (LoRA)', time: '35 min', teoria: 1, demos: 1 },
      { idx: '8.6', name: 'Ejercicios autocorregidos + quiz', time: '70 min', ejercicios: 7 },
    ],
    prereqs: [{ label: 'N5 · Transformers', path: '/modulos/transformers' }],
  },
  {
    level: 'N9',
    title: 'Reinforcement Learning',
    path: '/modulos/rl',
    meta: '3 demos · 6 ejercicios + quiz · 570 XP',
    topics: [
      { idx: '9.1', name: 'El bucle agente-entorno', time: '25 min', teoria: 1, demos: 1 },
      { idx: '9.2', name: 'Bandidos: explorar o explotar', time: '30 min', teoria: 1, demos: 1 },
      { idx: '9.3', name: 'MDP y la ecuación de Bellman', time: '35 min', teoria: 1 },
      { idx: '9.4', name: 'Q-learning', time: '40 min', teoria: 1, demos: 1 },
      { idx: '9.5', name: 'Policy gradients: REINFORCE y PPO', time: '35 min', teoria: 1 },
      { idx: '9.6', name: 'Ejercicios autocorregidos + quiz', time: '70 min', ejercicios: 7 },
    ],
    prereqs: [{ label: 'N2 · Redes neuronales', path: '/modulos/redes-neuronales' }],
  },
  {
    level: 'N10',
    title: 'MLOps y producción',
    path: '/modulos/mlops',
    meta: '3 demos · 5 ejercicios + quiz · 490 XP',
    topics: [
      { idx: '10.1', name: 'Ciclo de vida del modelo', time: '25 min', teoria: 1, demos: 1 },
      { idx: '10.2', name: 'Cuantización int8', time: '35 min', teoria: 1, demos: 1 },
      { idx: '10.3', name: 'Pruning y destilación', time: '30 min', teoria: 1 },
      { idx: '10.4', name: 'ONNX y formatos de exportación', time: '20 min', teoria: 1 },
      { idx: '10.5', name: 'Monitoring y drift', time: '30 min', teoria: 1, demos: 1 },
      { idx: '10.6', name: 'Ejercicios autocorregidos + quiz', time: '60 min', ejercicios: 6 },
    ],
    prereqs: [{ label: 'N7 · PyTorch práctico', path: '/modulos/pytorch' }],
  },
  {
    level: 'BOSS',
    title: 'Proyecto final (Boss Final)',
    path: '/laboratorio',
    meta: 'examen capstone · dataset real',
    topics: [
      { idx: 'B.1', name: 'Dataset real y exploración', time: '40 min', teoria: 1 },
      { idx: 'B.2', name: 'Pipeline completo de entrenamiento', time: '60 min', ejercicios: 1 },
      { idx: 'B.3', name: 'Superar el umbral de accuracy', time: '45 min', ejercicios: 1 },
      { idx: 'B.4', name: 'Informe final', time: '30 min', teoria: 1 },
    ],
    prereqs: [
      { label: 'N5 · Transformers', path: '/modulos/transformers' },
      { label: 'N6 · Generativos', path: '/modulos/generativos' },
    ],
  },
]
