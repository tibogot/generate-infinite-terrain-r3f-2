import React, { createContext, useContext, useRef } from "react";
import * as THREE from "three";

interface NoiseContextType {
  noiseTexture: React.MutableRefObject<THREE.Texture | null>;
}

const NoiseContext = createContext<NoiseContextType | null>(null);

export function useNoise() {
  const context = useContext(NoiseContext);
  if (!context) {
    throw new Error("useNoise must be used within a NoiseProvider");
  }
  return context;
}

export function NoiseProvider({ children }: { children: React.ReactNode }) {
  const noiseTexture = useRef<THREE.Texture | null>(null);

  const value = {
    noiseTexture,
  };

  return <NoiseContext.Provider value={value}>{children}</NoiseContext.Provider>;
}

