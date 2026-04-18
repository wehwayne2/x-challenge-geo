import * as THREE from 'three'
import { fbm } from './noise'

export const TERRAIN_H: [number, number] = [0.001, 0.130]
export const OCEAN_H: [number, number] = [0.010, 0.018]

export function isOcean(v: THREE.Vector3): boolean {
  return fbm(v.x * 2.1, v.y * 2.1, v.z * 2.1) <= 0.08
}

export function rnd(a: number, b: number) { return a + Math.random() * (b - a) }
