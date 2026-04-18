import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { buildCells, tangentFrame } from '../globe/cells'
import { isOcean, TERRAIN_H, OCEAN_H, rnd } from '../globe/biome'
import { fbm } from '../globe/noise'

// DETAIL prop
const SEA_RADIUS      = 0.99
const RADIUS          = 1.0
const CLOUD_RADIUS    = 1.09
const CLOUD_H         = 0.020
const CLOUD_THRESHOLD = 0.18

type CloudEntry = { mesh: THREE.Mesh; nx: number; ny: number; nz: number }

export function HexGlobe({ detail }: { detail: number }) {
  const groupRef        = useRef<THREE.Group>(null)
  const cloudEntriesRef = useRef<CloudEntry[]>([])
  const timeRef         = useRef(0)
  const seaUniformRef   = useRef<Record<string, { value: number }> | null>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    const cells = buildCells(detail)

    const seaGeos: THREE.BufferGeometry[]     = []
    const terrainGeos: THREE.BufferGeometry[] = []
    const cloudGeos: THREE.BufferGeometry[]   = []
    const cloudMats: THREE.Material[]         = []
    const clouds: CloudEntry[]                = []

    const tmp = new THREE.Vector3(1, 1, 1)

    for (const { center, verts2d } of cells) {
      const { outward, north, east } = tangentFrame(center)
      const basis = new THREE.Matrix4().makeBasis(east, north, outward)
      const quat  = new THREE.Quaternion().setFromRotationMatrix(basis)

      const makeGeo = (r: number, h: number) => {
        const shape = new THREE.Shape()
        verts2d.forEach(([x, y], i) => { i === 0 ? shape.moveTo(x*r, y*r) : shape.lineTo(x*r, y*r) })
        shape.closePath()
        const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false })
        geo.applyMatrix4(new THREE.Matrix4().compose(center.clone().multiplyScalar(r), quat, tmp))
        return geo
      }

      const ocean = isOcean(center)

      seaGeos.push(makeGeo(SEA_RADIUS, rnd(...OCEAN_H)))

      const fbmScale = 5
      if (!ocean) {
        const n = fbm(center.x * fbmScale, center.y * fbmScale, center.z * fbmScale, 4)
        const t = (n + 1) * 0.5
        const h = TERRAIN_H[0] + t * (TERRAIN_H[1] - TERRAIN_H[0]);
        terrainGeos.push(makeGeo(RADIUS, h))
      }

      // Clouds need individual meshes for per-hex visibility toggling
      const cmat = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.9, roughness: 0.8, emissive: '#5f9aff', emissiveIntensity: 0.2 })
      cloudMats.push(cmat)
      const cgeo = makeGeo(CLOUD_RADIUS, CLOUD_H)
      cloudGeos.push(cgeo)
      const cmesh = new THREE.Mesh(cgeo, cmat)
      cmesh.visible = false
      cmesh.castShadow = true
      group.add(cmesh)
      clouds.push({ mesh: cmesh, nx: center.x, ny: center.y, nz: center.z })
    }

    // Sea and terrain: 1 draw call each
    const seaMerged = mergeGeometries(seaGeos)
    seaGeos.forEach(g => g.dispose())
    const seaMat = new THREE.MeshLambertMaterial( {emissive: '#004bc5', emissiveIntensity: 0.1} )
    seaMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      seaUniformRef.current = shader.uniforms as Record<string, { value: number }>

      shader.vertexShader = 'uniform float uTime;\nvarying float vWave;\n' + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float wave = sin(position.x * 8.0 + uTime * 1.2) * cos(position.z * 8.0 + uTime * 0.9)
                   + sin(position.y * 8.0 + uTime * 0.7) * 0.5;
        vWave = wave;
        transformed += normalize(position) * wave * 0.03;`
      )

      shader.fragmentShader = 'varying float vWave;\n' + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float t = clamp(vWave * 0.9 + 0.2, 0.0, 1.0);
        vec3 dark  = vec3(0.,0.106,0.4);
        vec3 light = vec3(0.22,0.788,0.769);
        diffuseColor.rgb = mix(dark, light, t);`
      )
    }
    const seaMesh = new THREE.Mesh(seaMerged, seaMat)
    /* seaMesh.castShadow = true */
    seaMesh.receiveShadow = true
    group.add(seaMesh)

    let terrainMerged: THREE.BufferGeometry | null = null
    if (terrainGeos.length > 0) {
      terrainMerged = mergeGeometries(terrainGeos)
      terrainGeos.forEach(g => g.dispose())

      const terrainMat = new THREE.MeshPhongMaterial()
      terrainMat.onBeforeCompile = (shader) => {
        const decl = 'varying float vIsTop;\nvarying vec3 vObjPos;\n'
        shader.vertexShader = decl + shader.vertexShader
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vIsTop   = step(0.7, dot(normalize(normal), normalize(position)));
          vObjPos  = position;`
        )
        shader.fragmentShader = decl + shader.fragmentShader
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          // height above unit sphere surface, normalised 0‑1
          float h = clamp((length(vObjPos) - 1.0) / 0.13, 0.0, 1.0);
          h = smoothstep(0.35, 0.75, h);
          vec3 c0 = vec3(0.737,0.486,0.11);   // low  – brown
          vec3 c1 = vec3(0.086,0.8,0.204);      // mid  – green
          vec3 c2 = vec3(0.1,0.1,0.1);      // high – black
          vec3 c3 = vec3(1.0, 1.0, 1.0);      // peak – white
          float s = h * 3.999;
          vec3 topColor = s < 1.0 ? mix(c0, c1, s)
                        : s < 2.0 ? mix(c1, c2, s - 1.0)
                        :           mix(c2, c3, s - 2.0);
          vec3 sideColor = vec3(0.737,0.486,0.11);  // brown sides
          diffuseColor.rgb = mix(sideColor, topColor, vIsTop);
          
          `
        )
      }

      const terrainMesh = new THREE.Mesh(terrainMerged, terrainMat)
      terrainMesh.castShadow = true
      terrainMesh.receiveShadow = true
      group.add(terrainMesh)
    }

    cloudEntriesRef.current = clouds

    return () => {
      seaMerged.dispose()
      seaMat.dispose()
      terrainMerged?.dispose()
      cloudGeos.forEach(g => g.dispose())
      cloudMats.forEach(m => m.dispose())
      group.clear()
    }
  }, [])

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.15
    if (seaUniformRef.current) seaUniformRef.current.uTime.value = t

    const cloudSpeed = 0.08
    const cosD = Math.cos(t * cloudSpeed), sinD = Math.sin(t * 0.055)
    cloudEntriesRef.current.forEach(({ mesh, nx, ny, nz }) => {
      const rx = nx*cosD - nz*sinD, rz = nx*sinD + nz*cosD
      mesh.visible = fbm(rx*2.4, ny*2.4, rz*2.4, 4) > CLOUD_THRESHOLD
    })
  })

  return <group ref={groupRef} />
}
