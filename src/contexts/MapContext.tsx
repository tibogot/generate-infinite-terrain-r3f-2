import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { ComponentName } from '../scenes/componentRegistry'

// Map-specific terrain configuration
export interface MapTerrainConfig {
  seed: string
  subdivisions: number
  lacunarity: number
  persistence: number
  maxIterations: number
  baseFrequency: number
  baseAmplitude: number
  power: number
  elevationOffset: number
}

// Map-specific sky configuration
export interface MapSkyConfig {
  sunPosition: [number, number, number]
  colorDayCycleLow: string
  colorDayCycleHigh: string
  colorNightLow: string
  colorNightHigh: string
  colorSun: string
  colorDawn: string
}

// Map-specific player/character configuration
export interface MapPlayerConfig {
  spawnPosition: [number, number, number]
  characterType: 'capsule' | 'godot' | 'godot-hybrid'
  // Add more character-specific settings as needed
}

// Component selection for scene
export interface SceneComponents {
  sky: ComponentName
  terrain: ComponentName
  water: ComponentName
  chunks: ComponentName
  player: ComponentName
  grass: ComponentName
  noises: ComponentName
  camera: ComponentName
}

// Complete map configuration
export interface MapConfig {
  id: string
  name: string
  components: SceneComponents
  terrain: MapTerrainConfig
  sky: MapSkyConfig
  player: MapPlayerConfig
  // Add more map-specific settings as needed
}

// Map state (preserved when switching)
export interface MapState {
  config: MapConfig
  // Store any state that should be preserved per map
  // For example: player position, discovered areas, etc.
}

interface MapContextType {
  maps: Map<string, MapConfig>
  activeMapId: string
  activeMapConfig: MapConfig | null
  mapStates: Map<string, MapState>
  switchMap: (mapId: string) => void
  getMapConfig: (mapId: string) => MapConfig | undefined
  registerMap: (config: MapConfig) => void
}

const MapContext = createContext<MapContextType | null>(null)

export function useMap() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMap must be used within MapProvider')
  }
  return context
}

// Default map configurations
const defaultMaps: MapConfig[] = [
  {
    id: 'map1',
    name: 'Map 1 - Default',
    components: {
      sky: 'Sky',
      terrain: 'Terrains',
      water: 'Water',
      chunks: 'Chunks',
      player: 'Player',
      grass: 'Grass',
      noises: 'Noises',
      camera: 'Camera',
    },
    terrain: {
      seed: 'p',
      subdivisions: 120,
      lacunarity: 2.2,
      persistence: 0.4,
      maxIterations: 8,
      baseFrequency: 0.002,
      baseAmplitude: 220,
      power: 2.2,
      elevationOffset: 1,
    },
    sky: {
      sunPosition: [-0.5, -0.5, -0.5],
      colorDayCycleLow: '#f0fff9',
      colorDayCycleHigh: '#2e89ff',
      colorNightLow: '#004794',
      colorNightHigh: '#001624',
      colorSun: '#ff531a',
      colorDawn: '#ff1900',
    },
    player: {
      spawnPosition: [0, 50, 0],
      characterType: 'capsule',
    },
  },
  {
    id: 'map2',
    name: 'Map 2 - Simple Sky',
    components: {
      sky: 'SimpleSky', // Different sky component!
      terrain: 'Terrains', // Same terrain
      water: 'Water', // Same water
      chunks: 'Chunks', // Same chunks
      player: 'Player', // Same player
      grass: 'Grass', // Same grass
      noises: 'Noises', // Same noises
      camera: 'Camera', // Same camera
    },
    terrain: {
      seed: 'p',
      subdivisions: 120,
      lacunarity: 2.2,
      persistence: 0.4,
      maxIterations: 8,
      baseFrequency: 0.002,
      baseAmplitude: 220,
      power: 2.2,
      elevationOffset: 1,
    },
    sky: {
      sunPosition: [-0.5, -0.5, -0.5],
      colorDayCycleLow: '#f0fff9',
      colorDayCycleHigh: '#2e89ff',
      colorNightLow: '#004794',
      colorNightHigh: '#001624',
      colorSun: '#ff531a',
      colorDawn: '#ff1900',
    },
    player: {
      spawnPosition: [0, 50, 0],
      characterType: 'capsule',
    },
  },
  {
    id: 'map3',
    name: 'Map 3 - Simple Sky Copy',
    components: {
      sky: 'SimpleSky',
      terrain: 'Terrains',
      water: 'Water',
      chunks: 'Chunks',
      player: 'Player',
      grass: 'Grass',
      noises: 'Noises',
      camera: 'Camera',
    },
    terrain: {
      seed: 'p',
      subdivisions: 120,
      lacunarity: 2.2,
      persistence: 0.4,
      maxIterations: 8,
      baseFrequency: 0.002,
      baseAmplitude: 220,
      power: 2.2,
      elevationOffset: 1,
    },
    sky: {
      sunPosition: [-0.5, -0.5, -0.5],
      colorDayCycleLow: '#f0fff9',
      colorDayCycleHigh: '#2e89ff',
      colorNightLow: '#004794',
      colorNightHigh: '#001624',
      colorSun: '#ff531a',
      colorDawn: '#ff1900',
    },
    player: {
      spawnPosition: [0, 50, 0],
      characterType: 'capsule',
    },
  },
]

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [maps] = useState<Map<string, MapConfig>>(() => {
    const map = new Map<string, MapConfig>()
    defaultMaps.forEach(config => {
      map.set(config.id, config)
    })
    return map
  })

  const [activeMapId, setActiveMapId] = useState<string>('map1')
  const [mapStates] = useState<Map<string, MapState>>(new Map())
  const isSwitchingRef = useRef(false)

  // Initialize map states
  useEffect(() => {
    maps.forEach((config) => {
      if (!mapStates.has(config.id)) {
        mapStates.set(config.id, {
          config,
        })
      }
    })
  }, [maps, mapStates])

  const activeMapConfig = maps.get(activeMapId) || null

  const switchMap = useCallback((mapId: string) => {
    if (!maps.has(mapId)) {
      console.warn(`Map ${mapId} not found`)
      return
    }

    if (mapId === activeMapId) {
      return // Already on this map
    }

    if (isSwitchingRef.current) {
      return // Already switching
    }

    isSwitchingRef.current = true

    // Save current map state if needed
    // (For now, we'll just switch - can add state saving later)

    // Switch to new map
    setActiveMapId(mapId)

    // Reset switching flag after a brief delay
    setTimeout(() => {
      isSwitchingRef.current = false
    }, 100)
  }, [activeMapId, maps])

  const getMapConfig = useCallback((mapId: string) => {
    return maps.get(mapId)
  }, [maps])

  const registerMap = useCallback((config: MapConfig) => {
    maps.set(config.id, config)
    if (!mapStates.has(config.id)) {
      mapStates.set(config.id, {
        config,
      })
    }
  }, [maps, mapStates])

  const value: MapContextType = {
    maps,
    activeMapId,
    activeMapConfig,
    mapStates,
    switchMap,
    getMapConfig,
    registerMap,
  }

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  )
}

