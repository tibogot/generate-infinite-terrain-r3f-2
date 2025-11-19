import { Sky } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";

/**
 * DreiSky - Wrapper component for drei's Sky component
 * For map4, uses a fixed daytime sun position (not following game state)
 */
export default function DreiSky() {
  const { scene, gl } = useThree();
  const skyRef = useRef<any>(null);

  // For map4, use a fixed daytime sun position
  // For other maps, you could use game state if needed
  const sunPosition = useMemo(() => {
    // Fixed daytime sun position (above horizon, slightly to the side)
    // Normalized direction: sun is up and to the side
    return {
      x: 0.3,
      y: 0.7, // Above horizon (positive Y = up)
      z: -0.5,
    };
  }, []);

  // Calculate inclination from sun Y position
  // Inclination: 0 = horizon, 1 = zenith
  const inclination = Math.max(0, Math.min(1, (sunPosition.y + 1) / 2));

  // Azimuth: rotation around the Y axis (0-1)
  const azimuth = Math.atan2(sunPosition.x, sunPosition.z) / (2 * Math.PI) + 0.5;

  // Ensure scene background is properly set by drei Sky
  useEffect(() => {
    // Clear any existing background
    scene.background = null;
    
    // Wait a frame for drei Sky to set the background
    const timeout = setTimeout(() => {
      if (skyRef.current && scene.background) {
        // drei Sky sets scene.background automatically
        // If it's too bright, we might need to adjust tone mapping exposure
        // But let drei handle it for now
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [scene]);

  return (
    <Sky
      ref={skyRef}
      distance={1000}
      sunPosition={[sunPosition.x * 1000, sunPosition.y * 1000, sunPosition.z * 1000]}
      inclination={inclination}
      azimuth={azimuth}
      turbidity={3} // Reduced from 10 - lower = clearer sky
      rayleigh={0.5} // Reduced from 3 - lower = less blue scattering
      mieCoefficient={0.005}
      mieDirectionalG={0.8}
    />
  );
}

