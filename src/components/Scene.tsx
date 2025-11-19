import { useMap } from "../contexts/MapContext";
import { renderComponent } from "../scenes/componentRegistry";
import MapSelector from "./MapSelector";
import PhysicsDebugCubesControls from "./PhysicsDebugCubesControls";
import FreeOrbitCameraControls from "./FreeOrbitCameraControls";
import Lights from "./Lights";
import Csm from "./Csm";
import CsmControls, { useCsmControls } from "./CsmControls";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export default function Scene() {
  const { activeMapConfig } = useMap();
  const { gl } = useThree();
  const csmControls = useCsmControls();

  // Adjust tone mapping exposure for map4 (drei Sky needs lower exposure, but we compensate with brighter lights)
  useEffect(() => {
    if (activeMapConfig?.id === "map4") {
      gl.toneMappingExposure = 0.8; // Slightly lower exposure for drei Sky, but not too dark
    } else {
      gl.toneMappingExposure = 1.0; // Default exposure for other maps
    }
  }, [activeMapConfig?.id, gl]);

  // If no map config, render nothing (shouldn't happen)
  if (!activeMapConfig) {
    return null;
  }

  const { components } = activeMapConfig;
  const isMap4 = activeMapConfig.id === "map4";

  return (
    <>
      {/* Map selector for Leva controls */}
      <MapSelector />

      {/* CSM Controls - Only show for map4 */}
      {isMap4 && <CsmControls />}

      {/* Free orbit camera controls */}
      <FreeOrbitCameraControls />

      {/* Lights for standard materials - Only in map4 */}
      {isMap4 && <Lights />}

      {/* CSM - Only in map4 */}
      {isMap4 && (
        <Csm
          enabled={csmControls.enabled}
          cascades={csmControls.cascades}
          shadowMapSize={csmControls.shadowMapSize}
          shadowBias={csmControls.shadowBias}
          shadowNormalBias={csmControls.shadowNormalBias}
          lightIntensity={csmControls.lightIntensity}
          fade={csmControls.fade}
          lightMargin={csmControls.lightMargin}
          lightDirection={[
            csmControls.lightDirection.x,
            csmControls.lightDirection.y,
            csmControls.lightDirection.z,
          ]}
          useSunPosition={false}
        />
      )}

      {/* Dynamically render components based on map config */}
      {renderComponent(components.camera)}
      {renderComponent(components.noises)}
      {renderComponent(components.sky)}
      {renderComponent(components.water)}
      {renderComponent(components.terrain)}
      {renderComponent(components.chunks)}
      {renderComponent(components.player)}
      {renderComponent(components.grass)}

      {/* Physics debug cubes with Leva controls */}
      <PhysicsDebugCubesControls />
    </>
  );
}
