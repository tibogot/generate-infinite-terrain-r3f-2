import React, { createContext, useContext, useRef } from "react";
import * as THREE from "three";

interface NoiseContextType {
  noiseTexture: React.MutableRefObject<THREE.Texture | null>;
}

const NoiseContext2 = createContext<NoiseContextType | null>(null);

export function useNoise2() {
  const context = useContext(NoiseContext2);
  if (!context) {
    throw new Error("useNoise2 must be used within a NoiseProvider2");
  }
  return context;
}

export function NoiseProvider2({ children }: { children: React.ReactNode }) {
  const noiseTexture = useRef<THREE.Texture | null>(null);

  const value = {
    noiseTexture,
  };

  return <NoiseContext2.Provider value={value}>{children}</NoiseContext2.Provider>;
}

