import { /* OrbitControls, */ Stats } from '@react-three/drei'
import { HexGlobe } from './HexGlobe'
import { BloomEffect } from './BloomEffect'

export function Experience() {
  return (
    <>
      <color attach="background" args={['#024B90']} />
      <ambientLight intensity={0.2} color={'#ffffff'}/>
      <directionalLight position={[8, 3, 5]} intensity={2.8} color={'#fffefb'} castShadow shadow-mapSize={[2048, 2048]} />
      <HexGlobe />
     {/*  <OrbitControls enableDamping dampingFactor={0.05} /> */}
      <BloomEffect />
      <Stats />
    </>
  )
}
