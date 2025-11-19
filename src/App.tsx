import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { Perf } from "r3f-perf";
import { Physics } from "@react-three/rapier";
import { KeyboardControls } from "@react-three/drei";
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

// Keyboard controls map for GodotCharacterHybrid
const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "run", keys: ["ShiftLeft", "ShiftRight"] },
  { name: "crouch", keys: ["ControlLeft", "ControlRight", "KeyC"] },
  { name: "dance", keys: ["KeyE"] },
  { name: "roll", keys: ["KeyF"] },
  { name: "walkBackward", keys: ["KeyQ"] },
];

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
              <KeyboardControls map={keyboardMap}>
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
              </KeyboardControls>
              <UI />
            </div>
          </NoiseProvider>
        </SkyProvider>
      </MapProvider>
    </GameStateProvider>
  );
}

export default App;
