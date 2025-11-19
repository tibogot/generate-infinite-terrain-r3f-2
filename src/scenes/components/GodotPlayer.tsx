import { useRef, useState, useEffect } from "react";
import { GodotCharacterHybrid } from "../../components/GodotCharacterHybrid";
import { useGameState } from "../../contexts/GameStateContext";
import { useMap } from "../../contexts/MapContext";
import { registerGodotCameraModeSetter } from "../../components/CameraControls";
import { useRapier } from "@react-three/rapier";

/**
 * GodotPlayer - Wrapper component for GodotCharacterHybrid
 * Integrates the Godot character with the infinite terrain system
 * Uses Rapier-only ground detection (no BVH collider needed)
 * Syncs position to game state so grass and other systems can follow it
 */
export default function GodotPlayer() {
  const state = useGameState();
  const { activeMapConfig } = useMap();
  const { world, rapier } = useRapier();
  const positionRef = useRef<[number, number, number]>([0, 20, 0]);
  const [cameraMode, setCameraMode] = useState<string>("follow"); // Default to "follow" for map3
  const [calculatedPosition, setCalculatedPosition] = useState<
    [number, number, number] | null
  >(null);
  const hasCalculatedRef = useRef(false);
  const retryTimeoutRef = useRef<number | null>(null);

  // Register setter so CameraControls can update camera mode
  useEffect(() => {
    registerGodotCameraModeSetter(setCameraMode);
  }, []);

  // Calculate spawn position on terrain using raycast
  useEffect(() => {
    if (hasCalculatedRef.current || !world || !rapier || !activeMapConfig) {
      return;
    }

    // Get initial spawn position from map config or game state
    // Force spawn at center [0, y, 0] for proper camera view
    let spawnPos: [number, number, number] = [0, 20, 0];
    if (activeMapConfig?.player?.spawnPosition) {
      // Use Y from config, but force X and Z to 0 for center spawn
      const configPos = activeMapConfig.player.spawnPosition;
      spawnPos = [0, configPos[1], 0];
    } else {
      const playerState = state.player;
      if (playerState && playerState.position) {
        const pos = playerState.position.current;
        // Force X and Z to 0 for center spawn
        spawnPos = [0, pos[1], 0];
      }
    }

    const calculateSpawnHeight = () => {
      if (!world || !rapier) {
        return false;
      }

      // Always spawn at center [0, y, 0]
      const spawnX = 0;
      const spawnZ = 0;
      const spawnY = spawnPos[1];

      // Cast a ray downward from spawn position to find terrain height
      // Start from a high Y position to ensure we're above the terrain
      const rayOrigin = {
        x: spawnX,
        y: Math.max(spawnY, 100), // Use spawn Y or 100, whichever is higher
        z: spawnZ,
      };
      const rayDirection = { x: 0, y: -1, z: 0 };
      const rayLength = 200; // Cast far enough to hit terrain

      try {
        const ray = new rapier.Ray(rayOrigin, rayDirection);
        const hit = world.castRay(ray, rayLength, true);

        if (hit) {
          const hitToi =
            (hit as any).toi ??
            (hit as any).timeOfImpact ??
            (hit as any).time_of_impact ??
            null;

          if (typeof hitToi === "number") {
            const hitPoint = ray.pointAt(hitToi);
            const terrainHeight = hitPoint.y;
            // Spawn character 2 units above terrain (capsule height is ~1.8, so this gives some clearance)
            const finalY = terrainHeight + 2;
            setCalculatedPosition([spawnX, finalY, spawnZ]);
            positionRef.current = [spawnX, finalY, spawnZ];
            hasCalculatedRef.current = true;
            return true;
          }
        }
        // Retry after a short delay if terrain might not be loaded yet
        return false;
      } catch (error) {
        console.error(
          "Error calculating spawn height for Godot character:",
          error
        );
        // Fallback to original spawn position
        setCalculatedPosition(spawnPos);
        positionRef.current = spawnPos;
        hasCalculatedRef.current = true;
        return true;
      }
    };

    // Clear any existing timeout
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Try to calculate immediately
    if (calculateSpawnHeight()) {
      return;
    }

    // If it fails, retry after a delay (terrain might still be loading)
    const retry = () => {
      if (!calculateSpawnHeight()) {
        retryTimeoutRef.current = window.setTimeout(retry, 500);
      }
    };

    retryTimeoutRef.current = window.setTimeout(retry, 500);

    return () => {
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [world, rapier, activeMapConfig, state.player]);

  // Get spawn position for fallback - always center [0, y, 0]
  let spawnPos: [number, number, number] = [0, 20, 0];
  if (activeMapConfig?.player?.spawnPosition) {
    const configPos = activeMapConfig.player.spawnPosition;
    spawnPos = [0, configPos[1], 0]; // Force center spawn
  } else {
    const playerState = state.player;
    if (playerState && playerState.position) {
      const pos = playerState.position.current;
      spawnPos = [0, pos[1], 0]; // Force center spawn
    }
  }

  // Use calculated position if available, otherwise use spawn position
  const finalPosition = calculatedPosition || spawnPos;

  // Sync position back to game state so grass can follow it
  const handlePositionChange = (pos: [number, number, number]) => {
    const playerState = state.player;
    if (playerState && playerState.position) {
      playerState.position.current[0] = pos[0];
      playerState.position.current[1] = pos[1];
      playerState.position.current[2] = pos[2];
    }
  };

  // Sync rotation to game state
  const handleRotationChange = (rot: number) => {
    const playerState = state.player;
    if (playerState) {
      playerState.rotation = rot;
    }
  };

  return (
    <GodotCharacterHybrid
      position={finalPosition}
      cameraMode={cameraMode}
      collider={null} // Use Rapier-only ground detection
      onPositionChange={handlePositionChange}
      onRotationChange={handleRotationChange}
    />
  );
}
