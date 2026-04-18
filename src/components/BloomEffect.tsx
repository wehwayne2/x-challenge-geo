import { EffectComposer, Bloom } from '@react-three/postprocessing'

export function BloomEffect() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.1}
        mipmapBlur
      />
    </EffectComposer>
  )
}
