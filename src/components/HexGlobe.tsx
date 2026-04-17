import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// --- Noise ---
function hash(n: number) {
  return Math.abs((Math.sin(n) * 43758.5453123) % 1)
}

function noise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = x - ix, fy = y - iy, fz = z - iz
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz)
  const h = (a: number, b: number, c: number) => hash(a + b * 57 + c * 113)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  return lerp(
    lerp(lerp(h(ix, iy, iz), h(ix + 1, iy, iz), ux), lerp(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), ux), uy),
    lerp(lerp(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), ux), lerp(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), ux), uy),
    uz
  )
}

function fbm(x: number, y: number, z: number, oct = 5): number {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < oct; i++) {
    v += (noise3D(x * f, y * f, z * f) * 2 - 1) * a
    a *= 0.5; f *= 2
  }
  return v
}

// --- World classification ---
function isLand(lat: number, lng: number): boolean {
  const phi = lat * Math.PI / 180, th = lng * Math.PI / 180
  const x = Math.cos(phi) * Math.cos(th)
  const y = Math.cos(phi) * Math.sin(th)
  const z = Math.sin(phi)
  return fbm(x * 2.1, y * 2.1, z * 2.1) > 0.08
}

function landBiome(lat: number, lng: number): 'forest' | 'land' | 'desert' {
  const phi = lat * Math.PI / 180, th = lng * Math.PI / 180
  const x = Math.cos(phi) * Math.cos(th)
  const y = Math.cos(phi) * Math.sin(th)
  const z = Math.sin(phi)
  const d = fbm(x * 5, y * 5, z * 5)
  if (Math.abs(lat) < 38 && d > 0.05) return 'desert'
  return d > -0.05 ? 'forest' : 'land'
}

// --- Hex helpers ---
function makeHexShape(r: number): THREE.Shape {
  const s = new THREE.Shape()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6
    i === 0 ? s.moveTo(r * Math.cos(a), r * Math.sin(a)) : s.lineTo(r * Math.cos(a), r * Math.sin(a))
  }
  s.closePath()
  return s
}

function placeHex(mesh: THREE.Mesh, lat: number, lng: number, radius: number, qUp: THREE.Vector3, tmpQ: THREE.Quaternion) {
  const phi = (90 - lat) * Math.PI / 180
  const theta = (lng + 180) * Math.PI / 180
  const pos = new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  )
  mesh.position.copy(pos)
  tmpQ.setFromUnitVectors(qUp, pos.clone().normalize())
  mesh.quaternion.copy(tmpQ)
}

function rnd(a: number, b: number) { return a + Math.random() * (b - a) }
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)] }

// --- Constants ---
const SPHERE_R = 1.0
const SEA_H = 0.014
const LAND_H: [number, number] = [0.058, 0.095]
const CLOUD_R = 1.1      // floats above land/sea
const CLOUD_H = 0.02     // fixed extrude depth; opacity+scale drives the anim

const SEA_COLORS   = [0x0c6882, 0x1880a0, 0x0f799a, 0x1a8fb8, 0x11779c]
const LAND_COLORS: Record<string, number[]> = {
  forest: [0x256028, 0x2f7230, 0x388440, 0x42904a],
  land:   [0x4a8030, 0x589038, 0x67a840],
  desert: [0xb08838, 0xc09848, 0xcda855, 0xd4b060],
}
const ICE_COLORS   = [0xcce4f0, 0xddf0f8, 0xeef8ff]
const CLOUD_COLORS = [0xe8f4f8, 0xf4fafc, 0xffffff, 0xfafcff]

// ── Grid density ──────────────────────────────────────────────────────────────
// Controls hex count for all three layers. Higher = more hexes, smaller tiles.
// Recommended range: 10 (chunky) → 50 (dense)
const GRID_DENSITY = 73
// ──────────────────────────────────────────────────────────────────────────────

const HEX_FACE_R = 0.035
const GAP        = 0.7
const LAT_STEPS  = GRID_DENSITY
const MAX_COLS   = Math.round(GRID_DENSITY * 1.57)  // ≈ π/2 × LAT_STEPS keeps hexes roughly square

// Cloud noise threshold — fraction of hexes that are "potentially cloudy"
const CLOUD_THRESHOLD = 0.2

type CloudEntry = {
  mesh: THREE.Mesh
  nx: number; ny: number; nz: number
}

