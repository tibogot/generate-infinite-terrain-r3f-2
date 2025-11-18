import { useEffect, useRef } from "react";
import { useControls } from "leva";
import { useMap } from "../contexts/MapContext";
import { useGameState } from "../contexts/GameStateContext";
import Camera from "../Game/State/Camera";

// Global ref to store the setter function for GodotCharacterHybrid camera mode
let setGodotCameraModeRef: ((mode: string) => void) | null = null;

export function setGodotCameraMode(mode: string) {
  if (setGodotCameraModeRef) {
    setGodotCameraModeRef(mode);
  }
}

export function registerGodotCameraModeSetter(setter: (mode: string) => void) {
  setGodotCameraModeRef = setter;
}

export default function CameraControls() {
  const { activeMapConfig } = useMap();
  const { player } = useGameState();
  const characterType = activeMapConfig?.player.characterType || "capsule";
  const lastCharacterType = useRef(characterType);

  // Determine initial value and options based on character type
  const getInitialValue = () => {
    if (characterType === "capsule") {
      return player?.camera?.mode === Camera.MODE_FLY ? "fly" : "orbit";
    }
    return "follow";
  };

  const getOptions = () => {
    if (characterType === "capsule") {
      return ["orbit", "fly"];
    }
    return ["orbit", "follow", "follow-orbit"];
  };

  // Global camera mode control - visible for all maps
  useControls("📷 Camera", {
    cameraMode: {
      value: getInitialValue(),
      options: getOptions(),
      label: "Camera Mode",
      onChange: (value: string) => {
        // For capsule player, switch between orbit and fly modes
        if (characterType === "capsule" && player?.camera) {
          if (value === "fly" && player.camera.mode !== Camera.MODE_FLY) {
            // Switch to fly mode
            player.camera.mode = Camera.MODE_FLY;
            player.camera.fly.activate(
              player.camera.position,
              player.camera.quaternion
            );
            player.camera.thirdPerson.deactivate();
          } else if (
            value === "orbit" &&
            player.camera.mode !== Camera.MODE_THIRDPERSON
          ) {
            // Switch to orbit mode (third-person camera that orbits around player)
            player.camera.mode = Camera.MODE_THIRDPERSON;
            player.camera.fly.deactivate();
            player.camera.thirdPerson.activate();
          }
        }
        // For GodotCharacterHybrid, update via the registered setter
        if (characterType === "godot-hybrid") {
          setGodotCameraMode(value);
        }
      },
    },
  });

  // Update options when character type changes
  useEffect(() => {
    if (lastCharacterType.current !== characterType) {
      lastCharacterType.current = characterType;
    }
  }, [characterType, player]);

  return null; // This component only provides Leva controls
}
