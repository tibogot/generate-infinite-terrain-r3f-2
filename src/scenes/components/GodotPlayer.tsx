import { useRef } from "react";
import { GodotCharacterHybrid } from "../../components/GodotCharacterHybrid";
import { useGameState } from "../../contexts/GameStateContext";

/**
 * GodotPlayer - Wrapper component for GodotCharacterHybrid
 * Integrates the Godot character with the infinite terrain system
 * Uses Rapier-only ground detection (no BVH collider needed)
 */
export default function GodotPlayer() {
  const state = useGameState();
  const positionRef = useRef<[number, number, number]>([0, 50, 0]);

  // Get initial spawn position from game state
  const playerState = state.player;
  if (playerState && playerState.position) {
    const pos = playerState.position.current;
    positionRef.current = [pos[0], pos[1], pos[2]];
  }

  // Optional: Sync position back to game state if needed
  // For now, GodotCharacterHybrid manages its own state independently

  return (
    <GodotCharacterHybrid
      position={positionRef.current}
      cameraMode="follow-orbit"
      collider={null} // Use Rapier-only ground detection
      // Optional callbacks to sync with game state if needed:
      // onPositionChange={(pos) => {
      //   playerState.position.current = pos;
      // }}
      // onRotationChange={(rot) => {
      //   playerState.rotation = rot;
      // }}
    />
  );
}

