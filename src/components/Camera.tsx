import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameState } from '../contexts/GameStateContext'

// Global ref to check if free orbit camera is enabled
let freeOrbitEnabledRef = false

export function setFreeOrbitEnabled(enabled: boolean) {
  freeOrbitEnabledRef = enabled
}

export function isFreeOrbitEnabled() {
  return freeOrbitEnabledRef
}

export default function Camera() {
  const { camera, size } = useThree()
  const state = useGameState()
  const cameraRef = useRef<THREE.PerspectiveCamera>(camera as THREE.PerspectiveCamera)

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      cameraRef.current = camera
      camera.rotation.reorder('YXZ')
    }
  }, [camera])

  // Handle resize
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = size.width / size.height
      camera.updateProjectionMatrix()
    }
  }, [size, camera])

  // Update camera position and rotation from player state
  // Only update if free orbit camera is not enabled
  useFrame(() => {
    // Skip updates if free orbit camera is active
    if (freeOrbitEnabledRef) {
      return
    }

    const playerState = state.player
    if (cameraRef.current) {
      cameraRef.current.position.set(
        playerState.camera.position[0],
        playerState.camera.position[1],
        playerState.camera.position[2]
      )
      cameraRef.current.quaternion.set(
        playerState.camera.quaternion[0],
        playerState.camera.quaternion[1],
        playerState.camera.quaternion[2],
        playerState.camera.quaternion[3]
      )
    }
  })

  return null
}

