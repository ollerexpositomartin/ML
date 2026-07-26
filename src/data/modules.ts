/**
 * modules.ts — Datos del currículo SINAPSIS (Navbar, Footer, Ruta, Home).
 */

import type { LevelDef } from '@/lib/progress'
import {
  Sigma,
  LineChart,
  Network,
  Grid3X3,
  Waves,
  Sparkles,
  Wand2,
  Flame,
  MessageSquare,
  Gamepad2,
  Rocket,
  FlaskConical,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

export interface ModuleDef {
  slug: string
  path: string
  level: LevelDef['id']
  title: string
  tagline: string
  meta: string
  art: string
  color: string
  icon: LucideIcon
}

export const MODULES: ModuleDef[] = [
  {
    slug: 'fundamentos',
    path: '/modulos/fundamentos',
    level: 'N0',
    title: 'Fundamentos',
    tagline: 'Álgebra lineal, cálculo, probabilidad, regresión lineal y gradiente descendente.',
    meta: '8 demos · 8 ejercicios',
    art: '/art-fundamentos.png',
    color: '#22D3EE',
    icon: Sigma,
  },
  {
    slug: 'ml-clasico',
    path: '/modulos/ml-clasico',
    level: 'N1',
    title: 'ML Clásico',
    tagline: 'Regresión logística, métricas, regularización, SVM, árboles, ensembles, k-means y PCA.',
    meta: '7 demos · 9 ejercicios',
    art: '/art-clasico.png',
    color: '#22D3EE',
    icon: LineChart,
  },
  {
    slug: 'redes-neuronales',
    path: '/modulos/redes-neuronales',
    level: 'N2',
    title: 'Redes Neuronales',
    tagline: 'Del perceptrón al MLP: activaciones, backpropagation y optimizadores.',
    meta: '6 demos · 8 ejercicios',
    art: '/art-redes.png',
    color: '#8B5CF6',
    icon: Network,
  },
  {
    slug: 'cnn',
    path: '/modulos/cnn',
    level: 'N3',
    title: 'CNN · Visión',
    tagline: 'Convolución, pooling, kernels sobre imágenes reales y arquitecturas LeNet → ResNet.',
    meta: '6 demos · 7 ejercicios',
    art: '/art-cnn.png',
    color: '#8B5CF6',
    icon: Grid3X3,
  },
  {
    slug: 'secuencias',
    path: '/modulos/secuencias',
    level: 'N4',
    title: 'Secuencias',
    tagline: 'Embeddings, RNN, puertas LSTM/GRU, seq2seq y la intuición de la atención.',
    meta: '5 demos · 7 ejercicios',
    art: '/art-secuencias.png',
    color: '#8B5CF6',
    icon: Waves,
  },
  {
    slug: 'transformers',
    path: '/modulos/transformers',
    level: 'N5',
    title: 'Transformers',
    tagline: 'Self-attention, positional encoding, la arquitectura completa, BERT y GPT.',
    meta: '6 demos · 8 ejercicios',
    art: '/art-transformers.png',
    color: '#FBBF24',
    icon: Sparkles,
  },
  {
    slug: 'generativos',
    path: '/modulos/generativos',
    level: 'N6',
    title: 'Modelos Generativos',
    tagline: 'VAE, la dinámica minimax de las GAN, difusión y ética de la IA generativa.',
    meta: '5 demos · 6 ejercicios',
    art: '/art-generativos.png',
    color: '#FBBF24',
    icon: Wand2,
  },
  {
    slug: 'pytorch',
    path: '/modulos/pytorch',
    level: 'N7',
    title: 'PyTorch Práctico',
    tagline: 'Autograd, tensores, broadcasting y el training loop real: construye tu propio mini-framework.',
    meta: '3 demos · 6 ejercicios + quiz',
    art: '/art-pytorch.svg',
    color: '#A3E635',
    icon: Flame,
  },
  {
    slug: 'llm-modernos',
    path: '/modulos/llm-modernos',
    level: 'N8',
    title: 'LLMs Modernos',
    tagline: 'RoPE, KV cache, MoE, el pipeline pretrain → SFT → RLHF/DPO, RAG y LoRA.',
    meta: '3 demos · 6 ejercicios + quiz',
    art: '/art-llm.svg',
    color: '#FB7185',
    icon: MessageSquare,
  },
  {
    slug: 'rl',
    path: '/modulos/rl',
    level: 'N9',
    title: 'Reinforcement Learning',
    tagline: 'El bucle agente-entorno, bandidos, la ecuación de Bellman, Q-learning y policy gradients.',
    meta: '3 demos · 6 ejercicios + quiz',
    art: '/art-rl.svg',
    color: '#22D3EE',
    icon: Gamepad2,
  },
  {
    slug: 'mlops',
    path: '/modulos/mlops',
    level: 'N10',
    title: 'MLOps · Producción',
    tagline: 'Cuantización, pruning, destilación, ONNX y monitorización de drift en producción.',
    meta: '3 demos · 5 ejercicios + quiz',
    art: '/art-mlops.svg',
    color: '#8B5CF6',
    icon: Rocket,
  },
  {
    slug: 'laboratorio',
    path: '/laboratorio',
    level: 'BOSS',
    title: 'Laboratorio',
    tagline: 'Notebook libre, centro de ejercicios y el examen Boss Final.',
    meta: 'notebook · boss final',
    art: '/art-lab.png',
    color: '#FB7185',
    icon: FlaskConical,
  },
]

export const BOSS_NODE = {
  id: 'BOSS' as const,
  title: 'Proyecto final',
  outcome: 'Construye y entrena tu propio GPT en miniatura',
  icon: Trophy,
}

/** Nodos de "El Camino" (home S3) y la Ruta */
export const CAMINO_NODES = [
  { level: 'N0', name: 'Fundamentos matemáticos', outcome: 'Ajusta tu primera recta por mínimos cuadrados', meta: '8 demos · 8 ejercicios', path: '/modulos/fundamentos', color: '#22D3EE' },
  { level: 'N1', name: 'ML clásico', outcome: 'Clasifica, mide y regulariza como un profesional', meta: '7 demos · 9 ejercicios', path: '/modulos/ml-clasico', color: '#22D3EE' },
  { level: 'N2', name: 'Redes neuronales', outcome: 'Implementa backpropagation desde cero', meta: '6 demos · 8 ejercicios', path: '/modulos/redes-neuronales', color: '#8B5CF6' },
  { level: 'N3', name: 'CNN', outcome: 'Extrae features de imágenes con tus propios kernels', meta: '6 demos · 7 ejercicios', path: '/modulos/cnn', color: '#8B5CF6' },
  { level: 'N4', name: 'Secuencias', outcome: 'Entrena una LSTM que predice texto', meta: '5 demos · 7 ejercicios', path: '/modulos/secuencias', color: '#8B5CF6' },
  { level: 'N5', name: 'Transformers', outcome: 'Programa self-attention multi-cabeza a mano', meta: '6 demos · 8 ejercicios', path: '/modulos/transformers', color: '#FBBF24' },
  { level: 'N6', name: 'Modelos generativos', outcome: 'Enfrenta un generador y un discriminador (GAN)', meta: '5 demos · 6 ejercicios', path: '/modulos/generativos', color: '#FBBF24' },
  { level: 'N7', name: 'PyTorch práctico', outcome: 'Construye tu propio mini-framework con autograd', meta: '3 demos · 6 ejercicios + quiz', path: '/modulos/pytorch', color: '#A3E635' },
  { level: 'N8', name: 'LLMs modernos', outcome: 'Programa RoPE, KV cache y DPO con tus manos', meta: '3 demos · 6 ejercicios + quiz', path: '/modulos/llm-modernos', color: '#FB7185' },
  { level: 'N9', name: 'Reinforcement Learning', outcome: 'Entrena un agente Q-learning que resuelve un gridworld', meta: '3 demos · 6 ejercicios + quiz', path: '/modulos/rl', color: '#22D3EE' },
  { level: 'N10', name: 'MLOps y producción', outcome: 'Cuantiza, poda y monitoriza un modelo en producción', meta: '3 demos · 5 ejercicios + quiz', path: '/modulos/mlops', color: '#8B5CF6' },
  { level: 'BOSS', name: 'Proyecto final', outcome: 'Construye y entrena tu propio GPT en miniatura', meta: 'boss final · examen', path: '/laboratorio', color: '#FB7185' },
] as const
