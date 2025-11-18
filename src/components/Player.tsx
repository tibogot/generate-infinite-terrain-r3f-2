import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameState } from '../contexts/GameStateContext'
import PlayerMaterial from '../Game/View/Materials/PlayerMaterial'

export default function Player() {
  const state = useGameState()
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  // Create geometry
  const geometry = useMemo(() => {
    const geom = new THREE.CapsuleGeometry(0.5, 0.8, 3, 16)
    geom.translate(0, 0.9, 0)
    return geom
  }, [])

  // Create material
  const material = useMemo(() => {
    const mat = new PlayerMaterial()
    mat.uniforms.uColor.value = new THREE.Color('#fff8d6')
    mat.uniforms.uSunPosition.value = new THREE.Vector3(-0.5, -0.5, -0.5)
    return mat
  }, [])

  // Update position and rotation
  useFrame(() => {
    const playerState = state.player
    const sunState = state.sun

    if (groupRef.current) {
      groupRef.current.position.set(
        playerState.position.current[0],
        playerState.position.current[1],
        playerState.position.current[2]
      )
    }

    if (meshRef.current && material instanceof PlayerMaterial) {
      meshRef.current.rotation.y = playerState.rotation
      material.uniforms.uSunPosition.value.set(
        sunState.position.x,
        sunState.position.y,
        sunState.position.z
      )
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={geometry} material={material} />
    </group>
  )
}

