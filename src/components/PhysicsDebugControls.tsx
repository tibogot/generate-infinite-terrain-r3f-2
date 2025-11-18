import { useEffect } from "react";
import { useControls } from "leva";

// Global ref to store the debug state setter
let setPhysicsDebugRef: ((debug: boolean) => void) | null = null;

export function setPhysicsDebug(debug: boolean) {
  if (setPhysicsDebugRef) {
    setPhysicsDebugRef(debug);
  }
}

export function registerPhysicsDebugSetter(setter: (debug: boolean) => void) {
  setPhysicsDebugRef = setter;
}

export default function PhysicsDebugControls() {
  const { physicsDebug } = useControls("🔧 Physics", {
    physicsDebug: {
      value: false,
      label: "Debug (Show Colliders)",
    },
  });

  // Update physics debug when control changes
  useEffect(() => {
    setPhysicsDebug(physicsDebug);
  }, [physicsDebug]);

  return null; // This component only adds Leva controls
}

