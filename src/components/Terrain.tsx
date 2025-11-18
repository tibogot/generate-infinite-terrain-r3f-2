import { useRef, useEffect, useState, useLayoutEffect } from "react";
import * as THREE from "three";
import TerrainMaterial from "../Game/View/Materials/TerrainMaterial";
import TerrainState from "../Game/State/Terrain";

interface TerrainProps {
  terrainState: TerrainState;
  material: TerrainMaterial;
}

export default function Terrain({ terrainState, material }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const [ready, setReady] = useState(terrainState.ready);

  // Listen for ready event
  useEffect(() => {
    if (terrainState.ready) {
      setReady(true);
      return;
    }

    const handleReady = () => {
      setReady(true);
    };
    terrainState.events.on("ready", handleReady);
    return () => {
      terrainState.events.off("ready", handleReady);
    };
  }, [terrainState]);

  // Create geometry once when ready - use useLayoutEffect to prevent visual glitches
  useLayoutEffect(() => {
    if (!ready || !terrainState.positions || geometryRef.current) return;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(terrainState.positions, 3)
    );
    geom.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(terrainState.uv, 2)
    );
    geom.index = new THREE.BufferAttribute(terrainState.indices, 1, false);

    geometryRef.current = geom;

    // Update mesh geometry if it exists
    if (meshRef.current) {
      meshRef.current.geometry = geom;
    }

    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
        geometryRef.current = null;
      }
    };
  }, [ready, terrainState.id]); // Use terrainState.id as stable dependency

  if (!ready || !geometryRef.current) {
    return null;
  }

  // Positions are already in world space (from worker), so mesh should be at origin
  return (
    <mesh ref={meshRef} geometry={geometryRef.current} material={material} />
  );
}
