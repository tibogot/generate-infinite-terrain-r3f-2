import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameState } from "../../contexts/GameStateContext";
import { useSky } from "../../contexts/SkyContext";

/**
 * SimpleSky - A simpler sky component for testing scene switching
 * This is a basic gradient sky without the complex day/night cycle
 */
export default function SimpleSky() {
  const { gl, size, camera } = useThree();
  const state = useGameState();
  const { fogTexture } = useSky();
  const meshRef = useRef<THREE.Mesh>(null);

  // Simple gradient material
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(0x87CEEB) }, // Sky blue
        uBottomColor: { value: new THREE.Color(0xE0F6FF) }, // Light blue
        uPlayerPosition: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float t = smoothstep(-1.0, 1.0, h);
          vec3 color = mix(uBottomColor, uTopColor, t);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    return mat;
  }, []);

  // Sphere geometry
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(1000, 32, 32);
  }, []);

  // Update player position for fog texture compatibility
  useFrame(() => {
    const playerState = state.player;
    if (material.uniforms.uPlayerPosition) {
      material.uniforms.uPlayerPosition.value.set(
        playerState.position.current[0],
        playerState.position.current[1],
        playerState.position.current[2]
      );
    }

    // Update mesh position to follow player
    if (meshRef.current) {
      meshRef.current.position.set(
        playerState.position.current[0],
        playerState.position.current[1],
        playerState.position.current[2]
      );
    }

    // Set a simple fog texture for terrain compatibility
    if (fogTexture.current === null) {
      // Create a simple texture if needed
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, 1, 1);
        const texture = new THREE.CanvasTexture(canvas);
        fogTexture.current = texture;
      }
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

