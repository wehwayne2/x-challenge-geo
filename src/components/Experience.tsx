import { /* OrbitControls, */ Stats } from '@react-three/drei'
import { HexGlobe } from './HexGlobe'
import { BloomEffect } from './BloomEffect'

export function Experience({ detail }: { detail: number }) {
  return (
    <>
      <color attach="background" args={['#024B90']} />
      <ambientLight intensity={0.1} color={'#ffffff'}/>
      <directionalLight position={[8, 3, 5]} intensity={2.5} color={'#fffefb'} castShadow shadow-mapSize={[4096, 4096]} />
      <HexGlobe key={detail} detail={detail} />
     {/*  <OrbitControls enableDamping dampingFactor={0.05} /> */}
      <BloomEffect />
      <Stats />
    </>
  )
}
