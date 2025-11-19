import { useControls } from "leva";

export interface Grass2Controls {
  enabled: boolean;
}

export function useGrass2Controls(): Grass2Controls {
  const controls = useControls("🌿 Grass 2", {
    enabled: {
      value: false,
      label: "Enabled",
    },
  });

  return controls;
}

/**
 * Grass2 Controls Component - Adds Leva controls for Grass2
 * This component only provides UI controls, doesn't render anything
 */
export default function Grass2Controls() {
  useGrass2Controls();
  return null; // This component only adds Leva controls
}

