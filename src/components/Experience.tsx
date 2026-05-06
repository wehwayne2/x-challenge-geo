import { HexGlobe } from './HexGlobe'
import { BloomEffect } from './BloomEffect'
import { Stats } from '@react-three/drei'

export function Experience({ detail, oceanThreshold }: { detail: number; oceanThreshold: number }) {
  return (
    <>
      <color attach="background" args={['#024B90']} />
      <ambientLight intensity={0.1} color={'#ffffff'} />
      <directionalLight position={[8, 3, 5]} intensity={2.5} color={'#fffefb'} castShadow shadow-mapSize={[1024,1024]} />

      <HexGlobe key={`${detail}-${oceanThreshold}`} detail={detail} oceanThreshold={oceanThreshold} />

      <BloomEffect />
      <Stats />
    </>
  )
}
