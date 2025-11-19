import { useEffect, useMemo, useRef, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CSM as ThreeCSM } from "three/examples/jsm/csm/CSM.js";

const defaultDirection = new THREE.Vector3(1, -1, 1).normalize();
const defaultColor = new THREE.Color(0xffffff);

const normalizeDirection = (direction: any): THREE.Vector3 => {
  if (!direction) {
    return defaultDirection.clone();
  }

  if (direction instanceof THREE.Vector3) {
    if (direction.lengthSq() === 0) {
      return defaultDirection.clone();
    }
    return direction.clone().normalize();
  }

  if (Array.isArray(direction) && direction.length === 3) {
    const vec = new THREE.Vector3(direction[0], direction[1], direction[2]);
    if (vec.lengthSq() === 0) {
      return defaultDirection.clone();
    }
    return vec.normalize();
  }

  return defaultDirection.clone();
};

const toColor = (color: any): THREE.Color => {
  if (color instanceof THREE.Color) {
    return color.clone();
  }
  try {
    return new THREE.Color(color);
  } catch (error) {
    return defaultColor.clone();
  }
};

const removeCsmDefines = (material: any) => {
  if (!material || !material.defines) {
    return;
  }

  const { defines } = material;
  let changed = false;

  if ("USE_CSM" in defines) {
    delete defines.USE_CSM;
    changed = true;
  }
  if ("CSM_CASCADES" in defines) {
    delete defines.CSM_CASCADES;
    changed = true;
  }
  if ("CSM_FADE" in defines) {
    delete defines.CSM_FADE;
    changed = true;
  }

  if (changed) {
    if (Object.keys(defines).length === 0) {
      delete material.defines;
    }
    material.needsUpdate = true;
  }
};

interface MaterialRecord {
  version: number;
  originalOnBeforeCompile?: (shader: any) => void;
  csmOnBeforeCompile?: (shader: any) => void;
  wrappedOnBeforeCompile?: (shader: any) => void;
}

const restoreMaterialAfterCsm = (
  material: any,
  record: MaterialRecord,
  csmInstance: any
) => {
  if (!material || !record) {
    return;
  }

  if (record.wrappedOnBeforeCompile) {
    if (material.onBeforeCompile === record.wrappedOnBeforeCompile) {
      if (record.originalOnBeforeCompile) {
        material.onBeforeCompile = record.originalOnBeforeCompile;
      } else {
        delete material.onBeforeCompile;
      }
    } else if (record.originalOnBeforeCompile) {
      material.onBeforeCompile = record.originalOnBeforeCompile;
    }
  }

  removeCsmDefines(material);

  if (csmInstance && csmInstance.shaders && csmInstance.shaders.has(material)) {
    csmInstance.shaders.delete(material);
  }

  material.needsUpdate = true;
};

const patchMaterialWithCsm = (
  material: any,
  csmInstance: any,
  materialVersion: number,
  patchedMaterials: Map<any, MaterialRecord>
) => {
  if (!material) {
    return;
  }

  const existing = patchedMaterials.get(material);
  if (existing && existing.version === materialVersion) {
    return;
  }

  if (existing) {
    restoreMaterialAfterCsm(material, existing, csmInstance);
    patchedMaterials.delete(material);
  }

  const originalOnBeforeCompile = material.onBeforeCompile;

  csmInstance.setupMaterial(material);

  const csmOnBeforeCompile = material.onBeforeCompile;

  const wrappedOnBeforeCompile = function (this: any, shader: any) {
    if (csmOnBeforeCompile) {
      csmOnBeforeCompile.call(this, shader);
    }
    if (originalOnBeforeCompile) {
      originalOnBeforeCompile.call(this, shader);
    }
  };

  material.onBeforeCompile = wrappedOnBeforeCompile;
  material.needsUpdate = true;

  patchedMaterials.set(material, {
    version: materialVersion,
    originalOnBeforeCompile,
    csmOnBeforeCompile,
    wrappedOnBeforeCompile,
  });
};

const applyCsmToScene = (
  scene: THREE.Scene,
  csm: any,
  materialVersion: number,
  patchedMaterials: Map<any, MaterialRecord>
) => {
  scene.traverse((child) => {
    if (!(child as any).isMesh) {
      return;
    }

    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    materials.forEach((material) =>
      patchMaterialWithCsm(material, csm, materialVersion, patchedMaterials)
    );
  });
};

