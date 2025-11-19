import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useThree } from "@react-three/fiber";

/**
 * FlatTerrain - A simple infinite flat terrain for debugging
 * Creates a large flat plane that receives shadows
 */
export default function FlatTerrain() {
  const { scene } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  // Create a large flat plane geometry
  const geometry = useMemo(() => {
    // Create a very large plane (1000x1000 units)
    const size = 10000;
    const segments = 1; // Simple plane, no subdivisions needed
    return new THREE.PlaneGeometry(size, size, segments, segments);
  }, []);

  // Create a standard material that works with CSM
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x8b9a5b, // Grass green color
      metalness: 0.1,
      roughness: 0.9,
    });
  }, []);

  // Rotate plane to be horizontal (PlaneGeometry is vertical by default)
  useMemo(() => {
    if (geometry) {
      geometry.rotateX(-Math.PI / 2);
    }
  }, [geometry]);

  // Patch material with CSM when ready
  useEffect(() => {
    if (!material || !meshRef.current) return;

    // Find CSM in scene userData
    const csmInstance = (scene as any).userData?.csm;
    
    if (csmInstance && csmInstance.setupMaterial) {
      try {
        csmInstance.setupMaterial(material);
        material.needsUpdate = true;
      } catch (error) {
        console.warn("Failed to patch flat terrain material with CSM:", error);
      }
    }
  }, [material, scene]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        position={[0, 0, 0]}
        receiveShadow
        castShadow={false}
      />
    </RigidBody>
  );
}

