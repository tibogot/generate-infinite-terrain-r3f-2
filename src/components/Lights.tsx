import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useControls } from "leva";
import * as THREE from "three";
import { useGameState } from "../contexts/GameStateContext";

export default function Lights() {
  const state = useGameState();
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  const { ambientIntensity, directionalIntensity, enableShadows } = useControls(
    "💡 Lights",
    {
      ambientIntensity: {
        value: 0.4,
        min: 0,
        max: 2,
        step: 0.1,
        label: "Ambient Light Intensity",
      },
      directionalIntensity: {
        value: 1.0,
        min: 0,
        max: 5,
        step: 0.1,
        label: "Directional Light Intensity",
      },
      enableShadows: {
        value: false,
        label: "Enable Shadows",
      },
    }
  );

  // Update directional light to match sun position
  useFrame(() => {
    const sunState = state.sun;
    if (directionalLightRef.current) {
      // Set light direction opposite to sun position (light comes FROM the sun)
      directionalLightRef.current.position.set(
        -sunState.position.x * 1000,
        -sunState.position.y * 1000,
        -sunState.position.z * 1000
      );
      // Update intensity
      directionalLightRef.current.intensity = directionalIntensity;
      // Update shadow casting
      directionalLightRef.current.castShadow = enableShadows;
    }
  });

  return (
    <>
      {/* Ambient light for base illumination - prevents completely black areas */}
      <ambientLight intensity={ambientIntensity} />

      {/* Directional light that follows the sun position */}
      <directionalLight
        ref={directionalLightRef}
        intensity={directionalIntensity}
        castShadow={enableShadows}
      />
    </>
  );
}
