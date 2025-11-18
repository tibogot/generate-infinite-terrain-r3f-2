import React, { createContext, useContext, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

interface TerrainMeshContextType {
  terrainMeshes: React.MutableRefObject<Set<THREE.Mesh>>
  registerTerrainMesh: (mesh: THREE.Mesh) => void
  unregisterTerrainMesh: (mesh: THREE.Mesh) => void
  getClosestTerrainMesh: (position: THREE.Vector3) => THREE.Mesh | null
}

const TerrainMeshContext = createContext<TerrainMeshContextType | null>(null)

export function useTerrainMesh() {
  const context = useContext(TerrainMeshContext)
  if (!context) {
    throw new Error('useTerrainMesh must be used within TerrainMeshProvider')
  }
  return context
}

export function TerrainMeshProvider({ children }: { children: React.ReactNode }) {
  const terrainMeshesRef = useRef<Set<THREE.Mesh>>(new Set())
  const [, forceUpdate] = useState(0)

  const registerTerrainMesh = useCallback((mesh: THREE.Mesh) => {
    terrainMeshesRef.current.add(mesh)
    forceUpdate(prev => prev + 1)
  }, [])

  const unregisterTerrainMesh = useCallback((mesh: THREE.Mesh) => {
    terrainMeshesRef.current.delete(mesh)
    forceUpdate(prev => prev + 1)
  }, [])

  const getClosestTerrainMesh = useCallback((position: THREE.Vector3): THREE.Mesh | null => {
    let closestMesh: THREE.Mesh | null = null
    let closestDistance = Infinity

    for (const mesh of terrainMeshesRef.current) {
      if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox()
      }
      
      if (mesh.geometry.boundingBox) {
        const box = mesh.geometry.boundingBox.clone()
        box.applyMatrix4(mesh.matrixWorld)
        
        const distance = box.distanceToPoint(position)
        if (distance < closestDistance) {
          closestDistance = distance
          closestMesh = mesh
        }
      }
    }

    return closestMesh
  }, [])

  const value: TerrainMeshContextType = {
    terrainMeshes: terrainMeshesRef,
    registerTerrainMesh,
    unregisterTerrainMesh,
    getClosestTerrainMesh,
  }

  return (
    <TerrainMeshContext.Provider value={value}>
      {children}
    </TerrainMeshContext.Provider>
  )
}

