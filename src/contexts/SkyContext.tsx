import React, { createContext, useContext, useRef } from 'react'
import * as THREE from 'three'

interface SkyContextType {
  fogTexture: React.MutableRefObject<THREE.Texture | null>
}

const SkyContext = createContext<SkyContextType | null>(null)

export function useSky() {
  const context = useContext(SkyContext)
  if (!context) {
    throw new Error('useSky must be used within SkyProvider')
  }
  return context
}

export function SkyProvider({ children }: { children: React.ReactNode }) {
  const fogTextureRef = useRef<THREE.Texture | null>(null)

  return (
    <SkyContext.Provider value={{ fogTexture: fogTextureRef }}>
      {children}
    </SkyContext.Provider>
  )
}

