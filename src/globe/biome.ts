import * as THREE from 'three'
import { fbm } from './noise'

export type Biome = 'ocean' | 'land' | 'forest' | 'desert'

export const BIOME: Record<Biome, { h: [number, number] }> = {
  ocean:  { h: [0.010, 0.018] },
  land:   { h: [0.035, 0.055] },
  forest: { h: [0.050, 0.080] },
  desert: { h: [0.025, 0.045] },
}


export function getBiome(v: THREE.Vector3): Biome {
  if (fbm(v.x*2.1, v.y*2.1, v.z*2.1) <= 0.08) return 'ocean'
  const lat = Math.asin(THREE.MathUtils.clamp(v.y, -1, 1)) * 180 / Math.PI
  const d = fbm(v.x*5, v.y*5, v.z*5)
  if (Math.abs(lat) < 35 && d > 0.05) return 'desert'
  return d > -0.05 ? 'forest' : 'land'
}

export function rnd(a: number, b: number) { return a + Math.random() * (b - a) }
