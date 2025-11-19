import { useControls } from "leva";

export interface CsmControls {
  enabled: boolean;
  cascades: number;
  shadowMapSize: number;
  shadowBias: number;
  shadowNormalBias: number;
  lightIntensity: number;
  fade: boolean;
  lightMargin: number;
  lightDirection: { x: number; y: number; z: number };
}

export function useCsmControls(): CsmControls {
  const controls = useControls("🌑 CSM Shadows", {
    enabled: {
      value: false,
      label: "Enabled",
    },
    cascades: {
      value: 4,
      min: 1,
      max: 8,
      step: 1,
      label: "Cascades",
    },
    shadowMapSize: {
      value: 2048,
      min: 512,
      max: 4096,
      step: 512,
      label: "Shadow Map Size",
    },
    shadowBias: {
      value: 0,
      min: -0.01,
      max: 0.01,
      step: 0.0001,
      label: "Shadow Bias",
    },
    shadowNormalBias: {
      value: 0,
      min: 0,
      max: 0.01,
      step: 0.0001,
      label: "Shadow Normal Bias",
    },
    lightIntensity: {
      value: 1,
      min: 0,
      max: 5,
      step: 0.1,
      label: "Light Intensity",
    },
    fade: {
      value: true,
      label: "Fade Between Cascades",
    },
    lightMargin: {
      value: 200,
      min: 0,
      max: 1000,
      step: 10,
      label: "Light Margin",
    },
    lightDirection: {
      value: { x: -1, y: -1, z: -1 },
      label: "Light Direction",
    },
  });

  return controls;
}

/**
 * CSM Controls Component - Adds Leva controls for CSM
 * This component only provides UI controls, doesn't render anything
 */
export default function CsmControls() {
  useCsmControls();
  return null; // This component only adds Leva controls
}
