import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Experience'
import './App.css'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1555b0', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 0, 3.2], fov: 45 }} gl={{ antialias: true }} dpr={[1,1]}>
        <Experience />
      </Canvas>
      <div className="overlay">
        <span>Geo Demo</span>
        <span className="overlay-separator">—</span>
        <a href="https://xianyaowei.com" target="_blank" rel="noopener noreferrer" className="overlay-name">
          Xianyao Wei
        </a>
      </div>
    </div>
  )
}
