import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameState } from '../contexts/GameStateContext'
import { useMap } from '../contexts/MapContext'
import { renderComponent } from '../scenes/componentRegistry'
import MapSelector from './MapSelector'

export default function Scene() {
  const state = useGameState()
  const { gl, scene } = useThree()
  const { activeMapConfig } = useMap()

  // Update renderer settings
  useFrame(() => {
    // Render loop is handled by R3F automatically
  })

  // If no map config, render nothing (shouldn't happen)
  if (!activeMapConfig) {
    return null
  }

  const { components } = activeMapConfig

  return (
    <>
      {/* Map selector for Leva controls */}
      <MapSelector />
      
      {/* Dynamically render components based on map config */}
      {renderComponent(components.camera)}
      {renderComponent(components.noises)}
      {renderComponent(components.sky)}
      {renderComponent(components.water)}
      {renderComponent(components.terrain)}
      {renderComponent(components.chunks)}
      {renderComponent(components.player)}
      {renderComponent(components.grass)}
    </>
  )
}

