import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { Perf } from "r3f-perf";
import { Physics } from "@react-three/rapier";
import { GameStateProvider } from "./contexts/GameStateContext";
import { SkyProvider } from "./contexts/SkyContext";
import { NoiseProvider } from "./contexts/NoiseContext";
import { MapProvider } from "./contexts/MapContext";
import Scene from "./components/Scene";
import UI from "./components/UI";
import PhysicsDebugControls, {
  registerPhysicsDebugSetter,
} from "./components/PhysicsDebugControls";
import "./style.css";

function App() {
  const [physicsDebug, setPhysicsDebug] = useState(false);

  // Register the setter so PhysicsDebugControls can update it
  useEffect(() => {
    registerPhysicsDebugSetter(setPhysicsDebug);
  }, []);

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
                <Physics debug={physicsDebug}>
                  <Suspense fallback={null}>
                    <Scene />
                    <PhysicsDebugControls />
                  </Suspense>
                </Physics>
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
