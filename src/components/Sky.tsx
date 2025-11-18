import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameState } from "../contexts/GameStateContext";
import { useSky } from "../contexts/SkyContext";
import SkyBackgroundMaterial from "../Game/View/Materials/SkyBackgroundMaterial";
import SkySphereMaterial from "../Game/View/Materials/SkySphereMaterial";
import StarsMaterial from "../Game/View/Materials/StarsMaterial";

export default function Sky() {
  const { gl, size, camera } = useThree();
  const state = useGameState();
  const { fogTexture } = useSky();
  const groupRef = useRef<THREE.Group>(null);
  const backgroundMeshRef = useRef<THREE.Mesh>(null);
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const starsPointsRef = useRef<THREE.Points>(null);

  const outerDistance = 1000;
  const resolutionRatio = 0.1;

  // Custom render scene and camera
  const customSceneRef = useRef<THREE.Scene | null>(null);
  const customCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);

  // Background material
  const backgroundMaterial = useMemo(() => {
    const mat = new SkyBackgroundMaterial();
    mat.depthTest = false;
    mat.depthWrite = false;
    return mat;
  }, []);

  // Sphere material
  const sphereMaterial = useMemo(() => {
    const mat = new SkySphereMaterial();
    mat.uniforms.uColorDayCycleLow.value.set("#f0fff9");
    mat.uniforms.uColorDayCycleHigh.value.set("#2e89ff");
    mat.uniforms.uColorNightLow.value.set("#004794");
    mat.uniforms.uColorNightHigh.value.set("#001624");
    mat.uniforms.uColorSun.value.set("#ff531a");
    mat.uniforms.uColorDawn.value.set("#ff1900");
    mat.uniforms.uDayCycleProgress.value = 0;
    mat.side = THREE.BackSide;
    return mat;
  }, []);

  // Stars material
  const starsMaterial = useMemo(() => {
    const mat = new StarsMaterial();
    mat.uniforms.uHeightFragments.value =
      size.height * Math.min(window.devicePixelRatio, 2);
    return mat;
  }, [size.height]);

  // Sphere geometry
  const sphereGeometry = useMemo(() => {
    return new THREE.SphereGeometry(10, 128, 64);
  }, []);

  // Stars geometry
  const starsGeometry = useMemo(() => {
    const count = 1000;
    const distance = outerDistance;
    const positionArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);
    const colorArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const iStride3 = i * 3;

      // Position
      const position = new THREE.Vector3();
      position.setFromSphericalCoords(
        distance,
        Math.acos(Math.random()),
        2 * Math.PI * Math.random()
      );

      positionArray[iStride3] = position.x;
      positionArray[iStride3 + 1] = position.y;
      positionArray[iStride3 + 2] = position.z;

      // Size
      sizeArray[i] = Math.pow(Math.random() * 0.9, 10) + 0.1;

      // Color
      const color = new THREE.Color();
      color.setHSL(Math.random(), 1, 0.5 + Math.random() * 0.5);
      colorArray[iStride3] = color.r;
      colorArray[iStride3 + 1] = color.g;
      colorArray[iStride3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positionArray, 3)
    );
    geometry.setAttribute(
      "aSize",
      new THREE.Float32BufferAttribute(sizeArray, 1)
    );
    geometry.setAttribute(
      "aColor",
      new THREE.Float32BufferAttribute(colorArray, 3)
    );

    return geometry;
  }, []);

  // Sun geometry
  const sunGeometry = useMemo(() => {
    const distance = outerDistance - 50;
    return new THREE.CircleGeometry(0.02 * distance, 32);
  }, []);

  // Initialize custom render scene
  useEffect(() => {
    customSceneRef.current = new THREE.Scene();
    customCameraRef.current = new THREE.PerspectiveCamera(
      45,
      size.width / size.height,
      0.1,
      5000
    );

    renderTargetRef.current = new THREE.WebGLRenderTarget(
      size.width * resolutionRatio,
      size.height * resolutionRatio,
      {
        generateMipmaps: false,
      }
    );

    // Create sphere mesh for custom render
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    customSceneRef.current.add(sphereMesh);

    // Set background material texture
    backgroundMaterial.uniforms.uTexture.value =
      renderTargetRef.current.texture;

    // Expose fog texture for terrain material
    fogTexture.current = renderTargetRef.current.texture;

    return () => {
      customSceneRef.current?.clear();
      renderTargetRef.current?.dispose();
      fogTexture.current = null;
    };
  }, [
    size.width,
    size.height,
    sphereGeometry,
    sphereMaterial,
    backgroundMaterial,
  ]);

  // Handle resize
  useEffect(() => {
    if (renderTargetRef.current) {
      renderTargetRef.current.setSize(
        size.width * resolutionRatio,
        size.height * resolutionRatio
      );
    }
    if (customCameraRef.current) {
      customCameraRef.current.aspect = size.width / size.height;
      customCameraRef.current.updateProjectionMatrix();
    }
    if (starsMaterial) {
      starsMaterial.uniforms.uHeightFragments.value =
        size.height * Math.min(window.devicePixelRatio, 2);
    }
  }, [size, starsMaterial]);

  // Update loop
  useFrame(() => {
    const dayState = state.day;
    const sunState = state.sun;
    const playerState = state.player;

    // Update group position
    if (groupRef.current) {
      groupRef.current.position.set(
        playerState.position.current[0],
        playerState.position.current[1],
        playerState.position.current[2]
      );
    }

    // Update sphere material
    sphereMaterial.uniforms.uSunPosition.value.set(
      sunState.position.x,
      sunState.position.y,
      sunState.position.z
    );
    sphereMaterial.uniforms.uDayCycleProgress.value = dayState.progress;

    // Update sun position
    if (sunMeshRef.current) {
      const sunDistance = outerDistance - 50;
      sunMeshRef.current.position.set(
        sunState.position.x * sunDistance,
        sunState.position.y * sunDistance,
        sunState.position.z * sunDistance
      );
      sunMeshRef.current.lookAt(
        playerState.position.current[0],
        playerState.position.current[1],
        playerState.position.current[2]
      );
    }

    // Update stars material
    starsMaterial.uniforms.uSunPosition.value.set(
      sunState.position.x,
      sunState.position.y,
      sunState.position.z
    );

    // Render to render target
    if (
      customSceneRef.current &&
      customCameraRef.current &&
      renderTargetRef.current
    ) {
      // Update custom camera to match main camera
      if (camera instanceof THREE.PerspectiveCamera) {
        customCameraRef.current.quaternion.copy(camera.quaternion);
      }

      // Render to render target
      gl.setRenderTarget(renderTargetRef.current);
      gl.render(customSceneRef.current, customCameraRef.current);
      gl.setRenderTarget(null);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background plane */}
      <mesh
        ref={backgroundMeshRef}
        frustumCulled={false}
        material={backgroundMaterial}
      >
        <planeGeometry args={[2, 2]} />
      </mesh>

      {/* Sun */}
      <mesh ref={sunMeshRef} geometry={sunGeometry}>
        <meshBasicMaterial color={0xffffff} />
      </mesh>

      {/* Stars */}
      <points
        ref={starsPointsRef}
        geometry={starsGeometry}
        material={starsMaterial}
      />
    </group>
  );
}