interface CsmProps {
  enabled?: boolean;
  cascades?: number;
  shadowMapSize?: number;
  shadowBias?: number;
  shadowNormalBias?: number;
  lightDirection?: THREE.Vector3 | [number, number, number] | null;
  lightIntensity?: number;
  lightColor?: THREE.Color | string | number;
  fade?: boolean;
  lightMargin?: number;
  maxFar?: number;
  materialVersion?: number;
  useSunPosition?: boolean; // Deprecated - kept for compatibility but not used
}

export const Csm = ({
  enabled = true,
  cascades = 4,
  shadowMapSize = 2048,
  shadowBias = 0,
  shadowNormalBias = 0,
  lightDirection,
  lightIntensity = 1,
  lightColor = defaultColor,
  fade = true,
  lightMargin = 200,
  maxFar,
  materialVersion = 0,
  useSunPosition = false, // Deprecated - kept for compatibility but not used
}: CsmProps) => {
  // Suppress unused parameter warning
  void useSunPosition;
  const { scene, camera } = useThree();
  const csmRef = useRef<any>(null);
  const patchedMaterialsRef = useRef<Map<any, MaterialRecord>>(new Map());

  const restoreAllPatchedMaterials = useCallback(() => {
    const csmInstance = csmRef.current;
    const patchedMaterials = patchedMaterialsRef.current;
    if (!patchedMaterials.size) {
      return;
    }

    patchedMaterials.forEach((record, material) => {
      restoreMaterialAfterCsm(material, record, csmInstance);
    });

    patchedMaterials.clear();
  }, []);

  // Get light direction from prop (no sun following)
  const effectiveLightDirection = useMemo(() => {
    return normalizeDirection(lightDirection);
  }, [lightDirection]);

  const colorInstance = useMemo(() => toColor(lightColor), [lightColor]);

  useEffect(() => {
    if (!enabled) {
      restoreAllPatchedMaterials();
      if (csmRef.current) {
        csmRef.current.remove();
        csmRef.current.dispose();
        csmRef.current = null;
      }
      return;
    }

    const csm = new ThreeCSM({
      camera,
      parent: scene,
      cascades,
      shadowMapSize,
      shadowBias,
      lightDirection: effectiveLightDirection,
      lightIntensity,
      maxFar: maxFar ?? camera.far,
      lightMargin,
    });

    csm.fade = fade;

    csm.lights.forEach((light: THREE.DirectionalLight) => {
      light.castShadow = true;
      light.intensity = lightIntensity;
      light.color.copy(colorInstance);
      light.shadow.bias = shadowBias;
      light.shadow.normalBias = shadowNormalBias;
      light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    });

    csm.updateFrustums();
    applyCsmToScene(scene, csm, materialVersion, patchedMaterialsRef.current);
    csmRef.current = csm;

    // Store CSM in scene userData so other components can access it
    (scene as any).userData.csm = csm;

    return () => {
      restoreAllPatchedMaterials();
      csm.remove();
      csm.dispose();
      csmRef.current = null;
      delete (scene as any).userData.csm;
    };
  }, [
    enabled,
    cascades,
    shadowMapSize,
    shadowBias,
    shadowNormalBias,
    effectiveLightDirection,
    lightIntensity,
    colorInstance,
    fade,
    lightMargin,
    maxFar,
    camera,
    scene,
    materialVersion,
    restoreAllPatchedMaterials,
  ]);

  useEffect(() => {
    if (!enabled || !csmRef.current) {
      return;
    }

    applyCsmToScene(
      scene,
      csmRef.current,
      materialVersion,
      patchedMaterialsRef.current
    );
    csmRef.current.updateFrustums();
  }, [enabled, materialVersion, scene]);

  // Re-apply CSM to catch newly added meshes periodically
  useFrame(() => {
    if (!enabled || !csmRef.current) {
      return;
    }

    // Periodically re-apply CSM to catch newly added meshes
    // This ensures dynamically created terrain meshes get patched
    if (Math.random() < 0.1) {
      // 10% chance per frame to re-apply
      applyCsmToScene(
        scene,
        csmRef.current,
        materialVersion,
        patchedMaterialsRef.current
      );
    }

    csmRef.current.update();
  }, -1);

  return null;
};

export default Csm;
