import { OrbitControls, Stats } from '@react-three/drei'
import { HexGlobe } from './HexGlobe'
import { BloomEffect } from './BloomEffect'

export function Experience() {
  return (
    <>
      <color attach="background" args={['#024B90']} />
      <ambientLight intensity={1} color={'#73a3be'}/>
      <directionalLight position={[4, 3, 4]} intensity={3.8} color={'#fffefb'} castShadow shadow-mapSize={[2048, 2048]} />
      <HexGlobe />
      <OrbitControls enableDamping dampingFactor={0.05} />
      <BloomEffect />
      <Stats />
    </>
  )
}
