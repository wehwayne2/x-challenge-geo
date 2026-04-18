import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Experience'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1555b0' }}>
      <Canvas shadows camera={{ position: [0, 0, 3.2], fov: 45 }} gl={{ antialias: true }} dpr={[1,1]}>
        <Experience />
      </Canvas>
    </div>
  )
}
