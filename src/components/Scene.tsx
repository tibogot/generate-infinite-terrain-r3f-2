import { useMap } from "../contexts/MapContext";
import { renderComponent } from "../scenes/componentRegistry";
import MapSelector from "./MapSelector";
import PhysicsDebugCubesControls from "./PhysicsDebugCubesControls";
import FreeOrbitCameraControls from "./FreeOrbitCameraControls";
import Lights from "./Lights";
import Csm from "./Csm";
import CsmControls, { useCsmControls } from "./CsmControls";
import Grass2Controls, { useGrass2Controls } from "./Grass2Controls";
import Grass2 from "./Grass2";
import Noises2 from "./Noises2";
import FlatTerrainControls from "./FlatTerrainControls";
import ClaudeGrassQuick5Infinite from "./ClaudeGrassQuick5Infinite";
import useClaudeGrassQuick5InfiniteControls from "./useClaudeGrassQuick5InfiniteControls";
import { GameStateProvider2 } from "../contexts/GameStateContext2";
import { NoiseProvider2 } from "../contexts/NoiseContext2";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export default function Scene() {
  const { activeMapConfig } = useMap();
  const { gl } = useThree();
  const csmControls = useCsmControls();
  const grass2Controls = useGrass2Controls();
  const claudeGrassInfiniteControls = useClaudeGrassQuick5InfiniteControls();

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

  // Debug: Check controls structure
  useEffect(() => {
    if (isMap4) {
      console.log(
        "🌿 ClaudeGrassInfiniteControls structure:",
        claudeGrassInfiniteControls
      );
      console.log(
        "🌿 ClaudeGrassInfiniteControls.claudeGrassQuick5Infinite:",
        (claudeGrassInfiniteControls as any).claudeGrassQuick5Infinite
      );
      console.log(
        "🌿 ClaudeGrassInfiniteControls.enabled:",
        (claudeGrassInfiniteControls as any).enabled
      );
    }
  }, [isMap4, claudeGrassInfiniteControls]);

  return (
    <>
      {/* Map selector for Leva controls */}
      <MapSelector />

      {/* CSM Controls - Only show for map4 */}
      {isMap4 && <CsmControls />}

      {/* Grass2 Controls - Only show for map4 */}
      {isMap4 && <Grass2Controls />}

      {/* Flat Terrain Controls - Only show for map4 */}
      {isMap4 && <FlatTerrainControls />}

      {/* ClaudeGrassQuick5Infinite - Only in map4 */}
      {isMap4 && (claudeGrassInfiniteControls as any)?.enabled && (
        <ClaudeGrassQuick5Infinite
          grassHeight={(claudeGrassInfiniteControls as any).grassHeight}
          grassWidth={(claudeGrassInfiniteControls as any).grassWidth}
          grassDensity={(claudeGrassInfiniteControls as any).grassDensity}
          grassDistance={(claudeGrassInfiniteControls as any).grassDistance}
          lodDistance={(claudeGrassInfiniteControls as any).lodDistance}
          maxDistance={(claudeGrassInfiniteControls as any).maxDistance}
          terrainSize={(claudeGrassInfiniteControls as any).terrainSize}
          heightScale={(claudeGrassInfiniteControls as any).heightScale}
          heightOffset={(claudeGrassInfiniteControls as any).heightOffset}
          baseColor1={(claudeGrassInfiniteControls as any).colors?.baseColor1}
          baseColor2={(claudeGrassInfiniteControls as any).colors?.baseColor2}
          tipColor1={(claudeGrassInfiniteControls as any).colors?.tipColor1}
          tipColor2={(claudeGrassInfiniteControls as any).colors?.tipColor2}
          gradientCurve={
            (claudeGrassInfiniteControls as any).colors?.gradientCurve
          }
          windEnabled={(claudeGrassInfiniteControls as any).wind?.windEnabled}
          windStrength={(claudeGrassInfiniteControls as any).wind?.windStrength}
          windDirectionScale={
            (claudeGrassInfiniteControls as any).wind?.windDirectionScale
          }
          windDirectionSpeed={
            (claudeGrassInfiniteControls as any).wind?.windDirectionSpeed
          }
          windStrengthScale={
            (claudeGrassInfiniteControls as any).wind?.windStrengthScale
          }
          windStrengthSpeed={
            (claudeGrassInfiniteControls as any).wind?.windStrengthSpeed
          }
          aoEnabled={(claudeGrassInfiniteControls as any).advanced?.aoEnabled}
          aoIntensity={
            (claudeGrassInfiniteControls as any).advanced?.aoIntensity
          }
          grassMiddleBrightnessMin={
            (claudeGrassInfiniteControls as any).advanced
              ?.grassMiddleBrightnessMin
          }
          grassMiddleBrightnessMax={
            (claudeGrassInfiniteControls as any).advanced
              ?.grassMiddleBrightnessMax
          }
          specularEnabled={
            (claudeGrassInfiniteControls as any).specular?.specularEnabled
          }
          specularIntensity={
            (claudeGrassInfiniteControls as any).specular?.specularIntensity
          }
          specularColor={
            (claudeGrassInfiniteControls as any).specular?.specularColor
          }
          specularDirectionX={
            (claudeGrassInfiniteControls as any).specular?.specularDirectionX
          }
          specularDirectionY={
            (claudeGrassInfiniteControls as any).specular?.specularDirectionY
          }
          specularDirectionZ={
            (claudeGrassInfiniteControls as any).specular?.specularDirectionZ
          }
          backscatterEnabled={
            (claudeGrassInfiniteControls as any).backscatter?.backscatterEnabled
          }
          backscatterIntensity={
            (claudeGrassInfiniteControls as any).backscatter
              ?.backscatterIntensity
          }
          backscatterColor={
            (claudeGrassInfiniteControls as any).backscatter?.backscatterColor
          }
          backscatterPower={
            (claudeGrassInfiniteControls as any).backscatter?.backscatterPower
          }
          frontScatterStrength={
            (claudeGrassInfiniteControls as any).backscatter
              ?.frontScatterStrength
          }
          rimSSSStrength={
            (claudeGrassInfiniteControls as any).backscatter?.rimSSSStrength
          }
          fogEnabled={(claudeGrassInfiniteControls as any).fog?.fogEnabled}
          fogNear={(claudeGrassInfiniteControls as any).fog?.fogNear}
          fogFar={(claudeGrassInfiniteControls as any).fog?.fogFar}
          fogIntensity={(claudeGrassInfiniteControls as any).fog?.fogIntensity}
          fogColor={(claudeGrassInfiniteControls as any).fog?.fogColor}
          playerInteractionEnabled={
            (claudeGrassInfiniteControls as any).playerInteraction
              ?.playerInteractionEnabled
          }
          playerInteractionRepel={
            (claudeGrassInfiniteControls as any).playerInteraction
              ?.playerInteractionRepel
          }
          playerInteractionRange={
            (claudeGrassInfiniteControls as any).playerInteraction
              ?.playerInteractionRange
          }
          playerInteractionStrength={
            (claudeGrassInfiniteControls as any).playerInteraction
              ?.playerInteractionStrength
          }
          playerInteractionHeightThreshold={
            (claudeGrassInfiniteControls as any).playerInteraction
              ?.playerInteractionHeightThreshold
          }
        />
      )}

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

      {/* Grass2 - Only in map4, with its own providers */}
      {isMap4 && grass2Controls.enabled && (
        <GameStateProvider2>
          <NoiseProvider2>
            <Noises2 />
            <Grass2 />
          </NoiseProvider2>
        </GameStateProvider2>
      )}

      {/* Physics debug cubes with Leva controls */}
      <PhysicsDebugCubesControls />
    </>
  );
}
