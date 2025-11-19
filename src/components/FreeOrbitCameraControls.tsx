import { useEffect } from "react";
import { useControls } from "leva";
import { setFreeOrbitEnabled } from "./Camera";
import FreeOrbitCamera from "./FreeOrbitCamera";

export default function FreeOrbitCameraControls() {
  const { freeOrbitCamera } = useControls("📷 Camera", {
    freeOrbitCamera: {
      value: false,
      label: "Free Orbit Camera",
    },
  });

  // Update the global flag when control changes
  useEffect(() => {
    setFreeOrbitEnabled(freeOrbitCamera);
  }, [freeOrbitCamera]);

  return <FreeOrbitCamera enabled={freeOrbitCamera} />;
}

