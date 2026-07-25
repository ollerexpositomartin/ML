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
  level: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'BOSS'
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
    meta: '5 demos · 5 ejercicios + quiz · 290 XP',
    topics: [
      { idx: '0.1', name: '¿Qué significa "aprender"?', time: '15 min', teoria: 1 },
      { idx: '0.2', name: 'Álgebra lineal esencial', time: '30 min', teoria: 1, demos: 1 },
      { idx: '0.3', name: 'Cálculo: la derivada y el gradiente', time: '30 min', teoria: 1, demos: 1 },
      { idx: '0.4', name: 'Probabilidad y máxima verosimilitud', time: '25 min', teoria: 1, demos: 1 },
      { idx: '0.5', name: 'Regresión lineal, MSE y solución OLS', time: '30 min', teoria: 1, demos: 1 },
      { idx: '0.6', name: 'Descenso del gradiente', time: '30 min', teoria: 1, demos: 1 },
      { idx: '0.7', name: 'Ejercicios autocorregidos + quiz', time: '45 min', ejercicios: 6 },
    ],
    prereqs: [],
  },
  {
    level: 'N1',
    title: 'ML clásico: clasificar, medir y no sobreajustar',
    path: '/modulos/ml-clasico',
    meta: '7 demos · 6 ejercicios + quiz · 400 XP',
    topics: [
      { idx: '1.1', name: 'Sigmoide y log-loss', time: '30 min', teoria: 1, demos: 1 },
      { idx: '1.2', name: 'Métricas y matriz de confusión', time: '30 min', teoria: 1, demos: 1 },
      { idx: '1.3', name: 'Overfitting y regularización L1/L2', time: '30 min', teoria: 1, demos: 1 },
      { idx: '1.4', name: 'KNN: predicción por vecindad', time: '20 min', teoria: 1, demos: 1 },
      { idx: '1.5', name: 'SVM y márgenes máximos', time: '25 min', teoria: 1, demos: 1 },
      { idx: '1.6', name: 'Árboles y ensembles (bagging/boosting)', time: '30 min', teoria: 1, demos: 1 },
      { idx: '1.7', name: 'K-means y PCA', time: '30 min', teoria: 1, demos: 2 },
      { idx: '1.8', name: 'Ejercicios autocorregidos + quiz', time: '60 min', ejercicios: 7 },
    ],
    prereqs: [{ label: 'N0 · Fundamentos', path: '/modulos/fundamentos' }],
  },
  {
    level: 'N2',
    title: 'Redes neuronales',
    path: '/modulos/redes-neuronales',
    meta: '6 demos · 8 ejercicios',
    topics: [
      { idx: '2.1', name: 'La neurona y el perceptrón', time: '20 min', teoria: 1, demos: 1 },
      { idx: '2.2', name: 'Funciones de activación', time: '20 min', teoria: 1, demos: 1 },
      { idx: '2.3', name: 'Forward pass', time: '25 min', teoria: 1, demos: 1 },
      { idx: '2.4', name: 'Backpropagation', time: '40 min', teoria: 1, demos: 1 },
      { idx: '2.5', name: 'Optimizadores: SGD → Adam', time: '30 min', teoria: 1, demos: 1 },
      { idx: '2.6', name: 'Inicialización y regularización', time: '25 min', teoria: 1, demos: 1 },
    ],
    prereqs: [{ label: 'N1 · ML clásico', path: '/modulos/ml-clasico' }],
  },
  {
    level: 'N3',
    title: 'Redes convolucionales (CNN)',
    path: '/modulos/cnn',
    meta: '6 demos · 7 ejercicios',
    topics: [
      { idx: '3.1', name: 'Convolución 2D y kernels', time: '30 min', teoria: 1, demos: 1 },
      { idx: '3.2', name: 'Stride y padding', time: '15 min', teoria: 1, demos: 1 },
      { idx: '3.3', name: 'Pooling', time: '15 min', teoria: 1, demos: 1 },
      { idx: '3.4', name: 'Mapas de características', time: '20 min', teoria: 1, demos: 1 },
      { idx: '3.5', name: 'Arquitecturas: LeNet → ResNet', time: '30 min', teoria: 1, demos: 1 },
      { idx: '3.6', name: 'Campo receptivo y data augmentation', time: '25 min', teoria: 1, demos: 1 },
    ],
    prereqs: [{ label: 'N2 · Redes neuronales', path: '/modulos/redes-neuronales' }],
  },
  {
    level: 'N4',
    title: 'Secuencias y atención',
    path: '/modulos/secuencias',
    meta: '5 demos · 7 ejercicios',
    topics: [
      { idx: '4.1', name: 'Embeddings', time: '25 min', teoria: 1, demos: 1 },
      { idx: '4.2', name: 'RNN y vanishing gradients', time: '30 min', teoria: 1, demos: 1 },
      { idx: '4.3', name: 'Puertas LSTM / GRU', time: '30 min', teoria: 1, demos: 1 },
      { idx: '4.4', name: 'Seq2seq', time: '25 min', teoria: 1, demos: 1 },
      { idx: '4.5', name: 'La intuición de la atención', time: '30 min', teoria: 1, demos: 1 },
    ],
    prereqs: [{ label: 'N2 · Redes neuronales', path: '/modulos/redes-neuronales' }],
  },
  {
    level: 'N5',
    title: 'Transformers',
    path: '/modulos/transformers',
    meta: '6 demos · 8 ejercicios',
    topics: [
      { idx: '5.1', name: 'Self-attention: Q, K, V', time: '35 min', teoria: 1, demos: 1 },
      { idx: '5.2', name: 'Multi-head attention', time: '25 min', teoria: 1, demos: 1 },
      { idx: '5.3', name: 'Positional encoding', time: '20 min', teoria: 1, demos: 1 },
      { idx: '5.4', name: 'La arquitectura completa', time: '40 min', teoria: 1, demos: 1 },
      { idx: '5.5', name: 'BERT vs GPT', time: '25 min', teoria: 1, demos: 1 },
      { idx: '5.6', name: 'Tokenización BPE', time: '20 min', teoria: 1, demos: 1 },
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
