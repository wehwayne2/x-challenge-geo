import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { HexGlobe } from './components/HexGlobe'
import './App.css'

export default function App() {
  return (
    <div className="canvas-wrap">
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 42 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#1555b0']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 3, 4]} intensity={1.8} color={0xfff8ee} />
        <directionalLight position={[-4, -2, -2]} intensity={0.5} color={0x4488ff} />
        <directionalLight position={[0, -1, -4]} intensity={0.25} color={0x88aaff} />
        <HexGlobe />
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  )
}
