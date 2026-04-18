import { EffectComposer, Bloom } from '@react-three/postprocessing'

export function BloomEffect() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.2}
        luminanceThreshold={1}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
    </EffectComposer>
  )
}
