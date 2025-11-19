import { useMap } from "../contexts/MapContext";
import { renderComponent } from "../scenes/componentRegistry";
import MapSelector from "./MapSelector";
import PhysicsDebugCubesControls from "./PhysicsDebugCubesControls";
import FreeOrbitCameraControls from "./FreeOrbitCameraControls";
import Lights from "./Lights";

export default function Scene() {
  const { activeMapConfig } = useMap();

  // If no map config, render nothing (shouldn't happen)
  if (!activeMapConfig) {
    return null;
  }

  const { components } = activeMapConfig;

  return (
    <>
      {/* Map selector for Leva controls */}
      <MapSelector />

      {/* Free orbit camera controls */}
      <FreeOrbitCameraControls />

      {/* Lights for standard materials (like physics cubes) */}
      <Lights />

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
