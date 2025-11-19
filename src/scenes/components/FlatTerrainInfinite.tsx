import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useThree } from "@react-three/fiber";
import { useGameState } from "../../contexts/GameStateContext";

interface FlatTerrainChunk {
  id: string;
  x: number;
  z: number;
  size: number;
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
}

/**
 * FlatTerrainInfinite - Infinite flat terrain that generates chunks procedurally
 * Uses the same chunk system as the regular terrain but generates flat planes
 */
export default function FlatTerrainInfinite() {
  const { scene } = useThree();
  const state = useGameState();
  const chunksRef = useRef<Map<string, FlatTerrainChunk>>(new Map());
  const [chunks, setChunks] = useState<Map<string, FlatTerrainChunk>>(
    new Map()
  );

  // Get chunk size from state
  const chunkSize = useMemo(() => state.chunks.maxSize, [state.chunks.maxSize]);

  // Create a flat terrain material
  const materialTemplate = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x8b9a5b, // Grass green
      metalness: 0.1,
      roughness: 0.9,
    });
  }, []);

  // Function to create a flat terrain chunk
  const createFlatChunk = (
    x: number,
    z: number,
    size: number
  ): FlatTerrainChunk => {
    const id = `${x},${z}`;

    // Create geometry for flat plane
    const segments = 1; // Simple plane
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2); // Rotate to horizontal

    // Create material (clone the template)
    const material = materialTemplate.clone();

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0, z);
    mesh.receiveShadow = true;
    mesh.castShadow = false;

    // Patch with CSM if available
    const csmInstance = (scene as any).userData?.csm;
    if (csmInstance && csmInstance.setupMaterial) {
      try {
        csmInstance.setupMaterial(material);
        material.needsUpdate = true;
      } catch (error) {
        console.warn("Failed to patch flat terrain material with CSM:", error);
      }
    }

    return {
      id,
      x,
      z,
      size,
      mesh,
      geometry,
      material,
    };
  };

  // Function to get chunk coordinates around player
  const getChunkCoordinates = () => {
    const playerPos = state.player.position.current;
    const chunkX = Math.floor(playerPos[0] / chunkSize) * chunkSize;
    const chunkZ = Math.floor(playerPos[2] / chunkSize) * chunkSize;

    // Generate chunks in a 3x3 grid around player
    const coordinates: Array<{ x: number; z: number }> = [];
    const radius = 1; // 3x3 grid

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        coordinates.push({
          x: chunkX + dx * chunkSize,
          z: chunkZ + dz * chunkSize,
        });
      }
    }

    return coordinates;
  };

  // Update chunks based on player position
  useEffect(() => {
    const updateChunks = () => {
      const coordinates = getChunkCoordinates();
      const newChunks = new Map(chunksRef.current);

      // Remove chunks that are too far away
      const coordinateKeys = new Set(coordinates.map((c) => `${c.x},${c.z}`));
      for (const [key, chunk] of newChunks) {
        if (!coordinateKeys.has(key)) {
          // Cleanup and remove
          chunk.geometry.dispose();
          chunk.material.dispose();
          newChunks.delete(key);
        }
      }

      // Create new chunks
      for (const coord of coordinates) {
        const key = `${coord.x},${coord.z}`;
        if (!newChunks.has(key)) {
          const chunk = createFlatChunk(coord.x, coord.z, chunkSize);
          newChunks.set(key, chunk);
          // Don't add to scene here - we'll render via React
        }
      }

      chunksRef.current = newChunks;
      setChunks(newChunks);
    };

    // Initial update
    updateChunks();

    // Update periodically (chunks system updates when player moves)
    const intervalId = setInterval(updateChunks, 100);

    // Also listen to player position changes
    const checkInterval = setInterval(() => {
      updateChunks();
    }, 500); // Check every 500ms

    return () => {
      clearInterval(intervalId);
      clearInterval(checkInterval);

      // Cleanup all chunks
      for (const chunk of chunksRef.current.values()) {
        chunk.geometry.dispose();
        chunk.material.dispose();
      }
      chunksRef.current.clear();
    };
  }, [chunkSize, scene, state.player.position, materialTemplate]);

  // Note: Meshes are already added to scene in useEffect
  // We just need to return the RigidBody components for physics
  return (
    <>
      {Array.from(chunks.values()).map((chunk) => (
        <RigidBody
          key={chunk.id}
          type="fixed"
          colliders="trimesh"
          position={[chunk.x, 0, chunk.z]}
        >
          <mesh
            geometry={chunk.geometry}
            material={chunk.material}
            receiveShadow
            castShadow={false}
          />
        </RigidBody>
      ))}
    </>
  );
}
