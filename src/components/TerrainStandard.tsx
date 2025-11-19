import { useRef, useEffect, useState, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useThree } from "@react-three/fiber";
import { useGameState } from "../contexts/GameStateContext";
import TerrainState from "../Game/State/Terrain";

interface TerrainStandardProps {
  terrainState: TerrainState;
}

export default function TerrainStandard({
  terrainState,
}: TerrainStandardProps) {
  const state = useGameState();
  const { scene } = useThree();
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

  // Create color texture from terrain elevation data
  const material = useMemo(() => {
    if (!ready || !terrainState.positions) {
      return null;
    }

    // Create a color texture based on elevation from positions
    // Find min/max elevation for normalization
    let minElevation = Infinity;
    let maxElevation = -Infinity;

    for (let i = 1; i < terrainState.positions.length; i += 3) {
      const y = terrainState.positions[i];
      if (y < minElevation) minElevation = y;
      if (y > maxElevation) maxElevation = y;
    }

    const elevationRange = maxElevation - minElevation;
    if (elevationRange === 0) {
      // Flat terrain, use default color
      return new THREE.MeshStandardMaterial({
        color: 0x8b9a5b, // Grass green
        metalness: 0.1,
        roughness: 0.9,
      });
    }

    // Create color texture from elevation
    const segments = state.terrains.segments;
    const textureData = new Uint8Array(segments * segments * 4);

    // Create a terrain-like color gradient based on elevation
    // Low elevation: grass green
    // Mid elevation: dirt brown
    // High elevation: rock gray
    for (let iZ = 0; iZ < segments; iZ++) {
      for (let iX = 0; iX < segments; iX++) {
        // Get elevation from positions array
        const positionIndex = (iZ * segments + iX) * 3;
        if (positionIndex + 1 >= terrainState.positions.length) continue;

        const elevation = terrainState.positions[positionIndex + 1]; // Y coordinate
        const normalizedElevation = (elevation - minElevation) / elevationRange;

        let r, g, b;

        if (normalizedElevation < 0.3) {
          // Low - grass green
          const t = normalizedElevation / 0.3;
          r = Math.floor(34 + t * 20); // 34-54
          g = Math.floor(139 + t * 30); // 139-169
          b = Math.floor(34 + t * 20); // 34-54
        } else if (normalizedElevation < 0.7) {
          // Mid - dirt brown
          const t = (normalizedElevation - 0.3) / 0.4;
          r = Math.floor(54 + t * 60); // 54-114
          g = Math.floor(169 + t * 40); // 169-209
          b = Math.floor(54 + t * 30); // 54-84
        } else {
          // High - rock gray
          const t = (normalizedElevation - 0.7) / 0.3;
          r = Math.floor(114 + t * 100); // 114-214
          g = Math.floor(209 + t * 46); // 209-255
          b = Math.floor(84 + t * 100); // 84-184
        }

        const textureIndex = (iZ * segments + iX) * 4;
        textureData[textureIndex] = r;
        textureData[textureIndex + 1] = g;
        textureData[textureIndex + 2] = b;
        textureData[textureIndex + 3] = 255; // Alpha
      }
    }

    // Create texture from color data
    const texture = new THREE.DataTexture(
      textureData,
      segments,
      segments,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    texture.flipY = false;
    texture.needsUpdate = true;

    // Create standard material with the texture
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.9,
    });

    return mat;
  }, [ready, terrainState.positions, state.terrains.segments]);

  // Create geometry once when ready
  useLayoutEffect(() => {
    if (!ready || !terrainState.positions || geometryRef.current) return;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(terrainState.positions, 3)
    );
    geom.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(terrainState.normals, 3)
    );
    geom.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(terrainState.uv, 2)
    );
    geom.index = new THREE.BufferAttribute(terrainState.indices, 1, false);

    geom.computeBoundingBox();
    geom.computeBoundingSphere();

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
  }, [ready, terrainState.id]);

  // Patch material with CSM when mesh is ready
  useEffect(() => {
    if (!ready || !material || !meshRef.current) return;

    // Find CSM by looking for its lights in the scene
    // CSM creates directional lights that are children of the scene
    let csmInstance: any = null;
    const csmLights: THREE.DirectionalLight[] = [];

    scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight && object.castShadow) {
        // Check if this is a CSM light (CSM lights have specific properties)
        if (object.shadow && object.shadow.mapSize) {
          csmLights.push(object);
        }
      }
    });

    // If we found CSM lights, try to find the CSM instance
    // CSM is typically stored as a property on the scene or as a parent of the lights
    if (csmLights.length > 0) {
      // Look for CSM in the scene's userData or find it through the lights' parent
      const firstLight = csmLights[0];
      if (firstLight.parent) {
        // CSM might be stored on the parent or in userData
        const parent = firstLight.parent as any;
        if (parent.setupMaterial) {
          csmInstance = parent;
        } else if (parent.userData?.csm) {
          csmInstance = parent.userData.csm;
        }
      }

      // Also check scene userData
      if (!csmInstance && (scene as any).userData?.csm) {
        csmInstance = (scene as any).userData.csm;
      }

      // If we found CSM, patch the material
      if (csmInstance && csmInstance.setupMaterial) {
        try {
          csmInstance.setupMaterial(material);
          material.needsUpdate = true;
        } catch (error) {
          console.warn("Failed to patch terrain material with CSM:", error);
        }
      } else if (csmLights.length > 0) {
        // Fallback: try to patch using the first light's shadow (this might work for standard materials)
        // Standard materials should work with CSM automatically, but let's ensure they're set up
        material.needsUpdate = true;
      }
    }
  }, [ready, material, scene]);

  // Cleanup material
  useEffect(() => {
    return () => {
      if (material) {
        if (material.map) {
          material.map.dispose();
        }
        material.dispose();
      }
    };
  }, [material]);

  if (!ready || !geometryRef.current || !material) {
    return null;
  }

  // Positions are already in world space (from worker), so mesh should be at origin
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh
        ref={meshRef}
        geometry={geometryRef.current}
        material={material}
        castShadow
        receiveShadow
      />
    </RigidBody>
  );
}
