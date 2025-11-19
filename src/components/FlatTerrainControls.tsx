import { useControls } from "leva";

export interface FlatTerrainControls {
  color: string;
}

export function useFlatTerrainControls(): FlatTerrainControls {
  const controls = useControls("🌍 Flat Terrain", {
    color: {
      value: "#8b9a5b",
      label: "Floor Color",
    },
  });

  return controls;
}

/**
 * FlatTerrain Controls Component - Adds Leva controls for flat terrain
 * This component only provides UI controls, doesn't render anything
 */
export default function FlatTerrainControls() {
  useFlatTerrainControls();
  return null; // This component only adds Leva controls
}

