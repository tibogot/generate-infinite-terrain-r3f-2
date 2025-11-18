import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameState } from "../contexts/GameStateContext";
import { useSky } from "../contexts/SkyContext";
import TerrainMaterial from "../Game/View/Materials/TerrainMaterial";
import TerrainGradient from "../Game/View/TerrainGradient";
import Terrain from "./Terrain";
import TerrainState from "../Game/State/Terrain";

export default function Terrains() {
  const state = useGameState();
  const { fogTexture } = useSky();
  const materialRef = useRef<TerrainMaterial | null>(null);
  const gradientRef = useRef<TerrainGradient | null>(null);
  const [terrainStates, setTerrainStates] = useState<Map<string, TerrainState>>(
    new Map()
  );

  // Initialize gradient and material
  useEffect(() => {
    gradientRef.current = new TerrainGradient();
    materialRef.current = new TerrainMaterial();

    if (materialRef.current && gradientRef.current) {
      materialRef.current.uniforms.uPlayerPosition.value = new THREE.Vector3();
      materialRef.current.uniforms.uGradientTexture.value =
        gradientRef.current.texture;
      materialRef.current.uniforms.uLightnessSmoothness.value = 0.25;
      materialRef.current.uniforms.uFresnelOffset.value = 0;
      materialRef.current.uniforms.uFresnelScale.value = 0.5;
      materialRef.current.uniforms.uFresnelPower.value = 2;
      materialRef.current.uniforms.uSunPosition.value = new THREE.Vector3(
        -0.5,
        -0.5,
        -0.5
      );
      materialRef.current.uniforms.uGrassDistance.value = state.chunks.minSize;
      // Set fog texture when available
      if (fogTexture.current) {
        materialRef.current.uniforms.uFogTexture.value = fogTexture.current;
      }
    }

    // Function to sync terrain states
    const syncTerrainStates = () => {
      const existingTerrains = new Map<string, TerrainState>();
      for (const [id, terrain] of state.terrains.terrains) {
        existingTerrains.set(id, terrain);
      }
      setTerrainStates(existingTerrains);
    };

    // Get existing terrain states immediately
    syncTerrainStates();

    // Also check periodically in case we missed some (terrain generation is async)
    const intervalId = setInterval(() => {
      syncTerrainStates();
    }, 100); // Check every 100ms

    // Listen for terrain creation events
    const handleCreate = (terrainState: TerrainState) => {
      setTerrainStates((prev) => {
        const next = new Map(prev);
        next.set(terrainState.id, terrainState);
        return next;
      });
    };

    const handleDestroy = (terrainState: TerrainState) => {
      setTerrainStates((prev) => {
        const next = new Map(prev);
        next.delete(terrainState.id);
        return next;
      });
    };

    state.terrains.events.on("create", handleCreate);
    state.terrains.events.on("destroy", handleDestroy);

    return () => {
      clearInterval(intervalId);
      state.terrains.events.off("create", handleCreate);
      state.terrains.events.off("destroy", handleDestroy);
      materialRef.current?.dispose();
      gradientRef.current?.texture?.dispose();
    };
  }, [state, fogTexture]);

  // Update material uniforms
  useFrame(() => {
    if (materialRef.current) {
      const playerState = state.player;
      const playerPosition = playerState.position.current;
      const sunState = state.sun;

      // Update fog texture if available
      if (fogTexture.current) {
        materialRef.current.uniforms.uFogTexture.value = fogTexture.current;
      }

      materialRef.current.uniforms.uPlayerPosition.value.set(
        playerPosition[0],
        playerPosition[1],
        playerPosition[2]
      );
      materialRef.current.uniforms.uSunPosition.value.set(
        sunState.position.x,
        sunState.position.y,
        sunState.position.z
      );
    }
  });

  // Render terrain instances
  if (!materialRef.current) {
    return null;
  }

  return (
    <>
      {Array.from(terrainStates.values()).map((terrainState) => (
        <Terrain
          key={terrainState.id}
          terrainState={terrainState}
          material={materialRef.current!}
        />
      ))}
    </>
  );
}
