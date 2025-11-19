import { useRef, useEffect, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface FreeOrbitCameraProps {
  enabled: boolean;
}

export default function FreeOrbitCamera({ enabled }: FreeOrbitCameraProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [initialTarget, setInitialTarget] = useState<[number, number, number]>([0, 0, 0]);
  const hasInitializedRef = useRef(false);

  // Calculate initial target when enabling free orbit
  useEffect(() => {
    if (enabled && camera instanceof THREE.PerspectiveCamera && !hasInitializedRef.current) {
      // Calculate target point based on current camera direction
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      // Set target 10 units in front of camera
      const targetPoint = camera.position.clone().add(direction.multiplyScalar(10));
      setInitialTarget([targetPoint.x, targetPoint.y, targetPoint.z]);
      hasInitializedRef.current = true;
      
      // Update controls target if they exist
      if (controlsRef.current) {
        controlsRef.current.target.set(targetPoint.x, targetPoint.y, targetPoint.z);
        controlsRef.current.update();
      }
    }
    
    if (!enabled) {
      hasInitializedRef.current = false;
    }
  }, [enabled, camera]);

  if (!enabled) {
    return null;
  }

  return (
    <OrbitControls
      ref={controlsRef}
      camera={camera as THREE.PerspectiveCamera}
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={1000}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      target={initialTarget}
    />
  );
}

