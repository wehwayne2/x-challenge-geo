import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import "./App.css";

export default function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1555b0",
        position: "relative",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        gl={{ antialias: true }}
        dpr={[1, 1]}
      >
        <Experience />
      </Canvas>
      <div className="overlay">
        <div className="overlay-title">
          <span>Geo Demo</span>
          <span className="overlay-separator">—</span>
          <a
            href="https://xianyaowei.com"
            target="_blank"
            rel="noopener noreferrer"
            className="overlay-name"
          >
            Xianyao Wei
          </a>
        </div>
        <div className="overlay-desc">
          <a
            href="https://x.com/threejs/status/2045024314400051552?s=20"
            target="_blank"
            rel="noopener noreferrer"
          >
            X- challenge
          </a>
          : a procedural globe An experiment inspired by posts from
          <a
            href="https://x.com/ito3am"
            target="_blank"
            rel="noopener noreferrer"
          >
            @ito3am
          </a>
          &
          <a
            href="https://x.com/threejs"
            target="_blank"
            rel="noopener noreferrer"
          >
            @threejs
          </a>
        </div>
      </div>
    </div>
  );
}
