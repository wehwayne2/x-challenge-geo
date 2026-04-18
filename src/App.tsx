import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import "./App.css";
import * as THREE from "three";

const isMobile = window.innerWidth < 768

export default function App() {
  const [detail, setDetail] = useState(32);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#014A8D",
        position: "relative",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: isMobile ? 75 : 55 }}
        shadows={{ type: THREE.VSMShadowMap }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          stencil: false,
          logarithmicDepthBuffer: false,
        }}
        dpr={[1, 1.5]}
      >
        <Experience detail={detail} />
      </Canvas>
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          fontFamily: "monospace",
          fontSize: 13,
        }}
      >
        <label>Detail: {detail}</label>
        <input
          type="range"
          min={12}
          max={32}
          step={1}
          value={detail}
          onChange={(e) => setDetail(parseInt(e.target.value))}
          style={{ width: 120, accentColor: "#5f9aff" }}
        />
      </div>
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
