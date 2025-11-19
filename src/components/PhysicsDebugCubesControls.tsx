import { useEffect, useState, useRef } from "react";
import { useControls } from "leva";
import { useRapier } from "@react-three/rapier";
import { useMap } from "../contexts/MapContext";
import PhysicsDebugCubes from "./PhysicsDebugCubes";

export default function PhysicsDebugCubesControls() {
  const { world, rapier } = useRapier();
  const { activeMapConfig } = useMap();
  const [spawnHeight, setSpawnHeight] = useState(20);
  const hasCalculatedRef = useRef(false);
  const retryTimeoutRef = useRef<number | null>(null);

  const { enabled } = useControls("🔧 Physics", {
    enabled: {
      value: false,
      label: "Debug Cubes",
    },
  });

  useEffect(() => {
    if (!enabled || hasCalculatedRef.current) {
      return;
    }

    // Calculate spawn height based on player spawn position and terrain
    const calculateSpawnHeight = () => {
      if (!world || !rapier || !activeMapConfig) {
        return false;
      }

      // Get player spawn position from map config
      const spawnPos = activeMapConfig.player.spawnPosition;
      const [spawnX, spawnY, spawnZ] = spawnPos;

      // Cast a ray downward from spawn position to find terrain height
      const rayOrigin = {
        x: spawnX,
        y: spawnY, // Start from spawn Y (should be high)
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
            // Spawn cubes 10 units above terrain
            setSpawnHeight(terrainHeight + 10);
            hasCalculatedRef.current = true;
            return true;
          }
        }
        // Retry after a short delay if terrain might not be loaded yet
        return false;
      } catch (error) {
        console.error("Error calculating spawn height for debug cubes:", error);
        // Fallback height
        setSpawnHeight(spawnY - 40);
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
      if (!calculateSpawnHeight() && enabled) {
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
  }, [enabled, world, rapier, activeMapConfig]);

  // Reset calculation flag when disabled
  useEffect(() => {
    if (!enabled) {
      hasCalculatedRef.current = false;
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return <PhysicsDebugCubes enabled={enabled} spawnHeight={spawnHeight} />;
}
