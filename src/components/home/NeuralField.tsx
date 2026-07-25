/**
 * NeuralField — Hero S1: campo de partículas neuronal (React Three Fiber).
 * ~250 nodos en 3D, aristas entre vecinos cercanos, pulsos de luz (lime→cyan)
 * viajando por aristas aleatorias (~cada 1.2s, máx. 8 en vuelo),
 * deriva lenta de cámara + parallax al cursor.
 * Se carga con React.lazy + Suspense desde Home; fallback = gradiente CSS.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const NODE_COUNT = 250
const EDGE_DIST = 1.15
const MAX_PULSES = 8
const PULSE_EVERY = 1.2

interface Pulse {
  edge: number
  t: number
}

function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null)
  const pulsesRef = useRef<Pulse[]>([])
  const pulseTimer = useRef(0)
  const pulseMeshes = useRef<Array<THREE.Mesh | null>>([])

  const { positions, edges } = useMemo(() => {
    const pos: THREE.Vector3[] = []
    const rng = mulberry32(20240607)
    for (let i = 0; i < NODE_COUNT; i++) {
      // distribución esferoidal achatada
      const r = 3.4 * Math.cbrt(rng())
      const theta = rng() * Math.PI * 2
      const phi = Math.acos(2 * rng() - 1)
      pos.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.62,
          r * Math.cos(phi) * 0.8,
        ),
      )
    }
    const eds: Array<[number, number]> = []
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (pos[i].distanceTo(pos[j]) < EDGE_DIST) eds.push([i, j])
      }
    }
    return { positions: pos, edges: eds }
  }, [])

  const { pointsGeo, linesGeo } = useMemo(() => {
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions.flatMap((p) => [p.x, p.y, p.z]), 3),
    )
    const lGeo = new THREE.BufferGeometry()
    lGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        edges.flatMap(([a, b]) => [positions[a].x, positions[a].y, positions[a].z, positions[b].x, positions[b].y, positions[b].z]),
        3,
      ),
    )
    return { pointsGeo: pGeo, linesGeo: lGeo }
  }, [positions, edges])

  const pulseProto = useMemo(() => {
    return {
      geo: new THREE.SphereGeometry(0.045, 8, 8),
    }
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const group = groupRef.current
    if (!group) return

    // deriva lenta + parallax al cursor
    group.rotation.y = t * 0.03
    group.rotation.x = Math.sin(t * 0.11) * 0.06
    const px = state.pointer.x
    const py = state.pointer.y
    group.position.x += (px * 0.35 - group.position.x) * 0.04
    group.position.y += (py * 0.22 - group.position.y) * 0.04

    // spawn de pulsos
    pulseTimer.current += delta
    if (pulseTimer.current > PULSE_EVERY && pulsesRef.current.length < MAX_PULSES && edges.length > 0) {
      pulseTimer.current = 0
      pulsesRef.current.push({ edge: Math.floor(Math.random() * edges.length), t: 0 })
    }

    // avance de pulsos
    pulsesRef.current = pulsesRef.current.filter((p) => {
      p.t += delta * 1.1
      return p.t < 1
    })

    pulseMeshes.current.forEach((mesh, i) => {
      if (!mesh) return
      const pulse = pulsesRef.current[i]
      if (!pulse) {
        mesh.visible = false
        return
      }
      mesh.visible = true
      const [a, b] = edges[pulse.edge]
      mesh.position.lerpVectors(positions[a], positions[b], pulse.t)
      const mat = mesh.material as THREE.MeshBasicMaterial
      // lime → cyan a lo largo del recorrido
      const c = new THREE.Color('#A3E635').lerp(new THREE.Color('#22D3EE'), pulse.t)
      mat.color = c
      const s = 0.6 + Math.sin(pulse.t * Math.PI) * 0.9
      mesh.scale.setScalar(s)
    })
  })

  return (
    <group ref={groupRef}>
      <points geometry={pointsGeo}>
        <pointsMaterial color="#8B5CF6" size={0.055} sizeAttenuation transparent opacity={0.9} />
      </points>
      <lineSegments geometry={linesGeo}>
        <lineBasicMaterial color="#1C2440" transparent opacity={0.4} />
      </lineSegments>
      {Array.from({ length: MAX_PULSES }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            pulseMeshes.current[i] = el
          }}
          geometry={pulseProto.geo}
          visible={false}
        >
          <meshBasicMaterial color="#A3E635" transparent opacity={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/** PRNG determinista para un layout estable de nodos. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function NeuralField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 55 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden
    >
      <NeuralNetwork />
    </Canvas>
  )
}
