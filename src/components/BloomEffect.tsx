import { EffectComposer, Bloom } from '@react-three/postprocessing'

export function BloomEffect() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.6}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.1}
        mipmapBlur
      />
    </EffectComposer>
  )
}
