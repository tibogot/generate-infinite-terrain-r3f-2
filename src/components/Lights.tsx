import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { useControls } from "leva";
import * as THREE from "three";
import { useGameState } from "../contexts/GameStateContext";

export default function Lights() {
  const state = useGameState();
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  const {
    ambientIntensity,
    directionalIntensity,
    enableShadows,
    lightPosition,
    shadowMapSize,
    shadowSize,
    shadowRadius,
    shadowBias,
  } = useControls("💡 Lights", {
    ambientIntensity: {
      value: 1.0,
      min: 0,
      max: 2,
      step: 0.1,
      label: "Ambient Light Intensity",
    },
    directionalIntensity: {
      value: 2.0,
      min: 0,
      max: 5,
      step: 0.1,
      label: "Directional Light Intensity",
    },
    enableShadows: {
      value: true,
      label: "Enable Shadows",
    },
    lightPosition: {
      value: { x: -500, y: 500, z: -500 },
      label: "Light Position",
    },
    shadowMapSize: {
      value: 4096,
      min: 512,
      max: 8192,
      step: 512,
      label: "Shadow Map Size",
    },
    shadowSize: {
      value: 200,
      min: 50,
      max: 1000,
      step: 10,
      label: "Shadow Area Size",
    },
    shadowRadius: {
      value: 2,
      min: 0,
      max: 10,
      step: 0.5,
      label: "Shadow Blur Radius",
    },
    shadowBias: {
      value: -0.0001,
      min: -0.01,
      max: 0.01,
      step: 0.0001,
      label: "Shadow Bias",
    },
  });

  // Initialize shadow camera configuration
  useEffect(() => {
    if (directionalLightRef.current && enableShadows) {
      const shadow = directionalLightRef.current.shadow;
      shadow.mapSize.width = shadowMapSize;
      shadow.mapSize.height = shadowMapSize;
      shadow.camera.near = 0.5;
      shadow.camera.far = 2000;
      shadow.bias = shadowBias;
      shadow.normalBias = 0.01; // Reduced to prevent shadow offset
      shadow.radius = shadowRadius;
    }
  }, [enableShadows, shadowMapSize, shadowBias, shadowRadius]);

  // Update directional light position and shadow configuration
  useFrame(() => {
    if (directionalLightRef.current) {
      const light = directionalLightRef.current;

      // For directional lights, position doesn't matter, but we set it anyway
      // The important thing is the direction (which comes from position to target)
      light.position.set(lightPosition.x, lightPosition.y, lightPosition.z);

      // Set light target to origin (or player position) to define direction
      const playerPos = state.player.position.current;
      light.target.position.set(playerPos[0], playerPos[1], playerPos[2]);
      light.target.updateMatrixWorld();

      // Update intensity
      light.intensity = directionalIntensity;
      // Update shadow casting
      light.castShadow = enableShadows;

      // Configure shadow camera if shadows are enabled
      if (enableShadows && light.shadow) {
        const shadow = light.shadow;

        // Update shadow map size if changed
        if (shadow.mapSize.width !== shadowMapSize) {
          shadow.mapSize.width = shadowMapSize;
          shadow.mapSize.height = shadowMapSize;
        }

        // Update shadow properties
        shadow.bias = shadowBias;
        shadow.radius = shadowRadius;

        // Position shadow camera to follow player
        // For directional lights, shadow camera should be positioned along the light direction
        const shadowDistance = 500;
        shadow.camera.position.set(
          playerPos[0] -
            (lightPosition.x / Math.abs(lightPosition.y || 1)) * shadowDistance,
          playerPos[1] + shadowDistance,
          playerPos[2] -
            (lightPosition.z / Math.abs(lightPosition.y || 1)) * shadowDistance
        );

        // Set shadow camera frustum to cover area around player
        // Smaller frustum = higher shadow resolution in that area
        shadow.camera.left = -shadowSize;
        shadow.camera.right = shadowSize;
        shadow.camera.top = shadowSize;
        shadow.camera.bottom = -shadowSize;

        // Make shadow camera look at the player position
        shadow.camera.lookAt(playerPos[0], playerPos[1], playerPos[2]);

        shadow.camera.updateProjectionMatrix();
        shadow.updateMatrices(light);
      }
    }
  });

  return (
    <>
      {/* Ambient light for base illumination - prevents completely black areas */}
      <ambientLight intensity={ambientIntensity} />

      {/* Directional light with fixed position */}
      <directionalLight
        ref={directionalLightRef}
        intensity={directionalIntensity}
        castShadow={enableShadows}
        target-position={[0, 0, 0]}
      />
    </>
  );
}
