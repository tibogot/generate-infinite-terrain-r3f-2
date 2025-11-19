import { useRef } from "react";
import { GodotCharacterHybrid } from "../../components/GodotCharacterHybrid";
import { useGameState } from "../../contexts/GameStateContext";
import { useMap } from "../../contexts/MapContext";

/**
 * GodotPlayer - Wrapper component for GodotCharacterHybrid
 * Integrates the Godot character with the infinite terrain system
 * Uses Rapier-only ground detection (no BVH collider needed)
 * Syncs position to game state so grass and other systems can follow it
 */
export default function GodotPlayer() {
  const state = useGameState();
  const { activeMapConfig } = useMap();
  const positionRef = useRef<[number, number, number]>([0, 50, 0]);

  // Get initial spawn position from map config or game state
  if (activeMapConfig?.player?.spawnPosition) {
    const spawnPos = activeMapConfig.player.spawnPosition;
    positionRef.current = [spawnPos[0], spawnPos[1], spawnPos[2]];
  } else {
    const playerState = state.player;
    if (playerState && playerState.position) {
      const pos = playerState.position.current;
      positionRef.current = [pos[0], pos[1], pos[2]];
    }
  }

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

  // Get camera mode from map config if available
  const cameraMode = activeMapConfig?.player?.characterType === "godot-hybrid" 
    ? "follow-orbit" 
    : "follow-orbit";

  return (
    <GodotCharacterHybrid
      position={positionRef.current}
      cameraMode={cameraMode}
      collider={null} // Use Rapier-only ground detection
      onPositionChange={handlePositionChange}
      onRotationChange={handleRotationChange}
    />
  );
}

