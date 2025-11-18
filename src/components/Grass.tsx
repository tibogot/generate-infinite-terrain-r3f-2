import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameState } from "../contexts/GameStateContext";
import { useNoise } from "../contexts/NoiseContext";
import GrassMaterial from "../Game/View/Materials/GrassMaterial";
import Chunk from "../Game/State/Chunk";

export default function Grass() {
  const state = useGameState();
  const { noiseTexture } = useNoise();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<GrassMaterial | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  // Create geometry
  const geometry = useMemo(() => {
    const details = 200;
    const size = state.chunks.minSize;
    const count = details * details;
    const fragmentSize = size / details;
    const bladeWidthRatio = 1.5;
    const bladeHeightRatio = 4;
    const bladeHeightRandomness = 0.5;
    const positionRandomness = 0.5;

    const centers = new Float32Array(count * 3 * 2);
    const positions = new Float32Array(count * 3 * 3);

    for (let iX = 0; iX < details; iX++) {
      const fragmentX = (iX / details - 0.5) * size + fragmentSize * 0.5;

      for (let iZ = 0; iZ < details; iZ++) {
        const fragmentZ = (iZ / details - 0.5) * size + fragmentSize * 0.5;

        const iStride9 = (iX * details + iZ) * 9;
        const iStride6 = (iX * details + iZ) * 6;

        const centerX =
          fragmentX + (Math.random() - 0.5) * fragmentSize * positionRandomness;
        const centerZ =
          fragmentZ + (Math.random() - 0.5) * fragmentSize * positionRandomness;

        centers[iStride6] = centerX;
        centers[iStride6 + 1] = centerZ;
        centers[iStride6 + 2] = centerX;
        centers[iStride6 + 3] = centerZ;
        centers[iStride6 + 4] = centerX;
        centers[iStride6 + 5] = centerZ;

        const bladeWidth = fragmentSize * bladeWidthRatio;
        const bladeHalfWidth = bladeWidth * 0.5;
        const bladeHeight =
          fragmentSize *
          bladeHeightRatio *
          (1 - bladeHeightRandomness + Math.random() * bladeHeightRandomness);

        positions[iStride9] = -bladeHalfWidth;
        positions[iStride9 + 1] = 0;
        positions[iStride9 + 2] = 0;
        positions[iStride9 + 3] = 0;
        positions[iStride9 + 4] = bladeHeight;
        positions[iStride9 + 5] = 0;
        positions[iStride9 + 6] = bladeHalfWidth;
        positions[iStride9 + 7] = 0;
        positions[iStride9 + 8] = 0;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("center", new THREE.Float32BufferAttribute(centers, 2));
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometryRef.current = geom;
    return geom;
  }, [state.chunks.minSize]);

  // Create material
  const material = useMemo(() => {
    const mat = new GrassMaterial();
    mat.uniforms.uTime.value = 0;
    mat.uniforms.uGrassDistance.value = state.chunks.minSize;
    mat.uniforms.uPlayerPosition.value = new THREE.Vector3();
    mat.uniforms.uTerrainSize.value = state.chunks.minSize;
    mat.uniforms.uTerrainTextureSize.value = state.terrains.segments;
    mat.uniforms.uTerrainATexture.value = null;
    mat.uniforms.uTerrainAOffset.value = new THREE.Vector2();
    mat.uniforms.uTerrainBTexture.value = null;
    mat.uniforms.uTerrainBOffset.value = new THREE.Vector2();
    mat.uniforms.uTerrainCTexture.value = null;
    mat.uniforms.uTerrainCOffset.value = new THREE.Vector2();
    mat.uniforms.uTerrainDTexture.value = null;
    mat.uniforms.uTerrainDOffset.value = new THREE.Vector2();
    mat.uniforms.uNoiseTexture.value = null; // Will be set when Noises is ready
    mat.uniforms.uFresnelOffset.value = 0;

    // Set noise texture when available
    if (noiseTexture.current) {
      mat.uniforms.uNoiseTexture.value = noiseTexture.current;
    }
    mat.uniforms.uFresnelScale.value = 0.5;
    mat.uniforms.uFresnelPower.value = 2;
    mat.uniforms.uSunPosition.value = new THREE.Vector3(-0.5, -0.5, -0.5);
    materialRef.current = mat;
    return mat;
  }, [state.chunks.minSize, state.terrains.segments, noiseTexture]);

  // Update noise texture when it becomes available (check in useFrame since refs don't trigger re-renders)

  // Cache for terrain textures to avoid recreating them every frame
  const textureCacheRef = useRef<Map<string, THREE.DataTexture>>(new Map());

  // Helper function to get or create texture from TerrainState data
  const getTextureFromTerrainState = useMemo(() => {
    return (terrainState: any): THREE.DataTexture | null => {
      if (!terrainState || !terrainState.ready || !terrainState.texture) {
        return null;
      }

      // Check cache first
      const cached = textureCacheRef.current.get(terrainState.id);
      if (cached) {
        return cached;
      }

      // Create new texture
      const segments = state.terrains.segments;
      const texture = new THREE.DataTexture(
        terrainState.texture,
        segments,
        segments,
        THREE.RGBAFormat,
        THREE.FloatType,
        THREE.UVMapping,
        THREE.ClampToEdgeWrapping,
        THREE.ClampToEdgeWrapping,
        THREE.LinearFilter,
        THREE.LinearFilter
      );
      texture.flipY = false;
      texture.needsUpdate = true;

      // Cache it
      textureCacheRef.current.set(terrainState.id, texture);
      return texture;
    };
  }, [state.terrains.segments]);

  // Update material uniforms and mesh position
  useFrame((r3fState) => {
    if (!materialRef.current || !meshRef.current) return;

    const playerState = state.player;
    const playerPosition = playerState.position.current;
    const sunState = state.sun;
    const engineChunks = state.chunks;

    // Update mesh position to follow player (X and Z, Y stays at 0)
    meshRef.current.position.set(playerPosition[0], 0, playerPosition[2]);

    // Update material uniforms
    materialRef.current.uniforms.uTime.value = r3fState.clock.elapsedTime;
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

    // Update noise texture if available
    if (
      noiseTexture.current &&
      !materialRef.current.uniforms.uNoiseTexture.value
    ) {
      materialRef.current.uniforms.uNoiseTexture.value = noiseTexture.current;
    }

    // Get terrain data from chunks
    const aChunkState = engineChunks.getDeepestChunkForPosition(
      playerPosition[0],
      playerPosition[2]
    ) as Chunk | false;

    if (aChunkState && aChunkState.terrain && aChunkState.terrain.ready) {
      // Texture A
      const textureA = getTextureFromTerrainState(aChunkState.terrain);
      if (textureA) {
        materialRef.current.uniforms.uTerrainATexture.value = textureA;
        materialRef.current.uniforms.uTerrainAOffset.value.set(
          aChunkState.x - aChunkState.size * 0.5,
          aChunkState.z - aChunkState.size * 0.5
        );
      }

      const chunkPositionRatioX =
        (playerPosition[0] - aChunkState.x + aChunkState.size * 0.5) /
        aChunkState.size;
      const chunkPositionRatioZ =
        (playerPosition[2] - aChunkState.z + aChunkState.size * 0.5) /
        aChunkState.size;

      // Texture B
      const bChunkState = aChunkState.neighbours.get(
        chunkPositionRatioX < 0.5 ? "w" : "e"
      );
      if (bChunkState && bChunkState.terrain && bChunkState.terrain.ready) {
        const textureB = getTextureFromTerrainState(bChunkState.terrain);
        if (textureB) {
          materialRef.current.uniforms.uTerrainBTexture.value = textureB;
          materialRef.current.uniforms.uTerrainBOffset.value.set(
            bChunkState.x - bChunkState.size * 0.5,
            bChunkState.z - bChunkState.size * 0.5
          );
        }
      }

      // Texture C
      const cChunkState = aChunkState.neighbours.get(
        chunkPositionRatioZ < 0.5 ? "n" : "s"
      );
      if (cChunkState && cChunkState.terrain && cChunkState.terrain.ready) {
        const textureC = getTextureFromTerrainState(cChunkState.terrain);
        if (textureC) {
          materialRef.current.uniforms.uTerrainCTexture.value = textureC;
          materialRef.current.uniforms.uTerrainCOffset.value.set(
            cChunkState.x - cChunkState.size * 0.5,
            cChunkState.z - cChunkState.size * 0.5
          );
        }
      }

      // Texture D
      if (bChunkState) {
        const dChunkState = bChunkState.neighbours.get(
          chunkPositionRatioZ < 0.5 ? "n" : "s"
        );
        if (dChunkState && dChunkState.terrain && dChunkState.terrain.ready) {
          const textureD = getTextureFromTerrainState(dChunkState.terrain);
          if (textureD) {
            materialRef.current.uniforms.uTerrainDTexture.value = textureD;
            materialRef.current.uniforms.uTerrainDOffset.value.set(
              dChunkState.x - dChunkState.size * 0.5,
              dChunkState.z - dChunkState.size * 0.5
            );
          }
        }
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
