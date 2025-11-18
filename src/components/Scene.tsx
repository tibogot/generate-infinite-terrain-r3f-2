import { useMap } from "../contexts/MapContext";
import { renderComponent } from "../scenes/componentRegistry";
import MapSelector from "./MapSelector";

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

      {/* Dynamically render components based on map config */}
      {renderComponent(components.camera)}
      {renderComponent(components.noises)}
      {renderComponent(components.sky)}
      {renderComponent(components.water)}
      {renderComponent(components.terrain)}
      {renderComponent(components.chunks)}
      {renderComponent(components.player)}
      {renderComponent(components.grass)}
    </>
  );
}
