import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameState } from "../contexts/GameStateContext";
import TerrainStandard from "./TerrainStandard";
import TerrainState from "../Game/State/Terrain";

export default function TerrainsStandard() {
  const state = useGameState();
  const [terrainStates, setTerrainStates] = useState<Map<string, TerrainState>>(
    new Map()
  );

  // Function to sync terrain states
  useEffect(() => {
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
    };
  }, [state]);

  // Render terrain instances
  return (
    <>
      {Array.from(terrainStates.values()).map((terrainState) => (
        <TerrainStandard
          key={terrainState.id}
          terrainState={terrainState}
        />
      ))}
    </>
  );
}