export function HexGlobe() {
  const groupRef        = useRef<THREE.Group>(null)
  const cloudEntriesRef = useRef<CloudEntry[]>([])
  const timeRef         = useRef(0)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    const qUp  = new THREE.Vector3(0, 0, 1)
    const tmpQ = new THREE.Quaternion()
    const geos: THREE.BufferGeometry[] = []
    const mats: THREE.Material[]       = []
    const clouds: CloudEntry[]         = []

    // Atmosphere glow
    const atmoGeo = new THREE.SphereGeometry(1.12, 64, 32)
    const atmoMat = new THREE.MeshPhongMaterial({ color: 0x3388cc, transparent: true, opacity: 0.07, side: THREE.BackSide })
    geos.push(atmoGeo); mats.push(atmoMat)
    group.add(new THREE.Mesh(atmoGeo, atmoMat))

    const seaShape   = makeHexShape(HEX_FACE_R * GAP)
    const landShape  = makeHexShape(HEX_FACE_R * GAP)
    const cloudShape = makeHexShape(HEX_FACE_R * GAP * 0.96)

    for (let i = 0; i <= LAT_STEPS; i++) {
      const lat    = -88 + 176 * i / LAT_STEPS
      const cosLat = Math.cos(lat * Math.PI / 180)
      const cols   = Math.max(4, Math.round(MAX_COLS * cosLat))
      const isPolar = Math.abs(lat) > 75

      for (let j = 0; j < cols; j++) {
        const lng  = -180 + 360 * j / cols
        const land = isPolar || isLand(lat, lng)

        // Layer 1 – sea (every position)
        {
          const color = isPolar ? pick(ICE_COLORS) : pick(SEA_COLORS)
          const geo   = new THREE.ExtrudeGeometry(seaShape, { depth: SEA_H, bevelEnabled: false })
          const mat   = new THREE.MeshPhongMaterial({ color, shininess: land ? 10 : 70, specular: land ? 0x111111 : 0x224466 })
          geos.push(geo); mats.push(mat)
          const mesh = new THREE.Mesh(geo, mat)
          placeHex(mesh, lat, lng, SPHERE_R, qUp, tmpQ)
          group.add(mesh)
        }

        // Layer 2 – land (land positions only)
        if (land && !isPolar) {
          const biome = landBiome(lat, lng)
          const color = pick(LAND_COLORS[biome])
          const h     = rnd(...LAND_H)
          const geo   = new THREE.ExtrudeGeometry(landShape, { depth: h, bevelEnabled: false })
          const mat   = new THREE.MeshPhongMaterial({ color, shininess: 12, specular: 0x111111 })
          geos.push(geo); mats.push(mat)
          const mesh = new THREE.Mesh(geo, mat)
          placeHex(mesh, lat, lng, SPHERE_R, qUp, tmpQ)
          group.add(mesh)
        }

        // Layer 3 – clouds at EVERY position, driven entirely by animated noise
        {
          const color = pick(CLOUD_COLORS)
          const geo   = new THREE.ExtrudeGeometry(cloudShape, { depth: CLOUD_H, bevelEnabled: false })
          const mat   = new THREE.MeshPhongMaterial({ color, shininess: 30, specular: 0x99bbcc })
          geos.push(geo); mats.push(mat)
          const mesh = new THREE.Mesh(geo, mat)
          mesh.visible = false          // hidden until noise says otherwise
          placeHex(mesh, lat, lng, CLOUD_R, qUp, tmpQ)
          group.add(mesh)

          const phi = lat * Math.PI / 180
          const th  = lng * Math.PI / 180
          clouds.push({
            mesh,
            nx: Math.cos(phi) * Math.cos(th),
            ny: Math.cos(phi) * Math.sin(th),
            nz: Math.sin(phi),
          })
        }
      }
    }

    cloudEntriesRef.current = clouds

    return () => {
      geos.forEach(g => g.dispose())
      mats.forEach(m => m.dispose())
      group.clear()
    }
  }, [])

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (groupRef.current) groupRef.current.rotation.y += delta * 0.18

    // Rotate the noise-sample coordinates around Y at a different rate than the globe.
    // This makes the cloud pattern drift across the surface over time.
    const driftAngle = t * 0.055          // noise field rotation speed
    const cosD = Math.cos(driftAngle)
    const sinD = Math.sin(driftAngle)

    cloudEntriesRef.current.forEach(({ mesh, nx, ny, nz }) => {
      const rx = nx * cosD - nz * sinD
      const rz = nx * sinD + nz * cosD
      const n  = fbm(rx * 2.4, ny * 2.4, rz * 2.4, 4)
      mesh.visible = n > CLOUD_THRESHOLD
    })
  })

  return <group ref={groupRef} />
}
