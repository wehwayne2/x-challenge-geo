import { EffectComposer, Bloom } from '@react-three/postprocessing'

export function BloomEffect() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.64}
        luminanceSmoothing={0.1}
        mipmapBlur
      />
    </EffectComposer>
  )
}
