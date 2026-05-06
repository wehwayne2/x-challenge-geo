import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const DAMPING = 0.92
const SENSITIVITY = 0.005
const X_LIMIT = Math.PI / 2

export function useDragRotation(ref: React.RefObject<THREE.Object3D | null>) {
  const { gl } = useThree()
  const isDragging = useRef(false)
  const lastPos    = useRef<[number, number]>([0, 0])
  const vel        = useRef<[number, number]>([0, 0])

  useEffect(() => {
    const el = gl.domElement

    const onDown = (e: PointerEvent) => {
      isDragging.current = true
      lastPos.current = [e.clientX, e.clientY]
      vel.current = [0, 0]
    }
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      vel.current[0] = (e.clientX - lastPos.current[0]) * SENSITIVITY
      vel.current[1] = (e.clientY - lastPos.current[1]) * SENSITIVITY
      lastPos.current = [e.clientX, e.clientY]
    }
    const onUp = () => { isDragging.current = false }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl])

  useFrame(() => {
    const obj = ref.current
    if (!obj) return
    if (!isDragging.current) {
      vel.current[0] *= DAMPING
      vel.current[1] *= DAMPING
    }
    obj.rotation.y += vel.current[0]
    obj.rotation.x = Math.max(-X_LIMIT, Math.min(X_LIMIT, obj.rotation.x + vel.current[1]))
  })
}
