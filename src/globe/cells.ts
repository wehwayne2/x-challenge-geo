import * as THREE from 'three'

export type Cell = {
  center: THREE.Vector3
  verts2d: [number, number][]
}

const _wup = new THREE.Vector3(0, 1, 0)

export function tangentFrame(center: THREE.Vector3) {
  const outward = center.clone()
  const north = _wup.clone().sub(outward.clone().multiplyScalar(_wup.dot(outward)))
  if (north.lengthSq() < 1e-6) north.set(1, 0, 0)
  north.normalize()
  const east = north.clone().cross(outward).normalize()
  return { outward, north, east }
}

export function buildCells(detail: number): Cell[] {
  const geo = new THREE.IcosahedronGeometry(1, detail)
  const pos = geo.attributes.position
  const N = pos.count

  const tv = Array.from({ length: N }, (_, i) =>
    new THREE.Vector3().fromBufferAttribute(pos, i).normalize())

  const fc: THREE.Vector3[] = []
  for (let i = 0; i < N; i += 3)
    fc.push(tv[i].clone().add(tv[i+1]).add(tv[i+2]).divideScalar(3).normalize())

  const keyMap = new Map<string, number>()
  const uv: THREE.Vector3[] = []
  const ui: number[] = []
  for (let i = 0; i < N; i++) {
    const v = tv[i]
    const k = `${(v.x*1e5+0.5|0)},${(v.y*1e5+0.5|0)},${(v.z*1e5+0.5|0)}`
    let idx = keyMap.get(k)
    if (idx === undefined) { idx = uv.length; uv.push(v.clone()); keyMap.set(k, idx) }
    ui[i] = idx
  }

  const vf: Set<number>[] = uv.map(() => new Set())
  for (let i = 0; i < N; i++) vf[ui[i]].add(i / 3 | 0)

  const cells: Cell[] = []
  for (let vi = 0; vi < uv.length; vi++) {
    const center = uv[vi]
    const fis = Array.from(vf[vi])
    if (fis.length < 3) continue

    const { north, east } = tangentFrame(center)

    const pts = fis.map(fi => fc[fi])
    pts.sort((a, b) => {
      const da = a.clone().sub(center), db = b.clone().sub(center)
      return Math.atan2(da.dot(north), da.dot(east)) - Math.atan2(db.dot(north), db.dot(east))
    })

    const verts2d: [number, number][] = pts.map(p => {
      const d = p.clone().sub(center)
      return [d.dot(east), d.dot(north)]
    })

    cells.push({ center, verts2d })
  }

  geo.dispose()
  return cells
}
