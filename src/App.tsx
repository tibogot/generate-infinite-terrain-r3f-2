import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Perf } from "r3f-perf";
import { GameStateProvider } from "./contexts/GameStateContext";
import { SkyProvider } from "./contexts/SkyContext";
import { NoiseProvider } from "./contexts/NoiseContext";
import { MapProvider } from "./contexts/MapContext";
import Scene from "./components/Scene";
import UI from "./components/UI";
import "./style.css";

function App() {
  return (
    <GameStateProvider>
      <MapProvider>
        <SkyProvider>
          <NoiseProvider>
            <div className="game">
              <Canvas
                gl={{
                  alpha: false,
                  antialias: true,
                  powerPreference: "high-performance",
                }}
                dpr={[1, 2]}
                camera={{ fov: 45, near: 0.1, far: 5000 }}
                onCreated={(state) => {
                  state.gl.setClearColor("#222222", 1);
                  state.gl.outputColorSpace = "srgb";
                  state.gl.toneMapping = 4; // ACESFilmicToneMapping
                }}
              >
                <Perf position="top-left" />
                <Suspense fallback={null}>
                  <Scene />
                </Suspense>
              </Canvas>
              <UI />
            </div>
          </NoiseProvider>
        </SkyProvider>
      </MapProvider>
    </GameStateProvider>
  );
}

export default App;
